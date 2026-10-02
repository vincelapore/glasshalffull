import type { Creative, EventLineup } from "@/db/schema";
import {
  craftCategories,
  eventCategories,
  submissionStatuses,
  workOpportunityTags,
} from "@/lib/validations";

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
    queer: "Queer",
    fashion: "Fashion",
    community: "Community",
    other: "Other",
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
