"use client";

import imageCompression from "browser-image-compression";

import { createUploadUrlAction } from "@/app/actions/upload";
import {
  MAX_COMPRESSED_BYTES,
  MAX_WORK_PHOTO_BYTES,
  MAX_WORK_PHOTO_SOURCE_BYTES,
  MEDIA_CACHE_CONTROL,
  MEDIA_CONTENT_TYPE,
  WORK_PHOTO_MAX_EDGE,
  WORK_PHOTO_QUALITY,
  type UploadKind,
} from "@/lib/media";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadPhotoResult =
  | { success: true; key: string }
  | { success: false; message: string };

export function isAcceptedImage(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}

export async function compressAndUploadPhoto(
  file: File,
  kind: UploadKind
): Promise<UploadPhotoResult> {
  if (!isAcceptedImage(file)) {
    return { success: false, message: "Use a JPEG, PNG, or WebP image." };
  }

  const maxBytes = kind === "work" ? MAX_WORK_PHOTO_BYTES : MAX_COMPRESSED_BYTES;
  if (kind === "work" && file.size > MAX_WORK_PHOTO_SOURCE_BYTES) {
    return {
      success: false,
      message: "That image is too large. Try one under 12 MB.",
    };
  }

  try {
    // Compress in the browser (resize + WebP) so the file never hits Next.js
    // and we stay within Vercel/R2 free-tier egress and function limits.
    const compressed = await imageCompression(file, {
      maxSizeMB: maxBytes / (1024 * 1024),
      maxWidthOrHeight: kind === "avatar" ? 720 : kind === "work" ? WORK_PHOTO_MAX_EDGE : 1080,
      useWebWorker: true,
      fileType: MEDIA_CONTENT_TYPE,
      initialQuality: kind === "work" ? WORK_PHOTO_QUALITY : 0.8,
    });

    if (compressed.size > maxBytes) {
      return {
        success: false,
        message: "That image is still too large after compression. Try a simpler photo.",
      };
    }

    const signed = await createUploadUrlAction(kind);
    if (!signed.success) {
      return { success: false, message: signed.message };
    }

    const response = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": MEDIA_CONTENT_TYPE,
        "Cache-Control": MEDIA_CACHE_CONTROL,
      },
      body: compressed,
    });

    if (!response.ok) {
      return { success: false, message: "Upload failed. Please try again." };
    }

    return { success: true, key: signed.key };
  } catch (error) {
    console.error("compressAndUploadPhoto", error);
    if (error instanceof TypeError) {
      return {
        success: false,
        message:
          "The browser could not reach R2. That’s usually a missing CORS policy on the bucket for this site’s origin.",
      };
    }
    return {
      success: false,
      message: "Could not process that image. Try another file.",
    };
  }
}
