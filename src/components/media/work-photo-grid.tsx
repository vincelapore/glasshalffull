"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import {
  AppleMusicIcon,
  BandcampIcon,
  GlobeIcon,
  InstagramIcon,
  SoundCloudIcon,
  SpotifyIcon,
  VimeoIcon,
  YouTubeIcon,
} from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/media";
import {
  socialProviderLabels,
  type SocialProvider,
} from "@/lib/creative-socials";
import { withOutboundUtm } from "@/lib/urls";
import { cn } from "@/lib/utils";

function ContactGlyph({ provider }: { provider: SocialProvider }) {
  switch (provider) {
    case "website":
      return <GlobeIcon className="size-4" />;
    case "instagram":
      return <InstagramIcon className="size-4" />;
    case "youtube":
      return <YouTubeIcon className="size-4" />;
    case "vimeo":
      return <VimeoIcon className="size-4" />;
    case "spotify":
      return <SpotifyIcon className="size-4" />;
    case "apple_music":
      return <AppleMusicIcon className="size-4" />;
    case "soundcloud":
      return <SoundCloudIcon className="size-4" />;
    case "bandcamp":
      return <BandcampIcon className="size-4" />;
  }
}

export function WorkPhotoGrid({
  name,
  keys,
  /** Absolute image URLs (e.g. example showcase). Prefer `keys` for real profiles. */
  srcs,
  contactHref,
  contactProvider,
}: {
  name: string;
  keys?: readonly string[];
  srcs?: readonly string[];
  contactHref?: string | null;
  contactProvider?: SocialProvider | null;
}) {
  const photos = srcs?.length
    ? srcs.map((src, index) => ({ key: `src-${index}`, src }))
    : (keys ?? []).flatMap((key) => {
        const src = mediaUrl(key);
        return src ? [{ key, src }] : [];
      });
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (index === null || photos.length < 2) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) =>
          current === null
            ? current
            : (current - 1 + photos.length) % photos.length
        );
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) =>
          current === null ? current : (current + 1) % photos.length
        );
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, photos.length]);

  if (photos.length === 0) return null;

  const open = index !== null;
  const current = index !== null ? photos[index] : null;
  const featured = photos.length >= 3;
  const contactLabel = contactProvider
    ? socialProviderLabels[contactProvider]
    : null;

  let contactControl: ReactNode = null;
  if (contactHref && contactProvider && contactLabel) {
    contactControl = (
      <Button
        render={
          <a
            href={withOutboundUtm(contactHref, {
              campaign: "artist_profile",
              content: `${contactProvider}_lightbox`,
            })}
            target="_blank"
            rel="noreferrer"
          />
        }
        size="sm"
        variant="secondary"
        className="gap-1.5 bg-white/15 px-3 text-white hover:bg-white/25"
      >
        <ContactGlyph provider={contactProvider} />
        {contactLabel}
      </Button>
    );
  }

  return (
    <>
      <section id="work" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Work</h2>
        <ul
          className={cn(
            "grid gap-2 sm:gap-3",
            featured
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3"
          )}
        >
          {photos.map((photo, photoIndex) => {
            const isFeatured = featured && photoIndex === 0;
            return (
              <li
                key={photo.key}
                className={cn(isFeatured && "col-span-2 row-span-2")}
              >
                <button
                  type="button"
                  onClick={() => setIndex(photoIndex)}
                  aria-label={`View ${name}, work example ${photoIndex + 1}`}
                  className={cn(
                    "relative w-full overflow-hidden rounded-xl bg-muted",
                    isFeatured ? "h-full min-h-[12rem]" : "aspect-square",
                    "cursor-zoom-in transition-opacity duration-200 hover:opacity-90",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  )}
                >
                  {/* Plain img, one stored size, lazy. Keeps the gallery off Vercel image optimization. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={`${name}, work example ${photoIndex + 1}`}
                    width={1600}
                    height={1600}
                    loading={photoIndex === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={photoIndex === 0 ? "high" : "low"}
                    className="absolute inset-0 size-full object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setIndex(null);
        }}
      >
        <DialogPopup
          backdropClassName="bg-black/90"
          className={cn(
            "flex h-dvh w-screen max-w-none translate-x-[-50%] translate-y-[-50%] items-center justify-center",
            "rounded-none border-0 bg-transparent p-0 text-white shadow-none"
          )}
        >
          <DialogTitle className="sr-only">
            {current
              ? `${name}, work example ${(index ?? 0) + 1} of ${photos.length}`
              : "Work photo"}
          </DialogTitle>

          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {contactControl}
            <DialogClose
              aria-label="Close"
              className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X className="size-5" />
            </DialogClose>
          </div>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() =>
                  setIndex((currentIndex) =>
                    currentIndex === null
                      ? currentIndex
                      : (currentIndex - 1 + photos.length) % photos.length
                  )
                }
                className="absolute top-1/2 left-2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() =>
                  setIndex((currentIndex) =>
                    currentIndex === null
                      ? currentIndex
                      : (currentIndex + 1) % photos.length
                  )
                }
                className="absolute top-1/2 right-2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}

          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.src}
              alt={`${name}, work example ${(index ?? 0) + 1}`}
              width={1600}
              height={1600}
              className="max-h-[min(92dvh,100%)] max-w-[min(96vw,100%)] object-contain"
            />
          ) : null}

          {photos.length > 1 && index !== null ? (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-sm tabular-nums text-white">
              {index + 1} / {photos.length}
            </p>
          ) : null}
        </DialogPopup>
      </Dialog>
    </>
  );
}
