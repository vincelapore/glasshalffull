import Link from "next/link";

import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { EventCategoryTags } from "@/components/event-category-tags";
import { ExternalImage } from "@/components/media/external-image";
import { Button } from "@/components/ui/button";
import {
  Card,
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
  SectionHeader,
  TextLink,
} from "@/components/ui/page";
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
    <Page className="flex flex-col gap-16 py-16">
      <PageHeader
        className="mb-0 space-y-5"
        eyebrow="Glass Half Full"
        eyebrowSize="md"
        title={
          activeCity === "naarm"
            ? "Pouring back into Melbourne's creative scene."
            : activeCity === "all"
              ? "Pouring back into the creative scene."
              : "Pouring back into Brisbane's creative scene."
        }
        titleClassName="max-w-3xl sm:text-5xl"
        description="Find events and local creatives."
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

      <section className="space-y-5">
        <SectionHeader
          title="Featured Events"
          description={
            <>
              Browse to find new events in {cityCopy} that&apos;ll tickle your
              pick— uh, fancy.
            </>
          }
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
        <SectionHeader
          title="Discover Creatives"
          description="Find that graphic designer without having to ask a friend of a friend of a friend of a..."
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
    </Page>
  );
}
