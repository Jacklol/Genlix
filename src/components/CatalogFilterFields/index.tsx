import type { ReactNode } from "react";
import styles from "./CatalogFilterFields.module.css";

export function CatalogFilterFields({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.fields, className].filter(Boolean).join(" ")}>{children}</div>;
}
