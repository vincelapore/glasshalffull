export type ProfileMenuIconName =
  | "profile"
  | "events"
  | "view"
  | "moderation"
  | "overflow"
  | "team"
  | "analytics";

export type ProfileMenuLinkItem = {
  href: string;
  label: string;
  icon: ProfileMenuIconName;
};

const adminStaffRoots = [
  "/admin/team",
  "/admin/overflow",
  "/admin/analytics",
] as const;

export function getProfileMenuLinks(options: {
  publicProfileHref?: string;
  canModerate: boolean;
  canManageTeam: boolean;
}): { account: ProfileMenuLinkItem[]; staff: ProfileMenuLinkItem[] } {
  const account: ProfileMenuLinkItem[] = [
    { href: "/account", label: "Edit profile", icon: "profile" },
    { href: "/account/events", label: "Events", icon: "events" },
  ];

  if (options.publicProfileHref) {
    account.push({
      href: options.publicProfileHref,
      label: "View profile",
      icon: "view",
    });
  }

  const staff: ProfileMenuLinkItem[] = [];

  if (options.canModerate) {
    staff.push(
      {
        href: "/admin/submissions",
        label: "Moderation",
        icon: "moderation",
      },
      {
        href: "/admin/overflow",
        label: "Overflow",
        icon: "overflow",
      }
    );
  }

  if (options.canManageTeam) {
    staff.push({
      href: "/admin/team",
      label: "Team",
      icon: "team",
    });
  }

  if (options.canModerate) {
    staff.push({
      href: "/admin/analytics",
      label: "Analytics",
      icon: "analytics",
    });
  }

  return { account, staff };
}

export function isProfileMenuLinkActive(pathname: string, href: string) {
  if (href === "/admin/submissions") {
    return (
      pathname.startsWith("/admin") &&
      !adminStaffRoots.some((root) => pathname.startsWith(root))
    );
  }

  if (href === "/admin/overflow") {
    return pathname.startsWith("/admin/overflow");
  }

  if (href === "/admin/analytics") {
    return pathname.startsWith("/admin/analytics");
  }

  if (href === "/account") {
    return pathname === "/account";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
