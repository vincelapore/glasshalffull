import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { PersonName } from "@/components/discipline-tag";
import { ExternalImage } from "@/components/media/external-image";
import type { Creative } from "@/db/schema";
import { cityShortLabels, resolveCardIcon } from "@/lib/labels";
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
    "slug" | "name" | "disciplines" | "cardDiscipline" | "city" | "avatarKey"
  > & {
    coverWorkPhotoKey: string | null;
  };
  className?: string;
};

export function CreativeListingCard({
  creative,
  className,
}: CreativeListingCardProps) {
  const icon = resolveCardIcon(creative);
  const initial = creative.name.slice(0, 1).toUpperCase();

  return (
    <Link
      href={creativePath(creative.slug)}
      prefetch={false}
      className={cn(
        "profile-card block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
    >
      <div className="profile-card-photo overflow-hidden rounded-lg bg-muted">
        <ExternalImage
          src={mediaUrl(creative.coverWorkPhotoKey)}
          alt=""
          className="absolute inset-0 size-full object-cover"
          fallback={<div className="absolute inset-0 bg-muted" />}
        />
      </div>
      <div className="profile-card-scrim" aria-hidden="true" />

      <div className="relative z-10">
        <div className="aspect-square" />
        <span className="profile-card-avatar absolute bottom-0 left-1/2 z-10 block size-11 -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-full">
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

      <div className="profile-card-meta relative z-10 mt-7 pb-1.5 text-center">
        <h3 className="profile-card-name text-center text-base leading-tight font-medium tracking-tight">
          <PersonName name={creative.name} icon={icon} />
        </h3>
        <div className="profile-card-foot">
          {creative.city ? (
            <p className="profile-card-city text-sm leading-tight text-neutral-400">
              {cityShortLabels[creative.city]}
            </p>
          ) : null}
          <span className="profile-card-cta inline-flex items-center justify-center gap-1 text-xs font-medium tracking-wide">
            View profile
            <ArrowRight className="size-3.5" aria-hidden strokeWidth={2.25} />
          </span>
        </div>
      </div>
    </Link>
  );
}
