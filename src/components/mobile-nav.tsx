"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { pageWidths } from "@/components/ui/page";
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
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>

      {open ? (
        <nav
          id={panelId}
          className="glass-nav absolute inset-x-0 top-full px-4 py-3 sm:px-6"
        >
          <ul className={`mx-auto flex ${pageWidths.wide} flex-col gap-1`}>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-border/60 pt-2">
              {signedIn ? (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Sign out
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-1">
                  <Link
                    href="/auth/sign-in"
                    className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    Join
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
