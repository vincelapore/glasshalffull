import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser, isAdminEmail } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?next=/admin/submissions");
  }
  if (!(await isAdminEmail(user.email))) {
    redirect("/");
  }
  redirect("/admin/submissions");
}
