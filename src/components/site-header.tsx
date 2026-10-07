import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { MobileNav } from "@/components/mobile-nav";
import { NavSearch, NavSearchSkeleton } from "@/components/nav-search";
import { ProfileMenu } from "@/components/profile-menu";
import { publicNavLinks } from "@/components/site-nav";
import { pageWidths } from "@/components/ui/page";
import { getSessionUser, getStaffRole } from "@/lib/admin";
import { mediaUrl } from "@/lib/media";
import { creativePath } from "@/lib/paths";
import { getCreativeByUserId } from "@/lib/queries";

export async function SiteHeader() {
  const user = await getSessionUser();
  const [profile, role] = user
    ? await Promise.all([
        getCreativeByUserId(user.id),
        getStaffRole(user.email),
      ])
    : [null, null];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50">
      <div
        className={`mx-auto flex h-14 ${pageWidths.wide} items-center gap-4 px-4 sm:px-6`}
      >
        <Link
          href="/"
          aria-label="Glass Half Full"
          className="pointer-events-auto shrink-0"
        >
          <Image
            src="/mark.png"
            alt=""
            width={552}
            height={608}
            priority
            className="h-8 w-auto drop-shadow-[0_0_10px_var(--background)] dark:invert"
          />
        </Link>

        <div className="pointer-events-auto hidden shrink-0 lg:block">
          <Suspense fallback={<NavSearchSkeleton />}>
            <NavSearch />
          </Suspense>
        </div>

        <nav className="pointer-events-auto ml-auto hidden items-center gap-5 text-sm text-muted-foreground [text-shadow:0_0_12px_var(--background),0_0_4px_var(--background)] lg:flex">
          {publicNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {user ? null : (
            <Link
              href="/auth/sign-in"
              className="text-foreground transition-opacity hover:opacity-60"
            >
              Sign in
            </Link>
          )}
        </nav>

        <div className="pointer-events-auto relative ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
          <MobileNav links={[...publicNavLinks]} signedIn={Boolean(user)} />
          {user ? (
            <ProfileMenu
              name={user.name ?? ""}
              email={user.email ?? ""}
              avatarUrl={mediaUrl(profile?.avatarKey)}
              publicProfileHref={
                profile?.status === "approved"
                  ? creativePath(profile.slug)
                  : undefined
              }
              canModerate={role === "admin" || role === "owner"}
              canManageTeam={role === "owner"}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
