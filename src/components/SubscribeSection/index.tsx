import homeStyles from "@/app/home.module.css";
import { FooterInstagramIcon } from "@/components/icons/FooterInstagramIcon";

import styles from "./SubscribeSection.module.css";

export function SubscribeSection() {
  return (
    <section className={styles.section} aria-labelledby="subscribe-title">
      <div className={homeStyles.shell}>
        <div className={styles.grid}>
          <div className={styles.heading}>
            <h2 id="subscribe-title">
              Подпишитесь <span>на обновления</span>
            </h2>
            <p>
              Получайте новости о поставках, сезонных предложениях и обновлениях ассортимента
              для HoReCa и ритейла.
            </p>
          </div>
          <form className={styles.form}>
            <input name="email" placeholder="Ваша почта" type="email" />
            <button type="submit">Подписаться</button>
            <a className={styles.social} href="/#contacts" aria-label="Instagram">
              <FooterInstagramIcon />
            </a>
          </form>
        </div>
      </div>
    </section>
  );
}
