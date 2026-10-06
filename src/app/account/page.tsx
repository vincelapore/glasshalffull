import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/actions/auth";
import { CreativeSubmissionForm } from "@/components/forms/creative-submission-form";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Account
          </h1>
          <p className="text-muted-foreground">
            {user.name || user.email}
            {user.email && user.name ? ` · ${user.email}` : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <section className="mb-14 space-y-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
            {profile ? (
              <p className="text-sm text-muted-foreground">
                {statusLabels[profile.status]}
                {profile.status === "approved" ? (
                  <>
                    {" "}
                    ·{" "}
                    <Link
                      href={creativePath(profile.slug)}
                      className="underline-offset-4 hover:underline"
                    >
                      View public page
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {profile
              ? "Changes go live as soon as you save."
              : "Fill this in so the scene can find you. It appears in the directory as soon as you save."}
          </p>
        </div>
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
                  openToPaidWork: profile.openToPaidWork,
                  openToTrade: profile.openToTrade,
                  buildingPortfolio: profile.buildingPortfolio,
                }
              : undefined
          }
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Events</h2>
          {profile ? (
            <Button
              size="sm"
              variant="ghost"
              render={<Link href="/account/events/new" />}
            >
              Submit event
            </Button>
          ) : null}
        </div>
        {!profile ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            Save your profile above first — you’ll be listed as organiser on
            events you submit.
          </p>
        ) : events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No events yet.{" "}
            <Link
              href="/account/events/new"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Submit one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={eventPath(event.slug)}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {event.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(event.dateTime)} · {cityLabels[event.city]}
                  </p>
                </div>
                <span className="text-sm capitalize text-muted-foreground">
                  {statusLabels[event.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
