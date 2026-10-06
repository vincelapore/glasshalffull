export const publicNavLinks = [
  { href: "/events", label: "Events" },
  { href: "/creatives", label: "Creatives" },
] as const;

export type NavLink = {
  href: string;
  label: string;
};

export const navLinks = publicNavLinks;
