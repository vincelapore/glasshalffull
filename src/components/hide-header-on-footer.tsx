"use client";

import { useEffect } from "react";

/** Slides the fixed header off screen while the footer is in view. */
export function HideHeaderOnFooter() {
  useEffect(() => {
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    if (!header || !footer) return;

    const observer = new IntersectionObserver(([entry]) => {
      const hidden = entry.isIntersecting;
      header.toggleAttribute("data-hidden", hidden);
      header.inert = hidden;
    });

    observer.observe(footer);
    return () => {
      observer.disconnect();
      header.toggleAttribute("data-hidden", false);
      header.inert = false;
    };
  }, []);

  return null;
}
