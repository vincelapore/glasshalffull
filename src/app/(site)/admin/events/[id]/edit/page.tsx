import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ModerationActivityLog } from "@/components/admin/moderation-activity-log";
import { EventOrganisersPanel } from "@/components/event-organisers-panel";
import { EventSubmissionForm } from "@/components/forms/event-submission-form";
import { Button } from "@/components/ui/button";
import { Page, PageHeader, SectionHeader } from "@/components/ui/page";
import { isOwnerEmail, requireAdmin } from "@/lib/admin";
import { toDateTimeLocalValue } from "@/lib/labels";
import { getModerationActivity } from "@/lib/moderation-activity";
import { getEventById, getEventOrganisers } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit Event",
};

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();

  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const showActivity = await isOwnerEmail(user.email);
  const [organisers, activity] = await Promise.all([
    getEventOrganisers(event.id),
    showActivity
      ? getModerationActivity("event", event.id)
      : Promise.resolve([]),
  ]);

  return (
    <Page width="narrow">
      <PageHeader
        title="Edit event"
        description="Update event details. Status is managed from the submissions queue."
        actions={
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/admin/submissions" />}
          >
            Back to queue
          </Button>
        }
      />
      <EventSubmissionForm
        mode="edit"
        eventId={event.id}
        defaultValues={{
          title: event.title,
          dateTime: toDateTimeLocalValue(event.dateTime),
          city: event.city,
          location: event.location,
          categories: event.categories,
          musicGenres: event.musicGenres ?? [],
          description: event.description ?? "",
          ticketLink: event.ticketLink ?? "",
          flyerKey: event.flyerKey ?? "",
        }}
      />
      <section className="mt-14 space-y-4">
        <SectionHeader
          title="Organisers"
          description="Search the directory, or invite someone with a name and email."
        />
        <EventOrganisersPanel
          eventId={event.id}
          allowInvite
          organisers={organisers.map(({ creative }) => ({
            id: creative.id,
            name: creative.name,
            claimed: Boolean(creative.userId),
            inviteEmail: creative.inviteEmail,
            disciplines: creative.disciplines,
            cardDiscipline: creative.cardDiscipline,
          }))}
        />
      </section>
      {showActivity ? (
        <ModerationActivityLog entries={activity} viewerEmail={user.email} />
      ) : null}
    </Page>
  );
}
