import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { EventCategoryTags } from "@/components/event-category-tags";
import { ExternalImage } from "@/components/media/external-image";
import {
  cityLabels,
  formatDateTime,
  parseCityFilter,
  type CityFilter,
} from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { creativePath, eventPath } from "@/lib/paths";
import { getApprovedCreatives, getUpcomingApprovedEvents } from "@/lib/queries";
import { cities } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ city?: string }>;

function buildHomeHref(city: CityFilter) {
  if (city === "meanjin") return "/";
  return `/?city=${city}`;
}

function cityBrowseHref(path: "/events" | "/creatives", city: CityFilter) {
  if (city === "meanjin") return path;
  return `${path}?city=${city}`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { city } = await searchParams;
  const activeCity = parseCityFilter(city);

  const [upcomingEvents, approvedCreatives] = await Promise.all([
    getUpcomingApprovedEvents(activeCity === "all" ? 6 : 12),
    getApprovedCreatives(activeCity === "all" ? 8 : 16),
  ]);

  const featuredEvents = (
    activeCity === "all"
      ? upcomingEvents
      : upcomingEvents.filter((event) => event.city === activeCity)
  ).slice(0, 6);
  const creatives = (
    activeCity === "all"
      ? approvedCreatives
      : approvedCreatives.filter((creative) => creative.city === activeCity)
  ).slice(0, 8);

  const cityCopy =
    activeCity === "all"
      ? "across Brisbane / Meanjin and Melbourne / Naarm"
      : `in ${cityLabels[activeCity]}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6">
      <section className="space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Glass Half Full
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          {activeCity === "naarm"
            ? "Pouring back into Melbourne's creative scene."
            : activeCity === "all"
              ? "Pouring back into the creative scene."
              : "Pouring back into Brisbane's creative scene."}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Find events and local creatives.
        </p>
        <div className="flex flex-wrap gap-2">
          {cities.map((cityOption) => (
            <Link
              key={cityOption}
              href={buildHomeHref(cityOption)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                activeCity === cityOption
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {cityLabels[cityOption]}
            </Link>
          ))}
          <Link
            href={buildHomeHref("all")}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              activeCity === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            render={<Link href={cityBrowseHref("/events", activeCity)} />}
          >
            Browse events
          </Button>
          <Button
            variant="outline"
            render={<Link href={cityBrowseHref("/creatives", activeCity)} />}
          >
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
              Browse to find new events in {cityCopy} that'll tickle your pick—
              uh, fancy.
            </p>
          </div>
          <Link
            href={cityBrowseHref("/events", activeCity)}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all
          </Link>
        </div>

        {featuredEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No upcoming events yet.{" "}
            <Link
              href="/account/events/new"
              className="underline underline-offset-4"
            >
              Submit one
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event) => (
              <Link
                key={event.id}
                href={eventPath(event.slug)}
                className="group"
              >
                <Card className="h-full transition-colors group-hover:bg-muted/30">
                  <ExternalImage
                    src={mediaUrl(event.flyerKey)}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{event.title}</CardTitle>
                      <EventCategoryTags
                        event={event}
                        className="justify-end"
                      />
                    </div>
                    <CardDescription>
                      {formatDateTime(event.dateTime)} ·{" "}
                      {cityLabels[event.city]} · {event.location}
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
              Find that graphic designer without having to ask a friend of a
              friend of a friend of a...
            </p>
          </div>
          <Link
            href={cityBrowseHref("/creatives", activeCity)}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all
          </Link>
        </div>

        {creatives.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No creatives yet.{" "}
            <Link href="/account" className="underline underline-offset-4">
              Add your profile
            </Link>
            .
          </p>
        ) : (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {creatives.map((creative) => (
              <Link
                key={creative.id}
                href={creativePath(creative.slug)}
                className="w-56 shrink-0 rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/40"
              >
                <ExternalImage
                  src={mediaUrl(creative.avatarKey)}
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
                  <CreativeCraftTags creative={creative} asText />
                  {creative.city ? ` · ${cityLabels[creative.city]}` : null}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
