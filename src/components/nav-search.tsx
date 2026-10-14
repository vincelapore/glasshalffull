"use client";

import { ChevronDown, MapPin, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cityShortLabels } from "@/lib/labels";
import { eventsBrowsePath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { cities, disciplines } from "@/lib/validations";

type Discipline = (typeof disciplines)[number];
type NavCity = (typeof cities)[number] | "all";

/** Selected-state label for each discipline in the nav search. */
const disciplineSearchLabels: Record<Discipline, string> = {
  music: "musician",
  visual_art: "visual artist",
  photography: "photographer",
  fashion: "fashion creative",
  performance: "performer",
  film: "filmmaker",
  writing: "writer",
  design: "graphic designer",
  tattoo: "tattoo artist",
  community: "event organiser",
};

/** Role-style phrases that resolve to a browse discipline. */
const searchPhrases: { label: string; discipline: Discipline }[] = [
  { label: "musician", discipline: "music" },
  { label: "DJ", discipline: "music" },
  { label: "producer", discipline: "music" },
  { label: "visual artist", discipline: "visual_art" },
  { label: "photographer", discipline: "photography" },
  { label: "fashion creative", discipline: "fashion" },
  { label: "stylist", discipline: "fashion" },
  { label: "makeup artist", discipline: "fashion" },
  { label: "model", discipline: "fashion" },
  { label: "performer", discipline: "performance" },
  { label: "dancer", discipline: "performance" },
  { label: "actor", discipline: "performance" },
  { label: "filmmaker", discipline: "film" },
  { label: "writer", discipline: "writing" },
  { label: "poet", discipline: "writing" },
  { label: "graphic designer", discipline: "design" },
  { label: "creative director", discipline: "design" },
  { label: "tattoo artist", discipline: "tattoo" },
  { label: "event organiser", discipline: "community" },
];

const citySearchLabels: Record<NavCity, string> = {
  ...cityShortLabels,
  all: "all cities",
};

const cityOptions: NavCity[] = [...cities, "all"];

function isDiscipline(value: string | null): value is Discipline {
  return disciplines.includes(value as Discipline);
}

function isNavCity(value: string | null): value is NavCity {
  return value === "all" || cities.includes(value as (typeof cities)[number]);
}

function creativesHref(discipline: Discipline, city: NavCity) {
  const params = new URLSearchParams({ discipline, city });
  return `/creatives?${params.toString()}`;
}

export function NavSearch({
  className,
  bare = false,
  hideIcon = false,
}: {
  className?: string;
  bare?: boolean;
  hideIcon?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const disciplineParam = searchParams.get("discipline");
  const cityParam = searchParams.get("city");
  const discipline = isDiscipline(disciplineParam)
    ? disciplineParam
    : "design";
  const city = isNavCity(cityParam) ? cityParam : "meanjin";

  function go(nextDiscipline: Discipline, nextCity: NavCity) {
    router.push(creativesHref(nextDiscipline, nextCity));
  }

  return (
    <div className={cn("nav-search", bare && "nav-search-bare", className)}>
      <span className="inline-flex min-w-0 items-center gap-1.5">
        {hideIcon ? null : (
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="shrink-0 text-muted-foreground">i&apos;m looking for a</span>
        <CraftInput
          value={discipline}
          onPick={(next) => go(next, city)}
        />
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="shrink-0 text-muted-foreground">in</span>
        <InlineSelect
          label="City"
          value={city}
          options={cityOptions.map((value) => ({
            value,
            label: citySearchLabels[value],
          }))}
          onValueChange={(value) => {
            if (isNavCity(value)) go(discipline, value);
          }}
        />
      </span>
    </div>
  );
}

export function NavSearchSkeleton({
  className,
  bare = false,
  hideIcon = false,
}: {
  className?: string;
  bare?: boolean;
  hideIcon?: boolean;
}) {
  return (
    <div className={cn("nav-search", bare && "nav-search-bare", className)} aria-hidden>
      <span className="inline-flex items-center gap-1.5">
        {hideIcon ? null : (
          <Search className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">i&apos;m looking for a</span>
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <ChevronDown className="size-3.5" />
          graphic designer
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-muted-foreground">in</span>
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <ChevronDown className="size-3.5" />
          Meanjin
        </span>
      </span>
    </div>
  );
}

function matchingPhrases(query: string, selected: Discipline) {
  const selectedLabel = disciplineSearchLabels[selected];
  const normalized = query.trim().toLowerCase();
  if (!normalized || normalized === selectedLabel.toLowerCase()) {
    return searchPhrases.filter(
      (phrase, index, list) =>
        list.findIndex((item) => item.discipline === phrase.discipline) ===
        index
    );
  }
  return searchPhrases.filter((phrase) =>
    phrase.label.toLowerCase().includes(normalized)
  );
}

function CraftInput({
  value,
  onPick,
}: {
  value: Discipline;
  onPick: (discipline: Discipline) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLLabelElement>(null);
  const [query, setQuery] = useState(disciplineSearchLabels[value]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const suggestions = matchingPhrases(query, value);

  useEffect(() => {
    setQuery(disciplineSearchLabels[value]);
  }, [value]);

  function choose(discipline: Discipline) {
    setQuery(disciplineSearchLabels[discipline]);
    setOpen(false);
    onPick(discipline);
  }

  function onFocus() {
    setOpen(true);
    const index = suggestions.findIndex(
      (phrase) => phrase.discipline === value
    );
    setActive(index >= 0 ? index : 0);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  return (
    <label
      ref={anchorRef}
      className="relative inline-flex shrink-0 items-center gap-1 font-medium text-foreground"
    >
      <ChevronDown className="size-3.5 pointer-events-none" aria-hidden />
      <span className="inline-grid items-center">
        <span className="invisible col-start-1 row-start-1 whitespace-pre">
          {query || "profession"}
        </span>
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Discipline"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && suggestions[active]
              ? `${listId}-${suggestions[active].discipline}-${active}`
              : undefined
          }
          size={1}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder="profession"
          className="col-start-1 row-start-1 w-full min-w-0 border-0 bg-transparent p-0 font-medium text-foreground outline-none placeholder:text-muted-foreground"
          onFocus={onFocus}
          onBlur={() => {
            setOpen(false);
            setQuery(disciplineSearchLabels[value]);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((index) =>
                Math.min(index + 1, Math.max(suggestions.length - 1, 0)),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const phrase = suggestions[active];
              if (phrase) choose(phrase.discipline);
            } else if (event.key === "Escape") {
              setOpen(false);
              setQuery(disciplineSearchLabels[value]);
              inputRef.current?.blur();
            }
          }}
        />
      </span>
      {open ? (
        <SuggestionList
          id={listId}
          anchor={anchorRef.current}
          suggestions={suggestions}
          active={active}
          onHover={setActive}
          onPick={(phrase) => choose(phrase.discipline)}
        />
      ) : null}
    </label>
  );
}

function SuggestionList({
  id,
  anchor,
  suggestions,
  active,
  onHover,
  onPick,
}: {
  id: string;
  anchor: HTMLElement | null;
  suggestions: readonly { label: string; discipline: Discipline }[];
  active: number;
  onHover: (index: number) => void;
  onPick: (phrase: { label: string; discipline: Discipline }) => void;
}) {
  const [box, setBox] = useState<{ top: number; left: number; width: number }>();
  const listRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (!anchor) return;

    function place() {
      const rect = anchor!.getBoundingClientRect();
      const width = Math.max(rect.width, 180);
      const left = Math.min(
        Math.max(8, rect.left),
        window.innerWidth - width - 8,
      );
      setBox({
        top: rect.bottom + 8,
        left,
        width,
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, suggestions.length]);

  useEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>("[data-active='true']");
    item?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!box || typeof document === "undefined") return null;

  return createPortal(
    <ul
      ref={listRef}
      id={id}
      role="listbox"
      aria-label="Professions"
      style={{ top: box.top, left: box.left, minWidth: box.width }}
      className="fixed z-[70] max-h-64 overflow-y-auto rounded-2xl bg-background p-1.5 text-sm text-foreground shadow-lg ring-1 ring-foreground/10"
    >
      {suggestions.length === 0 ? (
        <li className="px-2.5 py-1.5 text-muted-foreground">No matches</li>
      ) : (
        suggestions.map((phrase, index) => (
          <li key={`${phrase.discipline}-${phrase.label}`} role="presentation">
            <button
              id={`${id}-${phrase.discipline}-${index}`}
              type="button"
              role="option"
              aria-selected={index === active}
              data-active={index === active}
              className={cn(
                "block w-full rounded-xl px-2.5 py-1.5 text-left",
                index === active && "bg-muted",
              )}
              onMouseEnter={() => onHover(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(phrase)}
            >
              {phrase.label}
            </button>
          </li>
        ))
      )}
    </ul>,
    document.body,
  );
}

const PLACEHOLDER_WORDS = [
  "graphic designer",
  "events",
  "musician",
  "DJ",
  "dancer",
  "photographer",
  "tattoo artist",
] as const;

type SearchHit =
  | { kind: "events" }
  | { kind: "discipline"; discipline: Discipline; label: string };

function useNavCity() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city");
  return isNavCity(cityParam) ? cityParam : "meanjin";
}

function searchHits(query: string): SearchHit[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const hits: SearchHit[] = [];
  if ("events".startsWith(normalized) || normalized === "event") {
    hits.push({ kind: "events" });
  }
  const phrases = searchPhrases.filter((phrase) =>
    phrase.label.toLowerCase().includes(normalized)
  );
  phrases.sort((a, b) => {
    const aStart = a.label.toLowerCase().startsWith(normalized);
    const bStart = b.label.toLowerCase().startsWith(normalized);
    if (aStart === bStart) return 0;
    return aStart ? -1 : 1;
  });
  const seen = new Set<Discipline>();
  for (const phrase of phrases) {
    if (seen.has(phrase.discipline)) continue;
    seen.add(phrase.discipline);
    hits.push({
      kind: "discipline",
      discipline: phrase.discipline,
      label: phrase.label,
    });
  }
  return hits;
}

function hitLabel(hit: SearchHit) {
  return hit.kind === "events" ? "events" : hit.label;
}

function hitKey(hit: SearchHit) {
  return hit.kind === "events" ? "events" : hit.discipline;
}

export function MobileNavQuery({
  active,
  noteAnchor,
}: {
  active: boolean;
  noteAnchor: HTMLElement | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const city = useNavCity();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [activeHit, setActiveHit] = useState(0);
  const [noteOn, setNoteOn] = useState(false);
  const [noteLeaving, setNoteLeaving] = useState(false);
  const hits = searchHits(query);
  const listOpen = active && query.trim().length > 0;

  useLayoutEffect(() => {
    if (!active) {
      setQuery("");
      setActiveHit(0);
      return;
    }
    const input = inputRef.current;
    if (!input || document.activeElement === input) return;
    input.focus({ preventScroll: true });
  }, [active]);

  useEffect(() => {
    if (!noteAnchor) return;
    if (active) {
      setNoteLeaving(false);
      setNoteOn(true);
      return;
    }
    setNoteLeaving(true);
    const timeout = window.setTimeout(() => {
      setNoteOn(false);
      setNoteLeaving(false);
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [active, noteAnchor]);

  useEffect(() => {
    if (!active || query.trim()) return;

    let timer = 0;
    const start = () => {
      timer = window.setInterval(() => {
        setIndex((current) => (current + 1) % PLACEHOLDER_WORDS.length);
      }, 2600);
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
  }, [active, query]);

  function go(hit: SearchHit) {
    if (hit.kind === "events") {
      router.push(eventsBrowsePath({ city }));
      return;
    }
    router.push(creativesHref(hit.discipline, city));
  }

  function chooseCity(next: string) {
    if (!isNavCity(next)) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "meanjin") params.delete("city");
    else params.set("city", next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div ref={rootRef} className="nav-search-mobile">
      <div className="nav-search-mobile-field">
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Search"
          aria-expanded={listOpen}
          aria-controls={listOpen ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            listOpen && hits[activeHit]
              ? `${listId}-${hitKey(hits[activeHit])}`
              : undefined
          }
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          className="nav-search-mobile-input"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveHit(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveHit((current) =>
                Math.min(current + 1, Math.max(hits.length - 1, 0)),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveHit((current) => Math.max(current - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const hit = hits[activeHit];
              if (hit) go(hit);
            } else if (event.key === "Escape") {
              if (!query) return;
              event.stopPropagation();
              setQuery("");
              setActiveHit(0);
            }
          }}
        />
        {query ? null : (
          <span className="nav-search-mobile-placeholder" aria-hidden>
            <span className="nav-search-word-window">
              <PlaceholderWord word={PLACEHOLDER_WORDS[index]} />
            </span>
          </span>
        )}
      </div>
      <label className="nav-search-city">
        <MapPin className="size-4" aria-hidden />
        <select
          aria-label="City"
          value={city}
          onFocus={(event) => {
            let node = event.currentTarget.parentElement;
            while (node) {
              node.scrollLeft = 0;
              node = node.parentElement;
            }
          }}
          onChange={(event) => chooseCity(event.target.value)}
        >
          {cityOptions.map((value) => (
            <option key={value} value={value}>
              {citySearchLabels[value]}
            </option>
          ))}
        </select>
      </label>
      {listOpen ? (
        <MobileHitList
          id={listId}
          anchor={rootRef.current}
          hits={hits}
          active={activeHit}
          onHover={setActiveHit}
          onPick={go}
        />
      ) : null}
      {noteOn && noteAnchor
        ? createPortal(
            <p
              className={`nav-search-city-note${noteLeaving ? " is-leaving" : ""}`}
            >
              in {citySearchLabels[city]}
            </p>,
            noteAnchor,
          )
        : null}
    </div>
  );
}

function PlaceholderWord({ word }: { word: string }) {
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
    <>
      {outgoing ? (
        <span className="nav-search-word is-muted is-out">{outgoing}</span>
      ) : null}
      <span
        className={
          outgoing ? "nav-search-word is-muted is-in" : "nav-search-word is-muted"
        }
      >
        {word}
      </span>
    </>
  );
}

function MobileHitList({
  id,
  anchor,
  hits,
  active,
  onHover,
  onPick,
}: {
  id: string;
  anchor: HTMLElement | null;
  hits: readonly SearchHit[];
  active: number;
  onHover: (index: number) => void;
  onPick: (hit: SearchHit) => void;
}) {
  const [box, setBox] = useState<{ top: number; left: number; width: number }>();
  const listRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (!anchor) return;

    function place() {
      const rect = anchor!.getBoundingClientRect();
      const left = Math.max(8, rect.left);
      const width = Math.min(rect.width, window.innerWidth - left - 8);
      setBox({ top: rect.bottom + 8, left, width });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, hits.length]);

  useEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>("[data-active='true']");
    item?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!box || typeof document === "undefined") return null;

  return createPortal(
    <ul
      ref={listRef}
      id={id}
      role="listbox"
      aria-label="Search suggestions"
      style={{ top: box.top, left: box.left, width: box.width }}
      className="fixed z-[70] max-h-64 overflow-y-auto rounded-2xl bg-background p-1.5 text-sm text-foreground shadow-lg ring-1 ring-foreground/10"
    >
      {hits.length === 0 ? (
        <li className="px-2.5 py-1.5 text-muted-foreground">No matches</li>
      ) : (
        hits.map((hit, index) => {
          const label = hitLabel(hit);
          return (
            <li key={hitKey(hit)} role="presentation">
              <button
                id={`${id}-${hitKey(hit)}`}
                type="button"
                role="option"
                aria-selected={index === active}
                data-active={index === active}
                className={cn(
                  "block w-full rounded-xl px-2.5 py-1.5 text-left",
                  index === active && "bg-muted",
                )}
                onMouseEnter={() => onHover(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onPick(hit)}
              >
                {label}
              </button>
            </li>
          );
        })
      )}
    </ul>,
    document.body,
  );
}

function InlineSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string | null) => void;
}) {
  const current = options.find((option) => option.value === value)?.label;

  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span
        aria-hidden
        className="inline-flex items-center gap-1 font-medium text-foreground"
      >
        <ChevronDown className="size-3.5" />
        {current}
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
