import { and, asc, desc, eq, getTableColumns, gte, ilike, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { creatives, eventLineup, events } from "@/db/schema";
import { getSessionUser, isAdminEmail } from "@/lib/admin";
import { isUuid } from "@/lib/slug";
import type { submissionStatuses } from "@/lib/validations";

type Status = (typeof submissionStatuses)[number];

const publicCreativeColumns = omitInviteEmail(getTableColumns(creatives));

function omitInviteEmail<T extends { inviteEmail: unknown }>(columns: T) {
  const { inviteEmail, ...rest } = columns;
  void inviteEmail;
  return rest;
}

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

/** Directory cards. Only the first work photo — listings never pull the full set. */
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
  coverWorkPhotoKey: sql<string | null>`${creatives.workPhotoKeys}[1]`,
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
    .select(publicCreativeColumns)
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

async function getPublicCreativeById(id: string) {
  const [creative] = await db
    .select(publicCreativeColumns)
    .from(creatives)
    .where(eq(creatives.id, id))
    .limit(1);
  return creative ?? null;
}

export async function getCreativeByParam(param: string) {
  return (
    (await getCreativeBySlug(param)) ??
    (isUuid(param) ? await getPublicCreativeById(param) : null)
  );
}

export async function getEventLineup(eventId: string) {
  return db
    .select({
      role: eventLineup.role,
      creative: publicCreativeColumns,
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

/** Events this account submitted, plus events their profile organises. */
export async function getAccountEvents(userId: string) {
  const profile = await getCreativeByUserId(userId);
  const submitted = await getEventsByUserId(userId);
  const organised = profile
    ? await db
        .select({ event: events })
        .from(eventLineup)
        .innerJoin(events, eq(eventLineup.eventId, events.id))
        .where(
          and(
            eq(eventLineup.creativeId, profile.id),
            eq(eventLineup.role, "organiser")
          )
        )
    : [];

  const merged = new Map<
    string,
    (typeof submitted)[number] & { submittedByMe: boolean; organising: boolean }
  >();

  for (const event of submitted) {
    merged.set(event.id, { ...event, submittedByMe: true, organising: false });
  }

  for (const { event } of organised) {
    const existing = merged.get(event.id);
    if (existing) {
      existing.organising = true;
      continue;
    }
    merged.set(event.id, {
      ...event,
      submittedByMe: false,
      organising: true,
    });
  }

  return [...merged.values()].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function searchCreativesByName(query: string, limit = 8) {
  const term = query.trim();
  if (term.length < 2) return [];

  const pattern = `%${term.replace(/[%_\\]/g, "\\$&")}%`;

  return db
    .select({
      id: creatives.id,
      name: creatives.name,
      city: creatives.city,
    })
    .from(creatives)
    .where(ilike(creatives.name, pattern))
    .orderBy(asc(creatives.name))
    .limit(limit);
}

export async function getOrganisersByEventIds(eventIds: string[]) {
  const unique = [...new Set(eventIds)];
  const grouped = new Map<
    string,
    { id: string; name: string; avatarKey: string | null }[]
  >();

  if (unique.length === 0) return grouped;

  const rows = await db
    .select({
      eventId: eventLineup.eventId,
      id: creatives.id,
      name: creatives.name,
      avatarKey: creatives.avatarKey,
    })
    .from(eventLineup)
    .innerJoin(creatives, eq(eventLineup.creativeId, creatives.id))
    .where(
      and(
        inArray(eventLineup.eventId, unique),
        eq(eventLineup.role, "organiser")
      )
    )
    .orderBy(asc(creatives.name));

  for (const row of rows) {
    const list = grouped.get(row.eventId) ?? [];
    list.push({ id: row.id, name: row.name, avatarKey: row.avatarKey });
    grouped.set(row.eventId, list);
  }

  return grouped;
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
      and(eq(eventLineup.eventId, eventId), eq(eventLineup.role, "organiser"))
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
