export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const MEDIA_CONTENT_TYPE = "image/webp";
export const MAX_COMPRESSED_BYTES = 800 * 1024;
export const PRESIGN_TTL_SECONDS = 60;

export type UploadKind = "avatar" | "flyer";

const UUID_WEBP =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.webp";

export const avatarKeyPattern = new RegExp(`^avatars/${UUID_WEBP}$`, "i");
export const flyerKeyPattern = new RegExp(`^flyers/${UUID_WEBP}$`, "i");

export function mediaPrefix(kind: UploadKind) {
  return kind === "avatar" ? "avatars" : "flyers";
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
