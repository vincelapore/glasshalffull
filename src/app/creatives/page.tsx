import type { Metadata } from "next";
import Link from "next/link";

import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { CreativeWorkTags } from "@/components/creative-work-tags";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalImage } from "@/components/media/external-image";
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
import { cities, craftCategories, workOpportunityTags } from "@/lib/validations";
import { cn } from "@/lib/utils";

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
    category && craftCategories.includes(category as (typeof craftCategories)[number])
      ? (category as (typeof craftCategories)[number])
      : null;
  const activeTag =
    tag && workOpportunityTags.includes(tag as (typeof workOpportunityTags)[number])
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
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Creatives</h1>
        <p className="text-muted-foreground">
          Artists, organisers, and makers
          {activeCity === "all"
            ? " across the local scene."
            : ` in ${cityLabels[activeCity]}.`}
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          City
        </p>
        <div className="flex flex-wrap gap-2">
          {cities.map((cityOption) => (
            <Link
              key={cityOption}
              href={buildCreativesHref({
                city: cityOption,
                category: activeCategory,
                tag: activeTag,
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
            href={buildCreativesHref({
              city: "all",
              category: activeCategory,
              tag: activeTag,
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

      <div className="mb-6 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Craft
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildCreativesHref({
              city: activeCity,
              category: null,
              tag: activeTag,
            })}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              !activeCategory
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Link>
          {craftCategories.map((cat) => (
            <Link
              key={cat}
              href={buildCreativesHref({
                city: activeCity,
                category: cat,
                tag: activeTag,
              })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                activeCategory === cat
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {craftCategoryLabels[cat]}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-8 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Open to
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildCreativesHref({
              city: activeCity,
              category: activeCategory,
              tag: null,
            })}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              !activeTag
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Link>
          {workOpportunityTags.map((workTag) => (
            <Link
              key={workTag}
              href={buildCreativesHref({
                city: activeCity,
                category: activeCategory,
                tag: workTag,
              })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                activeTag === workTag
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {workOpportunityTagLabels[workTag]}
            </Link>
          ))}
        </div>
      </div>

      {creatives.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          {allCreatives.length === 0
            ? "No approved creatives yet. "
            : "No creatives match these filters. "}
          <Link href="/account" className="underline underline-offset-4">
            Add your profile
          </Link>
          .
        </p>
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
    </div>
  );
}
