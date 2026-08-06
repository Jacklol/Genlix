import styles from "./Brand.module.css";

type BrandProps = {
  href?: string;
};

export function Brand({ href = "/" }: BrandProps) {
  return (
    <a className={styles.brand} href={href} aria-label="Genlix — на главную">
      <span aria-hidden="true" />
      <strong>Genlix</strong>
    </a>
  );
}
