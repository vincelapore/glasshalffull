import { relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const craftCategoryEnum = pgEnum("craft_category", [
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
  "design",
  "queer",
  "other",
]);

export const eventCategoryEnum = pgEnum("event_category", [
  "music",
  "art",
  "theatre",
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
  "organizer",
  "visual_artist",
  "collaborator",
  "other",
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
    craftCategories: craftCategoryEnum("craft_categories")
      .array()
      .notNull(),
    city: cityEnum("city"),
    bio: text("bio"),
    instagramHandle: text("instagram_handle"),
    portfolioUrl: text("portfolio_url"),
    avatarKey: text("avatar_key"),
    /** Ordered work-example object keys. At most 6. Empty on listing queries' rendered output. */
    workPhotoKeys: text("work_photo_keys").array().notNull().default([]),
    openToPaidWork: boolean("open_to_paid_work").notNull().default(false),
    openToTrade: boolean("open_to_trade").notNull().default(false),
    buildingPortfolio: boolean("building_portfolio").notNull().default(false),
    status: submissionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("creatives_user_id_unique").on(table.userId)]
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

export const creativesRelations = relations(creatives, ({ many }) => ({
  lineup: many(eventLineup),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  lineup: many(eventLineup),
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

export type Creative = typeof creatives.$inferSelect;
export type NewCreative = typeof creatives.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventLineup = typeof eventLineup.$inferSelect;
export type NewEventLineup = typeof eventLineup.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
