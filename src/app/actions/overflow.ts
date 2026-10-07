"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { creatives, events, overflowEpisodes, overflowFeatures } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/admin";
import { emptyToNull } from "@/lib/labels";
import { flyerKeyPattern } from "@/lib/media";
import {
  getOverflowEpisodeById,
  searchApprovedEventsByTitle,
  searchCreativesByName,
} from "@/lib/queries";
import { deleteMediaObjects } from "@/lib/r2";
import { uniqueOverflowSlug } from "@/lib/slug";
import {
  overflowEpisodeSchema,
  type OverflowEpisodeInput,
} from "@/lib/validations";

export type OverflowActionResult =
  | { success: true; id: string; message: string }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

function parseOverflow(input: unknown) {
  const parsed = overflowEpisodeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      result: {
        success: false as const,
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  return { ok: true as const, data: parsed.data };
}

async function numberTaken(number: number, excludeId?: string) {
  const [row] = await db
    .select({ id: overflowEpisodes.id })
    .from(overflowEpisodes)
    .where(
      excludeId
        ? and(
            eq(overflowEpisodes.number, number),
            ne(overflowEpisodes.id, excludeId)
          )
        : eq(overflowEpisodes.number, number)
    )
    .limit(1);

  return Boolean(row);
}

async function assertLinks(data: OverflowEpisodeInput) {
  if (data.eventId) {
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1);

    if (!event) {
      return "That event could not be found.";
    }
  }

  const creativeIds = data.features.map((feature) => feature.creativeId);
  if (creativeIds.length === 0) return null;

  const rows = await db
    .select({ id: creatives.id })
    .from(creatives)
    .where(inArray(creatives.id, creativeIds));

  if (rows.length !== new Set(creativeIds).size) {
    return "One of those profiles could not be found.";
  }

  return null;
}

async function replaceFeatures(episodeId: string, data: OverflowEpisodeInput) {
  await db
    .delete(overflowFeatures)
    .where(eq(overflowFeatures.episodeId, episodeId));

  if (data.features.length === 0) return;

  await db.insert(overflowFeatures).values(
    data.features.map((feature, index) => ({
      episodeId,
      creativeId: feature.creativeId,
      role: feature.role,
      note: emptyToNull(feature.note),
      sort: index,
    }))
  );
}

function revalidateOverflow() {
  revalidatePath("/");
  revalidatePath("/admin/overflow");
}

async function removeCover(key: string | null | undefined) {
  if (!key || !flyerKeyPattern.test(key)) return;

  try {
    await deleteMediaObjects([key]);
  } catch (error) {
    console.error("overflow cover cleanup", error);
  }
}

export async function searchOverflowCreativesAction(query: string) {
  if (!(await isAdminAuthenticated())) {
    return { success: false as const, message: "Unauthorized", results: [] };
  }

  const results = await searchCreativesByName(query);
  return { success: true as const, message: "", results };
}

export async function searchOverflowEventsAction(query: string) {
  if (!(await isAdminAuthenticated())) {
    return { success: false as const, message: "Unauthorized", results: [] };
  }

  const results = await searchApprovedEventsByTitle(query);
  return { success: true as const, message: "", results };
}

export async function createOverflowEpisodeAction(
  input: unknown
): Promise<OverflowActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  const parsed = parseOverflow(input);
  if (!parsed.ok) return parsed.result;

  const linkError = await assertLinks(parsed.data);
  if (linkError) return { success: false, message: linkError };

  if (await numberTaken(parsed.data.number)) {
    return {
      success: false,
      message: "That episode number is already used.",
      fieldErrors: { number: ["That episode number is already used."] },
    };
  }

  try {
    const [created] = await db
      .insert(overflowEpisodes)
      .values({
        number: parsed.data.number,
        slug: await uniqueOverflowSlug(parsed.data.title),
        title: parsed.data.title,
        city: parsed.data.city,
        coverKey: parsed.data.coverKey,
        body: parsed.data.body.trim(),
        eventId: parsed.data.eventId || null,
      })
      .returning({ id: overflowEpisodes.id });

    if (!created) {
      return { success: false, message: "Could not save that episode." };
    }

    await replaceFeatures(created.id, parsed.data);
    revalidateOverflow();

    return { success: true, id: created.id, message: "Episode published." };
  } catch (error) {
    console.error("createOverflowEpisodeAction", error);
    return { success: false, message: "Could not save that episode." };
  }
}

export async function updateOverflowEpisodeAction(
  id: string,
  input: unknown
): Promise<OverflowActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  const parsed = parseOverflow(input);
  if (!parsed.ok) return parsed.result;

  const current = await getOverflowEpisodeById(id);
  if (!current) return { success: false, message: "Episode not found." };

  const linkError = await assertLinks(parsed.data);
  if (linkError) return { success: false, message: linkError };

  if (await numberTaken(parsed.data.number, id)) {
    return {
      success: false,
      message: "That episode number is already used.",
      fieldErrors: { number: ["That episode number is already used."] },
    };
  }

  try {
    const [updated] = await db
      .update(overflowEpisodes)
      .set({
        number: parsed.data.number,
        slug: await uniqueOverflowSlug(parsed.data.title, id),
        title: parsed.data.title,
        city: parsed.data.city,
        coverKey: parsed.data.coverKey,
        body: parsed.data.body.trim(),
        eventId: parsed.data.eventId || null,
      })
      .where(eq(overflowEpisodes.id, id))
      .returning({ id: overflowEpisodes.id });

    if (!updated) return { success: false, message: "Episode not found." };

    await replaceFeatures(id, parsed.data);

    if (current.coverKey !== parsed.data.coverKey) {
      await removeCover(current.coverKey);
    }

    revalidateOverflow();
    return { success: true, id, message: "Episode updated." };
  } catch (error) {
    console.error("updateOverflowEpisodeAction", error);
    return { success: false, message: "Could not save that episode." };
  }
}

export async function deleteOverflowEpisodeAction(
  id: string
): Promise<OverflowActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const [deleted] = await db
      .delete(overflowEpisodes)
      .where(eq(overflowEpisodes.id, id))
      .returning({
        id: overflowEpisodes.id,
        coverKey: overflowEpisodes.coverKey,
      });

    if (!deleted) return { success: false, message: "Episode not found." };

    await removeCover(deleted.coverKey);
    revalidateOverflow();

    return { success: true, id: deleted.id, message: "Episode deleted." };
  } catch (error) {
    console.error("deleteOverflowEpisodeAction", error);
    return { success: false, message: "Could not delete that episode." };
  }
}
