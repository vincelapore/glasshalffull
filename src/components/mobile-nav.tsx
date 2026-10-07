"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Suspense, useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";

import { NavSearch, NavSearchSkeleton } from "@/components/nav-search";
import { Button } from "@/components/ui/button";
import type { NavLink } from "@/components/site-nav";

type MobileNavProps = {
  links: NavLink[];
  signedIn: boolean;
};

export function MobileNav({ links, signedIn }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="drop-shadow-[0_0_8px_var(--background)]"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>

      {open ? (
        <nav
          id={panelId}
          className="absolute top-full right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl bg-background/95 p-3 shadow-lg ring-1 ring-foreground/10 backdrop-blur-md"
        >
          <div>
            <Suspense fallback={<NavSearchSkeleton className="lg:hidden" />}>
              <NavSearch className="max-w-full lg:hidden" />
            </Suspense>
            <ul className="mt-3 flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {signedIn ? null : (
                <li className="mt-1 border-t border-border/60 pt-1">
                  <Link
                    href="/auth/sign-in"
                    className="block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
