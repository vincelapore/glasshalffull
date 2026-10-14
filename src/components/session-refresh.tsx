"use client";

import { useEffect } from "react";

import { authClient } from "@/lib/auth/client";

/**
 * Remint Neon Auth session cookies via the Route Handler (/api/auth), where
 * Set-Cookie is allowed. Server Components call getSession with disableRefresh
 * so they never attempt cookie writes during render.
 */
export function SessionRefresh() {
  useEffect(() => {
    void authClient.getSession();
  }, []);

  return null;
}
