import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { EventSubmissionForm } from "@/components/forms/event-submission-form";
import { SectionHeader } from "@/components/ui/page";
import { getSessionUser } from "@/lib/admin";
import { toDateTimeLocalValue } from "@/lib/labels";
import { getEventById } from "@/lib/queries";
import { isUuid } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Edit event",
};

export const dynamic = "force-dynamic";

export default async function EditMyEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/account/events/${id}/edit`);
  }

  if (!isUuid(id)) {
    notFound();
  }

  const event = await getEventById(id);
  if (!event || event.submittedByUserId !== user.id) {
    notFound();
  }

  return (
    <AccountShell user={user}>
      <section className="space-y-4">
        <SectionHeader
          title="Edit event"
          description={
            event.status === "rejected"
              ? "Name, date, city, location, and a flyer are required. Saving sends it back for review."
              : "Name, date, city, location, and a flyer are required."
          }
        />
        <EventSubmissionForm
          mode="edit"
          editor="owner"
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
      </section>
    </AccountShell>
  );
}
