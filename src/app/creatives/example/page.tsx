import type { Metadata } from "next";

import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { CreativeSocialLinks } from "@/components/creative-social-links";
import { CreativeWorkTags } from "@/components/creative-work-tags";
import {
  EventListingCard,
  eventListingGridClassName,
} from "@/components/event-listing";
import { CreativeMediaEmbeds } from "@/components/media/creative-media-embeds";
import { ExternalImage } from "@/components/media/external-image";
import { WorkPhotoGrid } from "@/components/media/work-photo-grid";
import { Notice } from "@/components/ui/notice";
import { Page, PageTitle } from "@/components/ui/page";
import {
  exampleCreative,
  exampleUpcomingEvents,
} from "@/lib/example-creative";
import { cityLabels } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Example creative profile",
  robots: { index: false, follow: false },
};

export default function ExampleCreativePage() {
  const creative = exampleCreative;

  return (
    <Page>
      <Notice className="mb-6">
        Example profile — fully filled so you can judge layout and media
        players. Not a real account and not listed in the directory.
      </Notice>

      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <ExternalImage
              src={creative.avatarSrc}
              alt={creative.name}
              className="size-20 shrink-0 rounded-2xl object-cover sm:size-28"
              fallback={
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl font-medium sm:size-28 sm:text-3xl">
                  {creative.name.slice(0, 1).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <CreativeCraftTags creative={creative} />
                <CreativeWorkTags creative={creative} />
              </div>
              <PageTitle className="break-words sm:text-4xl">
                {creative.name}
              </PageTitle>
              <p className="text-sm text-muted-foreground">
                {creative.pronouns}
              </p>
              <p className="text-muted-foreground">
                {cityLabels[creative.city]}
              </p>
            </div>
          </div>

          <p className="max-w-2xl whitespace-pre-wrap text-base leading-relaxed">
            {creative.bio}
          </p>

          <CreativeSocialLinks socials={creative.socials} />
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Upcoming events
          </h2>
          <div className={eventListingGridClassName}>
            {exampleUpcomingEvents.map(
              ({ event, flyerSrc, roleNote, organisers }) => (
                <EventListingCard
                  key={event.slug}
                  event={event}
                  organisers={organisers}
                  note={roleNote}
                  flyerSrc={flyerSrc}
                  href="/creatives/example"
                />
              )
            )}
          </div>
        </section>
      </div>

      <WorkPhotoGrid name={creative.name} srcs={creative.workPhotoSrcs} />
      <CreativeMediaEmbeds
        videoUrls={creative.videoUrls}
        audioUrls={creative.audioUrls}
      />
    </Page>
  );
}
