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
  craftCategoryLabels,
  creativeMatchesWorkTag,
  parseCityFilter,
  workOpportunityTagLabels,
  type CityFilter,
} from "@/lib/labels";
import { getApprovedCreatives } from "@/lib/queries";
import {
  cities,
  craftCategories,
  workOpportunityTags,
} from "@/lib/validations";

export const metadata: Metadata = {
  title: "Creatives",
};

type SearchParams = Promise<{
  category?: string;
  tag?: string;
  city?: string;
}>;

function buildCreativesHref(options: {
  category?: string | null;
  tag?: string | null;
  city?: CityFilter | null;
}) {
  const params = new URLSearchParams();

  if (options.city === "all") {
    params.set("city", "all");
  } else if (options.city) {
    params.set("city", options.city);
  }

  if (options.category) {
    params.set("category", options.category);
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
  const { category, tag, city } = await searchParams;
  const activeCategory =
    category &&
    craftCategories.includes(category as (typeof craftCategories)[number])
      ? (category as (typeof craftCategories)[number])
      : null;
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

    if (activeCategory && !creative.craftCategories.includes(activeCategory)) {
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
                category: activeCategory,
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
              category: activeCategory,
              tag: activeTag,
            })}
            active={activeCity === "all"}
          >
            All
          </FilterChip>
        </ChipRow>
      </Section>

      <Section label="Category">
        <ChipRow>
          <FilterChip
            href={buildCreativesHref({
              city: activeCity,
              category: null,
              tag: activeTag,
            })}
            active={!activeCategory}
          >
            All
          </FilterChip>
          {craftCategories.map((cat) => (
            <FilterChip
              key={cat}
              href={buildCreativesHref({
                city: activeCity,
                category: cat,
                tag: activeTag,
              })}
              active={activeCategory === cat}
            >
              {craftCategoryLabels[cat]}
            </FilterChip>
          ))}
        </ChipRow>
      </Section>

      <Section label="Open to" className="mb-8">
        <ChipRow>
          <FilterChip
            href={buildCreativesHref({
              city: activeCity,
              category: activeCategory,
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
                category: activeCategory,
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
