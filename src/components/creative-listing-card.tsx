import Link from "next/link";
import type { ReactNode } from "react";

import { EventPosterTag } from "@/components/event-listing/poster-tag";
import { ExternalImage } from "@/components/media/external-image";
import type { Creative } from "@/db/schema";
import { cityShortLabels, primaryCraftTag } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { creativePath } from "@/lib/paths";
import { cn } from "@/lib/utils";

export function ProfileListingGrid({ children }: { children: ReactNode }) {
  return (
    <div className="profile-listing">
      <div className="profile-listing-grid">{children}</div>
    </div>
  );
}

type CreativeListingCardProps = {
  creative: Pick<
    Creative,
    "slug" | "name" | "craftCategories" | "city" | "avatarKey"
  > & {
    coverWorkPhotoKey: string | null;
  };
  className?: string;
};

export function CreativeListingCard({
  creative,
  className,
}: CreativeListingCardProps) {
  const tag = primaryCraftTag(creative.craftCategories);
  const initial = creative.name.slice(0, 1).toUpperCase();

  return (
    <Link
      href={creativePath(creative.slug)}
      className={cn(
        "group block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
    >
      <div className="relative pt-3">
        <div className="overflow-hidden rounded-lg bg-muted ring-1 ring-black/10 dark:ring-white/15">
          <div className="poster-hover">
            <ExternalImage
              src={mediaUrl(creative.coverWorkPhotoKey)}
              alt=""
              className="aspect-square w-full object-cover"
              fallback={<div className="aspect-square w-full bg-muted" />}
            />
          </div>
        </div>

        {tag ? (
          <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <EventPosterTag tone="category">{tag}</EventPosterTag>
          </div>
        ) : null}

        <span className="poster-avatar absolute bottom-0 left-1/2 z-10 block size-11 -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-full ring-2 ring-background">
          <ExternalImage
            src={mediaUrl(creative.avatarKey)}
            alt=""
            className="size-full object-cover"
            fallback={
              <span className="flex size-full items-center justify-center bg-neutral-800 text-xs font-medium text-white">
                {initial}
              </span>
            }
          />
        </span>
      </div>

      <div className="mt-7 text-center">
        <h3 className="text-base leading-tight font-medium tracking-tight">
          {creative.name}
        </h3>
        {creative.city ? (
          <p className="poster-meta mt-0.5 text-sm leading-tight text-neutral-400">
            {cityShortLabels[creative.city]}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
