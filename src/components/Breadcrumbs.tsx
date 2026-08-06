import { Fragment } from "react";

import homeStyles from "@/app/home.module.css";

import styles from "./Breadcrumbs.module.css";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className={styles.bar}>
      <div className={homeStyles.shell}>
        <nav className={styles.nav} aria-label="Хлебные крошки">
          {items.map((item, index) => (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? (
                <span className={styles.separator} aria-hidden="true">
                  ›
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
