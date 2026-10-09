"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isProfileMenuLinkActive } from "@/components/profile-menu-items";
import { pageWidths } from "@/components/ui/page";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/submissions", label: "Moderation" },
  { href: "/admin/overflow", label: "Overflow" },
] as const;

export function AdminNav({ canManageTeam }: { canManageTeam: boolean }) {
  const pathname = usePathname();
  const links = canManageTeam
    ? [...adminLinks, { href: "/admin/team", label: "Team" }]
    : [...adminLinks];

  return (
    <>
      <div
        data-admin-nav
        className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background pt-[4.25rem] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] data-hidden:-translate-y-full motion-reduce:transition-none"
      >
        <nav
          aria-label="Admin"
          className={cn(
            "mx-auto flex gap-6 px-4 sm:px-6",
            pageWidths.narrow
          )}
        >
          {links.map((link) => {
            const active = isProfileMenuLinkActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 py-3 text-sm transition-colors",
                  active
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div aria-hidden className="h-[2.75rem]" />
    </>
  );
}
