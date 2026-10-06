import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EventSubmissionForm } from "@/components/forms/event-submission-form";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/admin";
import { getCreativeByUserId } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Submit event",
};

export const dynamic = "force-dynamic";

export default async function AccountSubmitEventPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?next=/account/events/new");
  }

  const profile = await getCreativeByUserId(user.id);
  if (!profile) {
    redirect("/account");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Submit an event
          </h1>
          <p className="text-muted-foreground">
            You’ll be listed as organiser ({profile.name}). Submissions land in
            review before going live on the directory.
          </p>
        </div>
        <Button size="sm" variant="outline" render={<Link href="/account" />}>
          Account
        </Button>
      </div>
      <EventSubmissionForm />
    </div>
  );
}
