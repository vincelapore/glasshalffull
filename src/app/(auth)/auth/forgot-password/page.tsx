import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Page, PageHeader } from "@/components/ui/page";
import { getSessionUser } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Forgot password",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ email?: string }>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Signed-in users may land here to set a password when they have no credential yet.
  const user = await getSessionUser();
  const params = await searchParams;
  const fromQuery = typeof params.email === "string" ? params.email.trim() : "";
  const initialEmail = fromQuery || user?.email?.trim() || "";

  return (
    <Page width="auth" className="flex flex-col gap-6 py-0 sm:py-2">
      <PageHeader
        className="mb-0"
        title="Forgot password"
        description="We will email a code so you can choose a new password."
      />
      <ForgotPasswordForm initialEmail={initialEmail} />
    </Page>
  );
}
