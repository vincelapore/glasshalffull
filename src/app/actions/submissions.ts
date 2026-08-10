"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { isAdminAuthenticated } from "@/lib/admin";
import { emptyToNull } from "@/lib/labels";
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
        craftCategory: data.craftCategory,
        bio: emptyToNull(data.bio),
        instagramUrl: normalizeOptionalUrl(data.instagramUrl),
        portfolioUrl: normalizeOptionalUrl(data.portfolioUrl),
        avatarUrl: normalizeOptionalUrl(data.avatarUrl),
        status: "pending",
      })
      .returning({ id: creatives.id });

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
        dateTime: new Date(data.dateTime),
        location: data.location,
        category: data.category,
        description: emptyToNull(data.description),
        ticketLink: normalizeOptionalUrl(data.ticketLink),
        flyerUrl: normalizeOptionalUrl(data.flyerUrl),
        status: "pending",
      })
      .returning({ id: events.id });

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
      .returning({ id: creatives.id });

    if (!updated) {
      return { success: false, message: "Creative not found." };
    }

    revalidatePath("/admin/submissions");
    revalidatePath("/creatives");
    revalidatePath(`/creatives/${id}`);
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
      .returning({ id: events.id });

    if (!updated) {
      return { success: false, message: "Event not found." };
    }

    revalidatePath("/admin/submissions");
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
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

function revalidateCreativePaths(id: string) {
  revalidatePath("/admin/submissions");
  revalidatePath("/creatives");
  revalidatePath(`/creatives/${id}`);
  revalidatePath("/");
}

function revalidateEventPaths(id: string) {
  revalidatePath("/admin/submissions");
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
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
        craftCategory: data.craftCategory,
        bio: emptyToNull(data.bio),
        instagramUrl: normalizeOptionalUrl(data.instagramUrl),
        portfolioUrl: normalizeOptionalUrl(data.portfolioUrl),
        avatarUrl: normalizeOptionalUrl(data.avatarUrl),
      })
      .where(eq(creatives.id, id))
      .returning({ id: creatives.id });

    if (!updated) {
      return { success: false, message: "Creative not found." };
    }

    revalidateCreativePaths(updated.id);

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
        dateTime: new Date(data.dateTime),
        location: data.location,
        category: data.category,
        description: emptyToNull(data.description),
        ticketLink: normalizeOptionalUrl(data.ticketLink),
        flyerUrl: normalizeOptionalUrl(data.flyerUrl),
      })
      .where(eq(events.id, id))
      .returning({ id: events.id });

    if (!updated) {
      return { success: false, message: "Event not found." };
    }

    revalidateEventPaths(updated.id);

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
      .returning({ id: creatives.id });

    if (!deleted) {
      return { success: false, message: "Creative not found." };
    }

    revalidateCreativePaths(deleted.id);

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
      .returning({ id: events.id });

    if (!deleted) {
      return { success: false, message: "Event not found." };
    }

    revalidateEventPaths(deleted.id);

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
