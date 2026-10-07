"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { AccordionReveal } from "@/components/accordion-reveal";
import { FilterChip } from "@/components/ui/filter-chip";
import { ChipRow, Section } from "@/components/ui/page";
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
    <Section label="Category" className="mb-8">
      <ChipRow>
        <FilterChip
          href={eventsBrowsePath({ city: activeCity, category: null })}
          active={!activeCategory}
        >
          All
        </FilterChip>
        {eventCategories.map((cat) => {
          if (cat === "music") {
            return (
              <FilterChip
                key={cat}
                href={eventsBrowsePath({
                  city: activeCity,
                  category: "music",
                })}
                aria-expanded={musicOpen}
                aria-controls="music-genre-filters"
                onClick={() => setMusicOpen(true)}
                active={musicActive}
              >
                {eventCategoryLabels.music}
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none",
                    musicOpen && "rotate-180"
                  )}
                />
              </FilterChip>
            );
          }

          return (
            <FilterChip
              key={cat}
              href={eventsBrowsePath({ city: activeCity, category: cat })}
              active={activeCategory === cat}
            >
              {eventCategoryLabels[cat]}
            </FilterChip>
          );
        })}
      </ChipRow>
      <AccordionReveal open={musicOpen} id="music-genre-filters">
        <ChipRow className="pt-2">
          {musicGenres.map((genre) => (
            <FilterChip
              key={genre}
              href={eventsBrowsePath({
                city: activeCity,
                category: "music",
                genre,
              })}
              active={activeGenre === genre}
            >
              {musicGenreLabels[genre]}
            </FilterChip>
          ))}
        </ChipRow>
      </AccordionReveal>
    </Section>
  );
}
