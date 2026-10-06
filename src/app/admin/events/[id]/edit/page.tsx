import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventSubmissionForm } from "@/components/forms/event-submission-form";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Edit event</h1>
          <p className="text-muted-foreground">
            Update event details. Status is managed from the submissions queue.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          render={<Link href="/admin/submissions" />}
        >
          Back to queue
        </Button>
      </div>
      <EventSubmissionForm
        mode="edit"
        eventId={event.id}
        defaultValues={{
          title: event.title,
          dateTime: toDateTimeLocalValue(event.dateTime),
          city: event.city,
          location: event.location,
          categories: event.categories,
          description: event.description ?? "",
          ticketLink: event.ticketLink ?? "",
          flyerKey: event.flyerKey ?? "",
        }}
      />
    </div>
  );
}
