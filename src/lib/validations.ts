import { z } from "zod";

import { isAudioMediaUrl, isVideoMediaUrl } from "@/lib/creative-media";
import {
  avatarKeyPattern,
  flyerKeyPattern,
  MAX_WORK_PHOTOS,
  workKeyPattern,
} from "@/lib/media";
import { coerceWebsiteUrl } from "@/lib/urls";

export { coerceWebsiteUrl };

export const craftCategories = [
  "dj",
  "musician",
  "producer",
  "tattoo",
  "visual_art",
  "photography",
  "fashion",
  "makeup",
  "model",
  "dance",
  "film",
  "actor",
  "design",
  "queer",
  "organiser",
  "other",
] as const;

export const eventCategories = [
  "music",
  "art",
  "theatre",
  "dance",
  "queer",
  "fashion",
  "community",
  "activism",
] as const;

export const musicGenres = [
  "afro",
  "electronic",
  "hip_hop",
  "indie",
  "jazz",
] as const;

export const cities = ["meanjin", "naarm"] as const;

/**
 * Common pronoun sets (VA.gov / inclusive form guidance).
 * Multi-select + a free-text self-describe field covers the rest.
 */
export const pronounPresets = ["she/her", "he/him", "they/them"] as const;

/** Default city for browse filters (Brisbane / Meanjin). */
export const DEFAULT_CITY = "meanjin" as const;

export const submissionStatuses = ["pending", "approved", "rejected"] as const;

export const workOpportunityTags = ["paid_work", "trade", "portfolio"] as const;

export const eventRejectionReasons = [
  "location_unclear",
  "datetime_unclear",
  "details_mismatch",
  "duplicate",
  "doesnt_fit",
  "more_info",
] as const;

export const profileRejectionReasons = [
  "duplicate",
  "doesnt_fit",
  "more_info",
] as const satisfies readonly (typeof eventRejectionReasons)[number][];

const optionalUrl = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .refine(
      (value) => z.string().url().safeParse(coerceWebsiteUrl(value)).success,
      { message: "Enter a valid URL" }
    ),
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

const optionalVideoUrl = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .refine((value) => isVideoMediaUrl(value), {
      message: "Use a YouTube or Vimeo link",
    }),
]);

const optionalAudioUrl = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .refine((value) => isAudioMediaUrl(value), {
      message: "Use a SoundCloud or Bandcamp link",
    }),
]);

export const creativeSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  craftCategories: z
    .array(z.enum(craftCategories))
    .min(1, "Pick at least one category"),
  city: z.union([z.literal(""), z.enum(cities)]),
  pronouns: z.union([z.literal(""), z.string().trim().max(80)]),
  bio: z.union([z.literal(""), z.string().trim().max(2000)]),
  instagramHandle: optionalInstagramHandle,
  portfolioUrl: optionalUrl,
  videoUrl: optionalVideoUrl,
  audioUrl: optionalAudioUrl,
  avatarKey: z.union([
    z.literal(""),
    z.string().regex(avatarKeyPattern, "Upload a valid photo"),
  ]),
  workPhotoKeys: z
    .array(z.string().regex(workKeyPattern, "Upload a valid photo"))
    .max(MAX_WORK_PHOTOS, "You can add up to 6 photos"),
  openToPaidWork: z.boolean(),
  openToTrade: z.boolean(),
  buildingPortfolio: z.boolean(),
});

export const eventSubmissionSchema = z.object({
  title: z.string().trim().min(2, "Name is required").max(160),
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
  musicGenres: z.array(z.enum(musicGenres)),
  description: z.union([z.literal(""), z.string().trim().max(4000)]),
  ticketLink: optionalUrl,
  flyerKey: z
    .string()
    .trim()
    .min(1, "Upload a flyer")
    .regex(flyerKeyPattern, "Upload a valid flyer"),
});

export const eventRejectionSchema = z
  .object({
    reasons: z.array(z.enum(eventRejectionReasons)),
    extra: z.union([z.literal(""), z.string().trim().max(500)]),
  })
  .refine(
    (data) => data.reasons.length > 0 || data.extra.trim().length > 0,
    { message: "Pick a reason or add a note." }
  );

export const optionalInviteEmailSchema = z
  .string()
  .trim()
  .max(200)
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    { message: "Enter a valid email" }
  )
  .transform((value) => value.toLowerCase());

export const organiserStubSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
});

export const overflowFeatureRoles = ["artist", "interviewee"] as const;

const overflowFeatureSchema = z.object({
  creativeId: z.string().uuid(),
  role: z.enum(overflowFeatureRoles),
  note: z.string().trim().max(400),
});

export const overflowEpisodeSchema = z.object({
  title: z.string().trim().min(2, "Name is required").max(80),
  number: z
    .number({ invalid_type_error: "Enter an episode number" })
    .int()
    .min(1, "Enter an episode number")
    .max(999),
  city: z.enum(cities, {
    errorMap: () => ({ message: "Pick a city" }),
  }),
  coverKey: z
    .string()
    .trim()
    .min(1, "Upload a poster")
    .regex(flyerKeyPattern, "Upload a valid poster"),
  body: z.string().trim().min(1, "Write a short recap").max(4000),
  link: optionalUrl,
  eventId: z.union([z.literal(""), z.string().uuid()]),
  features: z
    .array(overflowFeatureSchema)
    .max(12)
    .superRefine((features, ctx) => {
      const seen = new Set<string>();
      features.forEach((feature, index) => {
        if (seen.has(feature.creativeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Each person can only be added once.",
            path: [index, "creativeId"],
          });
        }
        seen.add(feature.creativeId);
      });
    }),
});

export type CreativeSubmissionInput = z.infer<typeof creativeSubmissionSchema>;
export type EventSubmissionInput = z.infer<typeof eventSubmissionSchema>;
export type EventRejectionInput = z.infer<typeof eventRejectionSchema>;
export type OverflowEpisodeInput = z.infer<typeof overflowEpisodeSchema>;
