import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { EventModerationNote } from "@/components/event-moderation-note";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionHeader, TextLink } from "@/components/ui/page";
import { getSessionUser } from "@/lib/admin";
import { claimInvitedProfile } from "@/lib/claim-profile";
import { cityLabels, formatDateTime, statusLabels } from "@/lib/labels";
import { eventPath } from "@/lib/paths";
import { getAccountEvents, getCreativeByUserId } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Events",
};

export const dynamic = "force-dynamic";

export default async function AccountEventsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?next=/account/events");
  }

  await claimInvitedProfile(user);

  const [profile, events] = await Promise.all([
    getCreativeByUserId(user.id),
    getAccountEvents(user.id),
  ]);

  return (
    <AccountShell user={user}>
      <section className="space-y-4">
        <SectionHeader
          title="Your events"
          description={
            profile
              ? "Events you added, and ones you organise."
              : undefined
          }
          action={
            profile ? (
              <Button
                size="sm"
                variant="ghost"
                render={<Link href="/account/events/new" />}
              >
                Add event
              </Button>
            ) : null
          }
        />
        {!profile ? (
          <EmptyState>
            Save your profile first. You’ll be listed as organiser on events
            you add.{" "}
            <TextLink href="/account" variant="hover" className="text-foreground">
              Edit profile
            </TextLink>
            .
          </EmptyState>
        ) : events.length === 0 ? (
          <EmptyState>
            No events yet.{" "}
            <TextLink
              href="/account/events/new"
              variant="hover"
              className="text-foreground"
            >
              Add one
            </TextLink>
            .
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <TextLink
                    href={eventPath(event.slug)}
                    variant="hover"
                    className="font-medium text-foreground"
                  >
                    {event.title}
                  </TextLink>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(event.dateTime)} · {cityLabels[event.city]}
                  </p>
                  <EventModerationNote
                    note={event.moderationNote}
                    className="mt-2"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {event.organising ? (
                    <TextLink
                      href={`/account/events/${event.id}/organisers`}
                      variant="hover"
                      className="text-sm"
                    >
                      Organisers
                    </TextLink>
                  ) : null}
                  {event.submittedByMe ? (
                    <TextLink
                      href={`/account/events/${event.id}/edit`}
                      variant="hover"
                      className="text-sm"
                    >
                      Edit
                    </TextLink>
                  ) : null}
                  <span className="text-sm capitalize text-muted-foreground">
                    {statusLabels[event.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountShell>
  );
}
