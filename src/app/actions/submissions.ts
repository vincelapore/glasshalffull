"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getSessionUser, isAdminAuthenticated } from "@/lib/admin";
import { claimInvitedProfile } from "@/lib/claim-profile";
import {
  composeModerationNote,
  emptyToNull,
  fromDateTimeLocalValue,
} from "@/lib/labels";
import { flyerKeyPattern } from "@/lib/media";
import {
  recordModerationActivity,
  type ModerationAction,
} from "@/lib/moderation-activity";
import { creativePath, eventPath } from "@/lib/paths";
import { publicTags, revalidatePublicTags } from "@/lib/public-cache";
import { deleteMediaObjects } from "@/lib/r2";
import { uniqueCreativeSlug, uniqueEventSlug } from "@/lib/slug";
import {
  MAX_CREATIVE_AUDIO_URLS,
  MAX_CREATIVE_VIDEO_URLS,
  normalizeMediaUrlList,
} from "@/lib/creative-media";
import {
  instagramHandleFromSocials,
  normalizeSocials,
  websiteFromSocials,
} from "@/lib/creative-socials";
import {
  coerceWebsiteUrl,
  creativeSubmissionSchema,
  eventRejectionSchema,
  eventSubmissionSchema,
  optionalInviteEmailSchema,
  type CreativeSubmissionInput,
  type EventSubmissionInput,
} from "@/lib/validations";
import { db } from "@/db";
import { creatives, eventLineup, events } from "@/db/schema";
import { getCreativeByUserId } from "@/lib/queries";
import { releaseWorkPhotoKeys, resolveWorkPhotoKeys } from "@/lib/work-photos";

function statusChangeAction(
  status: "approved" | "rejected" | "pending"
): ModerationAction {
  if (status === "pending") return "returned_to_pending";
  return status;
}

export type ActionResult =
  | { success: true; id: string; message: string }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

function normalizeOptionalUrl(value?: string) {
  const trimmed = emptyToNull(value);
  if (!trimmed) return null;
  return coerceWebsiteUrl(trimmed);
}

/** Create or update the signed-in user's single creative profile. */
export async function saveMyProfileAction(
  input: unknown
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: "Sign in to edit your profile." };
  }

  const claim = await claimInvitedProfile(user);
  if (claim.status === "claimed") {
    revalidateCreativePaths(claim.slug);
    revalidatePath("/account/events");
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
    const existing = await db
      .select({ id: creatives.id })
      .from(creatives)
      .where(eq(creatives.userId, user.id))
      .limit(1);

    const workPhotos = await resolveWorkPhotoKeys({
      creativeId: existing[0]?.id ?? null,
      nextKeys: data.workPhotoKeys,
      actorUserId: user.id,
    });
    if (!workPhotos.ok) {
      return { success: false, message: workPhotos.message };
    }

    const profileValues = {
      ...creativeProfileValues(data, workPhotos.keys, {
        allowAccountEmail: true,
      }),
      status: "approved" as const,
    };

    if (existing[0]) {
      const [updated] = await db
        .update(creatives)
        .set({
          ...profileValues,
          slug: await uniqueCreativeSlug(data.name, existing[0].id),
        })
        .where(eq(creatives.id, existing[0].id))
        .returning({ id: creatives.id, slug: creatives.slug });

      await recordModerationActivity({
        subjectType: "creative",
        subjectId: updated.id,
        action: "edited",
        actor: user,
      });

      revalidateCreativePaths(updated.slug);
      revalidatePath("/account");
      await releaseWorkPhotoKeys(workPhotos.removed);

      return {
        success: true,
        id: updated.id,
        message: "Profile saved.",
      };
    }

    const [created] = await db
      .insert(creatives)
      .values({
        userId: user.id,
        slug: await uniqueCreativeSlug(data.name),
        ...profileValues,
      })
      .returning({ id: creatives.id, slug: creatives.slug });

    await recordModerationActivity({
      subjectType: "creative",
      subjectId: created.id,
      action: "submitted",
      actor: user,
      metadata: { toStatus: "approved" },
    });

    revalidateCreativePaths(created.slug);
    revalidatePath("/account");

    return {
      success: true,
      id: created.id,
      message: "Profile saved.",
    };
  } catch (error) {
    console.error("saveMyProfileAction", error);
    return {
      success: false,
      message: "Could not save your profile. Please try again.",
    };
  }
}

export async function submitEventAction(input: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: "Sign in to submit an event." };
  }

  const profile = await getCreativeByUserId(user.id);
  if (!profile) {
    return {
      success: false,
      message: "Save your profile first, then submit an event.",
    };
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
    const [created] = await db
      .insert(events)
      .values({
        submittedByUserId: user.id,
        title: data.title,
        slug: await uniqueEventSlug(data.title),
        dateTime: fromDateTimeLocalValue(data.dateTime),
        city: data.city,
        location: data.location,
        categories: data.categories,
        musicGenres: data.categories.includes("music") ? data.musicGenres : [],
        description: emptyToNull(data.description),
        ticketLink: normalizeOptionalUrl(data.ticketLink),
        flyerKey: data.flyerKey,
        status: "pending",
      })
      .returning({ id: events.id, slug: events.slug });

    await db.insert(eventLineup).values({
      eventId: created.id,
      creativeId: profile.id,
      role: "organiser",
    });

    await recordModerationActivity({
      subjectType: "event",
      subjectId: created.id,
      action: "submitted",
      actor: user,
      metadata: { toStatus: "pending" },
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/account/events");
    revalidatePath("/events");
    revalidatePath(eventPath(created.slug));
    revalidatePath(creativePath(profile.slug));
    revalidatePath("/");
    revalidatePublicTags(publicTags.events, publicTags.creatives);

    return {
      success: true,
      id: created.id,
      message: "Submitted. We’ll review it soon.",
    };
  } catch (error) {
    console.error("submitEventAction", error);
    return {
      success: false,
      message: "Could not save your event. Please try again.",
    };
  }
}

function creativeProfileValues(
  data: CreativeSubmissionInput,
  workPhotoKeys: string[],
  options?: { allowAccountEmail?: boolean }
) {
  const socials = normalizeSocials(data.socials);
  const publicEmailMode =
    data.publicEmailMode === "account" && !options?.allowAccountEmail
      ? "hidden"
      : data.publicEmailMode;
  const publicEmail =
    publicEmailMode === "custom"
      ? emptyToNull(data.publicEmail.toLowerCase())
      : null;
  return {
    name: data.name,
    disciplines: data.disciplines,
    roles: data.roles,
    specialty: emptyToNull(data.specialty),
    isQueer: data.isQueer,
    city: data.city || null,
    pronouns: emptyToNull(data.pronouns),
    bio: emptyToNull(data.bio),
    socials,
    // Keep legacy columns in sync for older list/query surfaces.
    instagramHandle: instagramHandleFromSocials(socials),
    portfolioUrl: websiteFromSocials(socials),
    publicEmailMode,
    publicEmail,
    videoUrls: normalizeMediaUrlList(
      data.videoUrls,
      "video",
      MAX_CREATIVE_VIDEO_URLS
    ),
    audioUrls: normalizeMediaUrlList(
      data.audioUrls,
      "audio",
      MAX_CREATIVE_AUDIO_URLS
    ),
    avatarKey: emptyToNull(data.avatarKey),
    workPhotoKeys,
    openToPaidWork: data.openToPaidWork,
    openToTrade: data.openToTrade,
    buildingPortfolio: data.buildingPortfolio,
  };
}

async function resolveInviteEmail(value: string, exceptCreativeId?: string) {
  const parsed = optionalInviteEmailSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Enter a valid email.",
    };
  }

  const email = parsed.data || null;
  if (!email) return { ok: true as const, email };

  const [taken] = await db
    .select({ id: creatives.id })
    .from(creatives)
    .where(eq(creatives.inviteEmail, email))
    .limit(1);

  if (taken && taken.id !== exceptCreativeId) {
    return {
      ok: false as const,
      message: "That email is already on another profile.",
    };
  }

  return { ok: true as const, email };
}

/** Admin-published profile. Optional invite email, no account yet. */
export async function createAdminCreativeAction(
  input: unknown,
  inviteEmail = ""
): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  const actor = await getSessionUser();
  if (!actor) {
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

  const invite = await resolveInviteEmail(inviteEmail);
  if (!invite.ok) return { success: false, message: invite.message };

  const data = parsed.data;

  try {
    const workPhotos = await resolveWorkPhotoKeys({
      creativeId: null,
      nextKeys: data.workPhotoKeys,
      actorUserId: actor.id,
    });
    if (!workPhotos.ok) {
      return { success: false, message: workPhotos.message };
    }

    const [created] = await db
      .insert(creatives)
      .values({
        userId: null,
        slug: await uniqueCreativeSlug(data.name),
        ...creativeProfileValues(data, workPhotos.keys, {
          allowAccountEmail: false,
        }),
        inviteEmail: invite.email,
        status: "approved",
      })
      .returning({ id: creatives.id, slug: creatives.slug });

    await recordModerationActivity({
      subjectType: "creative",
      subjectId: created.id,
      action: "published",
      actor,
      metadata: { toStatus: "approved" },
    });

    revalidateCreativePaths(created.slug);
    return {
      success: true,
      id: created.id,
      message: "Profile created.",
    };
  } catch (error) {
    console.error("createAdminCreativeAction", error);
    return { success: false, message: "Could not create that profile." };
  }
}

/** Admin-published event. Organisers are linked afterwards. */
export async function createAdminEventAction(
  input: unknown
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user || !(await isAdminAuthenticated())) {
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
    const [created] = await db
      .insert(events)
      .values({
        submittedByUserId: user.id,
        title: data.title,
        slug: await uniqueEventSlug(data.title),
        dateTime: fromDateTimeLocalValue(data.dateTime),
        city: data.city,
        location: data.location,
        categories: data.categories,
        musicGenres: data.categories.includes("music") ? data.musicGenres : [],
        description: emptyToNull(data.description),
        ticketLink: normalizeOptionalUrl(data.ticketLink),
        flyerKey: data.flyerKey,
        status: "approved",
      })
      .returning({ id: events.id, slug: events.slug });

    await recordModerationActivity({
      subjectType: "event",
      subjectId: created.id,
      action: "published",
      actor: user,
      metadata: { toStatus: "approved" },
    });

    revalidateEventPaths(created.slug);
    return {
      success: true,
      id: created.id,
      message: "Event published.",
    };
  } catch (error) {
    console.error("createAdminEventAction", error);
    return { success: false, message: "Could not publish that event." };
  }
}

export async function updateCreativeInviteEmailAction(
  id: string,
  inviteEmail: string
): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  const [existing] = await db
    .select({
      id: creatives.id,
      userId: creatives.userId,
      slug: creatives.slug,
    })
    .from(creatives)
    .where(eq(creatives.id, id))
    .limit(1);

  if (!existing) {
    return { success: false, message: "Creative not found." };
  }

  if (existing.userId) {
    return {
      success: false,
      message: "This profile is already linked to an account.",
    };
  }

  const invite = await resolveInviteEmail(inviteEmail, existing.id);
  if (!invite.ok) return { success: false, message: invite.message };

  try {
    await db
      .update(creatives)
      .set({ inviteEmail: invite.email })
      .where(eq(creatives.id, existing.id));

    revalidateCreativePaths(existing.slug);
    return {
      success: true,
      id: existing.id,
      message: invite.email ? "Invite email saved." : "Invite email cleared.",
    };
  } catch (error) {
    console.error("updateCreativeInviteEmailAction", error);
    return { success: false, message: "Could not save that email." };
  }
}

export async function updateCreativeStatusAction(
  id: string,
  status: "approved" | "rejected" | "pending",
  rejection?: unknown
): Promise<ActionResult> {
  const actor = await getSessionUser();
  if (!actor || !(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  let moderationNote: string | null | undefined;

  if (status === "rejected") {
    const parsed = eventRejectionSchema.safeParse(rejection ?? {});

    if (!parsed.success) {
      return {
        success: false,
        message:
          parsed.error.issues[0]?.message ?? "Pick a reason or add a note.",
      };
    }

    moderationNote = composeModerationNote(
      parsed.data.reasons,
      parsed.data.extra
    );
  }

  try {
    const [existing] = await db
      .select({ status: creatives.status })
      .from(creatives)
      .where(eq(creatives.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Creative not found." };
    }

    const [updated] = await db
      .update(creatives)
      .set({
        status,
        ...(moderationNote !== undefined ? { moderationNote } : {}),
      })
      .where(eq(creatives.id, id))
      .returning({ id: creatives.id, slug: creatives.slug });

    if (!updated) {
      return { success: false, message: "Creative not found." };
    }

    await recordModerationActivity({
      subjectType: "creative",
      subjectId: updated.id,
      action: statusChangeAction(status),
      actor,
      metadata: {
        fromStatus: existing.status,
        toStatus: status,
        ...(moderationNote ? { note: moderationNote } : {}),
      },
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/creatives");
    revalidatePath(creativePath(updated.slug));
    revalidatePath("/");
    revalidatePublicTags(publicTags.creatives);

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
  status: "approved" | "rejected" | "pending",
  rejection?: unknown
): Promise<ActionResult> {
  const actor = await getSessionUser();
  if (!actor || !(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  let moderationNote: string | null | undefined;

  if (status === "rejected") {
    const parsed = eventRejectionSchema.safeParse(rejection ?? {});

    if (!parsed.success) {
      return {
        success: false,
        message:
          parsed.error.issues[0]?.message ?? "Pick a reason or add a note.",
      };
    }

    moderationNote = composeModerationNote(
      parsed.data.reasons,
      parsed.data.extra
    );
  }

  try {
    const [existing] = await db
      .select({ status: events.status })
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, message: "Event not found." };
    }

    const [updated] = await db
      .update(events)
      .set({
        status,
        ...(moderationNote !== undefined ? { moderationNote } : {}),
      })
      .where(eq(events.id, id))
      .returning({ id: events.id, slug: events.slug });

    if (!updated) {
      return { success: false, message: "Event not found." };
    }

    await recordModerationActivity({
      subjectType: "event",
      subjectId: updated.id,
      action: statusChangeAction(status),
      actor,
      metadata: {
        fromStatus: existing.status,
        toStatus: status,
        ...(moderationNote ? { note: moderationNote } : {}),
      },
    });

    revalidateEventPaths(updated.slug);

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
  revalidatePublicTags(publicTags.creatives);
}

function revalidateEventPaths(slug: string) {
  revalidatePath("/admin/submissions");
  revalidatePath("/events");
  revalidatePath("/account/events");
  revalidatePath(eventPath(slug));
  revalidatePath("/");
  revalidatePublicTags(publicTags.events);
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
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const [existing] = await db
      .select({ userId: creatives.userId })
      .from(creatives)
      .where(eq(creatives.id, id))
      .limit(1);
    if (!existing) {
      return { success: false, message: "Creative not found." };
    }

    const workPhotos = await resolveWorkPhotoKeys({
      creativeId: id,
      nextKeys: data.workPhotoKeys,
      actorUserId: actor.id,
    });
    if (!workPhotos.ok) {
      return { success: false, message: workPhotos.message };
    }

    const [updated] = await db
      .update(creatives)
      .set({
        ...creativeProfileValues(data, workPhotos.keys, {
          allowAccountEmail: Boolean(existing.userId),
        }),
        slug: await uniqueCreativeSlug(data.name, id),
      })
      .where(eq(creatives.id, id))
      .returning({ id: creatives.id, slug: creatives.slug });

    if (!updated) {
      return { success: false, message: "Creative not found." };
    }

    await recordModerationActivity({
      subjectType: "creative",
      subjectId: updated.id,
      action: "edited",
      actor,
    });

    revalidateCreativePaths(updated.slug);
    await releaseWorkPhotoKeys(workPhotos.removed);

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

function parseEventSubmission(input: unknown) {
  const parsed = eventSubmissionSchema.safeParse(input);

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

async function writeEventDetails(
  id: string,
  data: EventSubmissionInput,
  extra: { status?: "pending"; moderationNote?: null } = {}
) {
  const [current] = await db
    .select({ flyerKey: events.flyerKey })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (!current) return null;

  const [updated] = await db
    .update(events)
    .set({
      title: data.title,
      slug: await uniqueEventSlug(data.title, id),
      dateTime: fromDateTimeLocalValue(data.dateTime),
      city: data.city,
      location: data.location,
      categories: data.categories,
      musicGenres: data.categories.includes("music") ? data.musicGenres : [],
      description: emptyToNull(data.description),
      ticketLink: normalizeOptionalUrl(data.ticketLink),
      flyerKey: data.flyerKey,
      ...extra,
    })
    .where(eq(events.id, id))
    .returning({ id: events.id, slug: events.slug });

  const previousFlyer = current.flyerKey;
  if (
    updated &&
    previousFlyer &&
    previousFlyer !== data.flyerKey &&
    flyerKeyPattern.test(previousFlyer)
  ) {
    try {
      await deleteMediaObjects([previousFlyer]);
    } catch (error) {
      console.error("writeEventDetails flyer cleanup", error);
    }
  }

  return updated ?? null;
}

export async function updateEventAction(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const actor = await getSessionUser();
  if (!actor || !(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  const parsed = parseEventSubmission(input);
  if (!parsed.ok) return parsed.result;

  try {
    const updated = await writeEventDetails(id, parsed.data);

    if (!updated) {
      return { success: false, message: "Event not found." };
    }

    await recordModerationActivity({
      subjectType: "event",
      subjectId: updated.id,
      action: "edited",
      actor,
    });

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

/** The signed-in organiser updates an event they submitted. */
export async function updateMyEventAction(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: "Sign in to edit your event." };
  }

  const [existing] = await db
    .select({
      id: events.id,
      submittedByUserId: events.submittedByUserId,
      status: events.status,
    })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (!existing || existing.submittedByUserId !== user.id) {
    return { success: false, message: "You can only edit your own events." };
  }

  const parsed = parseEventSubmission(input);
  if (!parsed.ok) return parsed.result;

  try {
    const updated = await writeEventDetails(
      id,
      parsed.data,
      existing.status === "rejected"
        ? { status: "pending", moderationNote: null }
        : {}
    );

    if (!updated) {
      return { success: false, message: "Event not found." };
    }

    await recordModerationActivity({
      subjectType: "event",
      subjectId: updated.id,
      action: "edited",
      actor: user,
    });

    if (existing.status === "rejected") {
      await recordModerationActivity({
        subjectType: "event",
        subjectId: updated.id,
        action: "returned_to_pending",
        actor: user,
        metadata: {
          fromStatus: "rejected",
          toStatus: "pending",
        },
      });
    }

    revalidateEventPaths(updated.slug);
    const profile = await getCreativeByUserId(user.id);
    if (profile) {
      revalidatePath(creativePath(profile.slug));
    }

    return {
      success: true,
      id: updated.id,
      message:
        existing.status === "rejected"
          ? "Saved. It’s back in review."
          : "Event updated.",
    };
  } catch (error) {
    console.error("updateMyEventAction", error);
    return { success: false, message: "Could not update event." };
  }
}

export async function deleteCreativeAction(id: string): Promise<ActionResult> {
  const actor = await getSessionUser();
  if (!actor || !(await isAdminAuthenticated())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const [deleted] = await db
      .delete(creatives)
      .where(eq(creatives.id, id))
      .returning({
        id: creatives.id,
        slug: creatives.slug,
        workPhotoKeys: creatives.workPhotoKeys,
      });

    if (!deleted) {
      return { success: false, message: "Creative not found." };
    }

    await recordModerationActivity({
      subjectType: "creative",
      subjectId: deleted.id,
      action: "deleted",
      actor,
    });

    revalidateCreativePaths(deleted.slug);
    await releaseWorkPhotoKeys(deleted.workPhotoKeys);

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
  const actor = await getSessionUser();
  if (!actor || !(await isAdminAuthenticated())) {
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

    await recordModerationActivity({
      subjectType: "event",
      subjectId: deleted.id,
      action: "deleted",
      actor,
    });

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
