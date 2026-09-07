import Link from "next/link";

import {
  getEditableNewsPayload,
  serializeTextBlocks,
} from "@/lib/cms/forms";
import type { CmsNewsEntity, CmsNewsPayload } from "@/lib/cms/types";

import { changeNewsState, saveNews } from "@/app/genlix-admin/(panel)/news/actions";
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
  tag: "Новости компании",
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

      <form action={saveNews} className={styles.formGrid}>
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
              <label className={styles.field}>
                <span>Дата публикации</span>
                <input defaultValue={payload.publishedAt.slice(0, 10)} name="publishedAt" required type="date" />
              </label>
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

          <section className={styles.formSection}>
            <h2>Обложка</h2>
            {payload.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Текущая обложка" className={styles.formPreview} src={payload.image} />
            ) : null}
            <label className={styles.field}>
              <span>Существующий URL</span>
              <input defaultValue={payload.image} name="image" required={!payload.image} />
            </label>
            <label className={styles.field}>
              <span>Или загрузить новую обложку (до 3 МБ)</span>
              <input accept="image/jpeg,image/png,image/webp" name="imageFile" type="file" />
            </label>
          </section>

          <section className={styles.formSection}>
            <h2>Текст новости</h2>
            <label className={styles.field}>
              <span>Материал</span>
              <textarea
                className={styles.articleEditor}
                defaultValue={serializeTextBlocks(payload.content)}
                name="content"
                required
              />
            </label>
            <p className={styles.helpText}>
              Новый абзац отделяйте пустой строкой. Заголовок начинайте с «## », пункты списка — с «- ».
            </p>
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
          <button name="intent" type="submit" value="draft">
            Сохранить черновик
          </button>
          <button className={styles.publishButton} name="intent" type="submit" value="publish">
            Опубликовать
          </button>
          <Link href="/genlix-admin/news">Вернуться к новостям</Link>
          <p className={styles.helpText}>
            Черновик виден только здесь. После публикации новость появится на главной и в разделе новостей.
          </p>
        </aside>
      </form>

      {entity ? (
        <section className={styles.panel}>
          <h2>Состояние новости</h2>
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
