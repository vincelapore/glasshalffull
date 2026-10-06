import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { exposeSecureCookies, needsHttpCookieShim } from "@/lib/auth/http-cookies";

/** Map HTTP-safe session cookies onto the names Neon Auth reads. No redirects. */
export function proxy(request: NextRequest) {
  if (!needsHttpCookieShim(request)) {
    return NextResponse.next();
  }

  const cookie = exposeSecureCookies(request.headers.get("cookie"));
  if (!cookie || cookie === request.headers.get("cookie")) {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);
  headers.set("cookie", cookie);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
