import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalImage } from "@/components/media/external-image";
import {
  craftCategoryLabels,
  eventCategoryLabels,
  formatDateTime,
} from "@/lib/labels";
import { getEventById, getEventLineup } from "@/lib/queries";

type EventPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const lineup = await getEventLineup(event.id);
  const isPublic = event.status === "approved";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      {!isPublic ? (
        <p className="mb-6 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          This event is <strong>{event.status}</strong> and not listed publicly yet.
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <Badge variant="outline">{eventCategoryLabels[event.category]}</Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {event.title}
            </h1>
            <p className="text-muted-foreground">
              {formatDateTime(event.dateTime)} · {event.location}
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
                Creatives linked to this event will appear here.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {lineup.map(({ creative, role }) => (
                  <li key={creative.id}>
                    <Link
                      href={`/creatives/${creative.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/40"
                    >
                      <ExternalImage
                        src={creative.avatarUrl}
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
                          {role.replaceAll("_", " ")} ·{" "}
                          {craftCategoryLabels[creative.craftCategory]}
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
            src={event.flyerUrl}
            alt={`${event.title} flyer`}
            className="w-full rounded-2xl object-cover"
            fallback={
              <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                No flyer linked
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
