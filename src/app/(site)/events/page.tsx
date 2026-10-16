import type { Metadata } from "next";

import { EventCategoryFilters } from "@/components/event-category-filters";
import {
  EventListingCard,
  eventListingGridClassName,
} from "@/components/event-listing";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  ChipRow,
  EmptyState,
  Page,
  PageHeader,
  Section,
  TextLink,
} from "@/components/ui/page";
import { cityLabels, parseCityFilter, parseMusicGenre } from "@/lib/labels";
import { eventsBrowsePath } from "@/lib/paths";
import { getApprovedEvents, getOrganisersByEventIds } from "@/lib/queries";
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
  const organisersByEvent = await getOrganisersByEventIds(
    events.map((event) => event.id)
  );

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
        actions={
          <TextLink href="/account/events/new">Submit an event</TextLink>
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
        <div className={eventListingGridClassName}>
          {events.map((event) => (
            <EventListingCard
              key={event.id}
              event={event}
              organisers={organisersByEvent.get(event.id)}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
