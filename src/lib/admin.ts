import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "ghf_admin";

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

export function isAdminConfigured() {
  return getAdminPassword().length > 0;
}

export function verifyAdminPassword(password: string) {
  const expected = getAdminPassword();
  if (!expected) return false;

  const left = Buffer.from(hashSecret(password));
  const right = Buffer.from(hashSecret(expected));

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function isAdminAuthenticated() {
  const expected = getAdminPassword();
  if (!expected) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const left = Buffer.from(token);
  const right = Buffer.from(hashSecret(expected));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function adminSessionToken() {
  return hashSecret(getAdminPassword());
}
