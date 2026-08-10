import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalImage } from "@/components/media/external-image";
import {
  craftCategoryLabels,
  eventCategoryLabels,
  formatDateTime,
} from "@/lib/labels";
import {
  getApprovedCreatives,
  getUpcomingApprovedEvents,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredEvents, creatives] = await Promise.all([
    getUpcomingApprovedEvents(6),
    getApprovedCreatives(8),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6">
      <section className="space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Glass Half Full
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Pouring back into Brisbane&apos;s creative scene.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Discover events, meet the artists behind them, and reconnect with the
          local music, art, queer, and fashion community.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/events" />}>Browse events</Button>
          <Button variant="outline" render={<Link href="/creatives" />}>
            Meet creatives
          </Button>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Featured Events
            </h2>
            <p className="text-sm text-muted-foreground">
              Upcoming approved nights worth showing up for.
            </p>
          </div>
          <Link
            href="/events"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all
          </Link>
        </div>

        {featuredEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No upcoming events yet.{" "}
            <Link href="/submit/event" className="underline underline-offset-4">
              Submit one
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="group">
                <Card className="h-full transition-colors group-hover:bg-muted/30">
                  <ExternalImage
                    src={event.flyerUrl}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{event.title}</CardTitle>
                      <Badge variant="outline">
                        {eventCategoryLabels[event.category]}
                      </Badge>
                    </div>
                    <CardDescription>
                      {formatDateTime(event.dateTime)} · {event.location}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Discover Creatives
            </h2>
            <p className="text-sm text-muted-foreground">
              Faces and crafts powering the scene.
            </p>
          </div>
          <Link
            href="/creatives"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all
          </Link>
        </div>

        {creatives.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No creatives yet.{" "}
            <Link
              href="/submit/creative"
              className="underline underline-offset-4"
            >
              Submit a profile
            </Link>
            .
          </p>
        ) : (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {creatives.map((creative) => (
              <Link
                key={creative.id}
                href={`/creatives/${creative.id}`}
                className="w-56 shrink-0 rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/40"
              >
                <ExternalImage
                  src={creative.avatarUrl}
                  alt=""
                  className="mb-3 size-16 rounded-full object-cover"
                  fallback={
                    <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-muted text-lg font-medium">
                      {creative.name.slice(0, 1).toUpperCase()}
                    </div>
                  }
                />
                <p className="font-medium">{creative.name}</p>
                <p className="text-sm text-muted-foreground">
                  {craftCategoryLabels[creative.craftCategory]}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
