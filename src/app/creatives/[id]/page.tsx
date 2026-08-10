import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ExternalImage } from "@/components/media/external-image";
import {
  craftCategoryLabels,
  eventCategoryLabels,
  formatDateTime,
} from "@/lib/labels";
import { getCreativeById, getCreativeUpcomingEvents } from "@/lib/queries";

type CreativePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CreativePageProps): Promise<Metadata> {
  const { id } = await params;
  const creative = await getCreativeById(id);
  return { title: creative?.name ?? "Creative" };
}

export default async function CreativeDetailPage({ params }: CreativePageProps) {
  const { id } = await params;
  const creative = await getCreativeById(id);

  if (!creative) {
    notFound();
  }

  const upcoming = await getCreativeUpcomingEvents(creative.id);
  const isPublic = creative.status === "approved";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      {!isPublic ? (
        <p className="mb-6 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          This profile is <strong>{creative.status}</strong> and not listed
          publicly yet.
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <ExternalImage
              src={creative.avatarUrl}
              alt={creative.name}
              className="size-20 shrink-0 rounded-2xl object-cover sm:size-28"
              fallback={
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl font-medium sm:size-28 sm:text-3xl">
                  {creative.name.slice(0, 1).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0 space-y-3">
              <Badge variant="outline">
                {craftCategoryLabels[creative.craftCategory]}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
                {creative.name}
              </h1>
            </div>
          </div>

          {creative.bio ? (
            <p className="max-w-2xl whitespace-pre-wrap text-base leading-relaxed">
              {creative.bio}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-4 text-sm">
            {creative.instagramUrl ? (
              <a
                href={creative.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                Instagram
              </a>
            ) : null}
            {creative.portfolioUrl ? (
              <a
                href={creative.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
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
              No upcoming linked events yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map(({ event, role }) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="block rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(event.dateTime)} · {event.location}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {eventCategoryLabels[event.category]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {role.replaceAll("_", " ")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
