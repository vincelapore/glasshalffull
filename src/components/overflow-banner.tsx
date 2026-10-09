"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

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
import { cn } from "@/lib/utils";

const flickMs = 280;
const dwellMs = 3600;

const urlPattern = /https?:\/\/[^\s<>"']+/g;

const heroImageClass =
  "aspect-[8/5] w-full object-cover sm:aspect-[5/2] lg:aspect-[3/1]";

function homeHref(city: CityFilter, episode?: string) {
  const params = new URLSearchParams();
  if (city === "all") params.set("city", "all");
  else if (city !== "meanjin") params.set("city", city);
  if (episode) params.set("episode", episode);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function leadLine(body: string) {
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  const end = flat.search(/[.!?](?:\s|$)/);
  const sentence = end === -1 ? flat : flat.slice(0, end + 1);
  if (sentence.length <= 200) return sentence;
  return `${sentence.slice(0, 197).trimEnd()}…`;
}

function episodeFaces(episode: OverflowEpisodeView) {
  return episode.features.map((feature) => ({
    id: feature.creativeId,
    name: feature.name,
    avatarKey: feature.avatarKey,
  }));
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
      </a>,
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

function flickEasing() {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--ease-in-out")
    .trim();
  return value || "cubic-bezier(0.77, 0, 0.175, 1)";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function OverflowPoster({
  episode,
  onOpen,
  framed = true,
}: {
  episode: OverflowEpisodeView;
  onOpen: (slug: string) => void;
  framed?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group overflow-poster relative block w-full overflow-hidden rounded-lg text-left focus-visible:outline-2 focus-visible:outline-ring",
        framed
          ? "ring-1 ring-black/10 focus-visible:outline-offset-4 dark:ring-white/15"
          : "focus-visible:outline-offset-[-3px]",
      )}
      aria-haspopup="dialog"
      aria-label={`the overflow #${episode.number}, ${episode.title}`}
      onClick={() => onOpen(episode.slug)}
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
        <span className="font-mono text-sm">the overflow #{episode.number}</span>
        <span className="font-mono text-4xl tracking-wide uppercase">
          {episode.title}
        </span>
        <span className="text-sm lowercase">{cityShortLabels[episode.city]}</span>
      </span>
      <EventOrganiserFaces
        className="bottom-4 left-1/2 -translate-x-1/2"
        organisers={episodeFaces(episode)}
      />
    </button>
  );
}

function OverflowHeroSlide({
  episode,
  onOpen,
}: {
  episode: OverflowEpisodeView;
  onOpen: (slug: string) => void;
}) {
  return (
    <button
      type="button"
      className="group overflow-poster relative block w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring"
      aria-haspopup="dialog"
      aria-label={`the overflow #${episode.number}, ${episode.title}`}
      onClick={() => onOpen(episode.slug)}
    >
      <span className="poster-hover block">
        <ExternalImage
          src={mediaUrl(episode.coverKey)}
          alt=""
          className={heroImageClass}
          fallback={<span className={cn("block bg-neutral-900", heroImageClass)} />}
        />
      </span>
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <span className="pointer-events-none absolute inset-x-0 bottom-14 px-4 text-white sm:bottom-16 sm:px-6">
        <span className="font-mono text-xs tracking-[0.16em] uppercase">
          the overflow #{episode.number}
        </span>
        <span className="mt-1 block font-mono text-2xl leading-none tracking-wide uppercase sm:text-4xl">
          {episode.title}
        </span>
        <span className="mt-1 block text-sm lowercase">
          {cityShortLabels[episode.city]}
        </span>
      </span>
      <EventOrganiserFaces organisers={episodeFaces(episode)} />
    </button>
  );
}

function OverflowLatest({
  episode,
  rest,
  onOpen,
}: {
  episode: OverflowEpisodeView;
  rest: OverflowEpisodeView[];
  onOpen: (slug: string) => void;
}) {
  const line = leadLine(episode.body);

  return (
    <section className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
      <button
        type="button"
        className="group block w-full overflow-hidden rounded-lg bg-neutral-900 text-left ring-1 ring-black/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring dark:ring-white/15"
        aria-haspopup="dialog"
        aria-label={`the overflow #${episode.number}, ${episode.title}`}
        onClick={() => onOpen(episode.slug)}
      >
        <span className="poster-hover block">
          <ExternalImage
            src={mediaUrl(episode.coverKey)}
            alt=""
            className="aspect-[4/5] max-h-[32rem] w-full object-cover"
            fallback={
              <span className="block aspect-[4/5] max-h-[32rem] w-full bg-neutral-900" />
            }
          />
        </span>
      </button>
      <div className="space-y-4">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          the overflow #{episode.number} · {cityShortLabels[episode.city]}
        </p>
        <h2 className="font-heading text-3xl font-normal tracking-tight sm:text-5xl">
          {episode.title}
        </h2>
        {line ? (
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            {line}
          </p>
        ) : null}
        <button
          type="button"
          className="text-sm underline underline-offset-4"
          onClick={() => onOpen(episode.slug)}
        >
          Read it
        </button>
        {rest.length > 0 ? (
          <div className="border-t border-border pt-4">
            <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
              More from the overflow
            </p>
            <ul className="mt-2 space-y-1">
              {rest.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="text-left text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    onClick={() => onOpen(item.slug)}
                  >
                    #{item.number} {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function OverflowTicker({
  episodes,
  onOpen,
  paused,
}: {
  episodes: OverflowEpisodeView[];
  onOpen: (slug: string) => void;
  paused: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLDivElement | null)[]>([]);
  const indexRef = useRef(0);
  const suppressClick = useRef(false);
  const stopPointer = useRef<(() => void) | null>(null);
  const showRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    showRef.current = (index: number) => {
      const count = episodes.length;
      if (count < 2) return;
      const from = indexRef.current;
      const next = ((index % count) + count) % count;
      if (next === from) return;
      const forward = (next - from + count) % count;
      const backward = (from - next + count) % count;
      indexRef.current = next;
      if (prefersReducedMotion()) {
        setLeaving(null);
        setCurrent(next);
        return;
      }
      setDirection(forward <= backward ? 1 : -1);
      setLeaving(from);
      setCurrent(next);
    };
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  useEffect(() => () => stopPointer.current?.(), []);

  useEffect(() => {
    if (
      paused ||
      held ||
      !inView ||
      !pageVisible ||
      reduceMotion ||
      episodes.length < 2
    ) {
      return;
    }
    const id = window.setInterval(() => {
      showRef.current(indexRef.current + 1);
    }, dwellMs);
    return () => window.clearInterval(id);
  }, [
    current,
    episodes.length,
    held,
    inView,
    pageVisible,
    paused,
    reduceMotion,
  ]);

  useLayoutEffect(() => {
    if (leaving == null || leaving === current) return;
    const incoming = slides.current[current];
    const outgoing = slides.current[leaving];
    if (!incoming || !outgoing || prefersReducedMotion()) return;

    const from = direction > 0 ? "100%" : "-100%";
    const to = direction > 0 ? "-100%" : "100%";
    const easing = flickEasing();
    let alive = true;
    const enter = incoming.animate(
      [
        { transform: `translate3d(${from}, 0, 0)` },
        { transform: "translate3d(0, 0, 0)" },
      ],
      { duration: flickMs, easing, fill: "both" },
    );
    const exit = outgoing.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: `translate3d(${to}, 0, 0)` },
      ],
      { duration: flickMs, easing, fill: "both" },
    );

    exit.finished
      .then(() => {
        if (alive) setLeaving(null);
      })
      .catch(() => {});

    return () => {
      alive = false;
      enter.cancel();
      exit.cancel();
    };
  }, [current, direction, leaving]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || stopPointer.current) return;
    const start = {
      x: event.clientX,
      y: event.clientY,
      edge: event.clientX < 28,
    };
    setHeld(true);

    const finish = (end: PointerEvent) => {
      stopPointer.current?.();
      setHeld(false);
      if (end.type === "pointercancel" || episodes.length < 2) return;
      const dx = end.clientX - start.x;
      const dy = end.clientY - start.y;
      if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
      suppressClick.current = true;
      if (start.edge) return;
      showRef.current(indexRef.current + (dx < 0 ? 1 : -1));
    };

    const stop = () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      stopPointer.current = null;
    };
    stopPointer.current = stop;
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  }

  return (
    <div
      ref={rootRef}
      className="w-full"
      role="region"
      aria-roledescription="carousel"
      aria-label="the overflow"
      onKeyDown={(event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        showRef.current(indexRef.current + (event.key === "ArrowRight" ? 1 : -1));
      }}
    >
      <div
        className="touch-pan-y overflow-hidden rounded-lg bg-neutral-900 ring-1 ring-black/10 select-none dark:ring-white/15 [-webkit-tap-highlight-color:transparent]"
        onPointerDown={onPointerDown}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div className="relative">
          {episodes.map((episode, index) => (
            <div
              key={episode.id}
              ref={(node) => {
                slides.current[index] = node;
              }}
              className={cn(
                "w-full",
                index === current ? "relative z-10" : "absolute inset-0",
                index !== current && index !== leaving && "invisible",
                index === leaving && "pointer-events-none",
              )}
              inert={index === current ? undefined : true}
              aria-hidden={index !== current}
            >
              <OverflowHeroSlide episode={episode} onOpen={onOpen} />
            </div>
          ))}
        </div>
      </div>
      {episodes.length > 1 ? (
        <div className="mt-3 flex flex-wrap justify-center" role="group" aria-label="Episodes">
          {episodes.map((episode, index) => (
            <button
              key={episode.id}
              type="button"
              aria-label={`Show the overflow #${episode.number}, ${episode.title}`}
              aria-current={index === current ? "true" : undefined}
              className="flex size-8 items-center justify-center"
              onClick={() => showRef.current(index)}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors duration-150 ease-[var(--ease-out)]",
                  index === current ? "bg-foreground" : "bg-foreground/25",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
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
        <div className="space-y-16">
          <OverflowTicker
            key={episodes.map((episode) => episode.id).join(":")}
            episodes={episodes}
            paused={Boolean(displayed)}
            onOpen={open}
          />
          <div className="flex flex-wrap justify-center gap-6">
            {episodes.map((episode) => (
              <div key={episode.id} className="w-full max-w-72">
                <OverflowPoster episode={episode} onOpen={open} />
              </div>
            ))}
          </div>
          <OverflowLatest
            episode={episodes[0]}
            rest={episodes.slice(1)}
            onOpen={open}
          />
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
            <DialogTitle className="pr-8 text-2xl">{displayed.title}</DialogTitle>
            <DialogDescription className="mt-1">
              the overflow #{displayed.number} · {cityShortLabels[displayed.city]}
            </DialogDescription>
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">
              <LinkifiedText text={displayed.body} />
            </p>
            <div className="mt-6 space-y-5">
              {overflowFeatureGroups.map((group) => {
                const people = displayed.features.filter(
                  (feature) => feature.role === group.role,
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
