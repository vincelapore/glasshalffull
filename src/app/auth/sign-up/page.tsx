import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Create account
        </h1>
        <p className="text-muted-foreground">
          Join Glass Half Full — we&apos;ll email a verification code, then you
          can keep your creative profile and event submissions in one place.
        </p>
      </div>
      <AuthForm mode="sign-up" />
    </div>
  );
}
