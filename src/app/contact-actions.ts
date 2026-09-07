"use server";

import { createHmac } from "node:crypto";

import { headers } from "next/headers";

import { getContactProductContext } from "@/lib/contact-requests/context";
import {
  ContactRequestRateLimitError,
  createContactRequest,
} from "@/lib/contact-requests/store";
import {
  CONTACT_BUSINESS_TYPES,
  type ContactBusinessType,
} from "@/lib/contact-requests/types";

export type ContactFormField =
  | "business"
  | "company"
  | "consent"
  | "email"
  | "name"
  | "phone";

export type ContactFormState = {
  errors?: Partial<Record<ContactFormField, string>>;
  message?: string;
  status: "idle" | "error" | "success";
};

function formText(formData: FormData, key: string, maxLength: number) {
  return String(formData.get(key) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength + 1);
}

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerStore.get("x-real-ip")?.trim() || undefined;
}

function getIpHash(ip: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();

  if (!ip || !secret) {
    return undefined;
  }

  return createHmac("sha256", secret)
    .update("genlix-contact-rate-limit\0")
    .update(ip)
    .digest("hex");
}

function getSourcePath(headerStore: Awaited<ReturnType<typeof headers>>) {
  const referer = headerStore.get("referer");

  if (!referer) {
    return "/";
  }

  try {
    const pathname = new URL(referer).pathname;
    return pathname.startsWith("/") ? pathname.slice(0, 300) : "/";
  } catch {
    return "/";
  }
}

export async function submitContactRequest(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // A filled hidden field indicates an automated submission. Return the same
  // response as a real request so bots cannot use it to tune their payload.
  if (formText(formData, "website", 200)) {
    return {
      message: "Спасибо! Заявка принята. Мы свяжемся с вами в ближайшее время.",
      status: "success",
    };
  }

  const company = formText(formData, "company", 160);
  const contactName = formText(formData, "name", 120);
  const phone = formText(formData, "phone", 40);
  const email = formText(formData, "email", 254).toLowerCase();
  const businessValue = formText(formData, "business", 20);
  const consent = formData.get("consent") === "accepted";
  const productSlug = formText(formData, "productSlug", 120);
  const errors: NonNullable<ContactFormState["errors"]> = {};

  if (company.length < 2) {
    errors.company = "Укажите название компании.";
  }
  if (contactName.length < 2) {
    errors.name = "Укажите ваше имя.";
  }
  if (phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Проверьте номер телефона.";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Проверьте адрес электронной почты.";
  }
  if (!CONTACT_BUSINESS_TYPES.includes(businessValue as ContactBusinessType)) {
    errors.business = "Выберите тип бизнеса.";
  }
  if (!consent) {
    errors.consent = "Нужно согласие на обработку данных.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      message: "Проверьте выделенные поля.",
      status: "error",
    };
  }

  try {
    const [headerStore, product] = await Promise.all([
      headers(),
      getContactProductContext(productSlug || undefined),
    ]);

    await createContactRequest({
      businessType: businessValue as ContactBusinessType,
      company,
      contactName,
      ...(email ? { email } : {}),
      ipHash: getIpHash(getClientIp(headerStore)),
      phone,
      privacyAcceptedAt: new Date().toISOString(),
      ...(product?.channel ? { productChannel: product.channel } : {}),
      ...(product ? { productSlug: product.slug, productTitle: product.title } : {}),
      sourcePath: getSourcePath(headerStore),
    });

    return {
      message: "Спасибо! Заявка принята. Мы свяжемся с вами в ближайшее время.",
      status: "success",
    };
  } catch (error) {
    if (error instanceof ContactRequestRateLimitError) {
      return {
        message: "Мы уже получили ваши заявки. Пожалуйста, попробуйте немного позже.",
        status: "error",
      };
    }

    console.error("Contact request submission failed", error);
    return {
      message: "Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.",
      status: "error",
    };
  }
}

