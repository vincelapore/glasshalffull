import Link from "next/link";

import {
  CreativeListingCard,
  ProfileListingGrid,
} from "@/components/creative-listing-card";
import {
  EventListingCard,
  eventListingGridClassName,
} from "@/components/event-listing";
import { ExternalImage } from "@/components/media/external-image";
import { OverflowBanner } from "@/components/overflow-banner";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  Page,
  SectionHeader,
  TextLink,
} from "@/components/ui/page";
import {
  cityShortLabels,
  formatEventListingDate,
  parseCityFilter,
  type CityFilter,
} from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { eventPath } from "@/lib/paths";
import {
  getApprovedCreatives,
  getOrganisersByEventIds,
  getOverflowEpisodeBySlug,
  getOverflowEpisodes,
  getUpcomingApprovedEvents,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ city?: string; episode?: string }>;

function cityBrowseHref(path: "/events" | "/creatives", city: CityFilter) {
  if (city === "meanjin") return path;
  return `${path}?city=${city}`;
}

function weekTitle(city: CityFilter) {
  if (city === "all") return "This week";
  return `This week in ${cityShortLabels[city]}`;
}

function EventLead({
  event,
}: {
  event: {
    slug: string;
    title: string;
    dateTime: Date;
    location: string;
    flyerKey: string | null;
  };
}) {
  return (
    <Link
      href={eventPath(event.slug)}
      className="group relative block overflow-hidden rounded-lg bg-neutral-900 ring-1 ring-black/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring dark:ring-white/15"
    >
      <span className="poster-hover block">
        <ExternalImage
          src={mediaUrl(event.flyerKey)}
          alt=""
          className="aspect-[8/5] w-full object-cover sm:aspect-[5/2] lg:aspect-[3/1]"
          fallback={
            <span className="block aspect-[8/5] w-full bg-neutral-900 sm:aspect-[5/2] lg:aspect-[3/1]" />
          }
        />
      </span>
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-4 text-white sm:px-6 sm:pb-5">
        <span className="font-mono text-xs tracking-[0.16em] uppercase">
          Next up
        </span>
        <span className="mt-1 block font-heading text-2xl leading-none sm:text-4xl">
          {event.title}
        </span>
        <span className="mt-2 block font-mono text-xs">
          {formatEventListingDate(event.dateTime)}
          {event.location ? ` · ${event.location}` : ""}
        </span>
      </span>
    </Link>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { city, episode } = await searchParams;
  const activeCity = parseCityFilter(city);
  const episodeSlug = episode?.trim() || null;

  const [upcomingEvents, approvedCreatives, overflowEpisodes] =
    await Promise.all([
      getUpcomingApprovedEvents(activeCity === "all" ? 6 : 12),
      getApprovedCreatives(),
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
  const showOverflow = overflowEpisodes.length > 0 || openEpisode;
  const leadEvent = showOverflow ? null : (featuredEvents[0] ?? null);
  const weekEvents = leadEvent
    ? featuredEvents.filter((event) => event.id !== leadEvent.id)
    : featuredEvents;
  const organisersByEvent = await getOrganisersByEventIds(
    weekEvents.map((event) => event.id),
  );
  const creatives =
    activeCity === "all"
      ? approvedCreatives
      : approvedCreatives.filter((creative) => creative.city === activeCity);

  return (
    <Page className="flex flex-col gap-16 py-8 sm:gap-20 sm:py-12">
      {showOverflow ? (
        <OverflowBanner
          episodes={overflowEpisodes}
          openEpisode={openEpisode}
          activeCity={activeCity}
        />
      ) : leadEvent ? (
        <EventLead event={leadEvent} />
      ) : null}

      {weekEvents.length > 0 ? (
        <section className="space-y-5">
          <SectionHeader
            title={weekTitle(activeCity)}
            action={
              <TextLink href={cityBrowseHref("/events", activeCity)}>
                View all
              </TextLink>
            }
          />
          <div className={eventListingGridClassName}>
            {weekEvents.map((event) => (
              <EventListingCard
                key={event.id}
                event={event}
                organisers={organisersByEvent.get(event.id)}
              />
            ))}
          </div>
        </section>
      ) : leadEvent ? null : (
        <section className="space-y-5">
          <SectionHeader title={weekTitle(activeCity)} />
          <EmptyState>
            No upcoming events yet.{" "}
            <TextLink href="/account/events/new" variant="inline">
              Submit one
            </TextLink>
            .
          </EmptyState>
        </section>
      )}

      <section className="space-y-5">
        <SectionHeader
          title="Who's pouring in"
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

      <section className="space-y-5 border-t border-border pt-12">
        <h2 className="max-w-xl font-heading text-3xl font-normal tracking-tight">
          Turn up, and pour back in.
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Behind every great night is a team that has poured time, money, and
          love into making it happen. You&apos;re not just a ticket holder.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/account/events/new" />}>
            Submit an event
          </Button>
          <Button variant="outline" render={<Link href="/account" />}>
            Add your profile
          </Button>
        </div>
      </section>
    </Page>
  );
}
