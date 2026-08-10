import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalImage } from "@/components/media/external-image";
import { craftCategoryLabels } from "@/lib/labels";
import { getApprovedCreatives } from "@/lib/queries";
import { craftCategories } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Creatives",
};

type SearchParams = Promise<{ category?: string }>;

export default async function CreativesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;
  const activeCategory =
    category && craftCategories.includes(category as (typeof craftCategories)[number])
      ? (category as (typeof craftCategories)[number])
      : null;

  const allCreatives = await getApprovedCreatives();
  const creatives = activeCategory
    ? allCreatives.filter((creative) => creative.craftCategory === activeCategory)
    : allCreatives;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Creatives</h1>
        <p className="text-muted-foreground">
          Artists, organizers, and makers behind the local scene.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/creatives"
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
            href={`/creatives?category=${cat}`}
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

      {creatives.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          No approved creatives yet.{" "}
          <Link href="/submit/creative" className="underline underline-offset-4">
            Submit a profile
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creatives.map((creative) => (
            <Link
              key={creative.id}
              href={`/creatives/${creative.id}`}
              className="group"
            >
              <Card className="h-full transition-colors group-hover:bg-muted/30">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ExternalImage
                      src={creative.avatarUrl}
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
                      <Badge variant="outline">
                        {craftCategoryLabels[creative.craftCategory]}
                      </Badge>
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
