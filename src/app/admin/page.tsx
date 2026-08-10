import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isAdminAuthenticated } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminIndexPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/submissions");
  }
  redirect("/admin/login");
}
