"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";
import {
  buildNewsPayloadFromForm,
  CmsFormError,
  parseCmsSlug,
  parseRevision,
} from "@/lib/cms/forms";
import {
  CmsMediaValidationError,
  loadCmsSnapshot,
  mutateCmsContent,
  uploadCmsImage,
} from "@/lib/cms/store";
import type { CmsNewsEntity } from "@/lib/cms/types";

function getErrorMessage(error: unknown) {
  if (error instanceof CmsFormError || error instanceof CmsMediaValidationError) {
    return error.message;
  }

  if (
    error instanceof Error &&
    /revision_conflict|cms revision conflict|(?:sqlstate|code)["'\s:]*40001/i.test(
      error.message,
    )
  ) {
    return "Данные уже изменились в другой вкладке. Обновите страницу и повторите правку.";
  }

  console.error("News CMS action failed", error);
  return "Не удалось сохранить новость. Проверьте поля и попробуйте ещё раз.";
}

function revalidateNewsPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath(`/news/${slug}`);
}

export async function saveNews(formData: FormData) {
  const session = await requireAdminSession();
  const revision = parseRevision(formData);
  const id = String(formData.get("id") ?? "").trim();
  const intent = formData.get("intent") === "publish" ? "publish" : "draft";
  const returnPath = id
    ? `/genlix-admin/news/${encodeURIComponent(id)}`
    : "/genlix-admin/news/new";
  let destination = returnPath;
  let savedSlug = "";

  try {
    const slug = parseCmsSlug(formData);
    const imageFile = formData.get("imageFile");
    const hasImageUpload = imageFile instanceof File && imageFile.size > 0;
    const preflight = await loadCmsSnapshot();

    if (!preflight.writable) {
      throw new CmsFormError(preflight.warning ?? "Хранилище доступно только для чтения");
    }

    if (preflight.snapshot.revision !== revision) {
      throw new Error(
        `revision_conflict: expected ${revision}, current ${preflight.snapshot.revision}`,
      );
    }

    const preflightExisting = id
      ? preflight.snapshot.content.news.find((item) => item.id === id)
      : undefined;

    if (id && !preflightExisting) {
      throw new CmsFormError("Новость не найдена");
    }

    if (preflightExisting && preflightExisting.slug !== slug) {
      throw new CmsFormError(
        "Адрес опубликованной новости нельзя менять, чтобы не сломать старые ссылки",
      );
    }

    if (
      preflight.snapshot.content.news.some(
        (item) => item.slug === slug && item.id !== preflightExisting?.id,
      )
    ) {
      throw new CmsFormError("Такой адрес страницы уже занят другой новостью");
    }

    buildNewsPayloadFromForm(
      formData,
      hasImageUpload ? "/uploads/cms/pending-validation.jpg" : undefined,
    );
    const uploadedImage =
      hasImageUpload
        ? await uploadCmsImage(imageFile, session.username)
        : undefined;

    await mutateCmsContent(
      revision,
      session.username,
      `${intent === "publish" ? "Публикация" : "Сохранение черновика"} новости «${slug}»`,
      (content) => {
        const existing = id ? content.news.find((item) => item.id === id) : undefined;

        if (id && !existing) {
          throw new CmsFormError("Новость не найдена");
        }

        if (existing && existing.slug !== slug) {
          throw new CmsFormError(
            "Адрес опубликованной новости нельзя менять, чтобы не сломать старые ссылки",
          );
        }

        if (content.news.some((item) => item.slug === slug && item.id !== existing?.id)) {
          throw new CmsFormError("Такой адрес страницы уже занят другой новостью");
        }

        const payload = buildNewsPayloadFromForm(formData, uploadedImage);
        const now = new Date().toISOString();

        if (existing) {
          existing.draft = payload;
          existing.updatedAt = now;

          if (!existing.published && existing.status !== "archived") {
            existing.status = "draft";
          }

          if (intent === "publish") {
            existing.published = payload;
            delete existing.draft;
            existing.status = "published";
          }
        } else {
          const entity: CmsNewsEntity = {
            createdAt: now,
            draft: payload,
            id: randomUUID(),
            slug,
            sortOrder:
              content.news.reduce(
                (maximum, item) => Math.max(maximum, item.sortOrder),
                -1,
              ) + 1,
            status: "draft",
            updatedAt: now,
          };

          if (intent === "publish") {
            entity.published = payload;
            delete entity.draft;
            entity.status = "published";
          }

          content.news.push(entity);
          destination = `/genlix-admin/news/${encodeURIComponent(entity.id)}`;
        }

        savedSlug = slug;
      },
    );
    try {
      revalidateNewsPaths(savedSlug);
    } catch (error) {
      console.error("News saved, but cache revalidation failed", error);
    }
    destination += `?saved=${intent}`;
  } catch (error) {
    destination += `?error=${encodeURIComponent(getErrorMessage(error))}`;
  }

  redirect(destination);
}

export async function changeNewsState(formData: FormData) {
  const session = await requireAdminSession();
  const revision = parseRevision(formData);
  const id = String(formData.get("id") ?? "").trim();
  const operation = String(formData.get("operation") ?? "");
  let destination = `/genlix-admin/news/${encodeURIComponent(id)}`;
  let slug = "";

  try {
    await mutateCmsContent(
      revision,
      session.username,
      `Изменение состояния новости ${id}: ${operation}`,
      (content) => {
        const entity = content.news.find((item) => item.id === id);

        if (!entity) {
          throw new CmsFormError("Новость не найдена");
        }

        slug = entity.slug;
        entity.updatedAt = new Date().toISOString();

        if (operation === "archive") {
          entity.status = "archived";
        } else if (operation === "restore") {
          entity.status = entity.published ? "published" : "draft";
        } else if (operation === "discard-draft") {
          if (!entity.published) {
            throw new CmsFormError("Нельзя удалить единственную версию новой новости");
          }
          const wasArchived = entity.status === "archived";
          delete entity.draft;
          if (!wasArchived) {
            entity.status = "published";
          }
        } else {
          throw new CmsFormError("Неизвестное действие");
        }
      },
    );
    try {
      revalidateNewsPaths(slug);
    } catch (error) {
      console.error("News state saved, but cache revalidation failed", error);
    }
    destination += "?saved=state";
  } catch (error) {
    destination += `?error=${encodeURIComponent(getErrorMessage(error))}`;
  }

  redirect(destination);
}
