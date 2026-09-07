import Link from "next/link";

import {
  getEditableProductPayload,
  serializeSpecs,
} from "@/lib/cms/forms";
import type { CmsProductEntity, CmsProductPayload } from "@/lib/cms/types";

import { changeProductState, saveProduct } from "@/app/genlix-admin/(panel)/products/actions";
import styles from "@/app/genlix-admin/admin.module.css";

type AdminProductFormProps = {
  entity?: CmsProductEntity;
  error?: string;
  revision: number;
  saved?: string;
};

const defaultPayload: CmsProductPayload = {
  category: "meat",
  catalog: {
    brand: "",
    image: "",
    specs: [],
    title: "",
    meat: {
      channel: "horeca",
      cooking: ["grill"],
      country: "russia",
      cutIds: [],
      packaging: "fixed-weight-vacuum",
      productType: "steak",
      species: "beef",
    },
  },
  detail: {
    brand: "",
    breadcrumbs: [],
    buttonHref: "/#contacts",
    buttonLabel: "Запросить поставку",
    category: "Мясо",
    cookingMethods: ["Гриль"],
    description: "",
    images: [],
    packaging: "Согласно маркировке",
    shelfLife: "Согласно маркировке",
    storage: "Хранить согласно условиям на упаковке",
    title: "",
  },
};

export function AdminProductForm({
  entity,
  error,
  revision,
  saved,
}: AdminProductFormProps) {
  const payload = getEditableProductPayload(entity) ?? defaultPayload;
  const catalog = payload.catalog;
  const detail = payload.detail;
  const meat = catalog.meat;
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
          Изменения сохранены. Каждая сохранённая версия доступна в разделе истории.
        </p>
      ) : null}

      <form action={saveProduct} className={styles.formGrid}>
        <input name="id" type="hidden" value={entity?.id ?? ""} />
        <input name="revision" type="hidden" value={revision} />

        <div className={styles.formColumn}>
          <section className={styles.formSection}>
            <h2>Основная информация</h2>
            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Название товара</span>
                <input defaultValue={catalog.title} name="title" required />
              </label>
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
                <span>Раздел каталога</span>
                <select defaultValue={payload.category} name="category">
                  <option value="meat">Мясо</option>
                  <option value="bird">Птица</option>
                  <option value="beer">Пиво</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Производитель / бренд</span>
                <input defaultValue={catalog.brand} name="brand" required />
              </label>
            </div>
            <label className={styles.field}>
              <span>Описание</span>
              <textarea defaultValue={detail.description} name="description" required />
            </label>
          </section>

          <section className={styles.formSection}>
            <h2>Изображения</h2>
            {catalog.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Текущее изображение товара" className={styles.formPreview} src={catalog.image} />
            ) : null}
            <label className={styles.field}>
              <span>Основное изображение: существующий URL</span>
              <input defaultValue={catalog.image} name="image" required={!catalog.image} />
            </label>
            <label className={styles.field}>
              <span>Или загрузить новое изображение (до 3 МБ)</span>
              <input accept="image/jpeg,image/png,image/webp" name="imageFile" type="file" />
            </label>
            <label className={styles.field}>
              <span>Галерея — по одному URL на строку</span>
              <textarea defaultValue={detail.images.join("\n")} name="images" />
            </label>
            <p className={styles.helpText}>
              Новые файлы сохраняются с уникальным именем. Старые изображения автоматически не удаляются.
            </p>
          </section>

          <section className={styles.formSection}>
            <h2>Фильтры мяса</h2>
            <p className={styles.helpText}>
              Эти поля используются только для раздела «Мясо».
            </p>
            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Вид мяса</span>
                <select defaultValue={meat?.species ?? "beef"} name="species">
                  <option value="beef">Говядина</option>
                  <option value="lamb">Баранина</option>
                  <option value="pork">Свинина</option>
                  <option value="poultry">Птица</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Страна (код латиницей)</span>
                <input defaultValue={meat?.country ?? "russia"} name="country" />
              </label>
              <label className={styles.field}>
                <span>HoReCa / ритейл</span>
                <select defaultValue={meat?.channel ?? "horeca"} name="channel">
                  <option value="horeca">HoReCa</option>
                  <option value="retail">Ритейл</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Тип товара</span>
                <select defaultValue={meat?.productType ?? "steak"} name="productType">
                  <option value="steak">Стейк</option>
                  <option value="large-cut">Крупный отруб</option>
                  <option value="minced-meat">Фарш</option>
                  <option value="goulash">Гуляш</option>
                  <option value="fillet">Филе</option>
                  <option value="cutlets">Котлеты</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Тип упаковки</span>
                <select defaultValue={meat?.packaging ?? "fixed-weight-vacuum"} name="packaging">
                  <option value="large-block">Крупный блок</option>
                  <option value="fixed-weight-vacuum">Вакуум, фиксированный вес</option>
                  <option value="tray-or-box">Лоток / короб</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Способы приготовления (коды)</span>
                <input defaultValue={meat?.cooking.join(", ") ?? "grill"} name="cooking" />
              </label>
            </div>
            <label className={styles.field}>
              <span>Коды отрубов — через запятую</span>
              <input defaultValue={meat?.cutIds.join(", ") ?? ""} name="cutIds" />
            </label>
          </section>

          <section className={styles.formSection}>
            <h2>Карточка и характеристики</h2>
            <label className={styles.field}>
              <span>Характеристики — «Название | Значение», по одной на строку</span>
              <textarea defaultValue={serializeSpecs(catalog.specs)} name="specs" />
            </label>
            <label className={styles.field}>
              <span>Метки — через запятую или с новой строки</span>
              <input defaultValue={catalog.tags?.join(", ") ?? ""} name="tags" />
            </label>
            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Бейдж</span>
                <select defaultValue={catalog.badge ?? ""} name="badge">
                  <option value="">Без бейджа</option>
                  <option value="хит">Хит</option>
                  <option value="new">New</option>
                  <option value="витрина">Витрина</option>
                  <option value="ферма">Ферма</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Название категории на странице</span>
                <input defaultValue={detail.category} name="detailCategory" required />
              </label>
            </div>
            <label className={styles.field}>
              <span>Рекомендация</span>
              <input defaultValue={catalog.recommendation ?? ""} name="recommendation" />
            </label>
          </section>

          <section className={styles.formSection}>
            <h2>Поставка и хранение</h2>
            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Фасовка</span>
                <input defaultValue={detail.packaging} name="packagingDisplay" required />
              </label>
              <label className={styles.field}>
                <span>Срок годности</span>
                <input defaultValue={detail.shelfLife} name="shelfLife" required />
              </label>
            </div>
            <label className={styles.field}>
              <span>Условия хранения</span>
              <input defaultValue={detail.storage} name="storage" required />
            </label>
            <label className={styles.field}>
              <span>Способы приготовления — названия для страницы</span>
              <input defaultValue={detail.cookingMethods.join(", ")} name="cookingMethods" />
            </label>
            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Текст кнопки</span>
                <input defaultValue={catalog.buttonLabel ?? detail.buttonLabel ?? ""} name="buttonLabel" />
              </label>
              <label className={styles.field}>
                <span>Ссылка кнопки</span>
                <input defaultValue={detail.buttonHref ?? "/#contacts"} name="buttonHref" />
              </label>
            </div>
            <label className={styles.field}>
              <span>Подпись рекомендации пива</span>
              <input defaultValue={detail.beerRecommendationLabel ?? ""} name="beerRecommendationLabel" />
            </label>
          </section>
        </div>

        <aside className={styles.formActions}>
          <span className={entity?.status === "archived" ? styles.statusArchived : entity?.published ? styles.statusOk : styles.statusDraft}>
            {entity?.status === "archived"
              ? "В архиве"
              : entity?.published
                ? "Опубликован"
                : "Новый черновик"}
          </span>
          {hasDraft ? <span className={styles.statusDraft}>Есть несохранённый на сайте черновик</span> : null}
          <button name="intent" type="submit" value="draft">
            Сохранить черновик
          </button>
          <button className={styles.publishButton} name="intent" type="submit" value="publish">
            Опубликовать
          </button>
          <Link href="/genlix-admin/products">Вернуться к товарам</Link>
          <p className={styles.helpText}>
            «Сохранить черновик» не меняет публичный сайт. «Опубликовать» создаёт новую восстановимую ревизию.
          </p>
        </aside>
      </form>

      {entity ? (
        <section className={styles.panel}>
          <h2>Состояние товара</h2>
          <div className={styles.inlineActions}>
            {entity.draft && entity.published ? (
              <form action={changeProductState}>
                <input name="id" type="hidden" value={entity.id} />
                <input name="revision" type="hidden" value={revision} />
                <button name="operation" type="submit" value="discard-draft">
                  Отменить черновик
                </button>
              </form>
            ) : null}
            <form action={changeProductState}>
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
          <p className={styles.helpText}>
            Архивирование скрывает товар с сайта, но сохраняет все данные и изображения.
          </p>
        </section>
      ) : null}
    </>
  );
}
