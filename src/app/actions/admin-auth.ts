"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE,
  adminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/admin";

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

export async function loginAdminAction(
  _prev: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  if (!isAdminConfigured()) {
    return {
      success: false,
      message: "Set ADMIN_PASSWORD in .env.local to enable moderation.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    return { success: false, message: "Incorrect password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, adminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  redirect("/admin/submissions");
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
