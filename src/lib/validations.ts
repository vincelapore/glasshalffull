import { z } from "zod";

export const craftCategories = [
  "music",
  "art",
  "queer",
  "fashion",
  "other",
] as const;

export const eventCategories = [
  "music",
  "art",
  "queer",
  "fashion",
  "community",
  "other",
] as const;

export const submissionStatuses = ["pending", "approved", "rejected"] as const;

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url("Enter a valid URL"),
]);

export const creativeSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  craftCategory: z.enum(craftCategories, {
    errorMap: () => ({ message: "Pick a craft category" }),
  }),
  bio: z.union([z.literal(""), z.string().trim().max(2000)]),
  instagramUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  avatarUrl: optionalUrl,
});

export const eventSubmissionSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  dateTime: z
    .string()
    .min(1, "Date and time are required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Enter a valid date and time",
    }),
  location: z.string().trim().min(2, "Location is required").max(200),
  category: z.enum(eventCategories, {
    errorMap: () => ({ message: "Pick an event category" }),
  }),
  description: z.union([z.literal(""), z.string().trim().max(4000)]),
  ticketLink: optionalUrl,
  flyerUrl: optionalUrl,
});

export type CreativeSubmissionInput = z.infer<typeof creativeSubmissionSchema>;
export type EventSubmissionInput = z.infer<typeof eventSubmissionSchema>;
