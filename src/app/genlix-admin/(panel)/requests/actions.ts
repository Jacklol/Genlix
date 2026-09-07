"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";
import { updateContactRequestStatus } from "@/lib/contact-requests/store";
import {
  CONTACT_REQUEST_STATUSES,
  type ContactRequestStatus,
} from "@/lib/contact-requests/types";

export async function changeContactRequestStatus(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  let destination = "/genlix-admin/requests";

  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error("Invalid contact request identifier");
    }

    if (!CONTACT_REQUEST_STATUSES.includes(status as ContactRequestStatus)) {
      throw new Error("Invalid contact request status");
    }

    await updateContactRequestStatus(id, status as ContactRequestStatus);
    revalidatePath("/genlix-admin/requests");
    destination += "?saved=1";
  } catch (error) {
    console.error("Contact request status update failed", error);
    destination += `?error=${encodeURIComponent("Не удалось обновить статус заявки.")}`;
  }

  redirect(destination);
}

