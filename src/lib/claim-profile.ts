import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { creatives } from "@/db/schema";
import { getCreativeByUserId } from "@/lib/queries";

export type ClaimResult =
  | { status: "claimed"; slug: string }
  | { status: "none" }
  | { status: "conflict" };

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && (error as { code: unknown }).code === "23505") {
    return true;
  }
  if ("cause" in error) {
    return isUniqueViolation((error as { cause: unknown }).cause);
  }
  return false;
}

/**
 * Attach an unclaimed profile when the session email matches inviteEmail.
 * Does nothing when this account already has a profile.
 */
export async function claimInvitedProfile(user: {
  id: string;
  email?: string | null;
}): Promise<ClaimResult> {
  const email = user.email?.trim().toLowerCase();
  if (!email) return { status: "none" };

  const [invited] = await db
    .select({
      id: creatives.id,
      slug: creatives.slug,
      userId: creatives.userId,
    })
    .from(creatives)
    .where(eq(creatives.inviteEmail, email))
    .limit(1);

  if (!invited || invited.userId) return { status: "none" };

  const owned = await getCreativeByUserId(user.id);
  if (owned) return { status: "conflict" };

  try {
    const [updated] = await db
      .update(creatives)
      .set({ userId: user.id, inviteEmail: null })
      .where(and(eq(creatives.id, invited.id), isNull(creatives.userId)))
      .returning({ slug: creatives.slug });

    if (!updated) return { status: "none" };
    return { status: "claimed", slug: updated.slug };
  } catch (error) {
    if (isUniqueViolation(error)) return { status: "conflict" };
    throw error;
  }
}
