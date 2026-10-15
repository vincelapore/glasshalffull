import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  moderationActivity,
  type ModerationActivityMetadata,
} from "@/db/schema";

export type ModerationSubject = "event" | "creative";

export type ModerationAction =
  | "submitted"
  | "published"
  | "approved"
  | "rejected"
  | "returned_to_pending"
  | "edited"
  | "deleted";

type Actor = {
  id?: string | null;
  email?: string | null;
} | null;

type RecordInput = {
  subjectType: ModerationSubject;
  subjectId: string;
  action: ModerationAction;
  actor?: Actor;
  metadata?: ModerationActivityMetadata;
};

/** Insert a moderation log row. Never fails the caller's mutation. */
export async function recordModerationActivity(input: RecordInput) {
  try {
    await db.insert(moderationActivity).values({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      action: input.action,
      actorUserId: input.actor?.id ?? null,
      actorEmail: input.actor?.email?.trim().toLowerCase() || null,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error("recordModerationActivity", error);
  }
}

export async function getModerationActivity(
  subjectType: ModerationSubject,
  subjectId: string
) {
  return db
    .select()
    .from(moderationActivity)
    .where(
      and(
        eq(moderationActivity.subjectType, subjectType),
        eq(moderationActivity.subjectId, subjectId)
      )
    )
    .orderBy(desc(moderationActivity.createdAt));
}

export function moderationActionLabel(action: ModerationAction) {
  switch (action) {
    case "submitted":
      return "Submitted";
    case "published":
      return "Published";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "returned_to_pending":
      return "Returned to pending";
    case "edited":
      return "Edited";
    case "deleted":
      return "Deleted";
  }
}

export function formatModerationActor(
  entry: {
    actorEmail: string | null;
    actorUserId: string | null;
  },
  viewerEmail?: string | null
) {
  const email = entry.actorEmail?.trim().toLowerCase() || null;
  const viewer = viewerEmail?.trim().toLowerCase() || null;

  if (email && viewer && email === viewer) return "you";
  if (email) return email;
  if (entry.actorUserId) return "an account";
  return "unknown";
}
