import styles from "@/app/genlix-admin/admin.module.css";

export function AdminSiteLink({ href }: { href: string }) {
  return (
    <a className={`${styles.secondaryLink} ${styles.siteLink}`} href={href} target="_blank" rel="noopener noreferrer">
      <span>Открыть на сайте</span>
      <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M5 15 15 5M5 5h10v10" /></svg>
    </a>
  );
}
