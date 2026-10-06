import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-muted-foreground">
          Sign in to manage your profile and events.
        </p>
      </div>
      <AuthForm mode="sign-in" next={next} />
    </div>
  );
}
