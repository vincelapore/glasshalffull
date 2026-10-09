"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { admins } from "@/db/schema";
import { getAccountsByIds } from "@/lib/accounts";
import { getOwnerEmails, requireOwner, syncStaff } from "@/lib/admin";

export type AdminActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function addAdminsAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireOwner();
  const userIds = formData
    .getAll("userId")
    .map((value) => String(value));
  const accounts = await getAccountsByIds(userIds);

  if (accounts.length === 0) {
    return { success: false, message: "Select an account." };
  }

  await syncStaff();

  const existing = await db
    .select({ email: admins.email, role: admins.role })
    .from(admins);
  const staffByEmail = new Map(
    existing.map((person) => [person.email, person.role])
  );

  const toAdd = accounts.filter((account) => !staffByEmail.has(account.email));

  if (toAdd.length === 0) {
    return {
      success: false,
      message: "Those accounts are already on the team.",
    };
  }

  try {
    await db.insert(admins).values(
      toAdd.map((account) => ({
        email: account.email,
        role: "admin" as const,
        createdByEmail: actor.email?.toLowerCase() ?? null,
      }))
    );
    revalidatePath("/admin/team");
    const names = toAdd.map((account) => account.name || account.email);
    return {
      success: true,
      message:
        names.length === 1
          ? `${names[0]} can moderate.`
          : `Added ${names.join(", ")}.`,
    };
  } catch (error) {
    console.error("addAdminsAction", error);
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
