"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const CHROME_SELECTOR = "[data-site-header], [data-admin-nav]";

/** Whole footer sits inside the viewport, including when it is taller than the screen. */
function isFooterFullyOnScreen(footer: Element) {
  const rect = footer.getBoundingClientRect();
  const viewHeight = window.innerHeight;
  if (rect.height <= viewHeight) {
    return rect.top >= -1 && rect.bottom <= viewHeight + 1;
  }
  // Tall footers can't fit — treat “scrolled to the end” as fully shown.
  return rect.bottom <= viewHeight + 1;
}

function isPageScrollable() {
  return document.documentElement.scrollHeight > window.innerHeight + 8;
}

/** True once the user has clearly scrolled back above the footer. */
function hasLeftFooter(footer: Element) {
  return footer.getBoundingClientRect().top > window.innerHeight * 0.45;
}

/**
 * Slides fixed chrome off screen once the footer is fully in view.
 * Stays hidden until the user scrolls back up (avoids desktop bottom-bounce flicker).
 */
export function HideHeaderOnFooter() {
  const pathname = usePathname();

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const bars = () =>
      document.querySelectorAll<HTMLElement>(CHROME_SELECTOR);

    let locked = false;
    let frame = 0;

    const apply = (hidden: boolean) => {
      bars().forEach((bar) => {
        bar.toggleAttribute("data-hidden", hidden);
        bar.inert = hidden;
      });
    };

    const update = () => {
      if (!isPageScrollable()) {
        locked = false;
        apply(false);
        return;
      }

      if (isFooterFullyOnScreen(footer)) {
        locked = true;
      } else if (hasLeftFooter(footer)) {
        locked = false;
      }

      apply(locked);
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
      apply(false);
    };
  }, [pathname]);

  return null;
}
