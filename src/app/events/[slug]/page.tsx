import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { EventCategoryTags } from "@/components/event-category-tags";
import { EventModerationNote } from "@/components/event-moderation-note";
import { ExternalImage } from "@/components/media/external-image";
import { cityLabels, formatDateTime, lineupRoleLabels } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { creativePath, eventPath } from "@/lib/paths";
import {
  canViewEventModerationNote,
  getEventByParam,
  getEventLineup,
} from "@/lib/queries";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventByParam(slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventByParam(slug);

  if (!event) {
    notFound();
  }

  if (slug !== event.slug) {
    permanentRedirect(eventPath(event.slug));
  }

  const lineup = await getEventLineup(event.id);
  const isPublic = event.status === "approved";
  const showModerationNote =
    Boolean(event.moderationNote?.trim()) &&
    (await canViewEventModerationNote(event));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      {!isPublic ? (
        <p className="mb-6 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          This event is <strong>{event.status}</strong> and not listed publicly yet.
        </p>
      ) : null}
      {showModerationNote ? (
        <EventModerationNote note={event.moderationNote} className="mb-6" />
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <EventCategoryTags event={event} />
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {event.title}
            </h1>
            <p className="text-muted-foreground">
              {formatDateTime(event.dateTime)} · {cityLabels[event.city]} ·{" "}
              {event.location}
            </p>
          </div>

          {event.description ? (
            <p className="max-w-2xl whitespace-pre-wrap text-base leading-relaxed">
              {event.description}
            </p>
          ) : null}

          {event.ticketLink ? (
            <Button render={<a href={event.ticketLink} target="_blank" rel="noreferrer" />}>
              Tickets / RSVP
            </Button>
          ) : null}

          <section className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold tracking-tight">Lineup</h2>
            {lineup.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Lineup coming soon.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {lineup.map(({ creative, role }) => (
                  <li key={creative.id}>
                    <Link
                      href={creativePath(creative.slug)}
                      className="flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/40"
                    >
                      <ExternalImage
                        src={mediaUrl(creative.avatarKey)}
                        alt=""
                        className="size-12 rounded-full object-cover"
                        fallback={
                          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-sm font-medium">
                            {creative.name.slice(0, 1).toUpperCase()}
                          </div>
                        }
                      />
                      <div>
                        <p className="font-medium">{creative.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {lineupRoleLabels[role]} ·{" "}
                          <CreativeCraftTags creative={creative} asText />
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div>
          <ExternalImage
            src={mediaUrl(event.flyerKey)}
            alt={`${event.title} flyer`}
            className="w-full rounded-2xl object-cover"
            fallback={
              <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                No flyer
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
