import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { EventOrganisersPanel } from "@/components/event-organisers-panel";
import { SectionHeader } from "@/components/ui/page";
import { getSessionUser } from "@/lib/admin";
import { claimInvitedProfile } from "@/lib/claim-profile";
import { getAccountEvents, getEventOrganisers } from "@/lib/queries";
import { isUuid } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Organisers",
};

export const dynamic = "force-dynamic";

export default async function AccountEventOrganisersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/account/events/${id}/organisers`);
  }

  if (!isUuid(id)) {
    notFound();
  }

  await claimInvitedProfile(user);

  const events = await getAccountEvents(user.id);
  const event = events.find((row) => row.id === id && row.organising);
  if (!event) {
    notFound();
  }

  const organisers = await getEventOrganisers(event.id);

  return (
    <AccountShell user={user}>
      <section className="space-y-4">
        <SectionHeader
          title="Organisers"
          description={`Who’s listed on ${event.title}. Invite someone with the email they’ll use to sign up.`}
        />
        <EventOrganisersPanel
          eventId={event.id}
          organisers={organisers.map(({ creative }) => ({
            id: creative.id,
            name: creative.name,
            claimed: Boolean(creative.userId),
            inviteEmail: creative.inviteEmail,
          }))}
        />
      </section>
    </AccountShell>
  );
}
