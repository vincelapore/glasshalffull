"use client";

import imageCompression from "browser-image-compression";

import { createUploadUrlAction } from "@/app/actions/upload";
import {
  AVATAR_CROP_SOURCE_EDGE,
  AVATAR_MAX_EDGE,
  FLYER_MAX_EDGE,
  MAX_COMPRESSED_BYTES,
  MAX_WORK_PHOTO_BYTES,
  MEDIA_CACHE_CONTROL,
  MEDIA_CONTENT_TYPE,
  OVERFLOW_MAX_BYTES,
  OVERFLOW_MAX_EDGE,
  OVERFLOW_MIN_EDGE,
  OVERFLOW_QUALITY,
  WORK_PHOTO_MAX_EDGE,
  WORK_PHOTO_QUALITY,
  type UploadKind,
} from "@/lib/media";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadPhotoResult =
  | { success: true; key: string }
  | { success: false; message: string };

const OUTPUT: Record<
  UploadKind,
  {
    maxBytes: number;
    maxEdge: number;
    minEdge: number;
    quality: number;
    minQuality: number;
  }
> = {
  avatar: {
    maxBytes: MAX_COMPRESSED_BYTES,
    maxEdge: AVATAR_MAX_EDGE,
    minEdge: 480,
    quality: 0.8,
    minQuality: 0.45,
  },
  flyer: {
    maxBytes: MAX_COMPRESSED_BYTES,
    maxEdge: FLYER_MAX_EDGE,
    minEdge: 480,
    quality: 0.8,
    minQuality: 0.45,
  },
  work: {
    maxBytes: MAX_WORK_PHOTO_BYTES,
    maxEdge: WORK_PHOTO_MAX_EDGE,
    minEdge: 960,
    quality: WORK_PHOTO_QUALITY,
    minQuality: 0.45,
  },
  overflow: {
    maxBytes: OVERFLOW_MAX_BYTES,
    maxEdge: OVERFLOW_MAX_EDGE,
    minEdge: OVERFLOW_MIN_EDGE,
    quality: OVERFLOW_QUALITY,
    minQuality: 0.75,
  },
};

/**
 * Files this module has already shrunk to the stored budget.
 * Uploading one of these skips a second encode. The original never enters the set.
 */
const preparedFiles = new WeakSet<Blob>();

export function isAcceptedImage(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}

async function shrinkToBudget(
  file: File,
  maxBytes: number,
  maxEdge: number,
  minEdge: number,
  quality: number,
  minQuality: number
) {
  let edge = maxEdge;
  let nextQuality = quality;
  let current = file;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    current = await imageCompression(attempt === 0 ? file : current, {
      maxSizeMB: maxBytes / (1024 * 1024),
      maxWidthOrHeight: edge,
      useWebWorker: true,
      fileType: MEDIA_CONTENT_TYPE,
      initialQuality: nextQuality,
      alwaysKeepResolution: false,
      maxIteration: 12,
    });
    if (current.size <= maxBytes) return current;
    edge = Math.max(minEdge, Math.round(edge * 0.75));
    nextQuality = Math.max(minQuality, nextQuality - 0.12);
  }

  if (current.size <= maxBytes) return current;
  throw new Error("Compressed photo is over the stored size budget.");
}

/** Shrink to the stored WebP budget. Original bytes are not returned. */
export async function compressPhoto(file: File, kind: UploadKind): Promise<File> {
  const limits = OUTPUT[kind];
  if (
    preparedFiles.has(file) &&
    file.type === MEDIA_CONTENT_TYPE &&
    file.size <= limits.maxBytes
  ) {
    return file;
  }

  const compressed = await shrinkToBudget(
    file,
    limits.maxBytes,
    limits.maxEdge,
    limits.minEdge,
    limits.quality,
    limits.minQuality
  );
  preparedFiles.add(compressed);
  return compressed;
}

/**
 * Downscale a profile photo so the crop UI can frame it.
 * The result stays on the device and is discarded after cropping.
 */
export async function prepareAvatarCropSource(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: AVATAR_CROP_SOURCE_EDGE,
    useWebWorker: true,
    fileType: MEDIA_CONTENT_TYPE,
    initialQuality: 0.86,
    alwaysKeepResolution: false,
  });
}

/** Square profile crop at the stored avatar size. Only this file may be uploaded. */
export async function exportAvatarCrop(
  image: CanvasImageSource,
  source: { sx: number; sy: number; size: number }
): Promise<File> {
  if (source.size <= 0) {
    throw new Error("Could not crop that photo.");
  }

  const edge = AVATAR_MAX_EDGE;
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not crop that photo.");

  context.drawImage(
    image,
    source.sx,
    source.sy,
    source.size,
    source.size,
    0,
    0,
    edge,
    edge
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, MEDIA_CONTENT_TYPE, 0.82);
  });
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error("Could not crop that photo.");

  const file = new File([blob], "avatar.webp", { type: MEDIA_CONTENT_TYPE });
  if (file.size > MAX_COMPRESSED_BYTES) return compressPhoto(file, "avatar");
  preparedFiles.add(file);
  return file;
}

/**
 * Square poster crop from the original pixels. Never upscales.
 * Only this file may be uploaded.
 */
export async function exportOverflowCrop(
  image: CanvasImageSource,
  source: { sx: number; sy: number; size: number }
): Promise<File> {
  if (source.size <= 0) {
    throw new Error("Could not crop that photo.");
  }

  const edge = Math.max(1, Math.min(OVERFLOW_MAX_EDGE, Math.round(source.size)));
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not crop that photo.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    source.sx,
    source.sy,
    source.size,
    source.size,
    0,
    0,
    edge,
    edge
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, MEDIA_CONTENT_TYPE, OVERFLOW_QUALITY);
  });
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error("Could not crop that photo.");

  const file = new File([blob], "poster.webp", { type: MEDIA_CONTENT_TYPE });
  if (file.size > OVERFLOW_MAX_BYTES) return compressPhoto(file, "overflow");
  preparedFiles.add(file);
  return file;
}

export async function compressAndUploadPhoto(
  file: File,
  kind: UploadKind
): Promise<UploadPhotoResult> {
  if (!isAcceptedImage(file)) {
    return { success: false, message: "Try a photo (JPG, PNG, or WebP)." };
  }

  const maxBytes = OUTPUT[kind].maxBytes;

  try {
    // Compress in the browser so the original never hits Next.js or R2.
    // The PUT below is the only stored object, and it stays within the existing cap.
    const compressed = await compressPhoto(file, kind);

    if (compressed.size > maxBytes) {
      return {
        success: false,
        message: "Could not process that image. Try another file.",
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
        message: "Couldn’t upload. Check your connection and try again.",
      };
    }
    return {
      success: false,
      message: "Could not process that image. Try another file.",
    };
  }
}
