import Link from "next/link";

import homeStyles from "@/app/home.module.css";

import styles from "./CatalogCategoryNav.module.css";

type CatalogCategory = "meat" | "bird" | "beer";

type CatalogCategoryNavProps = {
  activeCategory: CatalogCategory;
};

const categories = [
  { href: "/catalog/meat", id: "meat", label: "Мясо" },
  { href: "/catalog/bird", id: "bird", label: "Птица" },
  { href: "/catalog/beer", id: "beer", label: "Пиво" },
] as const satisfies readonly {
  href: string;
  id: CatalogCategory;
  label: string;
}[];

export function CatalogCategoryNav({ activeCategory }: CatalogCategoryNavProps) {
  return (
    <div className={styles.bar}>
      <div className={homeStyles.shell}>
        <nav aria-label="Разделы каталога">
          <ul className={styles.list}>
            {categories.map((category) => {
              const isActive = category.id === activeCategory;

              return (
                <li key={category.id}>
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={isActive ? styles.active : undefined}
                    href={category.href}
                  >
                    {category.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
