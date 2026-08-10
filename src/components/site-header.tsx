import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/creatives", label: "Creatives" },
  { href: "/submit/event", label: "Submit Event" },
  { href: "/submit/creative", label: "Submit Profile" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="font-heading text-sm font-semibold tracking-tight">
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
        <ThemeToggle />
      </div>
    </header>
  );
}
