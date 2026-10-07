import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { Page, PageHeader } from "@/components/ui/page";
import { getSessionUser } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ next?: string }>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const next =
    typeof params.next === "string" &&
    params.next.startsWith("/") &&
    !params.next.startsWith("//")
      ? params.next
      : undefined;

  const user = await getSessionUser();
  if (user) {
    redirect(next ?? "/account");
  }

  return (
    <Page width="auth" className="flex flex-col gap-6 py-16">
      <PageHeader
        className="mb-0"
        title="Sign in"
        description="Sign in to manage your profile and events."
      />
      <AuthForm mode="sign-in" next={next} />
    </Page>
  );
}
