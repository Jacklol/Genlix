"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";

import {
  submitContactRequest,
  type ContactFormState,
} from "@/app/contact-actions";
import styles from "@/app/home.module.css";
import type { ContactProductContext } from "@/lib/contact-requests/types";

const initialState: ContactFormState = { status: "idle" };

function FieldError({ children, id }: { children?: string; id: string }) {
  return children ? (
    <span className={styles.contactFieldError} id={id}>
      {children}
    </span>
  ) : null;
}

export function ContactRequestForm({ product }: { product?: ContactProductContext }) {
  const [state, formAction, isPending] = useActionState(submitContactRequest, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultBusiness = product?.channel === "retail" ? "retail" : "horeca";

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className={styles.contactForm} ref={formRef}>
      <h3>Заявка на партнёрство</h3>

      {product ? (
        <div className={styles.contactProduct}>
          <span>Запрос по товару</span>
          <strong>{product.title}</strong>
        </div>
      ) : null}
      <input name="productSlug" type="hidden" value={product?.slug ?? ""} />

      <label>
        Название компании
        <input
          aria-describedby={state.errors?.company ? "contact-company-error" : undefined}
          aria-invalid={Boolean(state.errors?.company)}
          autoComplete="organization"
          name="company"
          placeholder="ООО Гастрономия Плюс"
          required
        />
        <FieldError id="contact-company-error">{state.errors?.company}</FieldError>
      </label>
      <label>
        Ваше имя
        <input
          aria-describedby={state.errors?.name ? "contact-name-error" : undefined}
          aria-invalid={Boolean(state.errors?.name)}
          autoComplete="name"
          name="name"
          placeholder="Владислав Козлов"
          required
        />
        <FieldError id="contact-name-error">{state.errors?.name}</FieldError>
      </label>
      <label>
        Контактный телефон
        <input
          aria-describedby={state.errors?.phone ? "contact-phone-error" : undefined}
          aria-invalid={Boolean(state.errors?.phone)}
          autoComplete="tel"
          inputMode="tel"
          name="phone"
          placeholder="+7 (999) 123-45-67"
          required
        />
        <FieldError id="contact-phone-error">{state.errors?.phone}</FieldError>
      </label>
      <label>
        Электронная почта <small>(необязательно)</small>
        <input
          aria-describedby={state.errors?.email ? "contact-email-error" : undefined}
          aria-invalid={Boolean(state.errors?.email)}
          autoComplete="email"
          name="email"
          placeholder="name@company.ru"
          type="email"
        />
        <FieldError id="contact-email-error">{state.errors?.email}</FieldError>
      </label>

      <label className={styles.contactHoneypot} aria-hidden="true">
        Сайт
        <input autoComplete="off" name="website" tabIndex={-1} />
      </label>

      <fieldset aria-describedby={state.errors?.business ? "contact-business-error" : undefined}>
        <legend>Тип бизнеса</legend>
        <label>
          <input defaultChecked={defaultBusiness === "horeca"} name="business" type="radio" value="horeca" />
          HoReCa
        </label>
        <label>
          <input defaultChecked={defaultBusiness === "retail"} name="business" type="radio" value="retail" />
          Ритейл
        </label>
        <label>
          <input name="business" type="radio" value="distributor" /> Дистрибьютор
        </label>
        <FieldError id="contact-business-error">{state.errors?.business}</FieldError>
      </fieldset>

      <button className={styles.primaryButton} disabled={isPending} type="submit">
        {isPending ? "Отправляем…" : "Отправить заявку"}
      </button>
      <label className={styles.consent}>
        <input name="consent" required type="checkbox" value="accepted" />
        <span>
          Я соглашаюсь с условиями {" "}
          <Link href="/privacy" target="_blank">
            обработки персональных данных
          </Link>
          .
        </span>
      </label>
      <FieldError id="contact-consent-error">{state.errors?.consent}</FieldError>

      {state.message ? (
        <p
          className={`${styles.contactFormMessage} ${
            state.status === "success" ? styles.contactFormSuccess : styles.contactFormFailure
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
