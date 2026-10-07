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
