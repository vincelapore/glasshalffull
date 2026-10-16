import type { Metadata } from "next";

import { CreativeProfile } from "@/components/creative-profile";
import {
  EventListingCard,
  eventListingGridClassName,
} from "@/components/event-listing";
import { Notice } from "@/components/ui/notice";
import {
  exampleCreative,
  exampleUpcomingEvents,
} from "@/lib/example-creative";

export const metadata: Metadata = {
  title: "Example creative profile",
  robots: { index: false, follow: false },
};

export default function ExampleCreativePage() {
  const creative = exampleCreative;

  return (
    <CreativeProfile
      creative={creative}
      avatarSrc={creative.avatarSrc}
      socials={creative.socials}
      contactEmail={creative.contactEmail}
      workPhotoSrcs={creative.workPhotoSrcs}
      videoUrls={creative.videoUrls}
      audioUrls={creative.audioUrls}
      notices={
        <Notice className="mb-6">
          Example profile, fully filled so you can judge layout and media
          players. Not a real account and not listed in the directory.
        </Notice>
      }
      upcoming={
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
      }
    />
  );
}
