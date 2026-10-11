import { coerceWebsiteUrl } from "@/lib/urls";

const VIDEO_ROOT_HOSTS = [
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "vimeo.com",
] as const;

const AUDIO_ROOT_HOSTS = ["soundcloud.com", "bandcamp.com"] as const;

export type VideoProvider = "youtube" | "vimeo";
export type AudioProvider = "soundcloud" | "bandcamp";

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
  return Boolean(url && hostMatches(url.hostname, AUDIO_ROOT_HOSTS));
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

export function resolveAudioEmbed(value: string): AudioEmbed | null {
  const url = parseHttpUrl(value);
  if (!url || !hostMatches(url.hostname, AUDIO_ROOT_HOSTS)) return null;

  const href = url.toString();
  const host = rootHost(url.hostname);

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
    };
  }

  return {
    provider: "bandcamp",
    href,
    // Bandcamp needs an album/track id for iframes; link out from the URL alone.
    embedSrc: null,
    label: "Bandcamp",
  };
}
