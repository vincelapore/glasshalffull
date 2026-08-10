import Link from "next/link";

import { MobileNav } from "@/components/mobile-nav";
import { navLinks } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="relative sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 font-heading text-sm font-semibold tracking-tight">
          Glass Half Full
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <MobileNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
