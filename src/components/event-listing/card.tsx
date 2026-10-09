import Link from "next/link";

import {
  EventOrganiserFaces,
  type EventListingOrganiser,
} from "@/components/event-listing/organiser-faces";
import { EventPosterTag } from "@/components/event-listing/poster-tag";
import { EventShareButton } from "@/components/event-listing/share-button";
import { ExternalImage } from "@/components/media/external-image";
import type { Event } from "@/db/schema";
import {
  eventCategoryLabels,
  eventRelativeLabel,
  formatEventListingDate,
} from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { eventPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

type EventListingCardProps = {
  event: Pick<
    Event,
    "slug" | "title" | "dateTime" | "location" | "categories" | "flyerKey"
  >;
  organisers?: EventListingOrganiser[];
  /** Extra line under the venue, e.g. this creative's role. */
  note?: string;
  className?: string;
};

export function EventListingCard({
  event,
  organisers = [],
  note,
  className,
}: EventListingCardProps) {
  const when = eventRelativeLabel(event.dateTime);

  const href = eventPath(event.slug);

  return (
    <article
      className={cn(
        "group relative isolate has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-ring",
        className
      )}
    >
      <div className="relative pt-3">
        <div className="overflow-hidden rounded-lg bg-neutral-900 ring-1 ring-black/10 dark:ring-white/15">
          <div className="poster-hover">
            <ExternalImage
              src={mediaUrl(event.flyerKey)}
              alt=""
              className="aspect-[8/5] w-full object-cover"
              fallback={<div className="aspect-[8/5] w-full bg-neutral-900" />}
            />
          </div>
        </div>

        {when || event.categories.length > 0 ? (
          <div className="absolute top-3 right-3 left-3 z-10 -mt-3 flex flex-wrap items-center gap-1.5">
            {when ? (
              <EventPosterTag tone="time" className="whitespace-nowrap">
                {when}
              </EventPosterTag>
            ) : null}
            {event.categories.map((category) => (
              <EventPosterTag
                key={category}
                tone="category"
                className="whitespace-nowrap"
              >
                {eventCategoryLabels[category].toLowerCase()}
              </EventPosterTag>
            ))}
          </div>
        ) : null}

        <EventOrganiserFaces organisers={organisers} />
        <EventShareButton
          title={event.title}
          path={href}
          className="absolute right-3 bottom-3 z-20"
        />
      </div>

      <div className="mt-2.5">
        <h3 className="text-base leading-tight font-normal tracking-tight">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:z-10"
          >
            {event.title}
          </Link>
        </h3>
        <p className="pt-1 text-sm leading-tight">
          {formatEventListingDate(event.dateTime)}
        </p>
        <p className="poster-meta text-sm leading-tight text-neutral-400">
          {event.location}
        </p>
        {note ? (
          <p className="pt-1 font-mono text-[11px] text-neutral-400 lowercase">
            {note}
          </p>
        ) : null}
      </div>
    </article>
  );
}
