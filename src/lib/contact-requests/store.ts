import type {
  ContactBusinessType,
  ContactProductChannel,
  ContactRequest,
  ContactRequestStatus,
} from "./types";

const CONTACT_REQUEST_TIMEOUT_MS = 10_000;
const CONTACT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const CONTACT_RATE_LIMIT_MAX_REQUESTS = 5;

type SupabaseConfig = {
  secretKey: string;
  url: string;
};

type ContactRequestRow = {
  admin_note: string | null;
  business_type: ContactBusinessType;
  company: string;
  contact_name: string;
  created_at: string;
  email: string | null;
  id: string;
  phone: string;
  product_channel: ContactProductChannel | null;
  product_slug: string | null;
  product_title: string | null;
  source_path: string;
  status: ContactRequestStatus;
  updated_at: string;
};

export type NewContactRequest = {
  businessType: ContactBusinessType;
  company: string;
  contactName: string;
  email?: string;
  ipHash?: string;
  phone: string;
  privacyAcceptedAt: string;
  productChannel?: ContactProductChannel;
  productSlug?: string;
  productTitle?: string;
  sourcePath: string;
};

export class ContactRequestRateLimitError extends Error {
  constructor() {
    super("Contact request rate limit reached");
    this.name = "ContactRequestRateLimitError";
  }
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(
    /\/$/,
    "",
  );
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    return null;
  }

  return { secretKey, url };
}

export function isContactRequestStoreConfigured() {
  return Boolean(getSupabaseConfig());
}

async function supabaseRequest<T>(pathname: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase is not configured for contact requests");
  }

  const response = await fetch(`${config.url}${pathname}`, {
    ...init,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(CONTACT_REQUEST_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      apikey: config.secretKey,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Contact request storage failed (${response.status}): ${detail.slice(0, 400)}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function mapContactRequest(row: ContactRequestRow): ContactRequest {
  return {
    ...(row.admin_note ? { adminNote: row.admin_note } : {}),
    businessType: row.business_type,
    company: row.company,
    contactName: row.contact_name,
    createdAt: row.created_at,
    ...(row.email ? { email: row.email } : {}),
    id: row.id,
    phone: row.phone,
    ...(row.product_channel ? { productChannel: row.product_channel } : {}),
    ...(row.product_slug ? { productSlug: row.product_slug } : {}),
    ...(row.product_title ? { productTitle: row.product_title } : {}),
    sourcePath: row.source_path,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

async function assertWithinRateLimit(ipHash?: string) {
  if (!ipHash) {
    return;
  }

  const query = new URLSearchParams({
    created_at: `gte.${new Date(Date.now() - CONTACT_RATE_LIMIT_WINDOW_MS).toISOString()}`,
    ip_hash: `eq.${ipHash}`,
    limit: String(CONTACT_RATE_LIMIT_MAX_REQUESTS),
    select: "id",
  });
  const rows = await supabaseRequest<Array<{ id: string }>>(
    `/rest/v1/contact_requests?${query.toString()}`,
  );

  if (rows.length >= CONTACT_RATE_LIMIT_MAX_REQUESTS) {
    throw new ContactRequestRateLimitError();
  }
}

export async function createContactRequest(input: NewContactRequest) {
  await assertWithinRateLimit(input.ipHash);

  const rows = await supabaseRequest<ContactRequestRow[]>("/rest/v1/contact_requests", {
    body: JSON.stringify({
      business_type: input.businessType,
      company: input.company,
      contact_name: input.contactName,
      email: input.email ?? null,
      ip_hash: input.ipHash ?? null,
      phone: input.phone,
      privacy_accepted_at: input.privacyAcceptedAt,
      product_channel: input.productChannel ?? null,
      product_slug: input.productSlug ?? null,
      product_title: input.productTitle ?? null,
      source_path: input.sourcePath,
    }),
    headers: { Prefer: "return=representation" },
    method: "POST",
  });

  if (!rows[0]) {
    throw new Error("Supabase did not return the saved contact request");
  }

  return mapContactRequest(rows[0]);
}

export async function listContactRequests(limit = 200): Promise<ContactRequest[]> {
  const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
  const query = new URLSearchParams({
    limit: String(safeLimit),
    order: "created_at.desc",
    select:
      "id,created_at,updated_at,company,contact_name,phone,email,business_type,product_slug,product_title,product_channel,source_path,status,admin_note",
  });
  const rows = await supabaseRequest<ContactRequestRow[]>(
    `/rest/v1/contact_requests?${query.toString()}`,
  );

  return rows.map(mapContactRequest);
}

export async function updateContactRequestStatus(
  id: string,
  status: ContactRequestStatus,
) {
  await supabaseRequest<void>(
    `/rest/v1/contact_requests?id=eq.${encodeURIComponent(id)}`,
    {
      body: JSON.stringify({ status }),
      headers: { Prefer: "return=minimal" },
      method: "PATCH",
    },
  );
}

