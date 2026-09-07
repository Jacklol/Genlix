"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";
import {
  commitCmsSnapshot,
  getCmsSnapshotByRevision,
  initializeCmsStore,
  loadCmsSnapshot,
} from "@/lib/cms/store";

class CmsRestoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsRestoreError";
  }
}

function parseRevisionField(formData: FormData, name: string, label: string) {
  const source = formData.get(name);

  if (typeof source !== "string" || !/^(0|[1-9]\d*)$/.test(source)) {
    throw new CmsRestoreError(`${label}: указана некорректная ревизия.`);
  }

  const revision = Number(source);

  if (!Number.isSafeInteger(revision)) {
    throw new CmsRestoreError(`${label}: номер ревизии слишком большой.`);
  }

  return revision;
}

function isRevisionConflict(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /revision_conflict|cms revision conflict|(?:sqlstate|code)["'\s:]*40001/i.test(
    error.message,
  );
}

function getRestoreErrorMessage(error: unknown) {
  if (error instanceof CmsRestoreError) {
    return error.message;
  }

  if (isRevisionConflict(error)) {
    return "Данные уже изменились. Обновите страницу истории и повторите восстановление.";
  }

  console.error("CMS restore failed", error);
  return "Не удалось восстановить выбранную версию";
}

function revalidateAllContent() {
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/news/[slug]", "page");
  revalidatePath("/catalog/meat");
  revalidatePath("/catalog/meat/[species]", "page");
  revalidatePath("/catalog/beer");
  revalidatePath("/catalog/bird");
  revalidatePath("/catalog/product/[slug]", "page");
}

export async function initializeAdminCms() {
  const session = await requireAdminSession();
  let destination = "/genlix-admin";

  try {
    await initializeCmsStore(session.username);
    revalidateAllContent();
    destination += "?initialized=1";
  } catch (error) {
    console.error("CMS initialization failed", error);
    destination += `?error=${encodeURIComponent("Не удалось перенести исходные данные в базу")}`;
  }

  redirect(destination);
}

export async function restoreCmsRevision(formData: FormData) {
  const session = await requireAdminSession();
  let destination = "/genlix-admin/backups";

  try {
    const targetRevision = parseRevisionField(
      formData,
      "targetRevision",
      "Выбранная копия",
    );
    const expectedCurrentRevision = parseRevisionField(
      formData,
      "expectedCurrentRevision",
      "Текущая версия страницы",
    );
    const confirmation = formData.get("confirmation");

    if (targetRevision === 0) {
      throw new CmsRestoreError("Исходную служебную ревизию 0 восстанавливать нельзя.");
    }

    if (
      typeof confirmation !== "string" ||
      confirmation.trim() !== String(expectedCurrentRevision)
    ) {
      throw new CmsRestoreError(
        `Для подтверждения введите номер текущей ревизии: ${expectedCurrentRevision}.`,
      );
    }

    const [current, target] = await Promise.all([
      loadCmsSnapshot(),
      getCmsSnapshotByRevision(targetRevision),
    ]);

    if (!current.writable) {
      throw new CmsRestoreError("Хранилище CMS сейчас доступно только для чтения.");
    }

    if (current.snapshot.revision !== expectedCurrentRevision) {
      throw new Error(
        `revision_conflict: expected ${expectedCurrentRevision}, current ${current.snapshot.revision}`,
      );
    }

    if (!target) {
      throw new CmsRestoreError("Выбранная копия не найдена.");
    }

    if (targetRevision === expectedCurrentRevision) {
      throw new CmsRestoreError("Выбранная ревизия уже является текущей.");
    }

    await commitCmsSnapshot(
      expectedCurrentRevision,
      target.content,
      session.username,
      `Восстановление содержимого из ревизии ${targetRevision}`,
    );
    revalidateAllContent();
    destination += `?restored=${targetRevision}`;
  } catch (error) {
    destination += `?error=${encodeURIComponent(getRestoreErrorMessage(error))}`;
  }

  redirect(destination);
}
