const SECURE_PREFIX = "__Secure-neon-auth";
const HTTP_PREFIX = "neon-auth";

/** True when the browser would refuse Neon's `__Secure-` session cookies. */
export function needsHttpCookieShim(request: Request) {
  if (process.env.NODE_ENV === "production") return false;
  return new URL(request.url).protocol === "http:";
}

/** Browser cookies `neon-auth.*` → SDK names `__Secure-neon-auth.*`. */
export function exposeSecureCookies(cookieHeader: string | null) {
  if (!cookieHeader) return cookieHeader;
  const extras: string[] = [];
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${HTTP_PREFIX}.`)) {
      extras.push(`${SECURE_PREFIX}${trimmed.slice(HTTP_PREFIX.length)}`);
    }
  }
  if (extras.length === 0) return cookieHeader;
  return `${cookieHeader}; ${extras.join("; ")}`;
}

/** SDK Set-Cookie `__Secure-…; Secure` → names the HTTP browser will keep. */
export function toHttpSetCookie(header: string) {
  return header
    .replaceAll(SECURE_PREFIX, HTTP_PREFIX)
    .replace(/;\s*Secure/gi, "")
    .replace(/;\s*Partitioned/gi, "");
}

export async function withHttpCookies(request: Request, response: Response) {
  if (!needsHttpCookieShim(request)) return response;

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  if (setCookies.length === 0) return response;

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  for (const cookie of setCookies) {
    headers.append("set-cookie", toHttpSetCookie(cookie));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
