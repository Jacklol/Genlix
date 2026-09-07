export const CONTACT_BUSINESS_TYPES = ["horeca", "retail", "distributor"] as const;
export const CONTACT_REQUEST_STATUSES = ["new", "in_progress", "closed"] as const;

export type ContactBusinessType = (typeof CONTACT_BUSINESS_TYPES)[number];
export type ContactRequestStatus = (typeof CONTACT_REQUEST_STATUSES)[number];
export type ContactProductChannel = "horeca" | "retail";

export type ContactProductContext = {
  channel?: ContactProductChannel;
  slug: string;
  title: string;
};

export type ContactRequest = {
  adminNote?: string;
  businessType: ContactBusinessType;
  company: string;
  contactName: string;
  createdAt: string;
  email?: string;
  id: string;
  phone: string;
  productChannel?: ContactProductChannel;
  productSlug?: string;
  productTitle?: string;
  sourcePath: string;
  status: ContactRequestStatus;
  updatedAt: string;
};

export const contactBusinessLabels: Record<ContactBusinessType, string> = {
  distributor: "Дистрибьютор",
  horeca: "HoReCa",
  retail: "Ритейл",
};

export const contactRequestStatusLabels: Record<ContactRequestStatus, string> = {
  closed: "Закрыта",
  in_progress: "В работе",
  new: "Новая",
};

