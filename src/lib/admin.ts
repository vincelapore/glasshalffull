import { asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { admins } from "@/db/schema";
import { auth } from "@/lib/auth/server";

function parseEmailList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Hardcoded plus OWNER_EMAILS. Owners manage the admin list. */
export function getOwnerEmails() {
  return Array.from(
    new Set([
      "vincemlapore@gmail.com",
      ...parseEmailList(process.env.OWNER_EMAILS),
    ])
  );
}

/** Bootstrap seed only. Extra admins copied into the table on first check. */
export function getBootstrapAdminEmails() {
  return parseEmailList(process.env.ADMIN_EMAILS);
}

export function isAdminConfigured() {
  return getOwnerEmails().length > 0 || getBootstrapAdminEmails().length > 0;
}

export async function getSessionUser() {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
}

export async function syncStaff() {
  const owners = getOwnerEmails();
  if (owners.length > 0) {
    await db
      .insert(admins)
      .values(
        owners.map((email) => ({
          email,
          role: "owner" as const,
          createdByEmail: "bootstrap",
        }))
      )
      .onConflictDoUpdate({
        target: admins.email,
        set: { role: "owner" },
      });
  }

  const extraAdmins = getBootstrapAdminEmails().filter(
    (email) => !owners.includes(email)
  );
  if (extraAdmins.length > 0) {
    await db
      .insert(admins)
      .values(
        extraAdmins.map((email) => ({
          email,
          role: "admin" as const,
          createdByEmail: "bootstrap",
        }))
      )
      .onConflictDoNothing();
  }
}

export async function listStaff() {
  await syncStaff();
  return db
    .select()
    .from(admins)
    .orderBy(desc(admins.role), asc(admins.email));
}

export async function getStaffRole(email: string | null | undefined) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();

  try {
    await syncStaff();
    const [row] = await db
      .select({ role: admins.role })
      .from(admins)
      .where(eq(admins.email, normalized))
      .limit(1);
    return row?.role ?? null;
  } catch (error) {
    console.error("getStaffRole", error);
    if (getOwnerEmails().includes(normalized)) return "owner" as const;
    if (getBootstrapAdminEmails().includes(normalized)) return "admin" as const;
    return null;
  }
}

export async function isAdminEmail(email: string | null | undefined) {
  const role = await getStaffRole(email);
  return role === "owner" || role === "admin";
}

export async function isOwnerEmail(email: string | null | undefined) {
  return (await getStaffRole(email)) === "owner";
}

export async function isAdminAuthenticated() {
  const user = await getSessionUser();
  return isAdminEmail(user?.email);
}

/** Moderators (owners and admins). Guests go to sign-in; everyone else home. */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?next=/admin/submissions");
  }
  if (!(await isAdminEmail(user.email))) {
    redirect("/");
  }
  return user;
}

/** Owners only. Manage who can moderate. */
export async function requireOwner() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?next=/admin/team");
  }
  if (!(await isOwnerEmail(user.email))) {
    redirect("/admin/submissions");
  }
  return user;
}
