import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventSubmissionForm } from "@/components/forms/event-submission-form";
import { Button } from "@/components/ui/button";
import { Page, PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";
import { toDateTimeLocalValue } from "@/lib/labels";
import { getEventById } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit Event",
};

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

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
    </Page>
  );
}
