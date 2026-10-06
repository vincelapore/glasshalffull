import Link from "next/link";

import { signOutAction } from "@/app/actions/auth";
import { MobileNav } from "@/components/mobile-nav";
import { publicNavLinks, type NavLink } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSessionUser, isAdminEmail, isOwnerEmail } from "@/lib/admin";

export async function SiteHeader() {
  const user = await getSessionUser();
  const admin = await isAdminEmail(user?.email);
  const owner = await isOwnerEmail(user?.email);

  const links: NavLink[] = [
    ...publicNavLinks,
    ...(user ? [{ href: "/account", label: "Account" }] : []),
    ...(admin ? [{ href: "/admin/submissions", label: "Moderation" }] : []),
    ...(owner ? [{ href: "/admin/team", label: "Team" }] : []),
  ];

  return (
    <header className="relative sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 font-heading text-sm font-semibold tracking-tight"
        >
          Glass Half Full
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
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
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/auth/sign-in" />}
                >
                  Sign in
                </Button>
                <Button size="sm" render={<Link href="/auth/sign-up" />}>
                  Join
                </Button>
              </>
            )}
          </div>
          <MobileNav links={links} signedIn={Boolean(user)} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
