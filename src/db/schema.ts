import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { CreativeSocial } from "@/lib/creative-socials";

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const moderationSubjectEnum = pgEnum("moderation_subject", [
  "event",
  "creative",
]);

export const moderationActionEnum = pgEnum("moderation_action", [
  "submitted",
  "published",
  "approved",
  "rejected",
  "returned_to_pending",
  "edited",
  "deleted",
]);

export type ModerationActivityMetadata = {
  fromStatus?: "pending" | "approved" | "rejected";
  toStatus?: "pending" | "approved" | "rejected";
  note?: string | null;
};

export const disciplineEnum = pgEnum("discipline", [
  "music",
  "visual_art",
  "photography",
  "fashion",
  "performance",
  "film",
  "writing",
  "design",
  "tattoo",
  "community",
]);

export const creativeRoleEnum = pgEnum("creative_role", [
  "dj",
  "musician",
  "producer",
  "stylist",
  "makeup",
  "model",
  "dancer",
  "actor",
  "poet",
  "writer",
  "creative_director",
  "organiser",
  "host",
  "designer",
  "filmmaker",
  "photographer",
  "tattoo_artist",
]);

export const eventCategoryEnum = pgEnum("event_category", [
  "music",
  "art",
  "theatre",
  "dance",
  "queer",
  "fashion",
  "community",
  "activism",
]);

export const musicGenreEnum = pgEnum("music_genre", [
  "afro",
  "electronic",
  "hip_hop",
  "indie",
  "jazz",
]);

export const cityEnum = pgEnum("city", ["meanjin", "naarm"]);

export const staffRoleEnum = pgEnum("staff_role", ["owner", "admin"]);

export const lineupRoleEnum = pgEnum("lineup_role", [
  "performer",
  "dj",
  "host",
  "organiser",
  "visual_artist",
  "collaborator",
  "other",
]);

export const overflowFeatureRoleEnum = pgEnum("overflow_feature_role", [
  "artist",
  "interviewee",
]);

/** How (if at all) a creative’s public contact email is shown. */
export const publicEmailModeEnum = pgEnum("public_email_mode", [
  "hidden",
  "account",
  "custom",
]);

/** One public creative profile per Neon Auth account (unique userId). */
export const creatives = pgTable(
  "creatives",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Neon Auth user id. Required for account-owned profiles. */
    userId: text("user_id"),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    disciplines: disciplineEnum("disciplines").array().notNull().default([]),
    roles: creativeRoleEnum("roles").array().notNull().default([]),
    specialty: text("specialty"),
    isQueer: boolean("is_queer").notNull().default(false),
    city: cityEnum("city"),
    pronouns: text("pronouns"),
    bio: text("bio"),
    /**
     * Profile social accounts (one URL per provider). Shown as SVG icons.
     * Legacy instagramHandle / portfolioUrl stay in sync for older reads.
     */
    socials: jsonb("socials")
      .$type<CreativeSocial[]>()
      .notNull()
      .default([]),
    /** @deprecated Prefer socials[instagram]. Kept synced on save. */
    instagramHandle: text("instagram_handle"),
    /** @deprecated Prefer socials[website]. Kept synced on save. */
    portfolioUrl: text("portfolio_url"),
    /**
     * Public contact email visibility. `account` shows the login email;
     * `custom` shows `publicEmail`. Never confuse with inviteEmail.
     */
    publicEmailMode: publicEmailModeEnum("public_email_mode")
      .notNull()
      .default("hidden"),
    /** Used when publicEmailMode is `custom`. Not the login or invite email. */
    publicEmail: text("public_email"),
    /** YouTube / Vimeo links for featured videos (at most 3). */
    videoUrls: text("video_urls").array().notNull().default([]),
    /**
     * Listen links: Spotify, Apple Music, SoundCloud, or Bandcamp
     * (at most 3). Featured media — not social account icons.
     */
    audioUrls: text("audio_urls").array().notNull().default([]),
    avatarKey: text("avatar_key"),
    /** Ordered work-example object keys. At most 6. Empty on listing queries' rendered output. */
    workPhotoKeys: text("work_photo_keys").array().notNull().default([]),
    openToPaidWork: boolean("open_to_paid_work").notNull().default(false),
    openToTrade: boolean("open_to_trade").notNull().default(false),
    buildingPortfolio: boolean("building_portfolio").notNull().default(false),
    status: submissionStatusEnum("status").notNull().default("pending"),
    /** Private review note. Visible to admins and the profile owner only. */
    moderationNote: text("moderation_note"),
    /**
     * Email that can claim this profile by signing up or signing in.
     * Cleared once userId is set. Never shown on public pages.
     */
    inviteEmail: text("invite_email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("creatives_user_id_unique").on(table.userId),
    uniqueIndex("creatives_invite_email_unique").on(table.inviteEmail),
  ]
);

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Neon Auth user id of the account that submitted the event. */
  submittedByUserId: text("submitted_by_user_id"),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  dateTime: timestamp("date_time", { withTimezone: true }).notNull(),
  city: cityEnum("city").notNull().default("meanjin"),
  location: text("location").notNull(),
  categories: eventCategoryEnum("categories").array().notNull(),
  musicGenres: musicGenreEnum("music_genres").array().notNull().default([]),
  description: text("description"),
  ticketLink: text("ticket_link"),
  flyerKey: text("flyer_key"),
  status: submissionStatusEnum("status").notNull().default("pending"),
  /** Private review note. Visible to admins and the event's organisers only. */
  moderationNote: text("moderation_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Append-only moderation history for events and creatives.
 * No FK on subjectId so rows survive deletes.
 */
export const moderationActivity = pgTable(
  "moderation_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectType: moderationSubjectEnum("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    action: moderationActionEnum("action").notNull(),
    actorUserId: text("actor_user_id"),
    actorEmail: text("actor_email"),
    metadata: jsonb("metadata")
      .$type<ModerationActivityMetadata>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("moderation_activity_subject_created_idx").on(
      table.subjectType,
      table.subjectId,
      table.createdAt
    ),
  ]
);

/**
 * Site staff. Owners manage who is an admin. Admins moderate submissions only.
 */
export const admins = pgTable("admins", {
  email: text("email").primaryKey(),
  role: staffRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdByEmail: text("created_by_email"),
});

/** Per-account directory visibility. Missing row means public. */
export const accountSettings = pgTable("account_settings", {
  userId: text("user_id").primaryKey(),
  isPublic: boolean("is_public").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const eventLineup = pgTable(
  "event_lineup",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    creativeId: uuid("creative_id")
      .notNull()
      .references(() => creatives.id, { onDelete: "cascade" }),
    role: lineupRoleEnum("role").notNull().default("performer"),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.creativeId] })]
);

/**
 * An Overflow episode: an interview with a night, plus the people in it.
 * The cover is a flyer-sized photo (`flyers/…webp`).
 */
export const overflowEpisodes = pgTable("overflow_episodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: integer("number").notNull().unique(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  city: cityEnum("city").notNull(),
  coverKey: text("cover_key").notNull(),
  body: text("body").notNull(),
  /** Instagram reel. Empty when the episode has not been posted yet. */
  link: text("link"),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** One creative per episode. They are either a featured artist or the interviewee. */
export const overflowFeatures = pgTable(
  "overflow_features",
  {
    episodeId: uuid("episode_id")
      .notNull()
      .references(() => overflowEpisodes.id, { onDelete: "cascade" }),
    creativeId: uuid("creative_id")
      .notNull()
      .references(() => creatives.id, { onDelete: "cascade" }),
    role: overflowFeatureRoleEnum("role").notNull(),
    note: text("note"),
    sort: integer("sort").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.episodeId, table.creativeId] })]
);

export const creativesRelations = relations(creatives, ({ many }) => ({
  lineup: many(eventLineup),
  overflowFeatures: many(overflowFeatures),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  lineup: many(eventLineup),
  overflowEpisodes: many(overflowEpisodes),
}));

export const eventLineupRelations = relations(eventLineup, ({ one }) => ({
  event: one(events, {
    fields: [eventLineup.eventId],
    references: [events.id],
  }),
  creative: one(creatives, {
    fields: [eventLineup.creativeId],
    references: [creatives.id],
  }),
}));

export const overflowEpisodesRelations = relations(
  overflowEpisodes,
  ({ one, many }) => ({
    features: many(overflowFeatures),
    event: one(events, {
      fields: [overflowEpisodes.eventId],
      references: [events.id],
    }),
  })
);

export const overflowFeaturesRelations = relations(
  overflowFeatures,
  ({ one }) => ({
    episode: one(overflowEpisodes, {
      fields: [overflowFeatures.episodeId],
      references: [overflowEpisodes.id],
    }),
    creative: one(creatives, {
      fields: [overflowFeatures.creativeId],
      references: [creatives.id],
    }),
  })
);

export type Creative = typeof creatives.$inferSelect;
export type NewCreative = typeof creatives.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventLineup = typeof eventLineup.$inferSelect;
export type NewEventLineup = typeof eventLineup.$inferInsert;
export type ModerationActivity = typeof moderationActivity.$inferSelect;
export type NewModerationActivity = typeof moderationActivity.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type AccountSettings = typeof accountSettings.$inferSelect;
export type OverflowEpisode = typeof overflowEpisodes.$inferSelect;
export type NewOverflowEpisode = typeof overflowEpisodes.$inferInsert;
export type OverflowFeature = typeof overflowFeatures.$inferSelect;
export type NewOverflowFeature = typeof overflowFeatures.$inferInsert;
