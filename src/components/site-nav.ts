export const publicNavLinks = [
  { href: "/events", label: "Events" },
  { href: "/creatives", label: "Creatives" },
  { href: "/about", label: "About" },
] as const;

export type NavLink = {
  href: string;
  label: string;
};

export const navLinks = publicNavLinks;

export const mobileNavEvents = {
  closeMenu: "ghf-close-mobile-nav",
  closeSearch: "ghf-close-nav-search",
} as const;
