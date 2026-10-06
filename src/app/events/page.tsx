import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventCategoryFilters } from "@/components/event-category-filters";
import { EventCategoryTags } from "@/components/event-category-tags";
import { ExternalImage } from "@/components/media/external-image";
import {
  cityLabels,
  formatDateTime,
  parseCityFilter,
  parseMusicGenre,
} from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { eventPath, eventsBrowsePath } from "@/lib/paths";
import { getApprovedEvents } from "@/lib/queries";
import { cities, eventCategories } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Events",
};

type SearchParams = Promise<{
  category?: string;
  city?: string;
  genre?: string;
}>;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category, city, genre } = await searchParams;
  const parsedGenre = parseMusicGenre(genre);
  const activeCategory =
    category && eventCategories.includes(category as (typeof eventCategories)[number])
      ? (category as (typeof eventCategories)[number])
      : parsedGenre
        ? "music"
        : null;
  const activeGenre = activeCategory === "music" ? parsedGenre : null;
  const activeCity = parseCityFilter(city);

  const allEvents = await getApprovedEvents();
  const events = allEvents.filter((event) => {
    if (activeCity !== "all" && event.city !== activeCity) {
      return false;
    }

    if (activeGenre) {
      return (event.musicGenres ?? []).includes(activeGenre);
    }

    if (activeCategory && !event.categories.includes(activeCategory)) {
      return false;
    }

    return true;
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Gigs and gatherings
          {activeCity === "all"
            ? " across Brisbane / Meanjin and Melbourne / Naarm."
            : ` in ${cityLabels[activeCity]}.`}
        </p>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          City
        </p>
        <div className="flex flex-wrap gap-2">
          {cities.map((cityOption) => (
            <Link
              key={cityOption}
              href={eventsBrowsePath({
                city: cityOption,
                category: activeCategory,
                genre: activeGenre,
              })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                activeCity === cityOption
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {cityLabels[cityOption]}
            </Link>
          ))}
          <Link
            href={eventsBrowsePath({
              city: "all",
              category: activeCategory,
              genre: activeGenre,
            })}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              activeCity === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Link>
        </div>
      </div>

      <EventCategoryFilters
        activeCity={activeCity}
        activeCategory={activeCategory}
        activeGenre={activeGenre}
      />

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          {allEvents.length === 0
            ? "No events yet. "
            : "No events match these filters. "}
          <Link href="/account/events/new" className="underline underline-offset-4">
            Submit one
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link key={event.id} href={eventPath(event.slug)} className="group">
              <Card className="h-full transition-colors group-hover:bg-muted/30">
                <ExternalImage
                  src={mediaUrl(event.flyerKey)}
                  alt=""
                  className="aspect-[4/5] w-full object-cover sm:aspect-video"
                />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="group-hover:underline group-hover:underline-offset-4">
                      {event.title}
                    </CardTitle>
                    <EventCategoryTags event={event} className="justify-end" />
                  </div>
                  <CardDescription>
                    {formatDateTime(event.dateTime)} · {cityLabels[event.city]} ·{" "}
                    {event.location}
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
