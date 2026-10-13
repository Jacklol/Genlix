import { Fragment } from "react";
import Image from "next/image";

import homeStyles from "@/app/home.module.css";

import styles from "./Breadcrumbs.module.css";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  variant?: "default" | "dark";
};

export function Breadcrumbs({ items, variant = "default" }: BreadcrumbsProps) {
  return (
    <div className={`${styles.bar} ${variant === "dark" ? styles.dark : ""}`}>
      <div className={homeStyles.shell}>
        <nav className={styles.nav} aria-label="Хлебные крошки">
          {items.map((item, index) => (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? (
                <span className={styles.separator} aria-hidden="true">
                  {variant === "dark" ? <Image src="/assets/catalog/meat/catalog-hero/breadcrumb-chevron.svg" width={12} height={12} alt="" /> : "›"}
                </span>
              ) : null}
              {item.href ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <strong className={styles.current}>{item.label}</strong>
              )}
            </Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
}
