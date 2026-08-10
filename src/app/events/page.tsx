import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalImage } from "@/components/media/external-image";
import { eventCategoryLabels, formatDateTime } from "@/lib/labels";
import { getApprovedEvents } from "@/lib/queries";
import { eventCategories } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Events",
};

type SearchParams = Promise<{ category?: string }>;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;
  const activeCategory =
    category && eventCategories.includes(category as (typeof eventCategories)[number])
      ? (category as (typeof eventCategories)[number])
      : null;

  const allEvents = await getApprovedEvents();
  const events = activeCategory
    ? allEvents.filter((event) => event.category === activeCategory)
    : allEvents;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Approved gigs and gatherings across Brisbane&apos;s creative scene.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/events"
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
            !activeCategory
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </Link>
        {eventCategories.map((cat) => (
          <Link
            key={cat}
            href={`/events?category=${cat}`}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              activeCategory === cat
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {eventCategoryLabels[cat]}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          No approved events yet.{" "}
          <Link href="/submit/event" className="underline underline-offset-4">
            Submit one
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="group">
              <Card className="h-full transition-colors group-hover:bg-muted/30">
                <ExternalImage
                  src={event.flyerUrl}
                  alt=""
                  className="aspect-[4/5] w-full object-cover sm:aspect-video"
                />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="group-hover:underline group-hover:underline-offset-4">
                      {event.title}
                    </CardTitle>
                    <Badge variant="outline">
                      {eventCategoryLabels[event.category]}
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatDateTime(event.dateTime)} · {event.location}
                  </CardDescription>
                </CardHeader>
                {event.description ? (
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  </CardContent>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
