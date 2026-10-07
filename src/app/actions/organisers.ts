"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getSessionUser, isAdminEmail } from "@/lib/admin";
import { creativePath, eventPath } from "@/lib/paths";
import { getCreativeByUserId, getEventOrganisers, searchCreativesByName } from "@/lib/queries";
import { uniqueCreativeSlug } from "@/lib/slug";
import { organiserStubSchema } from "@/lib/validations";
import { db } from "@/db";
import { creatives, eventLineup, events } from "@/db/schema";

export type OrganiserActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

async function requireOrganiserManager(eventId: string) {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false as const, message: "Sign in to manage organisers." };
  }

  if (await isAdminEmail(user.email)) {
    return { ok: true as const, user };
  }

  const profile = await getCreativeByUserId(user.id);
  if (!profile) {
    return { ok: false as const, message: "Save your profile first." };
  }

  const organisers = await getEventOrganisers(eventId);
  const isOrganiser = organisers.some((row) => row.creative.id === profile.id);
  if (!isOrganiser) {
    return {
      ok: false as const,
      message: "Only an organiser of this event can change the list.",
    };
  }

  return { ok: true as const, user };
}

async function revalidateOrganiserChange(eventId: string, creativeSlug?: string) {
  const [event] = await db
    .select({ slug: events.slug })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  revalidatePath("/admin/submissions");
  revalidatePath("/account/events");
  revalidatePath("/events");
  revalidatePath("/creatives");
  revalidatePath("/");
  if (event) revalidatePath(eventPath(event.slug));
  if (creativeSlug) revalidatePath(creativePath(creativeSlug));
}

async function linkOrganiser(eventId: string, creativeId: string) {
  await db
    .insert(eventLineup)
    .values({
      eventId,
      creativeId,
      role: "organiser",
    })
    .onConflictDoUpdate({
      target: [eventLineup.eventId, eventLineup.creativeId],
      set: { role: "organiser" },
    });
}

export async function searchCreativesAction(eventId: string, query: string) {
  const access = await requireOrganiserManager(eventId);
  if (!access.ok) {
    return { success: false as const, message: access.message, results: [] };
  }

  if (query.trim().length < 2) {
    return {
      success: false as const,
      message: "Type at least two letters.",
      results: [],
    };
  }

  const results = await searchCreativesByName(query);
  return { success: true as const, message: "", results };
}

export async function addEventOrganiserAction(
  eventId: string,
  creativeId: string
): Promise<OrganiserActionResult> {
  const access = await requireOrganiserManager(eventId);
  if (!access.ok) return { success: false, message: access.message };

  const [creative] = await db
    .select({ id: creatives.id, slug: creatives.slug })
    .from(creatives)
    .where(eq(creatives.id, creativeId))
    .limit(1);

  if (!creative) {
    return { success: false, message: "That profile could not be found." };
  }

  try {
    await linkOrganiser(eventId, creative.id);
    await revalidateOrganiserChange(eventId, creative.slug);
    return { success: true, message: "Organiser added." };
  } catch (error) {
    console.error("addEventOrganiserAction", error);
    return { success: false, message: "Could not add that organiser." };
  }
}

export async function removeEventOrganiserAction(
  eventId: string,
  creativeId: string
): Promise<OrganiserActionResult> {
  const access = await requireOrganiserManager(eventId);
  if (!access.ok) return { success: false, message: access.message };

  const organisers = await getEventOrganisers(eventId);
  const target = organisers.find((row) => row.creative.id === creativeId);
  if (!target) {
    return { success: false, message: "That person is not an organiser." };
  }

  try {
    await db
      .delete(eventLineup)
      .where(
        and(
          eq(eventLineup.eventId, eventId),
          eq(eventLineup.creativeId, creativeId),
          eq(eventLineup.role, "organiser")
        )
      );
    await revalidateOrganiserChange(eventId, target.creative.slug);
    return { success: true, message: "Organiser removed." };
  } catch (error) {
    console.error("removeEventOrganiserAction", error);
    return { success: false, message: "Could not remove that organiser." };
  }
}

export async function inviteEventOrganiserAction(
  eventId: string,
  input: unknown
): Promise<OrganiserActionResult> {
  const access = await requireOrganiserManager(eventId);
  if (!access.ok) return { success: false, message: access.message };

  const parsed = organiserStubSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Enter a name and email.",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const [existing] = await db
      .select({
        id: creatives.id,
        slug: creatives.slug,
        userId: creatives.userId,
      })
      .from(creatives)
      .where(eq(creatives.inviteEmail, email))
      .limit(1);

    let creativeId = existing?.id;
    let creativeSlug = existing?.slug;

    if (!creativeId) {
      const [created] = await db
        .insert(creatives)
        .values({
          userId: null,
          slug: await uniqueCreativeSlug(parsed.data.name),
          name: parsed.data.name,
          craftCategories: ["other"],
          inviteEmail: email,
          status: "approved",
        })
        .returning({ id: creatives.id, slug: creatives.slug });
      creativeId = created.id;
      creativeSlug = created.slug;
    }

    const organisers = await getEventOrganisers(eventId);
    if (organisers.some((row) => row.creative.id === creativeId)) {
      return { success: true, message: "They’re already an organiser." };
    }

    await linkOrganiser(eventId, creativeId);
    await revalidateOrganiserChange(eventId, creativeSlug);
    return {
      success: true,
      message: existing
        ? "They’re already invited. Added as an organiser."
        : "Invite saved. Ask them to sign up with that email.",
    };
  } catch (error) {
    console.error("inviteEventOrganiserAction", error);
    return { success: false, message: "Could not invite that organiser." };
  }
}
