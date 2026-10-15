/** Accept `example.com` or full URLs; store a browsable href. */
export function coerceWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Canonical public origin for share / OG links (not preview or localhost). */
export function publicSiteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "https://www.glasshalffull.space";
}

/** Absolute URL for a site path, using the public origin when possible. */
export function absoluteSiteUrl(path: string) {
  return new URL(path, `${publicSiteOrigin()}/`).href;
}

/** Tag outbound http(s) links so destinations credit glasshalffull in analytics. */
export function withOutboundUtm(
  href: string,
  {
    campaign = "artist_profile",
    content,
  }: { campaign?: string; content?: string } = {},
) {
  try {
    const url = new URL(coerceWebsiteUrl(href));
    if (url.protocol !== "http:" && url.protocol !== "https:") return href;

    url.searchParams.set("utm_source", "glasshalffull");
    url.searchParams.set("utm_medium", "directory");
    url.searchParams.set("utm_campaign", campaign);
    if (content) url.searchParams.set("utm_content", content);

    return url.toString();
  } catch {
    return href;
  }
}
