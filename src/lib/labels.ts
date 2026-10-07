import type { Creative, Event, EventLineup } from "@/db/schema";
import {
  cities,
  DEFAULT_CITY,
  craftCategories,
  eventCategories,
  eventRejectionReasons,
  musicGenres,
  overflowFeatureRoles,
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

/** One-word pill on a directory card. `other` has no pill. */
export const craftTagLabels: Record<
  (typeof craftCategories)[number],
  string | null
> = {
  dj: "DJ",
  musician: "music",
  producer: "music",
  tattoo: "tattoo",
  visual_art: "art",
  photography: "photo",
  fashion: "fashion",
  makeup: "makeup",
  model: "model",
  dance: "dance",
  film: "film",
  design: "design",
  queer: "queer",
  other: null,
};

/** First craft that fits the card pill. */
export function primaryCraftTag(
  categories: readonly (typeof craftCategories)[number][] | null | undefined
) {
  for (const category of categories ?? []) {
    const tag = craftTagLabels[category];
    if (tag) return tag;
  }
  return null;
}

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

/** Place name on a card or in search. Filters keep the longer `cityLabels`. */
export const cityShortLabels: Record<(typeof cities)[number], string> = {
  meanjin: "Meanjin",
  naarm: "Naarm",
};

/** Role names on the admin form. */
export const overflowFeatureRoleLabels: Record<
  (typeof overflowFeatureRoles)[number],
  string
> = {
  organiser: "Organiser",
  wall: "On the wall",
  music: "Music",
};

/** Section headings in the episode popup, in display order. */
export const overflowFeatureGroups = [
  { role: "wall", label: "On the wall" },
  { role: "music", label: "In the room" },
  { role: "organiser", label: "With" },
] as const satisfies ReadonlyArray<{
  role: (typeof overflowFeatureRoles)[number];
  label: string;
}>;

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
  organiser: "Organiser",
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

const BRISBANE = "Australia/Brisbane";

const WEEKDAY_LABELS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function asDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : value;
}

function brisbaneParts(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
}

function brisbaneYmd(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRISBANE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 0 = Sunday … 6 = Saturday, in Brisbane. */
function brisbaneWeekdayIndex(date: Date) {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: BRISBANE,
    weekday: "short",
  })
    .format(date)
    .replace(".", "");
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(short);
  return index === -1 ? 0 : index;
}

function brisbaneDayDiff(event: Date, now: Date) {
  const [ey, em, ed] = brisbaneYmd(event).split("-").map(Number);
  const [ny, nm, nd] = brisbaneYmd(now).split("-").map(Number);
  return Math.round(
    (Date.UTC(ey, em - 1, ed) - Date.UTC(ny, nm - 1, nd)) / 86_400_000
  );
}

export function formatDateTime(value: Date | string) {
  const date = asDate(value);
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: BRISBANE,
  }).format(date);
}

/** Listing date, e.g. "Sat 7 Nov 3:00pm". */
export function formatEventListingDate(value: Date | string) {
  const parts = brisbaneParts(asDate(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = String(Number(get("hour")));
  const minute = get("minute");
  const period = get("dayPeriod").toLowerCase().replace(/[\s.]/g, "");
  return `${get("weekday")} ${get("day")} ${get("month")} ${hour}:${minute}${period}`;
}

/**
 * Short relative label for upcoming listings.
 * Tonight and tomorrow win over the weekday. Saturday and Sunday in the
 * current Monday–Sunday week read as "this weekend".
 */
export function eventRelativeLabel(value: Date | string, now: Date = new Date()) {
  const event = asDate(value);
  const diff = brisbaneDayDiff(event, now);
  if (diff < 0) return null;
  if (diff === 0) return "tonight";
  if (diff === 1) return "tomorrow";

  const eventWeekday = brisbaneWeekdayIndex(event);
  const todayWeekday = brisbaneWeekdayIndex(now);
  const daysLeftThisWeek = todayWeekday === 0 ? 0 : 7 - todayWeekday;
  const weekend = eventWeekday === 0 || eventWeekday === 6;

  if (diff <= daysLeftThisWeek) {
    return weekend ? "this weekend" : `this ${WEEKDAY_LABELS[eventWeekday]}`;
  }

  if (diff <= daysLeftThisWeek + 7) {
    return weekend ? "next weekend" : `next ${WEEKDAY_LABELS[eventWeekday]}`;
  }

  return null;
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
