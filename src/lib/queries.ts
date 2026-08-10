import { and, asc, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { creatives, eventLineup, events } from "@/db/schema";
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

export async function getApprovedCreatives(limit?: number) {
  const query = db
    .select()
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

  return {
    events: eventRows,
    creatives: creativeRows,
  };
}
