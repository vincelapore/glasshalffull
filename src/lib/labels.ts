import {
  craftCategories,
  eventCategories,
  submissionStatuses,
} from "@/lib/validations";

export const craftCategoryLabels: Record<(typeof craftCategories)[number], string> =
  {
    music: "Music",
    art: "Art",
    queer: "Queer",
    fashion: "Fashion",
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
