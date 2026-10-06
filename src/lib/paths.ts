import type { CityFilter } from "@/lib/labels";
import type { eventCategories, musicGenres } from "@/lib/validations";

export function creativePath(slug: string) {
  return `/creatives/${slug}`;
}

export function eventPath(slug: string) {
  return `/events/${slug}`;
}

export function eventsBrowsePath(options: {
  city?: CityFilter | null;
  category?: (typeof eventCategories)[number] | null;
  genre?: (typeof musicGenres)[number] | null;
}) {
  const params = new URLSearchParams();

  if (options.city === "all") {
    params.set("city", "all");
  } else if (options.city) {
    params.set("city", options.city);
  }

  if (options.category) {
    params.set("category", options.category);
  }

  if (options.category === "music" && options.genre) {
    params.set("genre", options.genre);
  }

  const query = params.toString();
  return query ? `/events?${query}` : "/events";
}
