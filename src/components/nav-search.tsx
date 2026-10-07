"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cityShortLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { cities, craftCategories } from "@/lib/validations";

const craftSearchLabels: Record<(typeof craftCategories)[number], string> = {
  dj: "DJ",
  musician: "musician",
  producer: "producer",
  tattoo: "tattoo artist",
  visual_art: "visual artist",
  photography: "photographer",
  fashion: "fashion designer",
  makeup: "makeup artist",
  model: "model",
  dance: "dancer",
  film: "filmmaker",
  design: "graphic designer",
  queer: "queer artist",
  other: "creative",
};

type Craft = (typeof craftCategories)[number];
type NavCity = (typeof cities)[number] | "all";

const citySearchLabels: Record<NavCity, string> = {
  ...cityShortLabels,
  all: "all cities",
};

const cityOptions: NavCity[] = [...cities, "all"];

function isCraft(value: string | null): value is Craft {
  return craftCategories.includes(value as Craft);
}

function isNavCity(value: string | null): value is NavCity {
  return value === "all" || cities.includes(value as (typeof cities)[number]);
}

function creativesHref(category: Craft, city: NavCity) {
  const params = new URLSearchParams({ category, city });
  return `/creatives?${params.toString()}`;
}

export function NavSearch({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const cityParam = searchParams.get("city");
  const category = isCraft(categoryParam) ? categoryParam : "design";
  const city = isNavCity(cityParam) ? cityParam : "meanjin";

  function go(nextCategory: Craft, nextCity: NavCity) {
    router.push(creativesHref(nextCategory, nextCity));
  }

  return (
    <div className={cn("nav-search", className)}>
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="shrink-0 text-muted-foreground">i&apos;m looking for a</span>
        <CraftInput
          value={category}
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
            if (isNavCity(value)) go(category, value);
          }}
        />
      </span>
    </div>
  );
}

export function NavSearchSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("nav-search", className)} aria-hidden>
      <span className="inline-flex items-center gap-1.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
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

function matchingCrafts(query: string, selected: Craft) {
  const selectedLabel = craftSearchLabels[selected];
  const normalized = query.trim().toLowerCase();
  if (!normalized || normalized === selectedLabel.toLowerCase()) {
    return [...craftCategories];
  }
  return craftCategories.filter((craft) =>
    craftSearchLabels[craft].toLowerCase().includes(normalized),
  );
}

function CraftInput({
  value,
  onPick,
}: {
  value: Craft;
  onPick: (craft: Craft) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLLabelElement>(null);
  const [query, setQuery] = useState(craftSearchLabels[value]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const suggestions = matchingCrafts(query, value);

  useEffect(() => {
    setQuery(craftSearchLabels[value]);
  }, [value]);

  function choose(craft: Craft) {
    setQuery(craftSearchLabels[craft]);
    setOpen(false);
    onPick(craft);
  }

  function onFocus() {
    setOpen(true);
    const index = suggestions.indexOf(value);
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
          aria-label="Craft"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && suggestions[active]
              ? `${listId}-${suggestions[active]}`
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
            setQuery(craftSearchLabels[value]);
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
              const craft = suggestions[active];
              if (craft) choose(craft);
            } else if (event.key === "Escape") {
              setOpen(false);
              setQuery(craftSearchLabels[value]);
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
          onPick={choose}
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
  suggestions: readonly Craft[];
  active: number;
  onHover: (index: number) => void;
  onPick: (craft: Craft) => void;
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
        suggestions.map((craft, index) => (
          <li key={craft} role="presentation">
            <button
              id={`${id}-${craft}`}
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
              onClick={() => onPick(craft)}
            >
              {craftSearchLabels[craft]}
            </button>
          </li>
        ))
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
