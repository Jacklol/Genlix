import Link from "next/link";
import { randomUUID } from "node:crypto";
import {
  ProductEditorForm, ProductImagesEditor, ProductSlugField, ProductSubmitButton, ProductCategorySection, ProductCategoryLabel,
} from "@/components/AdminProductEditor";
import { SHOW_PRODUCT_PAIRINGS } from "@/lib/catalog/features";

import {
  getEditableProductPayload,
  serializeSpecs,
} from "@/lib/cms/forms";
import type { CmsProductEntity, CmsProductPayload } from "@/lib/cms/types";
import {
  getMeatCharacteristicValue,
  getUnmanagedMeatSpecs,
  meatCharacteristicFields,
} from "@/lib/catalog/meat-characteristics";

import { changeProductState } from "@/app/genlix-admin/(panel)/products/actions";
import styles from "@/app/genlix-admin/admin.module.css";
import { categoryFields, categoryLabels, fieldValue, unmanagedCategorySpecs, type FilteredCategory } from "@/lib/catalog/category-fields";

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

      <ProductEditorForm
        key={`${entity?.id ?? "new"}:${revision}`}
        creationId={entity?.id ?? randomUUID()}
        slug={entity?.slug}
        initialTitle={catalog.title}
        initialBrand={catalog.brand}
        initialCategory={payload.category}
        mainImage={catalog.image}
        gallery={detail.images}
      >
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
              <ProductSlugField />
              <label className={styles.field}>
                <span>Раздел каталога</span>
                <select aria-label="Раздел каталога" defaultValue={payload.category} name="category">
                  <option value="meat">Мясо</option>
                  <option value="bird">Птица</option>
                  <option value="beer">Пиво</option>
                  <option value="water">Вода</option>
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

          <ProductImagesEditor />

          <ProductCategorySection categories={["meat"]}>
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
                  <option value="both">HoReCa и ритейл</option>
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
          </ProductCategorySection>

          {(Object.keys(categoryFields) as FilteredCategory[]).map((category) => (
            <ProductCategorySection key={category} categories={[category]}>
              <section className={styles.formSection}>
                <h2>{categoryLabels[category]}: фильтры и характеристики</h2>
                <p className={styles.helpText}>Все поля необязательные. Заполненные значения появятся на странице товара. Поля с пометкой «фильтр» также используются в каталоге. Неизвестные значения оставьте пустыми.</p>
                <div className={styles.twoColumns}>
                  {categoryFields[category].map((field) => {
                    const current = fieldValue(catalog.specs, field);
                    return <label className={styles.field} key={field.name}>
                      <span>{field.label}{field.filter ? " · фильтр" : ""}</span>
                      {field.options ? <select aria-label={field.label} defaultValue={current} name={field.name}>
                        <option value="">Не указано</option>
                        {current && !field.options.includes(current) ? <option value={current}>{current}</option> : null}
                        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select> : <input defaultValue={current} name={field.name} maxLength={160}
                        inputMode={field.numeric === "integer" ? "numeric" : field.numeric ? "decimal" : undefined}
                        placeholder={field.placeholder} />}
                    </label>;
                  })}
                </div>
              </section>
            </ProductCategorySection>
          ))}

          <section className={styles.formSection}>
            <h2>Карточка и характеристики</h2>
            <label className={styles.field}>
              <span>Характеристики — «Название | Значение», по одной на строку</span>
              <textarea defaultValue={serializeSpecs(unmanagedCategorySpecs(payload.category === "meat"
                ? getUnmanagedMeatSpecs(catalog.specs)
                : catalog.specs))} name="specs" />
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
                <ProductCategoryLabel initialCategory={payload.category} label={detail.category} />
              </label>
            </div>
            {SHOW_PRODUCT_PAIRINGS ? <label className={styles.field}>
              <span>Рекомендация</span>
              <input defaultValue={catalog.recommendation ?? ""} name="recommendation" />
            </label> : null}
          </section>

          <ProductCategorySection categories={["meat"]}>
          <section className={styles.formSection} id="meat-characteristics">
            <h2>Дополнительные характеристики мяса</h2>
            <p className={styles.helpText}>
              Все поля необязательные. Заполненные характеристики появятся справа на странице
              мясного товара, рядом со сроком годности и условиями хранения. Пустые строки
              не отображаются. Мраморность также остаётся в карточке каталога.
              Тип упаковки берётся из раздела «Фильтры мяса», фасовка — из «Поставки и хранения».
            </p>
            <div className={styles.twoColumns}>
              {meatCharacteristicFields.map((field) => {
                const currentValue = getMeatCharacteristicValue(catalog.specs, field.name);
                return (
                  <label className={styles.field} key={field.name}>
                    <span>{field.label}</span>
                    {field.options ? (
                      <select defaultValue={currentValue} name={field.name}>
                        <option value="">Не указано</option>
                        {currentValue && !field.options.includes(currentValue) ? (
                          <option value={currentValue}>{currentValue}</option>
                        ) : null}
                        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input
                        defaultValue={currentValue}
                        inputMode={field.inputMode}
                        maxLength={field.maxLength}
                        name={field.name}
                        pattern={field.pattern}
                        placeholder={field.placeholder}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </section>
          </ProductCategorySection>

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
            <ProductCategorySection categories={["meat", "bird"]}>
            <label className={styles.field}>
              <span>Способы приготовления — названия для страницы</span>
              <input defaultValue={detail.cookingMethods.join(", ")} name="cookingMethods" />
            </label>
            </ProductCategorySection>
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
            {SHOW_PRODUCT_PAIRINGS ? <label className={styles.field}>
              <span>Подпись рекомендации пива</span>
              <input defaultValue={detail.beerRecommendationLabel ?? ""} name="beerRecommendationLabel" />
            </label> : null}
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
          <ProductSubmitButton intent="draft">
            Сохранить черновик
          </ProductSubmitButton>
          <ProductSubmitButton className={styles.publishButton} intent="publish">
            Опубликовать
          </ProductSubmitButton>
          <Link href="/genlix-admin/products">Вернуться к товарам</Link>
          <p className={styles.helpText}>
            «Сохранить черновик» не меняет публичный сайт. «Опубликовать» создаёт новую восстановимую ревизию.
          </p>
        </aside>
      </ProductEditorForm>

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
