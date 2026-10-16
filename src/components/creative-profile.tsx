import type { ReactNode } from "react";

import { CreativeBio } from "@/components/creative-bio";
import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { CreativeSocialLinks } from "@/components/creative-social-links";
import { CreativeWorkTags } from "@/components/creative-work-tags";
import { CreativeMediaDock } from "@/components/media/creative-media-dock";
import { CreativeMediaEmbeds } from "@/components/media/creative-media-embeds";
import { ExternalImage } from "@/components/media/external-image";
import { WorkPhotoGrid } from "@/components/media/work-photo-grid";
import { Page, PageTitle } from "@/components/ui/page";
import {
  resolveAudioEmbed,
  resolveVideoEmbed,
  type AudioEmbed,
  type VideoEmbed,
} from "@/lib/creative-media";
import type { Creative } from "@/db/schema";
import { resolvePrimaryContact } from "@/lib/creative-contact";
import {
  socialsFromLegacy,
  type CreativeSocial,
} from "@/lib/creative-socials";
import { cityLabels } from "@/lib/labels";

type CreativeProfileIdentity = Pick<
  Creative,
  | "name"
  | "pronouns"
  | "city"
  | "bio"
  | "disciplines"
  | "roles"
  | "specialty"
  | "isQueer"
  | "openToPaidWork"
  | "openToTrade"
  | "buildingPortfolio"
>;

export function CreativeProfile({
  creative,
  avatarSrc,
  socials,
  instagramHandle,
  portfolioUrl,
  contactEmail,
  workPhotoKeys,
  workPhotoSrcs,
  videoUrls,
  audioUrls,
  notices,
  upcoming,
}: {
  creative: CreativeProfileIdentity;
  avatarSrc?: string | null;
  socials?: readonly CreativeSocial[] | null;
  instagramHandle?: string | null;
  portfolioUrl?: string | null;
  /** Opted-in public contact email (already resolved). */
  contactEmail?: string | null;
  workPhotoKeys?: readonly string[];
  workPhotoSrcs?: readonly string[];
  videoUrls?: readonly string[] | null;
  audioUrls?: readonly string[] | null;
  notices?: ReactNode;
  upcoming?: ReactNode;
}) {
  const links = socialsFromLegacy({
    socials: socials ? [...socials] : null,
    instagramHandle,
    portfolioUrl,
  });
  const primary = resolvePrimaryContact(links, contactEmail);
  const videos = (videoUrls ?? [])
    .map((value) => resolveVideoEmbed(value))
    .filter((value): value is VideoEmbed => Boolean(value));
  const audios = (audioUrls ?? [])
    .map((value) => resolveAudioEmbed(value))
    .filter((value): value is AudioEmbed => Boolean(value));

  const showDock =
    videos.length > 0 ||
    audios.length > 0 ||
    links.length > 0 ||
    Boolean(contactEmail);

  return (
    <Page>
      <div className="grid">
        <div className="col-start-1 row-start-1 min-w-0">
          {notices}

          <header className="space-y-5">
            <div className="flex items-start gap-4">
              <ExternalImage
                src={avatarSrc}
                alt={creative.name}
                className="size-20 shrink-0 rounded-2xl object-cover sm:size-28"
                fallback={
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl font-medium sm:size-28 sm:text-3xl">
                    {creative.name.slice(0, 1).toUpperCase()}
                  </div>
                }
              />
              <div className="min-w-0 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  <CreativeCraftTags creative={creative} />
                  <CreativeWorkTags creative={creative} />
                </div>
                <PageTitle className="break-words sm:text-4xl">
                  {creative.name}
                </PageTitle>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                  {creative.pronouns ? <span>{creative.pronouns}</span> : null}
                  {creative.pronouns && creative.city ? (
                    <span aria-hidden>·</span>
                  ) : null}
                  {creative.city ? (
                    <span>{cityLabels[creative.city]}</span>
                  ) : null}
                </div>
              </div>
            </div>

            {creative.bio ? <CreativeBio bio={creative.bio} /> : null}

            {/* Quiet desktop fallback — primary contact lives in the sticky dock */}
            <CreativeSocialLinks
              socials={links}
              email={contactEmail}
              className="hidden sm:flex"
            />
          </header>

          <div className="mt-10 space-y-12">
            <WorkPhotoGrid
              name={creative.name}
              keys={workPhotoKeys}
              srcs={workPhotoSrcs}
              contactHref={primary?.href}
              contactLabel={primary?.label}
              contactKind={primary?.type ?? null}
              contactProvider={
                primary?.type === "social" ? primary.provider : null
              }
            />

            {upcoming}

            <CreativeMediaEmbeds videoUrls={videoUrls} audioUrls={audioUrls} />
          </div>

          {showDock ? <div className="h-24" aria-hidden /> : null}
        </div>

        <CreativeMediaDock
          name={creative.name}
          avatarSrc={avatarSrc}
          videos={videos}
          audios={audios}
          socials={links}
          contactEmail={contactEmail}
        />
      </div>
    </Page>
  );
}
