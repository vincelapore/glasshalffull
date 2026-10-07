"use client";

import Link from "next/link";
import {
  CalendarDays,
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
  team: Users,
};

export type ProfileMenuProps = {
  name: string;
  email: string;
  avatarUrl?: string;
  publicProfileHref?: string;
  canModerate: boolean;
  canManageTeam: boolean;
};

export function ProfileMenu({
  name,
  email,
  avatarUrl,
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
    <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-foreground ring-1 ring-border">
      <ExternalImage
        src={avatarUrl}
        alt=""
        className="size-8 object-cover"
        fallback={<span aria-hidden="true">{initial}</span>}
      />
    </span>
  );

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Account menu"
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
        aria-label={`Account menu for ${displayName}`}
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
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {account.map((item) => (
            <ProfileMenuLink
              key={item.href}
              item={item}
              active={isProfileMenuLinkActive(pathname, item.href)}
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
}: {
  item: ProfileMenuLinkItem;
  active: boolean;
}) {
  const Icon = menuIcons[item.icon];

  return (
    <DropdownMenuItem
      render={<Link href={item.href} />}
      className={cn(
        "px-2 py-1.5",
        active && "bg-muted text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon />
      {item.label}
    </DropdownMenuItem>
  );
}
