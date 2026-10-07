import Link from "next/link";

import {
  CreativeListingCard,
  ProfileListingGrid,
} from "@/components/creative-listing-card";
import {
  EventListingCard,
  eventListingGridClassName,
} from "@/components/event-listing";
import { OverflowBanner } from "@/components/overflow-banner";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  ChipRow,
  EmptyState,
  Page,
  PageHeader,
  SectionHeader,
  TextLink,
} from "@/components/ui/page";
import { cityLabels, parseCityFilter, type CityFilter } from "@/lib/labels";
import {
  getApprovedCreatives,
  getOrganisersByEventIds,
  getOverflowEpisodeBySlug,
  getOverflowEpisodes,
  getUpcomingApprovedEvents,
} from "@/lib/queries";
import { cities } from "@/lib/validations";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ city?: string; episode?: string }>;

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
  const { city, episode } = await searchParams;
  const activeCity = parseCityFilter(city);
  const episodeSlug = episode?.trim() || null;

  const [upcomingEvents, approvedCreatives, overflowEpisodes] = await Promise.all([
    getUpcomingApprovedEvents(activeCity === "all" ? 6 : 12),
    getApprovedCreatives(activeCity === "all" ? 8 : 16),
    getOverflowEpisodes(activeCity),
  ]);

  const openEpisode = episodeSlug
    ? (overflowEpisodes.find((item) => item.slug === episodeSlug) ??
      (await getOverflowEpisodeBySlug(episodeSlug)))
    : null;

  const featuredEvents = (
    activeCity === "all"
      ? upcomingEvents
      : upcomingEvents.filter((event) => event.city === activeCity)
  ).slice(0, 6);
  const organisersByEvent = await getOrganisersByEventIds(
    featuredEvents.map((event) => event.id)
  );
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
    <Page className="flex flex-col gap-14 py-12">
      <PageHeader
        className="mb-0 space-y-5"
        title={
          activeCity === "naarm"
            ? "Pouring back into Melbourne's creative scene."
            : activeCity === "all"
              ? "Pouring back into the creative scene."
              : "Pouring back into Brisbane's creative scene."
        }
        titleClassName="max-w-3xl font-normal sm:text-4xl"
        description="Events and the people making them."
        descriptionClassName="max-w-2xl"
      >
        <ChipRow>
          {cities.map((cityOption) => (
            <FilterChip
              key={cityOption}
              href={buildHomeHref(cityOption)}
              active={activeCity === cityOption}
            >
              {cityLabels[cityOption]}
            </FilterChip>
          ))}
          <FilterChip href={buildHomeHref("all")} active={activeCity === "all"}>
            All
          </FilterChip>
        </ChipRow>
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
      </PageHeader>

      {overflowEpisodes.length > 0 || openEpisode ? (
        <OverflowBanner
          episodes={overflowEpisodes}
          openEpisode={openEpisode}
          activeCity={activeCity}
        />
      ) : null}

      <section className="space-y-5">
        <SectionHeader
          title="Featured Events"
          description={<>Coming up {cityCopy}.</>}
          action={
            <TextLink href={cityBrowseHref("/events", activeCity)}>
              View all
            </TextLink>
          }
        />

        {featuredEvents.length === 0 ? (
          <EmptyState>
            No upcoming events yet.{" "}
            <TextLink href="/account/events/new" variant="inline">
              Submit one
            </TextLink>
            .
          </EmptyState>
        ) : (
          <div className={eventListingGridClassName}>
            {featuredEvents.map((event) => (
              <EventListingCard
                key={event.id}
                event={event}
                organisers={organisersByEvent.get(event.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Discover Creatives"
          description="Without asking a friend of a friend."
          action={
            <TextLink href={cityBrowseHref("/creatives", activeCity)}>
              View all
            </TextLink>
          }
        />

        {creatives.length === 0 ? (
          <EmptyState>
            No creatives yet.{" "}
            <TextLink href="/account" variant="inline">
              Add your profile
            </TextLink>
            .
          </EmptyState>
        ) : (
          <ProfileListingGrid>
            {creatives.map((creative) => (
              <CreativeListingCard key={creative.id} creative={creative} />
            ))}
          </ProfileListingGrid>
        )}
      </section>
    </Page>
  );
}
