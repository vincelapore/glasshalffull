"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { accountSettings } from "@/db/schema";
import { getSessionUser } from "@/lib/admin";
import { creativePath } from "@/lib/paths";
import { publicTags, revalidatePublicTags } from "@/lib/public-cache";
import { getCreativeByUserId } from "@/lib/queries";

export async function setAccountVisibilityAction(isPublic: boolean) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false as const, message: "Sign in first." };
  }

  await db
    .insert(accountSettings)
    .values({ userId: user.id, isPublic })
    .onConflictDoUpdate({
      target: accountSettings.userId,
      set: { isPublic, updatedAt: new Date() },
    });

  revalidatePath("/account");
  revalidatePath("/");
  revalidatePath("/creatives");
  const profile = await getCreativeByUserId(user.id);
  if (profile) revalidatePath(creativePath(profile.slug));
  revalidatePublicTags(publicTags.creatives);

  return { success: true as const };
}
