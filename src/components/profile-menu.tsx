"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChartColumn,
  Clapperboard,
  Eye,
  LogOut,
  Shield,
  UserRoundPen,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import type { LucideIcon } from "lucide-react";

import { signOutAction } from "@/app/actions/auth";
import { ExternalImage } from "@/components/media/external-image";
import {
  getProfileMenuLinks,
  isProfileMenuLinkActive,
  type ProfileMenuIconName,
  type ProfileMenuLinkItem,
} from "@/components/profile-menu-items";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function subscribe() {
  return () => {};
}

const menuIcons: Record<ProfileMenuIconName, LucideIcon> = {
  profile: UserRoundPen,
  events: CalendarDays,
  view: Eye,
  moderation: Shield,
  overflow: Clapperboard,
  team: Users,
  analytics: ChartColumn,
};

export type ProfileMenuProps = {
  name: string;
  email: string;
  avatarUrl?: string;
  needsEssentials?: boolean;
  publicProfileHref?: string;
  canModerate: boolean;
  canManageTeam: boolean;
};

function AttentionBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold leading-none text-white",
        className
      )}
      aria-hidden
    >
      !
    </span>
  );
}

export function ProfileMenu({
  name,
  email,
  avatarUrl,
  needsEssentials = false,
  publicProfileHref,
  canModerate,
  canManageTeam,
}: ProfileMenuProps) {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const displayName = name.trim() || email.trim() || "Account";
  const initial = displayName.slice(0, 1).toUpperCase();
  const { account, staff } = getProfileMenuLinks({
    publicProfileHref,
    canModerate,
    canManageTeam,
  });
  const avatar = (
    <span className="relative flex size-8 items-center justify-center">
      <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-foreground ring-1 ring-border">
        <ExternalImage
          src={avatarUrl}
          alt=""
          className="size-8 object-cover"
          fallback={<span aria-hidden="true">{initial}</span>}
        />
      </span>
      {needsEssentials ? (
        <AttentionBadge className="absolute -right-0.5 -top-0.5 ring-2 ring-background" />
      ) : null}
    </span>
  );

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label={
          needsEssentials
            ? "Account menu: profile needs attention"
            : "Account menu"
        }
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "rounded-full"
        )}
      >
        {avatar}
      </button>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        openOnHover
        delay={0}
        closeDelay={120}
        aria-label={
          needsEssentials
            ? `Account menu for ${displayName}: profile needs attention`
            : `Account menu for ${displayName}`
        }
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "rounded-full"
        )}
      >
        {avatar}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[60] w-60 p-1.5"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 font-normal">
            <span className="block truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            {email && email !== displayName ? (
              <span className="block truncate text-xs text-muted-foreground">
                {email}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {needsEssentials ? (
          <>
            <DropdownMenuSeparator />
            <div className="mx-1 rounded-lg border border-destructive/35 bg-destructive/10 px-2.5 py-2">
              <p className="flex items-start gap-2 text-xs leading-snug text-destructive">
                <AttentionBadge className="mt-0.5 shrink-0" />
                <span>
                  Profile isn’t public yet. Add a bio, profile picture, and work
                  photo.
                </span>
              </p>
              <Link
                href="/account"
                className="mt-1.5 block text-xs font-medium text-destructive underline-offset-2 hover:underline"
              >
                Finish essentials
              </Link>
            </div>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {account.map((item) => (
            <ProfileMenuLink
              key={item.href}
              item={item}
              active={isProfileMenuLinkActive(pathname, item.href)}
              attention={needsEssentials && item.href === "/account"}
            />
          ))}
        </DropdownMenuGroup>
        {staff.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {staff.map((item) => (
                <ProfileMenuLink
                  key={item.href}
                  item={item}
                  active={isProfileMenuLinkActive(pathname, item.href)}
                />
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem
            nativeButton
            render={<button type="submit" />}
            className="w-full px-2 py-1.5"
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileMenuLink({
  item,
  active,
  attention = false,
}: {
  item: ProfileMenuLinkItem;
  active: boolean;
  attention?: boolean;
}) {
  const Icon = menuIcons[item.icon];

  return (
    <DropdownMenuItem
      render={<Link href={item.href} />}
      className={cn(
        "px-2 py-1.5",
        active && "bg-muted text-foreground",
        attention && "text-destructive focus:text-destructive"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon />
      <span className="flex-1">{item.label}</span>
      {attention ? <AttentionBadge /> : null}
    </DropdownMenuItem>
  );
}
