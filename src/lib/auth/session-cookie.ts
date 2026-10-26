import { cookies } from "next/headers";

const AUTH_COOKIE_PREFIXES = ["__Secure-neon-auth", "neon-auth"] as const;

/** True when the request might have a Neon Auth session. Does not query Postgres. */
export async function hasAuthSessionCookie() {
  const store = await cookies();
  return store.getAll().some((cookie) =>
    AUTH_COOKIE_PREFIXES.some((prefix) => cookie.name.startsWith(prefix)),
  );
}
