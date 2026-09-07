import {
  contactBusinessLabels,
  contactRequestStatusLabels,
  CONTACT_REQUEST_STATUSES,
  type ContactRequest,
} from "@/lib/contact-requests/types";
import {
  isContactRequestStoreConfigured,
  listContactRequests,
} from "@/lib/contact-requests/store";

import { changeContactRequestStatus } from "./actions";
import styles from "../../admin.module.css";

type RequestsPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Minsk",
});

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const { error, saved } = await searchParams;
  let requests: ContactRequest[] = [];
  let loadError = "";

  if (!isContactRequestStoreConfigured()) {
    loadError = "Заявки пока недоступны. Проверьте подключение и миграцию Supabase.";
  } else {
    try {
      requests = await listContactRequests();
    } catch (requestError) {
      console.error("Contact requests could not be loaded", requestError);
      loadError = "Заявки пока недоступны. Проверьте подключение и миграцию Supabase.";
    }
  }

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Заявки</h1>
          <p>Обращения с сайта и выбранные посетителями товары.</p>
        </div>
      </header>

      {error ? <p className={styles.alert}>{error}</p> : null}
      {loadError ? <p className={styles.alert}>{loadError}</p> : null}
      {saved ? <p className={styles.successAlert}>Статус заявки обновлён.</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Компания и контакт</th>
              <th>Тип</th>
              <th>Товар</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td className={styles.requestDate}>
                  {dateFormatter.format(new Date(request.createdAt))}
                </td>
                <td>
                  <div className={styles.requestContact}>
                    <strong>{request.company}</strong>
                    <span>{request.contactName}</span>
                    <a href={`tel:${request.phone}`}>{request.phone}</a>
                    {request.email ? <a href={`mailto:${request.email}`}>{request.email}</a> : null}
                  </div>
                </td>
                <td>{contactBusinessLabels[request.businessType]}</td>
                <td>
                  {request.productTitle ? (
                    <div className={styles.requestProduct}>
                      <strong>{request.productTitle}</strong>
                      {request.productChannel ? (
                        <span>{request.productChannel === "horeca" ? "HoReCa" : "Ритейл"}</span>
                      ) : null}
                    </div>
                  ) : (
                    <span className={styles.requestMuted}>Общая заявка</span>
                  )}
                </td>
                <td>
                  <form action={changeContactRequestStatus} className={styles.statusSelectForm}>
                    <input name="id" type="hidden" value={request.id} />
                    <select
                      aria-label={`Статус заявки от ${request.company}`}
                      defaultValue={request.status}
                      name="status"
                    >
                      {CONTACT_REQUEST_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {contactRequestStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <button type="submit">Сохранить</button>
                  </form>
                </td>
              </tr>
            ))}
            {!requests.length && !loadError ? (
              <tr>
                <td className={styles.emptyTableCell} colSpan={5}>
                  Новых заявок пока нет.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
