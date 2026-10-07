import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { CreativeWorkTags } from "@/components/creative-work-tags";
import { EventCategoryTags } from "@/components/event-category-tags";
import { ExternalImage } from "@/components/media/external-image";
import { WorkPhotoGrid } from "@/components/media/work-photo-grid";
import { Notice } from "@/components/ui/notice";
import { Page, PageTitle } from "@/components/ui/page";
import {
  cityLabels,
  formatDateTime,
  formatInstagramHandle,
  instagramProfileHref,
  lineupRoleLabels,
} from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { creativePath, eventPath } from "@/lib/paths";
import { getCreativeByParam, getCreativeUpcomingEvents } from "@/lib/queries";

type CreativePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CreativePageProps): Promise<Metadata> {
  const { slug } = await params;
  const creative = await getCreativeByParam(slug);
  return { title: creative?.name ?? "Creative" };
}

export default async function CreativeDetailPage({ params }: CreativePageProps) {
  const { slug } = await params;
  const creative = await getCreativeByParam(slug);

  if (!creative) {
    notFound();
  }

  if (slug !== creative.slug) {
    permanentRedirect(creativePath(creative.slug));
  }

  const upcoming = await getCreativeUpcomingEvents(creative.id);
  const isPublic = creative.status === "approved";

  return (
    <Page>
      {!isPublic ? (
        <Notice className="mb-6">
          This profile is <strong>{creative.status}</strong> and not listed
          publicly yet.
        </Notice>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <ExternalImage
              src={mediaUrl(creative.avatarKey)}
              alt={creative.name}
              className="size-20 shrink-0 rounded-2xl object-cover sm:size-28"
              fallback={
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl font-medium sm:size-28 sm:text-3xl">
                  {creative.name.slice(0, 1).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <CreativeCraftTags creative={creative} />
                <CreativeWorkTags creative={creative} />
              </div>
              <PageTitle className="break-words sm:text-4xl">
                {creative.name}
              </PageTitle>
              {creative.city ? (
                <p className="text-muted-foreground">
                  {cityLabels[creative.city]}
                </p>
              ) : null}
            </div>
          </div>

          {creative.bio ? (
            <p className="max-w-2xl whitespace-pre-wrap text-base leading-relaxed">
              {creative.bio}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-4 text-sm">
            {creative.instagramHandle ? (
              <a
                href={instagramProfileHref(creative.instagramHandle)}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-primary"
              >
                {formatInstagramHandle(creative.instagramHandle)}
              </a>
            ) : null}
            {creative.portfolioUrl ? (
              <a
                href={creative.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-primary"
              >
                Portfolio
              </a>
            ) : null}
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Upcoming events
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming events yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map(({ event, role }) => (
                <li key={event.id}>
                  <Link
                    href={eventPath(event.slug)}
                    className="block rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(event.dateTime)} ·{" "}
                          {cityLabels[event.city]} · {event.location}
                        </p>
                      </div>
                      <EventCategoryTags event={event} />
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {lineupRoleLabels[role]}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <WorkPhotoGrid name={creative.name} keys={creative.workPhotoKeys} />
    </Page>
  );
}
