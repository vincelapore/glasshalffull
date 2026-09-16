"use server";

import { createPresignedUpload } from "@/lib/r2";
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
  if (kind !== "avatar" && kind !== "flyer") {
    return { success: false, message: "Invalid upload type." };
  }

  try {
    const upload = await createPresignedUpload(kind);
    return { success: true, ...upload };
  } catch (error) {
    console.error("createUploadUrlAction", error);
    return {
      success: false,
      message: "Could not start the upload. Please try again.",
    };
  }
}
