import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/actions/auth";
import { EventModerationNote } from "@/components/event-moderation-note";
import { CreativeSubmissionForm } from "@/components/forms/creative-submission-form";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  Page,
  PageHeader,
  SectionHeader,
  TextLink,
} from "@/components/ui/page";
import { getSessionUser, isAdminEmail, isOwnerEmail } from "@/lib/admin";
import { cityLabels, formatDateTime, statusLabels } from "@/lib/labels";
import { creativePath, eventPath } from "@/lib/paths";
import { getCreativeByUserId, getEventsByUserId } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Account",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?next=/account");
  }

  const [profile, events] = await Promise.all([
    getCreativeByUserId(user.id),
    getEventsByUserId(user.id),
  ]);

  const admin = await isAdminEmail(user.email);
  const owner = await isOwnerEmail(user.email);

  return (
    <Page width="narrow">
      <PageHeader
        className="mb-10"
        title="Account"
        description={
          <>
            {user.name || user.email}
            {user.email && user.name ? ` · ${user.email}` : null}
          </>
        }
        actions={
          <>
            {admin ? (
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/admin/submissions" />}
              >
                Moderation
              </Button>
            ) : null}
            {owner ? (
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/admin/team" />}
              >
                Team
              </Button>
            ) : null}
            <form action={signOutAction}>
              <Button type="submit" size="sm" variant="outline">
                Sign out
              </Button>
            </form>
          </>
        }
      />

      <section className="mb-14 space-y-4">
        <SectionHeader
          title="Profile"
          description={profile ? undefined : "So people can find you."}
          action={
            profile ? (
              <p className="text-sm text-muted-foreground">
                {statusLabels[profile.status]}
                {profile.status === "approved" ? (
                  <>
                    {" "}
                    ·{" "}
                    <TextLink href={creativePath(profile.slug)} variant="hover">
                      View public page
                    </TextLink>
                  </>
                ) : null}
              </p>
            ) : null
          }
        />
        <CreativeSubmissionForm
          mode="profile"
          defaultValues={
            profile
              ? {
                  name: profile.name,
                  craftCategories: profile.craftCategories,
                  city: profile.city ?? "",
                  bio: profile.bio ?? "",
                  instagramHandle: profile.instagramHandle ?? "",
                  portfolioUrl: profile.portfolioUrl ?? "",
                  avatarKey: profile.avatarKey ?? "",
                  workPhotoKeys: profile.workPhotoKeys,
                  openToPaidWork: profile.openToPaidWork,
                  openToTrade: profile.openToTrade,
                  buildingPortfolio: profile.buildingPortfolio,
                }
              : undefined
          }
        />
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Events"
          action={
            profile ? (
              <Button
                size="sm"
                variant="ghost"
                render={<Link href="/account/events/new" />}
              >
                Submit event
              </Button>
            ) : null
          }
        />
        {!profile ? (
          <EmptyState>
            Save your profile above first. You’ll be listed as organiser on
            events you submit.
          </EmptyState>
        ) : events.length === 0 ? (
          <EmptyState>
            No events yet.{" "}
            <TextLink
              href="/account/events/new"
              variant="hover"
              className="text-foreground"
            >
              Submit one
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
                <span className="text-sm capitalize text-muted-foreground">
                  {statusLabels[event.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
