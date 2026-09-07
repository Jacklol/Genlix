"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";
import {
  buildProductPayloadFromForm,
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
import type { CmsProductEntity } from "@/lib/cms/types";

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

  console.error("Product CMS action failed", error);
  return "Не удалось сохранить товар. Проверьте поля и попробуйте ещё раз.";
}

function revalidateProductPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/catalog/meat");
  revalidatePath("/catalog/meat/beef");
  revalidatePath("/catalog/meat/lamb");
  revalidatePath("/catalog/beer");
  revalidatePath("/catalog/bird");
  revalidatePath(`/catalog/product/${slug}`);
}

export async function saveProduct(formData: FormData) {
  const session = await requireAdminSession();
  const revision = parseRevision(formData);
  const id = String(formData.get("id") ?? "").trim();
  const intent = formData.get("intent") === "publish" ? "publish" : "draft";
  const returnPath = id
    ? `/genlix-admin/products/${encodeURIComponent(id)}`
    : "/genlix-admin/products/new";

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
      ? preflight.snapshot.content.products.find((product) => product.id === id)
      : undefined;

    if (id && !preflightExisting) {
      throw new CmsFormError("Товар не найден");
    }

    if (preflightExisting && preflightExisting.slug !== slug) {
      throw new CmsFormError(
        "Адрес опубликованного товара нельзя менять, чтобы не сломать старые ссылки",
      );
    }

    if (
      preflight.snapshot.content.products.some(
        (product) => product.slug === slug && product.id !== preflightExisting?.id,
      )
    ) {
      throw new CmsFormError("Такой адрес страницы уже занят другим товаром");
    }

    buildProductPayloadFromForm(
      formData,
      preflightExisting?.draft ?? preflightExisting?.published,
      hasImageUpload ? "/uploads/cms/pending-validation.jpg" : undefined,
    );
    const uploadedImage =
      hasImageUpload
        ? await uploadCmsImage(imageFile, session.username)
        : undefined;

    await mutateCmsContent(
      revision,
      session.username,
      `${intent === "publish" ? "Публикация" : "Сохранение черновика"} товара «${slug}»`,
      (content) => {
        const existing = id
          ? content.products.find((product) => product.id === id)
          : undefined;

        if (id && !existing) {
          throw new CmsFormError("Товар не найден");
        }

        if (existing && existing.slug !== slug) {
          throw new CmsFormError(
            "Адрес опубликованного товара нельзя менять, чтобы не сломать старые ссылки",
          );
        }

        if (
          content.products.some(
            (product) => product.slug === slug && product.id !== existing?.id,
          )
        ) {
          throw new CmsFormError("Такой адрес страницы уже занят другим товаром");
        }

        const editable = existing?.draft ?? existing?.published;
        const payload = buildProductPayloadFromForm(formData, editable, uploadedImage);
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
          const entity: CmsProductEntity = {
            createdAt: now,
            draft: payload,
            id: randomUUID(),
            slug,
            sortOrder:
              content.products.reduce(
                (maximum, product) => Math.max(maximum, product.sortOrder),
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

          content.products.push(entity);
          destination = `/genlix-admin/products/${encodeURIComponent(entity.id)}`;
        }

        savedSlug = slug;
      },
    );

    try {
      revalidateProductPaths(savedSlug);
    } catch (error) {
      console.error("Product saved, but cache revalidation failed", error);
    }
    destination += `?saved=${intent}`;
  } catch (error) {
    destination += `?error=${encodeURIComponent(getErrorMessage(error))}`;
  }

  redirect(destination);
}

export async function changeProductState(formData: FormData) {
  const session = await requireAdminSession();
  const revision = parseRevision(formData);
  const id = String(formData.get("id") ?? "").trim();
  const operation = String(formData.get("operation") ?? "");
  let destination = `/genlix-admin/products/${encodeURIComponent(id)}`;
  let slug = "";

  try {
    await mutateCmsContent(
      revision,
      session.username,
      `Изменение состояния товара ${id}: ${operation}`,
      (content) => {
        const entity = content.products.find((product) => product.id === id);

        if (!entity) {
          throw new CmsFormError("Товар не найден");
        }

        slug = entity.slug;
        entity.updatedAt = new Date().toISOString();

        if (operation === "archive") {
          entity.status = "archived";
        } else if (operation === "restore") {
          entity.status = entity.published ? "published" : "draft";
        } else if (operation === "discard-draft") {
          if (!entity.published) {
            throw new CmsFormError("Нельзя удалить единственную версию нового товара");
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
      revalidateProductPaths(slug);
    } catch (error) {
      console.error("Product state saved, but cache revalidation failed", error);
    }
    destination += "?saved=state";
  } catch (error) {
    destination += `?error=${encodeURIComponent(getErrorMessage(error))}`;
  }

  redirect(destination);
}
