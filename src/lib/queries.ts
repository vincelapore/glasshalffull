import { and, asc, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { creatives, eventLineup, events } from "@/db/schema";
import { getSessionUser, isAdminEmail } from "@/lib/admin";
import { isUuid } from "@/lib/slug";
import type { submissionStatuses } from "@/lib/validations";

type Status = (typeof submissionStatuses)[number];

export async function getApprovedEvents(limit?: number) {
  const query = db
    .select()
    .from(events)
    .where(eq(events.status, "approved"))
    .orderBy(asc(events.dateTime));

  if (limit) {
    return query.limit(limit);
  }

  return query;
}

export async function getUpcomingApprovedEvents(limit = 6) {
  return db
    .select()
    .from(events)
    .where(and(eq(events.status, "approved"), gte(events.dateTime, new Date())))
    .orderBy(asc(events.dateTime))
    .limit(limit);
}

/** Directory cards. Work-photo keys stay off this query so listings don't pull them. */
const creativeCardColumns = {
  id: creatives.id,
  slug: creatives.slug,
  name: creatives.name,
  craftCategories: creatives.craftCategories,
  city: creatives.city,
  bio: creatives.bio,
  instagramHandle: creatives.instagramHandle,
  portfolioUrl: creatives.portfolioUrl,
  avatarKey: creatives.avatarKey,
  openToPaidWork: creatives.openToPaidWork,
  openToTrade: creatives.openToTrade,
  buildingPortfolio: creatives.buildingPortfolio,
  status: creatives.status,
};

export async function getApprovedCreatives(limit?: number) {
  const query = db
    .select(creativeCardColumns)
    .from(creatives)
    .where(eq(creatives.status, "approved"))
    .orderBy(asc(creatives.name));

  if (limit) {
    return query.limit(limit);
  }

  return query;
}

export async function getEventById(id: string) {
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return event ?? null;
}

export async function getCreativeById(id: string) {
  const [creative] = await db
    .select()
    .from(creatives)
    .where(eq(creatives.id, id))
    .limit(1);
  return creative ?? null;
}

export async function getEventBySlug(slug: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);
  return event ?? null;
}

export async function getCreativeBySlug(slug: string) {
  const [creative] = await db
    .select()
    .from(creatives)
    .where(eq(creatives.slug, slug))
    .limit(1);
  return creative ?? null;
}

export async function getEventByParam(param: string) {
  return (
    (await getEventBySlug(param)) ??
    (isUuid(param) ? await getEventById(param) : null)
  );
}

export async function getCreativeByParam(param: string) {
  return (
    (await getCreativeBySlug(param)) ??
    (isUuid(param) ? await getCreativeById(param) : null)
  );
}

export async function getEventLineup(eventId: string) {
  return db
    .select({
      role: eventLineup.role,
      creative: creatives,
    })
    .from(eventLineup)
    .innerJoin(creatives, eq(eventLineup.creativeId, creatives.id))
    .where(eq(eventLineup.eventId, eventId))
    .orderBy(asc(creatives.name));
}

export async function getCreativeUpcomingEvents(creativeId: string) {
  return db
    .select({
      role: eventLineup.role,
      event: events,
    })
    .from(eventLineup)
    .innerJoin(events, eq(eventLineup.eventId, events.id))
    .where(
      and(
        eq(eventLineup.creativeId, creativeId),
        eq(events.status, "approved"),
        gte(events.dateTime, new Date())
      )
    )
    .orderBy(asc(events.dateTime));
}

export async function getCreativeByUserId(userId: string) {
  const [creative] = await db
    .select()
    .from(creatives)
    .where(eq(creatives.userId, userId))
    .limit(1);
  return creative ?? null;
}

export async function getEventsByUserId(userId: string) {
  return db
    .select()
    .from(events)
    .where(eq(events.submittedByUserId, userId))
    .orderBy(desc(events.createdAt));
}

export async function getEventOrganisers(eventId: string) {
  return db
    .select({
      role: eventLineup.role,
      creative: creatives,
    })
    .from(eventLineup)
    .innerJoin(creatives, eq(eventLineup.creativeId, creatives.id))
    .where(
      and(eq(eventLineup.eventId, eventId), eq(eventLineup.role, "organizer"))
    )
    .orderBy(asc(creatives.name));
}

export async function canViewEventModerationNote(event: {
  id: string;
  submittedByUserId: string | null;
}) {
  const user = await getSessionUser();
  if (!user) return false;
  if (await isAdminEmail(user.email)) return true;
  if (event.submittedByUserId && event.submittedByUserId === user.id) {
    return true;
  }

  const organisers = await getEventOrganisers(event.id);
  return organisers.some((row) => row.creative.userId === user.id);
}

export async function getSubmissions(options?: {
  status?: Status | "all";
  type?: "events" | "creatives" | "all";
}) {
  const status = options?.status ?? "pending";
  const type = options?.type ?? "all";

  const eventRows =
    type === "creatives"
      ? []
      : status === "all"
        ? await db.select().from(events).orderBy(desc(events.createdAt))
        : await db
            .select()
            .from(events)
            .where(eq(events.status, status))
            .orderBy(desc(events.createdAt));

  const creativeRows =
    type === "events"
      ? []
      : status === "all"
        ? await db.select().from(creatives).orderBy(desc(creatives.createdAt))
        : await db
            .select()
            .from(creatives)
            .where(eq(creatives.status, status))
            .orderBy(desc(creatives.createdAt));

  const eventsWithOrganisers = await Promise.all(
    eventRows.map(async (event) => ({
      event,
      organisers: (await getEventOrganisers(event.id)).map((row) => row.creative),
    }))
  );

  return {
    events: eventsWithOrganisers,
    creatives: creativeRows,
  };
}
