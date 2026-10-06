import { z } from "zod";

import { avatarKeyPattern, flyerKeyPattern } from "@/lib/media";

export const craftCategories = [
  "dj",
  "musician",
  "producer",
  "tattoo",
  "visual_art",
  "photography",
  "fashion",
  "makeup",
  "dance",
  "film",
  "design",
  "queer",
  "other",
] as const;

export const eventCategories = [
  "music",
  "art",
  "theatre",
  "queer",
  "fashion",
  "community",
  "other",
] as const;

export const cities = ["meanjin", "naarm"] as const;

export const submissionStatuses = ["pending", "approved", "rejected"] as const;

export const workOpportunityTags = ["paid_work", "trade", "portfolio"] as const;

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url("Enter a valid URL"),
]);

const optionalInstagramHandle = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .regex(
      /^@?[A-Za-z0-9._]{1,30}$/,
      "Enter a valid Instagram handle"
    ),
]);

export const creativeSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  craftCategories: z
    .array(z.enum(craftCategories))
    .min(1, "Pick at least one craft category"),
  city: z.union([z.literal(""), z.enum(cities)]),
  bio: z.union([z.literal(""), z.string().trim().max(2000)]),
  instagramHandle: optionalInstagramHandle,
  portfolioUrl: optionalUrl,
  avatarKey: z.union([
    z.literal(""),
    z.string().regex(avatarKeyPattern, "Upload a valid photo"),
  ]),
  openToPaidWork: z.boolean(),
  openToTrade: z.boolean(),
  buildingPortfolio: z.boolean(),
});

export const eventSubmissionSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  dateTime: z
    .string()
    .min(1, "Date and time are required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Enter a valid date and time",
    }),
  city: z.enum(cities, {
    errorMap: () => ({ message: "Pick a city" }),
  }),
  location: z.string().trim().min(2, "Location is required").max(200),
  categories: z
    .array(z.enum(eventCategories))
    .min(1, "Pick at least one event category"),
  description: z.union([z.literal(""), z.string().trim().max(4000)]),
  ticketLink: optionalUrl,
  flyerKey: z.union([
    z.literal(""),
    z.string().regex(flyerKeyPattern, "Upload a valid flyer"),
  ]),
});

export type CreativeSubmissionInput = z.infer<typeof creativeSubmissionSchema>;
export type EventSubmissionInput = z.infer<typeof eventSubmissionSchema>;
