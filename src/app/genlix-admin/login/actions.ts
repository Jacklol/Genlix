"use server";

import { redirect } from "next/navigation";

import {
  createAdminSession,
  getAdminAuthStatus,
  verifyAdminCredentials,
} from "@/lib/admin/auth";

export async function loginAdmin(formData: FormData) {
  const username = String(formData.get("username") ?? "").slice(0, 128);
  const password = String(formData.get("password") ?? "").slice(0, 512);
  const status = getAdminAuthStatus();

  if (!status.configured) {
    redirect("/genlix-admin/login?error=config");
  }

  if (!verifyAdminCredentials(username, password)) {
    redirect("/genlix-admin/login?error=credentials");
  }

  await createAdminSession(username.trim());
  redirect("/genlix-admin");
}
