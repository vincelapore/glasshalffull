import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { SectionHeader } from "@/components/ui/page";
import { getSessionUser } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Security",
};

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?next=/account/security");
  }

  return (
    <AccountShell user={user}>
      <section className="space-y-4">
        <SectionHeader
          title="Password"
          description="Change your password. Other devices will be signed out after a successful update."
        />
        <ChangePasswordForm />
      </section>
    </AccountShell>
  );
}
