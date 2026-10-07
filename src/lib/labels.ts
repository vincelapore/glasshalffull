import type { Creative, Event, EventLineup } from "@/db/schema";
import {
  cities,
  DEFAULT_CITY,
  craftCategories,
  eventCategories,
  eventRejectionReasons,
  musicGenres,
  submissionStatuses,
  workOpportunityTags,
} from "@/lib/validations";

export type CityFilter = (typeof cities)[number] | "all";

/** Parse `?city=` for browse pages. Missing/invalid → Meanjin; `all` → every city. */
export function parseCityFilter(city?: string | null): CityFilter {
  if (city === "all") return "all";
  if (city && cities.includes(city as (typeof cities)[number])) {
    return city as (typeof cities)[number];
  }
  return DEFAULT_CITY;
}

export const craftCategoryLabels: Record<(typeof craftCategories)[number], string> =
  {
    dj: "DJ",
    musician: "Musician",
    producer: "Producer",
    tattoo: "Tattoo",
    visual_art: "Visual art",
    photography: "Photography",
    fashion: "Fashion",
    makeup: "Makeup",
    model: "Model",
    dance: "Dance",
    film: "Film & video",
    design: "Design",
    queer: "Queer",
    other: "Other",
  };

export const eventCategoryLabels: Record<(typeof eventCategories)[number], string> =
  {
    music: "Music",
    art: "Art",
    theatre: "Theatre",
    dance: "Dance",
    queer: "Queer",
    fashion: "Fashion",
    community: "Community",
    activism: "Activism/Advocacy",
  };

export const musicGenreLabels: Record<(typeof musicGenres)[number], string> = {
  afro: "Afro",
  electronic: "Electronic",
  hip_hop: "Hip hop",
  indie: "Indie",
  jazz: "Jazz",
};

export function parseMusicGenre(genre?: string | null) {
  if (genre && musicGenres.includes(genre as (typeof musicGenres)[number])) {
    return genre as (typeof musicGenres)[number];
  }
  return null;
}

export function eventDisplayTags(
  event: Pick<Event, "categories" | "musicGenres">
) {
  const tags: string[] = [];
  const genres = event.musicGenres ?? [];

  for (const category of event.categories ?? []) {
    if (category === "music") {
      if (genres.length > 0) {
        tags.push(...genres.map((genre) => musicGenreLabels[genre]));
      } else {
        tags.push(eventCategoryLabels.music);
      }
      continue;
    }

    tags.push(eventCategoryLabels[category]);
  }

  return tags;
}

export const cityLabels: Record<(typeof cities)[number], string> = {
  meanjin: "Brisbane / Meanjin",
  naarm: "Melbourne / Naarm",
};

export const statusLabels: Record<(typeof submissionStatuses)[number], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const workOpportunityTagLabels: Record<
  (typeof workOpportunityTags)[number],
  string
> = {
  paid_work: "Paid work",
  trade: "Open to trade",
  portfolio: "Building portfolio",
};

export const lineupRoleLabels: Record<EventLineup["role"], string> = {
  performer: "Performer",
  dj: "DJ",
  host: "Host",
  organizer: "Organiser",
  visual_artist: "Visual artist",
  collaborator: "Collaborator",
  other: "Other",
};

export const eventRejectionReasonLabels: Record<
  (typeof eventRejectionReasons)[number],
  string
> = {
  location_unclear: "Location unclear",
  datetime_unclear: "Date / time missing or wrong",
  details_mismatch: "Flyer or details don’t match",
  duplicate: "Duplicate / already listed",
  doesnt_fit: "Doesn’t fit the directory",
  more_info: "More info needed",
};

export function composeModerationNote(
  reasons: (typeof eventRejectionReasons)[number][],
  extra?: string | null
) {
  const ticks = reasons
    .map((reason) => eventRejectionReasonLabels[reason])
    .filter(Boolean);
  const more = extra?.trim() ?? "";

  if (ticks.length > 0 && more) {
    return `${ticks.join(". ")}.\n\n${more}`;
  }
  if (ticks.length > 0) {
    return `${ticks.join(". ")}.`;
  }
  return more || null;
}

export function getCreativeWorkTags(
  creative: Pick<
    Creative,
    "openToPaidWork" | "openToTrade" | "buildingPortfolio"
  >
) {
  const tags: (typeof workOpportunityTags)[number][] = [];

  if (creative.openToPaidWork) tags.push("paid_work");
  if (creative.openToTrade) tags.push("trade");
  if (creative.buildingPortfolio) tags.push("portfolio");

  return tags;
}

export function creativeMatchesWorkTag(
  creative: Pick<
    Creative,
    "openToPaidWork" | "openToTrade" | "buildingPortfolio"
  >,
  tag: (typeof workOpportunityTags)[number]
) {
  if (tag === "paid_work") return creative.openToPaidWork;
  if (tag === "trade") return creative.openToTrade;
  return creative.buildingPortfolio;
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Brisbane",
  }).format(date);
}

/** Format a Date for `<input type="datetime-local" />` in Brisbane time. */
export function toDateTimeLocalValue(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function emptyToNull(value?: string | null) {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export function normalizeInstagramHandle(value?: string | null) {
  const trimmed = emptyToNull(value);
  if (!trimmed) return null;
  return trimmed.replace(/^@+/, "");
}

export function formatInstagramHandle(handle: string) {
  return handle.startsWith("@") ? handle : `@${handle}`;
}

export function instagramProfileHref(handle: string) {
  return `https://instagram.com/${normalizeInstagramHandle(handle) ?? handle}`;
}
