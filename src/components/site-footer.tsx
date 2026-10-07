import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { pageWidths } from "@/components/ui/page";

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <div
        className={`mx-auto flex ${pageWidths.wide} items-center justify-between gap-4 px-4 py-8 sm:px-6`}
      >
        <p className="text-sm text-muted-foreground">
          Glass Half Full
          <span className="hidden sm:inline"> · Meanjin and Naarm</span>
        </p>
        <div className="flex items-center gap-1">
          <Link
            href="/about"
            className="px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
