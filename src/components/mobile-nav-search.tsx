"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Suspense,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  MobileNavQuery,
  NavSearch,
  NavSearchSkeleton,
} from "@/components/nav-search";
import { mobileNavEvents } from "@/components/site-nav";

const FIND_WORDS = [
  "creatives",
  "events",
  "graphic designers",
  "dancers",
  "photographers",
  "musicians",
  "tattoo artists",
] as const;

const ICON_SIZE = 44;
const WORD_INTERVAL_MS = 2600;

function sideRoom(header: Element | null | undefined) {
  const anchor = header?.querySelector("[data-nav-anchor]");
  const cluster = header?.querySelector("[data-nav-cluster]");
  if (!anchor || !cluster) return window.innerWidth - 24;

  const gap = 12;
  let right = cluster.getBoundingClientRect().left;
  const nav = header?.querySelector("[data-nav-links]");
  if (nav) {
    const rect = nav.getBoundingClientRect();
    if (rect.width > 1) right = Math.min(right, rect.left);
  }

  const left = anchor.getBoundingClientRect().right;
  const desktop = window.matchMedia("(min-width: 64rem)").matches;
  if (desktop) return right - left - 16 - gap;

  const center = window.innerWidth / 2;
  return (
    2 *
    Math.min(center - left - gap, right - center - gap)
  );
}

function mobileOpenRoom(header: Element | null | undefined) {
  const row = header?.firstElementChild;
  if (!row) return Math.max(ICON_SIZE, window.innerWidth - 32);
  const rect = row.getBoundingClientRect();
  const style = getComputedStyle(row);
  const pad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  return Math.max(ICON_SIZE, Math.floor(rect.width - pad));
}

function isDesktopNav() {
  return window.matchMedia("(min-width: 64rem)").matches;
}

function isCompactNav() {
  return window.matchMedia("(max-width: 47.999rem)").matches;
}

export function MobileNavSearch() {
  const [open, setOpen] = useState(false);
  const [labeled, setLabeled] = useState(false);
  const [widths, setWidths] = useState<number[]>([]);
  const [wordWidths, setWordWidths] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef(0);
  const openRef = useRef(false);
  const [swap, setSwap] = useState(false);
  const [openWidth, setOpenWidth] = useState(ICON_SIZE);
  const [desktop, setDesktop] = useState(true);
  const [compact, setCompact] = useState(false);
  const openedAt = useRef(0);
  const pathname = usePathname();
  const bodyId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useLayoutEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 64rem)");
    const compactMedia = window.matchMedia("(max-width: 47.999rem)");
    const sync = () => {
      setDesktop(desktopMedia.matches);
      setCompact(compactMedia.matches);
    };
    sync();
    desktopMedia.addEventListener("change", sync);
    compactMedia.addEventListener("change", sync);
    return () => {
      desktopMedia.removeEventListener("change", sync);
      compactMedia.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener(mobileNavEvents.closeSearch, close);
    return () => window.removeEventListener(mobileNavEvents.closeSearch, close);
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const root = measureRef.current;
      const header = anchorRef.current?.closest("header");
      const logo = header?.querySelector("a");
      const cluster = header?.querySelector("[data-nav-cluster]");
      if (!root || !logo || !cluster) return;

      const samples = [
        ...root.querySelectorAll<HTMLElement>("[data-word]"),
      ];
      const nextWidths = samples.map((sample) =>
        Math.ceil(sample.parentElement?.getBoundingClientRect().width ?? 0),
      );
      const nextWordWidths = samples.map((sample) =>
        Math.ceil(
          sample.querySelector(".nav-search-word")?.getBoundingClientRect()
            .width ?? 0,
        ),
      );
      if (
        nextWidths.length === 0 ||
        nextWidths.some((width) => width === 0) ||
        nextWordWidths.some((width) => width === 0)
      ) {
        return;
      }

      const prompt = samples[0]?.querySelector(".nav-search-prompt");
      const pill = samples[0]?.parentElement;
      if (prompt && pill) {
        chromeRef.current = Math.ceil(
          pill.getBoundingClientRect().width - prompt.getBoundingClientRect().width,
        );
      }

      const room = sideRoom(header);

      const nextLabeled = Math.max(...nextWidths) <= room;
      setWidths((current) =>
        current.length === nextWidths.length &&
        current.every((width, i) => width === nextWidths[i])
          ? current
          : nextWidths,
      );
      setWordWidths((current) =>
        current.length === nextWordWidths.length &&
        current.every((width, i) => width === nextWordWidths[i])
          ? current
          : nextWordWidths,
      );
      setLabeled((current) => (current === nextLabeled ? current : nextLabeled));
    };

    measure();
    const observer = new ResizeObserver(measure);
    const header = anchorRef.current?.closest("header");
    if (header) observer.observe(header);
    observer.observe(document.documentElement);
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!labeled || open) return;

    let timer = 0;
    const start = () => {
      timer = window.setInterval(() => {
        setIndex((current) => (current + 1) % FIND_WORDS.length);
      }, WORD_INTERVAL_MS);
    };
    const onVisibility = () => {
      window.clearInterval(timer);
      if (!document.hidden) start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [labeled, open]);

  useEffect(() => {
    if (!open) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && anchorRef.current?.contains(active)) {
        active.blur();
      }
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector("[role='listbox']")) return;
      setOpen(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (anchorRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[role='listbox']")) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (openRef.current === open) return;
    openRef.current = open;
    setSwap(true);
    const timeout = window.setTimeout(() => setSwap(false), 280);
    return () => window.clearTimeout(timeout);
  }, [open]);

  function measureOpenWidth() {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    const search = panel?.querySelector<HTMLElement>(".nav-search");
    if (!anchor) return ICON_SIZE;

    const header = anchor.closest("header");
    if (isCompactNav()) return mobileOpenRoom(header);
    if (!search) return ICON_SIZE;

    const room = isDesktopNav()
      ? Math.min(window.innerWidth - 24, 36 * 16, sideRoom(header))
      : mobileOpenRoom(header);
    const text = Math.ceil(search.scrollWidth);
    const chrome = chromeRef.current || ICON_SIZE;
    return Math.max(ICON_SIZE, Math.min(room, chrome + text));
  }

  useLayoutEffect(() => {
    if (!open) return;
    const fit = () => setOpenWidth(measureOpenWidth());
    fit();
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => window.removeEventListener("resize", fit);
  }, [open, compact, desktop]);

  useEffect(() => {
    if (!open || desktop) return;

    const startY = window.scrollY;
    const onScroll = () => {
      if (Date.now() - openedAt.current < 800) return;
      if (Math.abs(window.scrollY - startY) < 12) return;
      setOpen(false);
    };

    const anchor = anchorRef.current;
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && anchor?.contains(next)) return;
      if (next instanceof Element && next.closest("[role='listbox']")) return;
      if (event.target instanceof Element && event.target.closest("select")) return;
      window.setTimeout(() => {
        const active = document.activeElement;
        if (active instanceof Node && anchor?.contains(active)) return;
        setOpen(false);
      }, 80);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    anchor?.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("scroll", onScroll);
      anchor?.removeEventListener("focusout", onFocusOut);
    };
  }, [open, desktop]);

  function toggle() {
    if (!open) {
      openedAt.current = Date.now();
      setOpenWidth(measureOpenWidth());
      window.dispatchEvent(new Event(mobileNavEvents.closeMenu));
    }
    setOpen((value) => !value);
  }

  const closedWidth =
    labeled && widths[index] ? widths[index] : ICON_SIZE;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-14 lg:static lg:inset-auto lg:z-auto lg:h-auto lg:w-auto">
      <div className="nav-search-veil" aria-hidden />
      <p className="nav-search-lead">I&apos;m looking for a</p>
      <div
        ref={anchorRef}
        className="nav-search-anchor"
        data-open={open ? "" : undefined}
        data-labeled={labeled ? "" : undefined}
        style={{ width: open ? openWidth : closedWidth }}
      >
        <span className="nav-search-icon" aria-hidden>
          <Search className="size-4" />
        </span>
        <button
          type="button"
          className="nav-search-trigger"
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={open ? "Close search" : "Search"}
          onClick={toggle}
        />
        <div className="nav-search-slot">
          {labeled && (!open || swap) ? (
            <span
              className={`nav-search-prompt${
                open && swap ? " is-out" : !open && swap ? " is-in" : ""
              }`}
            >
              <span className="nav-search-find">find</span>
              <WordSwap word={FIND_WORDS[index]} width={wordWidths[index]} />
            </span>
          ) : null}
          <div
            ref={panelRef}
            id={bodyId}
            className={`nav-search-panel${
              open && swap
                ? " is-in"
                : !open && swap
                  ? " is-out"
                  : open
                    ? ""
                    : " is-parked"
            }`}
            inert={!open}
          >
            <Suspense
              fallback={
                compact ? (
                  <div className="nav-search-mobile" />
                ) : (
                  <NavSearchSkeleton bare hideIcon />
                )
              }
            >
              {compact ? (
                <MobileNavQuery active={open} noteAnchor={anchorRef.current} />
              ) : (
                <NavSearch bare hideIcon />
              )}
            </Suspense>
          </div>
        </div>
      </div>
      <div ref={measureRef} className="nav-search-measure" aria-hidden>
        {FIND_WORDS.map((word) => (
          <div key={word} className="nav-search-anchor" data-labeled="">
            <div className="nav-search-trigger" data-word={word}>
              <Search className="size-4" />
              <span className="nav-search-prompt">
                <span className="nav-search-find">find</span>
                <span className="nav-search-word">{word}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordSwap({ word, width }: { word: string; width?: number }) {
  const previous = useRef(word);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (previous.current === word) return;
    setOutgoing(previous.current);
    previous.current = word;
    const timeout = window.setTimeout(() => setOutgoing(null), 280);
    return () => window.clearTimeout(timeout);
  }, [word]);

  return (
    <span
      className="nav-search-word-window"
      style={width ? { width } : undefined}
    >
      {outgoing ? (
        <span className="nav-search-word is-out">{outgoing}</span>
      ) : null}
      <span className={outgoing ? "nav-search-word is-in" : "nav-search-word"}>
        {word}
      </span>
    </span>
  );
}
