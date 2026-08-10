import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/submissions");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Sign in to review event and creative submissions.
        </p>
      </div>
      {!isAdminConfigured() ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          Add <code className="text-foreground">ADMIN_PASSWORD</code> to{" "}
          <code className="text-foreground">.env.local</code> to enable this page.
        </p>
      ) : (
        <AdminLoginForm />
      )}
    </div>
  );
}
