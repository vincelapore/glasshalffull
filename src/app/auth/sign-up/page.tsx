import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { Page, PageHeader } from "@/components/ui/page";
import { getSessionUser } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Create account",
};

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/account");
  }

  return (
    <Page width="auth" className="flex flex-col gap-6 py-16">
      <PageHeader
        className="mb-0"
        title="Create account"
        description="Create an account to add your profile and events. We'll email a verification code."
      />
      <AuthForm mode="sign-up" />
    </Page>
  );
}
