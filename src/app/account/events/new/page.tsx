import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EventSubmissionForm } from "@/components/forms/event-submission-form";
import { Button } from "@/components/ui/button";
import { Page, PageHeader } from "@/components/ui/page";
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
    <Page width="narrow">
      <PageHeader
        title="Submit an event"
        description={`You’ll be listed as organiser (${profile.name}). We’ll review it before it goes live.`}
        actions={
          <Button size="sm" variant="outline" render={<Link href="/account" />}>
            Account
          </Button>
        }
      />
      <EventSubmissionForm />
    </Page>
  );
}
