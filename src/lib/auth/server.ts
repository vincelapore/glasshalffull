import { createNeonAuth } from "@neondatabase/auth/next/server";

const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    sameSite: "lax",
  },
});

function isCookieMutationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Cookies can only be modified")
  );
}

const originalGetSession = neonAuth.getSession.bind(neonAuth);

/**
 * RSC can read cookies but cannot write them. Neon Auth's getSession may try to
 * refresh the session_data cookie after its TTL; that throws in a Server Component
 * and takes down the whole page (React #441 / digest Cookies can only be modified…).
 *
 * Read sessions without refresh. Cookie reminting still happens via /api/auth
 * (Route Handler) when the client hits auth endpoints.
 */
neonAuth.getSession = ((...args: Parameters<typeof originalGetSession>) => {
  const [input, fetchOptions] = args;
  const base =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const existingQuery =
    base.query && typeof base.query === "object"
      ? (base.query as Record<string, unknown>)
      : {};

  const nextInput = {
    ...base,
    query: {
      ...existingQuery,
      disableRefresh: true,
    },
  } as Parameters<typeof originalGetSession>[0];

  return originalGetSession(nextInput, fetchOptions).catch((error: unknown) => {
    if (isCookieMutationError(error)) {
      console.warn("[auth] getSession skipped cookie write during render");
      return { data: null, error: null };
    }
    throw error;
  });
}) as typeof neonAuth.getSession;

export const auth = neonAuth;
