export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const MEDIA_CONTENT_TYPE = "image/webp";
export const MAX_COMPRESSED_BYTES = 800 * 1024;
export const PRESIGN_TTL_SECONDS = 60;

/** Stored avatar edge. Cropping exports this size; nothing larger is uploaded. */
export const AVATAR_MAX_EDGE = 720;
/** Device-only framing image. Discarded after crop and never uploaded. */
export const AVATAR_CROP_SOURCE_EDGE = AVATAR_MAX_EDGE * 2;
export const FLYER_MAX_EDGE = 1080;

/**
 * Overflow posters. Sharper than a flyer, still one WebP in the flyers prefix.
 * The byte cap stops a phone original from being stored.
 */
export const OVERFLOW_MAX_EDGE = 2048;
export const OVERFLOW_MIN_EDGE = 1600;
export const OVERFLOW_MAX_BYTES = 1280 * 1024;
export const OVERFLOW_QUALITY = 0.84;

/** Profile work examples: one WebP each, never a second rendition. */
export const MAX_WORK_PHOTOS = 6;
export const MAX_WORK_PHOTO_BYTES = 600 * 1024;
export const WORK_PHOTO_MAX_EDGE = 1200;
export const WORK_PHOTO_QUALITY = 0.8;

export type UploadKind = "avatar" | "flyer" | "work" | "overflow";

const UUID_WEBP =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.webp";
const OWNER_SEGMENT = "[a-zA-Z0-9_-]{8,80}";

export const avatarKeyPattern = new RegExp(`^avatars/${UUID_WEBP}$`, "i");
export const flyerKeyPattern = new RegExp(`^flyers/${UUID_WEBP}$`, "i");
export const workKeyPattern = new RegExp(
  `^work/${OWNER_SEGMENT}/${UUID_WEBP}$`,
  "i"
);

const SAFE_OWNER = /^[a-zA-Z0-9_-]{8,80}$/;

/** Stable path segment so a profile can only keep keys it uploaded. */
export function workOwnerSegment(userId: string) {
  if (SAFE_OWNER.test(userId)) return userId;
  let hex = "";
  for (let index = 0; index < userId.length && hex.length < 80; index += 1) {
    hex += userId.charCodeAt(index).toString(16).padStart(2, "0");
  }
  if (hex.length < 8) {
    throw new Error("Invalid user id for work photo upload.");
  }
  return hex.slice(0, 80);
}

export function isWorkKeyOwnedBy(key: string, userId: string) {
  return (
    workKeyPattern.test(key) &&
    key.toLowerCase().startsWith(`work/${workOwnerSegment(userId).toLowerCase()}/`)
  );
}

export function mediaPrefix(kind: "avatar" | "flyer") {
  return kind === "avatar" ? "avatars" : "flyers";
}

export function mediaObjectKey(kind: UploadKind, ownerUserId?: string) {
  const id = crypto.randomUUID();
  if (kind === "work") {
    if (!ownerUserId) {
      throw new Error("Missing owner for work photo.");
    }
    return `work/${workOwnerSegment(ownerUserId)}/${id}.webp`;
  }
  if (kind === "overflow") return `flyers/${id}.webp`;
  return `${mediaPrefix(kind)}/${id}.webp`;
}

export function mediaBaseUrl() {
  return process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "") ?? "";
}

/** Build a public CDN URL from a stored object key. The domain lives in env. */
export function mediaUrl(key?: string | null) {
  if (!key) return undefined;
  const base = mediaBaseUrl();
  if (!base) return undefined;
  return `${base}/${key}`;
}
