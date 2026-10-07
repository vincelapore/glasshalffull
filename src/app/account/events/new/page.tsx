import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { EventSubmissionForm } from "@/components/forms/event-submission-form";
import { SectionHeader } from "@/components/ui/page";
import { getSessionUser } from "@/lib/admin";
import { getCreativeByUserId } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Add event",
};

export const dynamic = "force-dynamic";

export default async function AccountSubmitEventPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?next=/account/events/new");
  }

  const profile = await getCreativeByUserId(user.id);
  if (!profile) {
    redirect("/account/events");
  }

  return (
    <AccountShell user={user}>
      <section className="space-y-4">
        <SectionHeader
          title="Add an event"
          description={`You’ll be listed as organiser (${profile.name}). We’ll review it before it goes live.`}
        />
        <EventSubmissionForm />
      </section>
    </AccountShell>
  );
}
