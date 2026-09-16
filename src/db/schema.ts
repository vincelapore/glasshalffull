import { relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
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
  "dance",
  "film",
  "design",
  "queer",
  "other",
]);

export const eventCategoryEnum = pgEnum("event_category", [
  "music",
  "art",
  "queer",
  "fashion",
  "community",
  "other",
]);

export const lineupRoleEnum = pgEnum("lineup_role", [
  "performer",
  "dj",
  "host",
  "organizer",
  "visual_artist",
  "collaborator",
  "other",
]);

export const creatives = pgTable("creatives", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  craftCategories: craftCategoryEnum("craft_categories")
    .array()
    .notNull(),
  bio: text("bio"),
  instagramUrl: text("instagram_url"),
  portfolioUrl: text("portfolio_url"),
  avatarKey: text("avatar_key"),
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
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  dateTime: timestamp("date_time", { withTimezone: true }).notNull(),
  location: text("location").notNull(),
  category: eventCategoryEnum("category").notNull(),
  description: text("description"),
  ticketLink: text("ticket_link"),
  flyerKey: text("flyer_key"),
  status: submissionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
