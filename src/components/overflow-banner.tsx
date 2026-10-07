"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { EventOrganiserFaces } from "@/components/event-listing/organiser-faces";
import { ExternalImage } from "@/components/media/external-image";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { cityShortLabels, overflowFeatureGroups, type CityFilter } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { creativePath, eventPath } from "@/lib/paths";
import type { OverflowEpisodeView, OverflowFeatureView } from "@/lib/queries";

const urlPattern = /https?:\/\/[^\s<>"']+/g;

function homeHref(city: CityFilter, episode?: string) {
  const params = new URLSearchParams();
  if (city === "all") params.set("city", "all");
  else if (city !== "meanjin") params.set("city", city);
  if (episode) params.set("episode", episode);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function LinkifiedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(urlPattern)) {
    const start = match.index ?? 0;
    let url = match[0];
    let trailing = "";
    while (/[).,!?;:]$/.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }
    if (start > last) nodes.push(text.slice(last, start));
    nodes.push(
      <a
        key={start}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4"
      >
        {url}
      </a>
    );
    if (trailing) nodes.push(trailing);
    last = start + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function FeatureList({ people }: { people: OverflowFeatureView[] }) {
  if (people.length === 0) return null;

  return (
    <ul className="space-y-3">
      {people.map((person) => (
        <li key={person.creativeId}>
          <Link
            href={creativePath(person.slug)}
            className="flex items-center gap-3 rounded-lg transition-colors hover:bg-muted/40"
          >
            <ExternalImage
              src={mediaUrl(person.avatarKey)}
              alt=""
              className="size-10 rounded-full object-cover"
              fallback={
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {person.name.slice(0, 1).toUpperCase()}
                </span>
              }
            />
            <span>
              <span className="block text-sm font-medium">{person.name}</span>
              {person.note ? (
                <span className="block text-sm text-muted-foreground">
                  {person.note}
                </span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OverflowBanner({
  episodes,
  openEpisode,
  activeCity,
}: {
  episodes: OverflowEpisodeView[];
  openEpisode: OverflowEpisodeView | null;
  activeCity: CityFilter;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(openEpisode?.slug ?? null);

  useEffect(() => {
    setSlug(openEpisode?.slug ?? null);
  }, [openEpisode?.slug]);
  const displayed =
    episodes.find((episode) => episode.slug === slug) ??
    (openEpisode?.slug === slug ? openEpisode : null);

  function open(next: string) {
    setSlug(next);
    router.replace(homeHref(activeCity, next), { scroll: false });
  }

  function close() {
    setSlug(null);
    router.replace(homeHref(activeCity), { scroll: false });
  }

  return (
    <>
      {episodes.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-6">
          {episodes.map((episode) => (
            <div key={episode.id} className="w-full max-w-72">
              <button
                type="button"
                className="group overflow-poster relative block w-full overflow-hidden rounded-lg text-left ring-1 ring-black/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring dark:ring-white/15"
                aria-haspopup="dialog"
                aria-label={`the overflow #${episode.number}, ${episode.title}`}
                onClick={() => open(episode.slug)}
              >
                <span className="poster-hover block">
                  <ExternalImage
                    src={mediaUrl(episode.coverKey)}
                    alt=""
                    className="aspect-square w-full object-cover"
                    fallback={<span className="block aspect-square w-full bg-neutral-900" />}
                  />
                </span>
                <span className="pointer-events-none absolute inset-0 bg-black/25" />
                <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                  <span className="font-mono text-sm">
                    the overflow #{episode.number}
                  </span>
                  <span className="font-mono text-4xl tracking-wide uppercase">
                    {episode.title}
                  </span>
                  <span className="text-sm lowercase">
                    {cityShortLabels[episode.city]}
                  </span>
                </span>
                <EventOrganiserFaces
                  className="bottom-4 left-1/2 -translate-x-1/2"
                  organisers={episode.features.map((feature) => ({
                    id: feature.creativeId,
                    name: feature.name,
                    avatarKey: feature.avatarKey,
                  }))}
                />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <Dialog
        open={Boolean(displayed)}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        {displayed ? (
          <DialogPopup className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto">
            <DialogClose
              aria-label="Close"
              className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </DialogClose>
            <ExternalImage
              src={mediaUrl(displayed.coverKey)}
              alt=""
              className="mb-4 aspect-[8/5] w-full rounded-lg object-cover"
              fallback={null}
            />
            <DialogTitle className="pr-8 text-2xl">
              {displayed.title}
            </DialogTitle>
            <DialogDescription className="mt-1">
              the overflow #{displayed.number} ·{" "}
              {cityShortLabels[displayed.city]}
            </DialogDescription>
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">
              <LinkifiedText text={displayed.body} />
            </p>
            <div className="mt-6 space-y-5">
              {overflowFeatureGroups.map((group) => {
                const people = displayed.features.filter(
                  (feature) => feature.role === group.role
                );
                if (people.length === 0) return null;
                return (
                  <section key={group.role} className="space-y-2">
                    <h2 className="text-sm font-medium">{group.label}</h2>
                    <FeatureList people={people} />
                  </section>
                );
              })}
              {displayed.event ? (
                <section className="space-y-2">
                  <h2 className="text-sm font-medium">The night</h2>
                  <Link
                    href={eventPath(displayed.event.slug)}
                    className="text-sm underline underline-offset-4"
                  >
                    {displayed.event.title}
                  </Link>
                </section>
              ) : null}
            </div>
          </DialogPopup>
        ) : null}
      </Dialog>
    </>
  );
}
