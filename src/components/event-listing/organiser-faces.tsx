import type { CSSProperties } from "react";

import { ExternalImage } from "@/components/media/external-image";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type EventListingOrganiser = {
  id: string;
  name: string;
  avatarKey: string | null;
};

const visibleCount = 4;

export function EventOrganiserFaces({
  organisers,
  className,
}: {
  organisers: EventListingOrganiser[];
  className?: string;
}) {
  if (organisers.length === 0) return null;

  const shown = organisers.slice(0, visibleCount);
  const extra = organisers.length - shown.length;

  return (
    <div
      className={cn("absolute bottom-3 left-3 z-10 flex items-center", className)}
      style={
        {
          "--faces": shown.length + (extra > 0 ? 1 : 0),
        } as CSSProperties
      }
    >
      <span className="sr-only">
        Organised by {organisers.map((organiser) => organiser.name).join(", ")}
      </span>
      {shown.map((organiser, index) => (
        <span
          key={organiser.id}
          title={organiser.name}
          className="poster-face relative size-8 overflow-hidden rounded-full ring-2 ring-white"
          style={
            {
              zIndex: index + 1,
              marginLeft: index === 0 ? 0 : -8,
              "--face": index,
            } as CSSProperties
          }
        >
          <ExternalImage
            src={mediaUrl(organiser.avatarKey)}
            alt=""
            className="size-full object-cover"
            fallback={
              <span className="flex size-full items-center justify-center bg-neutral-800 text-xs font-medium text-white">
                {organiser.name.slice(0, 1).toUpperCase()}
              </span>
            }
          />
        </span>
      ))}
      {extra > 0 ? (
        <span
          className="poster-face relative flex size-8 items-center justify-center rounded-full bg-neutral-900 font-mono text-[10px] text-white ring-2 ring-white"
          style={
            {
              zIndex: shown.length + 1,
              marginLeft: -8,
              "--face": shown.length,
            } as CSSProperties
          }
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
