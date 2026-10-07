import type { Metadata } from "next";
import Link from "next/link";

import { EventCategoryFilters } from "@/components/event-category-filters";
import { EventCategoryTags } from "@/components/event-category-tags";
import { ExternalImage } from "@/components/media/external-image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  ChipRow,
  EmptyState,
  Page,
  PageHeader,
  Section,
  TextLink,
} from "@/components/ui/page";
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
    <Page>
      <PageHeader
        title="Events"
        description={
          <>
            Gigs and gatherings
            {activeCity === "all"
              ? " across Brisbane / Meanjin and Melbourne / Naarm."
              : ` in ${cityLabels[activeCity]}.`}
          </>
        }
      />

      <Section label="City" className="mb-4">
        <ChipRow>
          {cities.map((cityOption) => (
            <FilterChip
              key={cityOption}
              href={eventsBrowsePath({
                city: cityOption,
                category: activeCategory,
                genre: activeGenre,
              })}
              active={activeCity === cityOption}
            >
              {cityLabels[cityOption]}
            </FilterChip>
          ))}
          <FilterChip
            href={eventsBrowsePath({
              city: "all",
              category: activeCategory,
              genre: activeGenre,
            })}
            active={activeCity === "all"}
          >
            All
          </FilterChip>
        </ChipRow>
      </Section>

      <EventCategoryFilters
        activeCity={activeCity}
        activeCategory={activeCategory}
        activeGenre={activeGenre}
      />

      {events.length === 0 ? (
        <EmptyState align="center">
          {allEvents.length === 0
            ? "No events yet. "
            : "No events match these filters. "}
          <TextLink href="/account/events/new" variant="inline">
            Submit one
          </TextLink>
          .
        </EmptyState>
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
    </Page>
  );
}
