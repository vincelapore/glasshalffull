"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * The base pixel already records the first PageView. App Router navigations
 * do not re-run that script, so later URL changes send their own PageView.
 */
export function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipInitial = useRef(true);
  const search = searchParams.toString();

  useEffect(() => {
    if (skipInitial.current) {
      skipInitial.current = false;
      return;
    }

    const fbq = (
      window as Window & { fbq?: (...args: unknown[]) => void }
    ).fbq;
    fbq?.("track", "PageView");
  }, [pathname, search]);

  return null;
}
