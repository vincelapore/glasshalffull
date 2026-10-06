"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { admins } from "@/db/schema";
import { getOwnerEmails, requireOwner, syncStaff } from "@/lib/admin";

export type AdminActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function addAdminAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireOwner();
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!email || !email.includes("@")) {
    return { success: false, message: "Enter a valid email address." };
  }

  await syncStaff();

  const [existing] = await db
    .select({ email: admins.email, role: admins.role })
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (existing) {
    return {
      success: false,
      message:
        existing.role === "owner"
          ? "That email is already an owner."
          : "That email is already an admin.",
    };
  }

  try {
    await db.insert(admins).values({
      email,
      role: "admin",
      createdByEmail: actor.email?.toLowerCase() ?? null,
    });
    revalidatePath("/admin/team");
    return {
      success: true,
      message: `${email} can moderate once they sign in with that email.`,
    };
  } catch (error) {
    console.error("addAdminAction", error);
    return { success: false, message: "Could not add admin." };
  }
}

export async function removeAdminAction(
  email: string
): Promise<AdminActionResult> {
  await requireOwner();
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return { success: false, message: "Missing email." };
  }

  if (getOwnerEmails().includes(normalized)) {
    return { success: false, message: "Owners can't be removed from here." };
  }

  const [row] = await db
    .select({ email: admins.email, role: admins.role })
    .from(admins)
    .where(eq(admins.email, normalized))
    .limit(1);

  if (!row) {
    return { success: false, message: "Admin not found." };
  }

  if (row.role === "owner") {
    return { success: false, message: "Owners can't be removed from here." };
  }

  try {
    const [removed] = await db
      .delete(admins)
      .where(and(eq(admins.email, normalized), eq(admins.role, "admin")))
      .returning({ email: admins.email });

    if (!removed) {
      return { success: false, message: "Admin not found." };
    }

    revalidatePath("/admin/team");
    return { success: true, message: `Removed ${normalized}.` };
  } catch (error) {
    console.error("removeAdminAction", error);
    return { success: false, message: "Could not remove admin." };
  }
}
