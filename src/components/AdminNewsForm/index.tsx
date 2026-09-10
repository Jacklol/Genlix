import Link from "next/link";

import {
  getEditableNewsPayload,
} from "@/lib/cms/forms";
import type { CmsNewsEntity, CmsNewsPayload } from "@/lib/cms/types";

import { changeNewsState } from "@/app/genlix-admin/(panel)/news/actions";
import { NewsEditorForm, NewsArticleEditor, NewsSubmitButton, NewsPublicationDateField } from "@/components/AdminNewsEditor";
import { NewsCoverEditor } from "@/components/AdminNewsEditor/NewsCoverEditor";
import styles from "@/app/genlix-admin/admin.module.css";

type AdminNewsFormProps = {
  entity?: CmsNewsEntity;
  error?: string;
  revision: number;
  saved?: string;
};

const defaultPayload: CmsNewsPayload = {
  category: "cases",
  content: [{ type: "paragraph", text: "" }],
  description: "",
  image: "",
  publishedAt: new Date().toISOString(),
  tag: "Блог компании",
  title: "",
};

export function AdminNewsForm({ entity, error, revision, saved }: AdminNewsFormProps) {
  const payload = getEditableNewsPayload(entity) ?? defaultPayload;
  const hasDraft = Boolean(entity?.draft);

  return (
    <>
      {error ? (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className={styles.successAlert} role="status">
          Изменения сохранены в истории CMS.
        </p>
      ) : null}

      <NewsEditorForm key={`${entity?.id ?? "new"}-${revision}`} initialTitle={payload.title} initialTag={payload.tag}>
        <input name="id" type="hidden" value={entity?.id ?? ""} />
        <input name="revision" type="hidden" value={revision} />

        <div className={styles.formColumn}>
          <section className={styles.formSection}>
            <h2>Основная информация</h2>
            <label className={styles.field}>
              <span>Заголовок</span>
              <input defaultValue={payload.title} name="title" required />
            </label>
            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Адрес страницы (slug)</span>
                <input
                  defaultValue={entity?.slug ?? ""}
                  name="slug"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  readOnly={Boolean(entity)}
                  required
                />
              </label>
              <NewsPublicationDateField initialValue={payload.publishedAt.slice(0, 10)} />
              <label className={styles.field}>
                <span>Категория</span>
                <select defaultValue={payload.category} name="category">
                  <option value="cases">Кейсы сотрудничества</option>
                  <option value="supplies">Новые поставки и отрубы</option>
                  <option value="cooking">Выбор и приготовление</option>
                  <option value="farms">Фермы-поставщики</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Метка на карточке</span>
                <input defaultValue={payload.tag} name="tag" required />
              </label>
            </div>
            <label className={styles.field}>
              <span>Краткое описание</span>
              <textarea defaultValue={payload.description} name="description" required />
            </label>
          </section>

          <NewsCoverEditor initialImage={payload.image} />

          <section className={styles.formSection}>
            <h2>Текст статьи</h2>
            <NewsArticleEditor content={payload.content} />
          </section>
        </div>

        <aside className={styles.formActions}>
          <span className={entity?.status === "archived" ? styles.statusArchived : entity?.published ? styles.statusOk : styles.statusDraft}>
            {entity?.status === "archived"
              ? "В архиве"
              : entity?.published
                ? "Опубликована"
                : "Новый черновик"}
          </span>
          {hasDraft ? <span className={styles.statusDraft}>Есть черновик</span> : null}
          <NewsSubmitButton intent="draft">
            Сохранить черновик
          </NewsSubmitButton>
          <NewsSubmitButton className={styles.publishButton} intent="publish">
            Опубликовать
          </NewsSubmitButton>
          <Link href="/genlix-admin/news">Вернуться к блогу</Link>
          <p className={styles.helpText}>
            Черновик виден только здесь. После публикации статья появится на главной и в блоге.
          </p>
        </aside>
      </NewsEditorForm>

      {entity ? (
        <section className={styles.panel}>
          <h2>Состояние статьи</h2>
          <div className={styles.inlineActions}>
            {entity.draft && entity.published ? (
              <form action={changeNewsState}>
                <input name="id" type="hidden" value={entity.id} />
                <input name="revision" type="hidden" value={revision} />
                <button name="operation" type="submit" value="discard-draft">
                  Отменить черновик
                </button>
              </form>
            ) : null}
            <form action={changeNewsState}>
              <input name="id" type="hidden" value={entity.id} />
              <input name="revision" type="hidden" value={revision} />
              {entity.status === "archived" ? (
                <button name="operation" type="submit" value="restore">
                  Вернуть из архива
                </button>
              ) : (
                <button className={styles.dangerButton} name="operation" type="submit" value="archive">
                  Переместить в архив
                </button>
              )}
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
