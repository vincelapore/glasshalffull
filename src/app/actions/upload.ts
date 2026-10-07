"use server";

import { getSessionUser } from "@/lib/admin";
import { isWorkKeyOwnedBy } from "@/lib/media";
import { createPresignedUpload } from "@/lib/r2";
import { releaseWorkPhotoKeys } from "@/lib/work-photos";
import type { UploadKind } from "@/lib/media";

export type CreateUploadUrlResult =
  | {
      success: true;
      uploadUrl: string;
      key: string;
      publicUrl: string;
    }
  | { success: false; message: string };

export async function createUploadUrlAction(
  kind: UploadKind
): Promise<CreateUploadUrlResult> {
  if (kind !== "avatar" && kind !== "flyer" && kind !== "work" && kind !== "overflow") {
    return { success: false, message: "That file type isn’t supported." };
  }

  let ownerUserId: string | undefined;
  if (kind === "work") {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, message: "Sign in to upload photos." };
    }
    ownerUserId = user.id;
  }

  try {
    const upload = await createPresignedUpload(kind, ownerUserId);
    return { success: true, ...upload };
  } catch (error) {
    console.error("createUploadUrlAction", error);
    return {
      success: false,
      message: "Couldn’t upload. Try again.",
    };
  }
}

/** Drop work photos that were uploaded but never saved on a profile. */
export async function discardUnusedWorkPhotosAction(keys: string[]) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false as const, message: "Sign in to upload photos." };
  }

  await releaseWorkPhotoKeys(keys.filter((key) => isWorkKeyOwnedBy(key, user.id)));
  return { success: true as const };
}
