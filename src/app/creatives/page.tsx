import type { Metadata } from "next";
import Link from "next/link";

import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { CreativeWorkTags } from "@/components/creative-work-tags";
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
  craftCategoryLabels,
  creativeMatchesWorkTag,
  parseCityFilter,
  workOpportunityTagLabels,
  type CityFilter,
} from "@/lib/labels";
import { getApprovedCreatives } from "@/lib/queries";
import { mediaUrl } from "@/lib/media";
import { creativePath } from "@/lib/paths";
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
        description="Find the missing piece to your creative project or discover talent you’d love to collaborate with."
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creatives.map((creative) => (
            <Link
              key={creative.id}
              href={creativePath(creative.slug)}
              className="group"
            >
              <Card className="h-full transition-colors group-hover:bg-muted/30">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ExternalImage
                      src={mediaUrl(creative.avatarKey)}
                      alt=""
                      className="size-14 rounded-full object-cover"
                      fallback={
                        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-base font-medium">
                          {creative.name.slice(0, 1).toUpperCase()}
                        </div>
                      }
                    />
                    <div className="space-y-1">
                      <CardTitle className="group-hover:underline group-hover:underline-offset-4">
                        {creative.name}
                      </CardTitle>
                      {creative.city ? (
                        <p className="text-sm text-muted-foreground">
                          {cityLabels[creative.city]}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-1.5">
                        <CreativeCraftTags creative={creative} />
                        <CreativeWorkTags creative={creative} />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {creative.bio ? (
                  <CardContent>
                    <CardDescription className="line-clamp-3">
                      {creative.bio}
                    </CardDescription>
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
