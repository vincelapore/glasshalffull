"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Whole footer sits inside the viewport, including when it is taller than the screen. */
function isFooterFullyOnScreen(footer: Element) {
  const rect = footer.getBoundingClientRect();
  const viewHeight = window.innerHeight;
  if (rect.height <= viewHeight) {
    return rect.top >= 0 && rect.bottom <= viewHeight + 1;
  }
  return rect.bottom <= viewHeight + 1;
}

/** Slides the fixed bars off screen once the footer is fully in view. */
export function HideHeaderOnFooter() {
  const pathname = usePathname();

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const bars = () =>
      document.querySelectorAll<HTMLElement>(
        "[data-site-header], [data-admin-nav]"
      );

    let frame = 0;
    const update = () => {
      const hidden = isFooterFullyOnScreen(footer);
      bars().forEach((bar) => {
        bar.toggleAttribute("data-hidden", hidden);
        bar.inert = hidden;
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      bars().forEach((bar) => {
        bar.toggleAttribute("data-hidden", false);
        bar.inert = false;
      });
    };
  }, [pathname]);

  return null;
}
