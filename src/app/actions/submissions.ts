"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { isAdminAuthenticated } from "@/lib/admin";
import { emptyToNull, normalizeInstagramHandle } from "@/lib/labels";
import { creativePath, eventPath } from "@/lib/paths";
import { uniqueCreativeSlug, uniqueEventSlug } from "@/lib/slug";
import {
  creativeSubmissionSchema,
  eventSubmissionSchema,
} from "@/lib/validations";
import { db } from "@/db";
import { creatives, events } from "@/db/schema";

export type ActionResult =
  | { success: true; id: string; message: string }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

function normalizeOptionalUrl(value?: string) {
  return emptyToNull(value);
}

export async function submitCreativeAction(
  input: unknown
): Promise<ActionResult> {
  const parsed = creativeSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const [created] = await db
      .insert(creatives)
      .values({
        name: data.name,
        slug: await uniqueCreativeSlug(data.name),
        craftCategories: data.craftCategories,
        bio: emptyToNull(data.bio),
        instagramHandle: normalizeInstagramHandle(data.instagramHandle),
        portfolioUrl: normalizeOptionalUrl(data.portfolioUrl),
        avatarKey: emptyToNull(data.avatarKey),
        openToPaidWork: data.openToPaidWork,
        openToTrade: data.openToTrade,
        buildingPortfolio: data.buildingPortfolio,
        status: "pending",
      })
      .returning({ id: creatives.id, slug: creatives.slug });

    revalidatePath("/admin/submissions");
    revalidatePath("/creatives");

    return {
      success: true,
      id: created.id,
      message: "Profile submitted for review. Thanks for pouring back in.",
    };
  } catch (error) {
    console.error("submitCreativeAction", error);
    return {
      success: false,
      message: "Could not save your profile. Please try again.",
    };
  }
}

export async function submitEventAction(input: unknown): Promise<ActionResult> {
  const parsed = eventSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const [created] = await db
      .insert(events)
      .values({
        title: data.title,
        slug: await uniqueEventSlug(data.title),
        dateTime: new Date(data.dateTime),
        location: data.location,
        category: data.category,
        description: emptyToNull(data.description),
        ticketLink: normalizeOptionalUrl(data.ticketLink),
        flyerKey: emptyToNull(data.flyerKey),
        status: "pending",
      })
      .returning({ id: events.id, slug: events.slug });

    revalidatePath("/admin/submissions");
    revalidatePath("/events");
    revalidatePath("/");

    return {
      success: true,
      id: created.id,
      message: "Event submitted for review. We’ll take a look soon.",
    };
  } catch (error) {
    console.error("submitEventAction", error);
    return {
      success: false,
      message: "Could not save your event. Please try again.",
    };
  }
}

export async function updateCreativeStatusAction(
  id: string,
  status: "approved" | "rejected" | "pending"
): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const [updated] = await db
      .update(creatives)
      .set({ status })
      .where(eq(creatives.id, id))
      .returning({ id: creatives.id, slug: creatives.slug });

    if (!updated) {
      return { success: false, message: "Creative not found." };
    }

    revalidatePath("/admin/submissions");
    revalidatePath("/creatives");
    revalidatePath(creativePath(updated.slug));
    revalidatePath("/");

    return {
      success: true,
      id: updated.id,
      message: `Creative marked as ${status}.`,
    };
  } catch (error) {
    console.error("updateCreativeStatusAction", error);
    return { success: false, message: "Could not update creative status." };
  }
}

export async function updateEventStatusAction(
  id: string,
  status: "approved" | "rejected" | "pending"
): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const [updated] = await db
      .update(events)
      .set({ status })
      .where(eq(events.id, id))
      .returning({ id: events.id, slug: events.slug });

    if (!updated) {
      return { success: false, message: "Event not found." };
    }

    revalidatePath("/admin/submissions");
    revalidatePath("/events");
    revalidatePath(eventPath(updated.slug));
    revalidatePath("/");

    return {
      success: true,
      id: updated.id,
      message: `Event marked as ${status}.`,
    };
  } catch (error) {
    console.error("updateEventStatusAction", error);
    return { success: false, message: "Could not update event status." };
  }
}

function revalidateCreativePaths(slug: string) {
  revalidatePath("/admin/submissions");
  revalidatePath("/creatives");
  revalidatePath(creativePath(slug));
  revalidatePath("/");
}

function revalidateEventPaths(slug: string) {
  revalidatePath("/admin/submissions");
  revalidatePath("/events");
  revalidatePath(eventPath(slug));
  revalidatePath("/");
}

export async function updateCreativeAction(
  id: string,
  input: unknown
): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  const parsed = creativeSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const [updated] = await db
      .update(creatives)
      .set({
        name: data.name,
        slug: await uniqueCreativeSlug(data.name, id),
        craftCategories: data.craftCategories,
        bio: emptyToNull(data.bio),
        instagramHandle: normalizeInstagramHandle(data.instagramHandle),
        portfolioUrl: normalizeOptionalUrl(data.portfolioUrl),
        avatarKey: emptyToNull(data.avatarKey),
        openToPaidWork: data.openToPaidWork,
        openToTrade: data.openToTrade,
        buildingPortfolio: data.buildingPortfolio,
      })
      .where(eq(creatives.id, id))
      .returning({ id: creatives.id, slug: creatives.slug });

    if (!updated) {
      return { success: false, message: "Creative not found." };
    }

    revalidateCreativePaths(updated.slug);

    return {
      success: true,
      id: updated.id,
      message: "Creative updated.",
    };
  } catch (error) {
    console.error("updateCreativeAction", error);
    return { success: false, message: "Could not update creative." };
  }
}

export async function updateEventAction(
  id: string,
  input: unknown
): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  const parsed = eventSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const [updated] = await db
      .update(events)
      .set({
        title: data.title,
        slug: await uniqueEventSlug(data.title, id),
        dateTime: new Date(data.dateTime),
        location: data.location,
        category: data.category,
        description: emptyToNull(data.description),
        ticketLink: normalizeOptionalUrl(data.ticketLink),
        flyerKey: emptyToNull(data.flyerKey),
      })
      .where(eq(events.id, id))
      .returning({ id: events.id, slug: events.slug });

    if (!updated) {
      return { success: false, message: "Event not found." };
    }

    revalidateEventPaths(updated.slug);

    return {
      success: true,
      id: updated.id,
      message: "Event updated.",
    };
  } catch (error) {
    console.error("updateEventAction", error);
    return { success: false, message: "Could not update event." };
  }
}

export async function deleteCreativeAction(id: string): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const [deleted] = await db
      .delete(creatives)
      .where(eq(creatives.id, id))
      .returning({ id: creatives.id, slug: creatives.slug });

    if (!deleted) {
      return { success: false, message: "Creative not found." };
    }

    revalidateCreativePaths(deleted.slug);

    return {
      success: true,
      id: deleted.id,
      message: "Creative deleted.",
    };
  } catch (error) {
    console.error("deleteCreativeAction", error);
    return { success: false, message: "Could not delete creative." };
  }
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const [deleted] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning({ id: events.id, slug: events.slug });

    if (!deleted) {
      return { success: false, message: "Event not found." };
    }

    revalidateEventPaths(deleted.slug);

    return {
      success: true,
      id: deleted.id,
      message: "Event deleted.",
    };
  } catch (error) {
    console.error("deleteEventAction", error);
    return { success: false, message: "Could not delete event." };
  }
}
