import { coerceWebsiteUrl } from "@/lib/urls";

export const socialProviders = [
  "website",
  "instagram",
  "youtube",
  "vimeo",
  "spotify",
  "apple_music",
  "soundcloud",
  "bandcamp",
] as const;

export type SocialProvider = (typeof socialProviders)[number];

export type CreativeSocial = {
  provider: SocialProvider;
  /** Normalized https URL (Instagram may be https://instagram.com/handle). */
  url: string;
};

export const MAX_CREATIVE_SOCIALS = socialProviders.length;

export const socialProviderLabels: Record<SocialProvider, string> = {
  website: "Website",
  instagram: "Instagram",
  youtube: "YouTube",
  vimeo: "Vimeo",
  spotify: "Spotify",
  apple_music: "Apple Music",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
};

export const socialProviderPlaceholders: Record<SocialProvider, string> = {
  website: "yourwebsite.com",
  instagram: "@yourhandle or instagram.com/yourhandle",
  youtube: "youtube.com/@yourchannel",
  vimeo: "vimeo.com/yourname",
  spotify: "open.spotify.com/artist/…",
  apple_music: "music.apple.com/…/artist/…",
  soundcloud: "soundcloud.com/yourname",
  bandcamp: "yourname.bandcamp.com",
};

export const socialProviderHints: Record<SocialProvider, string> = {
  website: "Any personal site or portfolio.",
  instagram: "Your Instagram profile.",
  youtube: "Your YouTube channel — not a single video.",
  vimeo: "Your Vimeo profile or channel.",
  spotify: "Your Spotify artist or user profile — not a track.",
  apple_music: "Your Apple Music artist page.",
  soundcloud: "Your SoundCloud profile.",
  bandcamp: "Your Bandcamp page.",
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

function instagramHandleFromValue(value: string): string | null {
  const trimmed = value.trim().replace(/^@+/, "");
  if (/^[A-Za-z0-9._]{1,30}$/.test(trimmed)) return trimmed;

  const url = parseHttpUrl(value);
  if (!url) return null;
  const host = rootHost(url.hostname);
  if (host !== "instagram.com" && host !== "instagr.am") return null;
  const handle = url.pathname.split("/").filter(Boolean)[0];
  if (!handle || !/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
  return handle;
}

export function isSocialProfileUrl(provider: SocialProvider, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (provider === "instagram") {
    return Boolean(instagramHandleFromValue(trimmed));
  }

  if (provider === "website") {
    return Boolean(parseHttpUrl(trimmed));
  }

  const url = parseHttpUrl(trimmed);
  if (!url) return false;
  const host = rootHost(url.hostname);
  const parts = url.pathname.split("/").filter(Boolean);

  switch (provider) {
    case "youtube": {
      if (
        host !== "youtube.com" &&
        host !== "youtu.be" &&
        host !== "youtube-nocookie.com" &&
        !host.endsWith(".youtube.com")
      ) {
        return false;
      }
      // Channel / handle profiles — not individual videos.
      if (host === "youtu.be") return false;
      if (
        parts[0] === "watch" ||
        parts[0] === "shorts" ||
        parts[0] === "embed" ||
        parts[0] === "live"
      ) {
        return false;
      }
      return (
        parts[0] === "channel" ||
        parts[0] === "c" ||
        parts[0] === "user" ||
        Boolean(parts[0]?.startsWith("@"))
      );
    }
    case "vimeo": {
      if (host !== "vimeo.com" && !host.endsWith(".vimeo.com")) return false;
      // Numeric-only paths are videos; profile/user paths have a slug.
      if (parts.length === 1 && /^\d+$/.test(parts[0]!)) return false;
      return parts.length >= 1;
    }
    case "spotify": {
      if (host !== "open.spotify.com" && host !== "spotify.com") return false;
      const type = parts[0] === "intl-en" || parts[0]?.startsWith("intl-")
        ? parts[1]
        : parts[0];
      return type === "artist" || type === "user";
    }
    case "apple_music": {
      if (host !== "music.apple.com" && !host.endsWith(".music.apple.com")) {
        return false;
      }
      return parts.includes("artist");
    }
    case "soundcloud": {
      if (host !== "soundcloud.com" && !host.endsWith(".soundcloud.com")) {
        return false;
      }
      // Profile is /username — reject /username/sets/… tracks optionally allow profile root
      if (parts.length === 0) return false;
      if (["discover", "stream", "search", "you", "upload"].includes(parts[0]!)) {
        return false;
      }
      // Allow profile (/user) or keep longer paths as profile-adjacent; reject obvious track-only? 
      // soundcloud.com/artist/track-name is a track — prefer length === 1 for profile.
      return parts.length === 1;
    }
    case "bandcamp": {
      // name.bandcamp.com or bandcamp.com/… 
      if (host === "bandcamp.com" || host.endsWith(".bandcamp.com")) {
        // Reject /track/ and /album/ deep links as account icons.
        if (parts[0] === "track" || parts[0] === "album") return false;
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

export function normalizeSocial(
  provider: SocialProvider,
  value: string
): CreativeSocial | null {
  const trimmed = value.trim();
  if (!trimmed || !isSocialProfileUrl(provider, trimmed)) return null;

  if (provider === "instagram") {
    const handle = instagramHandleFromValue(trimmed);
    if (!handle) return null;
    return {
      provider,
      url: `https://instagram.com/${handle}`,
    };
  }

  return {
    provider,
    url: coerceWebsiteUrl(trimmed),
  };
}

export function normalizeSocials(
  values: readonly { provider: string; url: string }[] | null | undefined
): CreativeSocial[] {
  const seen = new Set<SocialProvider>();
  const out: CreativeSocial[] = [];
  for (const entry of values ?? []) {
    if (!socialProviders.includes(entry.provider as SocialProvider)) continue;
    const provider = entry.provider as SocialProvider;
    if (seen.has(provider)) continue;
    const normalized = normalizeSocial(provider, entry.url);
    if (!normalized) continue;
    seen.add(provider);
    out.push(normalized);
    if (out.length >= MAX_CREATIVE_SOCIALS) break;
  }
  return out;
}

/** Pull Instagram handle from stored socials for legacy columns. */
export function instagramHandleFromSocials(socials: readonly CreativeSocial[]) {
  const ig = socials.find((social) => social.provider === "instagram");
  if (!ig) return null;
  return instagramHandleFromValue(ig.url);
}

export function websiteFromSocials(socials: readonly CreativeSocial[]) {
  return socials.find((social) => social.provider === "website")?.url ?? null;
}

/** Build socials from legacy columns when jsonb is empty. */
export function socialsFromLegacy(input: {
  instagramHandle?: string | null;
  portfolioUrl?: string | null;
  socials?: CreativeSocial[] | null;
}): CreativeSocial[] {
  if (input.socials?.length) return normalizeSocials(input.socials);
  const legacy: CreativeSocial[] = [];
  if (input.instagramHandle?.trim()) {
    const ig = normalizeSocial("instagram", input.instagramHandle);
    if (ig) legacy.push(ig);
  }
  if (input.portfolioUrl?.trim()) {
    const site = normalizeSocial("website", input.portfolioUrl);
    if (site) legacy.push(site);
  }
  return legacy;
}
