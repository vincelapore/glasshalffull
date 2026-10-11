import type { Metadata } from "next";

import {
  CreativeListingCard,
  ProfileListingGrid,
} from "@/components/creative-listing-card";
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
  creativeMatchesWorkTag,
  disciplineLabels,
  parseCityFilter,
  workOpportunityTagLabels,
  type CityFilter,
} from "@/lib/labels";
import { getApprovedCreatives } from "@/lib/queries";
import { cities, disciplines, workOpportunityTags } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Creatives",
};

type SearchParams = Promise<{
  discipline?: string;
  /** @deprecated Prefer `discipline`. Mapped from old craft category links. */
  category?: string;
  tag?: string;
  city?: string;
}>;

const legacyCategoryToDiscipline: Record<string, (typeof disciplines)[number]> =
  {
    dj: "music",
    musician: "music",
    producer: "music",
    tattoo: "tattoo",
    visual_art: "visual_art",
    photography: "photography",
    fashion: "fashion",
    stylist: "fashion",
    makeup: "fashion",
    model: "fashion",
    dance: "performance",
    film: "film",
    actor: "performance",
    poetry: "writing",
    writer: "writing",
    design: "design",
    creative_director: "design",
    organiser: "community",
    queer: "community",
    other: "community",
  };

function buildCreativesHref(options: {
  discipline?: string | null;
  tag?: string | null;
  city?: CityFilter | null;
}) {
  const params = new URLSearchParams();

  if (options.city === "all") {
    params.set("city", "all");
  } else if (options.city) {
    params.set("city", options.city);
  }

  if (options.discipline) {
    params.set("discipline", options.discipline);
  }

  if (options.tag) {
    params.set("tag", options.tag);
  }

  const query = params.toString();
  return query ? `/creatives?${query}` : "/creatives";
}

export default async function CreativesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { discipline, category, tag, city } = await searchParams;
  const fromLegacy =
    category && legacyCategoryToDiscipline[category]
      ? legacyCategoryToDiscipline[category]
      : null;
  const activeDiscipline =
    discipline &&
    disciplines.includes(discipline as (typeof disciplines)[number])
      ? (discipline as (typeof disciplines)[number])
      : fromLegacy;
  const activeTag =
    tag &&
    workOpportunityTags.includes(tag as (typeof workOpportunityTags)[number])
      ? (tag as (typeof workOpportunityTags)[number])
      : null;
  const activeCity = parseCityFilter(city);

  const allCreatives = await getApprovedCreatives();
  const creatives = allCreatives.filter((creative) => {
    if (activeCity !== "all" && creative.city !== activeCity) {
      return false;
    }

    if (
      activeDiscipline &&
      !creative.disciplines.includes(activeDiscipline)
    ) {
      return false;
    }

    if (activeTag && !creativeMatchesWorkTag(creative, activeTag)) {
      return false;
    }

    return true;
  });

  return (
    <Page>
      <PageHeader
        title="Creatives"
        description="People to work with, or just to know."
      />

      <Section label="City">
        <ChipRow>
          {cities.map((cityOption) => (
            <FilterChip
              key={cityOption}
              href={buildCreativesHref({
                city: cityOption,
                discipline: activeDiscipline,
                tag: activeTag,
              })}
              active={activeCity === cityOption}
            >
              {cityLabels[cityOption]}
            </FilterChip>
          ))}
          <FilterChip
            href={buildCreativesHref({
              city: "all",
              discipline: activeDiscipline,
              tag: activeTag,
            })}
            active={activeCity === "all"}
          >
            All
          </FilterChip>
        </ChipRow>
      </Section>

      <Section label="Discipline">
        <ChipRow>
          <FilterChip
            href={buildCreativesHref({
              city: activeCity,
              discipline: null,
              tag: activeTag,
            })}
            active={!activeDiscipline}
          >
            All
          </FilterChip>
          {disciplines.map((item) => (
            <FilterChip
              key={item}
              href={buildCreativesHref({
                city: activeCity,
                discipline: item,
                tag: activeTag,
              })}
              active={activeDiscipline === item}
            >
              {disciplineLabels[item]}
            </FilterChip>
          ))}
        </ChipRow>
      </Section>

      <Section label="Open to" className="mb-8">
        <ChipRow>
          <FilterChip
            href={buildCreativesHref({
              city: activeCity,
              discipline: activeDiscipline,
              tag: null,
            })}
            active={!activeTag}
          >
            All
          </FilterChip>
          {workOpportunityTags.map((workTag) => (
            <FilterChip
              key={workTag}
              href={buildCreativesHref({
                city: activeCity,
                discipline: activeDiscipline,
                tag: workTag,
              })}
              active={activeTag === workTag}
            >
              {workOpportunityTagLabels[workTag]}
            </FilterChip>
          ))}
        </ChipRow>
      </Section>

      {creatives.length === 0 ? (
        <EmptyState align="center">
          {allCreatives.length === 0
            ? "No creatives yet. "
            : "No creatives match these filters. "}
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
    </Page>
  );
}
