"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AccordionReveal } from "@/components/accordion-reveal";
import {
  eventCategoryLabels,
  musicGenreLabels,
  type CityFilter,
} from "@/lib/labels";
import { eventsBrowsePath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import {
  eventCategories,
  musicGenres,
} from "@/lib/validations";

type EventCategory = (typeof eventCategories)[number];
type MusicGenre = (typeof musicGenres)[number];

const chipClass = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors",
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border text-muted-foreground hover:text-foreground"
  );

export function EventCategoryFilters({
  activeCity,
  activeCategory,
  activeGenre,
}: {
  activeCity: CityFilter;
  activeCategory: EventCategory | null;
  activeGenre: MusicGenre | null;
}) {
  const musicActive = activeCategory === "music";
  const [musicOpen, setMusicOpen] = useState(musicActive);

  useEffect(() => {
    setMusicOpen(musicActive);
  }, [musicActive]);

  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Category
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={eventsBrowsePath({ city: activeCity, category: null })}
          className={chipClass(!activeCategory)}
        >
          All
        </Link>
        {eventCategories.map((cat) => {
          if (cat === "music") {
            return (
              <Link
                key={cat}
                href={eventsBrowsePath({
                  city: activeCity,
                  category: "music",
                })}
                aria-expanded={musicOpen}
                aria-controls="music-genre-filters"
                onClick={() => setMusicOpen(true)}
                className={chipClass(musicActive)}
              >
                {eventCategoryLabels.music}
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none",
                    musicOpen && "rotate-180"
                  )}
                />
              </Link>
            );
          }

          return (
            <Link
              key={cat}
              href={eventsBrowsePath({ city: activeCity, category: cat })}
              className={chipClass(activeCategory === cat)}
            >
              {eventCategoryLabels[cat]}
            </Link>
          );
        })}
      </div>
      <AccordionReveal open={musicOpen} id="music-genre-filters">
        <div className="flex flex-wrap gap-2 pt-2">
          {musicGenres.map((genre) => (
            <Link
              key={genre}
              href={eventsBrowsePath({
                city: activeCity,
                category: "music",
                genre,
              })}
              className={chipClass(activeGenre === genre)}
            >
              {musicGenreLabels[genre]}
            </Link>
          ))}
        </div>
      </AccordionReveal>
    </div>
  );
}
