import { coerceWebsiteUrl } from "@/lib/urls";

export const MAX_CREATIVE_VIDEO_URLS = 3;
export const MAX_CREATIVE_AUDIO_URLS = 3;

const VIDEO_ROOT_HOSTS = [
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "vimeo.com",
] as const;

const AUDIO_ROOT_HOSTS = [
  "soundcloud.com",
  "bandcamp.com",
  "spotify.com",
  "music.apple.com",
] as const;

export type VideoProvider = "youtube" | "vimeo";
export type AudioProvider =
  | "soundcloud"
  | "bandcamp"
  | "spotify"
  | "apple_music";

export type VideoEmbed = {
  provider: VideoProvider;
  href: string;
  embedSrc: string | null;
  label: string;
};

export type AudioEmbed = {
  provider: AudioProvider;
  href: string;
  embedSrc: string | null;
  label: string;
  /** iframe height in px when embedSrc is set */
  embedHeight: number;
};

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(coerceWebsiteUrl(value.trim()));
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function rootHost(hostname: string) {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function hostMatches(hostname: string, roots: readonly string[]) {
  const host = rootHost(hostname);
  return roots.some((root) => host === root || host.endsWith(`.${root}`));
}

export function isVideoMediaUrl(value: string) {
  const url = parseHttpUrl(value);
  return Boolean(url && hostMatches(url.hostname, VIDEO_ROOT_HOSTS));
}

export function isAudioMediaUrl(value: string) {
  const url = parseHttpUrl(value);
  if (!url) return false;
  const host = rootHost(url.hostname);
  if (host === "music.apple.com" || host.endsWith(".music.apple.com")) {
    return true;
  }
  if (host === "open.spotify.com" || host === "spotify.com") {
    return true;
  }
  return hostMatches(url.hostname, ["soundcloud.com", "bandcamp.com"]);
}

function youtubeId(url: URL): string | null {
  const host = rootHost(url.hostname);
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }
  if (!host.endsWith("youtube.com") && !host.endsWith("youtube-nocookie.com")) {
    return null;
  }
  const v = url.searchParams.get("v");
  if (v) return v;
  const parts = url.pathname.split("/").filter(Boolean);
  const marker = parts[0];
  if (
    marker &&
    ["embed", "shorts", "live", "v"].includes(marker) &&
    parts[1]
  ) {
    return parts[1];
  }
  return null;
}

function vimeoId(url: URL): string | null {
  const host = rootHost(url.hostname);
  if (host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] === "video" && parts[1] ? parts[1] : null;
  }
  if (!host.endsWith("vimeo.com")) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  // /123456 or /channels/foo/123456 or /groups/foo/videos/123456
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (/^\d+$/.test(parts[i]!)) return parts[i]!;
  }
  return null;
}

export function resolveVideoEmbed(value: string): VideoEmbed | null {
  const url = parseHttpUrl(value);
  if (!url || !hostMatches(url.hostname, VIDEO_ROOT_HOSTS)) return null;

  const href = url.toString();
  const host = rootHost(url.hostname);

  if (
    host === "youtu.be" ||
    host.endsWith("youtube.com") ||
    host.endsWith("youtube-nocookie.com")
  ) {
    const id = youtubeId(url);
    return {
      provider: "youtube",
      href,
      embedSrc: id
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
        : null,
      label: "YouTube",
    };
  }

  const id = vimeoId(url);
  return {
    provider: "vimeo",
    href,
    embedSrc: id
      ? `https://player.vimeo.com/video/${encodeURIComponent(id)}`
      : null,
    label: "Vimeo",
  };
}

const SPOTIFY_EMBED_TYPES = new Set([
  "track",
  "album",
  "playlist",
  "artist",
  "episode",
  "show",
]);

function spotifyEmbed(url: URL): AudioEmbed | null {
  const host = rootHost(url.hostname);
  if (host !== "open.spotify.com" && host !== "spotify.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  // /embed/track/id or /track/id (intl prefix like /intl-en/track/id)
  let type: string | undefined;
  let id: string | undefined;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]!;
    if (part === "embed") continue;
    if (SPOTIFY_EMBED_TYPES.has(part) && parts[i + 1]) {
      type = part;
      id = parts[i + 1]!.split("?")[0];
      break;
    }
  }
  if (!type || !id) return null;

  const href = url.toString();
  const compact = type === "track" || type === "episode";
  return {
    provider: "spotify",
    href,
    embedSrc: `https://open.spotify.com/embed/${type}/${encodeURIComponent(id)}?utm_source=generator`,
    label: "Spotify",
    embedHeight: compact ? 152 : 352,
  };
}

function appleMusicEmbed(url: URL): AudioEmbed | null {
  const host = rootHost(url.hostname);
  if (host !== "music.apple.com" && !host.endsWith(".music.apple.com")) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  // /au/album/slug/id or /au/song/slug/id
  if (parts.length < 3) return null;

  const embed = new URL(url.toString());
  embed.hostname = "embed.music.apple.com";
  const trackParam = url.searchParams.get("i");
  const isSong =
    parts[1] === "song" || (parts[1] === "album" && Boolean(trackParam));

  return {
    provider: "apple_music",
    href: url.toString(),
    embedSrc: embed.toString(),
    label: "Apple Music",
    embedHeight: isSong ? 175 : 450,
  };
}

export function resolveAudioEmbed(value: string): AudioEmbed | null {
  const url = parseHttpUrl(value);
  if (!url) return null;

  const href = url.toString();
  const host = rootHost(url.hostname);

  const spotify = spotifyEmbed(url);
  if (spotify) return spotify;

  const apple = appleMusicEmbed(url);
  if (apple) return apple;

  if (host === "soundcloud.com" || host.endsWith(".soundcloud.com")) {
    const params = new URLSearchParams({
      url: href,
      auto_play: "false",
      hide_related: "true",
      show_comments: "false",
      show_user: "true",
      show_reposts: "false",
      show_teaser: "false",
    });
    return {
      provider: "soundcloud",
      href,
      embedSrc: `https://w.soundcloud.com/player/?${params.toString()}`,
      label: "SoundCloud",
      embedHeight: 166,
    };
  }

  if (host === "bandcamp.com" || host.endsWith(".bandcamp.com")) {
    return {
      provider: "bandcamp",
      href,
      // Bandcamp needs an album/track id for iframes; show a listen card instead.
      embedSrc: null,
      label: "Bandcamp",
      embedHeight: 0,
    };
  }

  return null;
}

/** Append autoplay (and related) params for in-app expanded playback. */
export function withEmbedAutoplay(embedSrc: string) {
  const url = new URL(embedSrc);
  url.searchParams.set("autoplay", "1");
  if (url.hostname.includes("youtube")) {
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("rel", "0");
  }
  if (url.hostname.includes("vimeo")) {
    url.searchParams.set("autoplay", "1");
  }
  return url.toString();
}

/** Drop empties, coerce, dedupe, cap. */
export function normalizeMediaUrlList(
  values: readonly string[] | null | undefined,
  kind: "video" | "audio",
  max: number
) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values ?? []) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const href = coerceWebsiteUrl(trimmed);
    const ok = kind === "video" ? isVideoMediaUrl(href) : isAudioMediaUrl(href);
    if (!ok) continue;
    const key = href.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(href);
    if (out.length >= max) break;
  }
  return out;
}
