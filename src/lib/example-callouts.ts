import { exampleCreative } from "@/lib/example-creative";
import {
  calloutDaysLeftLabel,
  type CalloutCity,
  type CalloutKind,
  type CalloutRoleChoice,
} from "@/lib/callouts";

export type ExampleCalloutRole = {
  id: string;
  role: CalloutRoleChoice;
  kind: CalloutKind;
};

export type ExampleCalloutPoster = {
  name: string;
  city: CalloutCity;
  avatarSrc: string;
  /** Public profile, when this sample has one. */
  href: string | null;
};

export type ExampleCallout = {
  id: string;
  body: string;
  daysLeft: string;
  poster: ExampleCalloutPoster;
  roles: ExampleCalloutRole[];
};

export type ExampleCalloutInterest = {
  id: string;
  roleId: string;
  name: string;
  city: CalloutCity;
  roles: CalloutRoleChoice[];
  avatarSrc: string;
  profileHref: string;
};

const portrait = (photo: string) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=240&h=240&q=80`;

export const exampleCallouts: ExampleCallout[] = [
  {
    id: "riley-friday",
    body: "Warehouse set next Friday in West End. I need a vocalist for two songs, and someone to film the room. Small, loud, late.",
    daysLeft: calloutDaysLeftLabel(5),
    poster: {
      name: exampleCreative.name,
      city: exampleCreative.city,
      avatarSrc: exampleCreative.avatarSrc,
      href: "/creatives/example",
    },
    roles: [
      { id: "riley-musician", role: "musician", kind: "paid" },
      { id: "riley-filmmaker", role: "filmmaker", kind: "portfolio" },
      { id: "riley-dancer", role: "dancer", kind: "trade" },
    ],
  },
  {
    id: "alex-lookbook",
    body: "Saturday lookbook in Collingwood. Natural light, two hours, you keep the pictures.",
    daysLeft: calloutDaysLeftLabel(2),
    poster: {
      name: "Alex Moreau",
      city: "naarm",
      avatarSrc: portrait("photo-1534528741775-53994a69daeb"),
      href: null,
    },
    roles: [
      { id: "alex-photographer", role: "photographer", kind: "paid" },
      { id: "alex-model", role: "model", kind: "trade" },
      { id: "alex-makeup", role: "makeup", kind: "portfolio" },
    ],
  },
  {
    id: "priya-flash",
    body: "Flash day at the studio on Sunday. Looking for another artist to split the room and trade a piece.",
    daysLeft: calloutDaysLeftLabel(6),
    poster: {
      name: "Priya Shah",
      city: "meanjin",
      avatarSrc: portrait("photo-1531123897727-8f129e1688ce"),
      href: null,
    },
    roles: [{ id: "priya-tattoo", role: "tattoo_artist", kind: "trade" }],
  },
  {
    id: "jordan-poster",
    body: "Poster and a few photos for a community night next week. Design is paid. Photos can be for your portfolio if you want the credit.",
    daysLeft: calloutDaysLeftLabel(1),
    poster: {
      name: "Jordan Blake",
      city: "boorloo",
      avatarSrc: portrait("photo-1506794778202-cad84cf45f1d"),
      href: null,
    },
    roles: [
      { id: "jordan-designer", role: "designer", kind: "paid" },
      { id: "jordan-photographer", role: "photographer", kind: "portfolio" },
    ],
  },
];

/** Hands raised on Riley’s callout. Profile links open the example page, where the work lives. */
export const exampleCalloutInterests: ExampleCalloutInterest[] = [
  {
    id: "sam",
    roleId: "riley-musician",
    name: "Sam Okonkwo",
    city: "meanjin",
    roles: ["musician", "producer"],
    avatarSrc: portrait("photo-1500648767791-00dcc994a43e"),
    profileHref: "/creatives/example",
  },
  {
    id: "jules",
    roleId: "riley-musician",
    name: "Jules Park",
    city: "naarm",
    roles: ["musician"],
    avatarSrc: portrait("photo-1524504388940-b1c1722653e1"),
    profileHref: "/creatives/example",
  },
  {
    id: "noor",
    roleId: "riley-filmmaker",
    name: "Noor Ali",
    city: "meanjin",
    roles: ["filmmaker"],
    avatarSrc: portrait("photo-1544005313-94ddf0286df2"),
    profileHref: "/creatives/example",
  },
];

export function exampleCalloutById(id: string) {
  return exampleCallouts.find((callout) => callout.id === id) ?? null;
}
