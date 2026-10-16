import type { EventListingOrganiser } from "@/components/event-listing";
import type { Event } from "@/db/schema";

/** Fully filled fixture for `/creatives/example` — not stored in the database. */
export const exampleCreative = {
  slug: "example",
  name: "Riley Chen",
  pronouns: "they/them",
  city: "meanjin" as const,
  disciplines: ["music", "performance"] as Array<
    "music" | "performance"
  >,
  roles: ["dj", "musician", "producer"] as Array<
    "dj" | "musician" | "producer"
  >,
  specialty: "Warehouse sets",
  isQueer: true,
  bio: "Brisbane / Meanjin selector and producer. Late-night warehouse sets, leftfield club edits, and collaborative live shows across Meanjin and Naarm.\n\nOpen to paid club bookings, festival stages, and trade on the right bill.",
  socials: [
    { provider: "instagram" as const, url: "https://instagram.com/glasshalffull" },
    { provider: "website" as const, url: "https://example.com" },
    { provider: "spotify" as const, url: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02" },
    { provider: "bandcamp" as const, url: "https://girlpool.bandcamp.com" },
    { provider: "soundcloud" as const, url: "https://soundcloud.com/forss" },
    { provider: "youtube" as const, url: "https://www.youtube.com/@YouTube" },
  ],
  contactEmail: "bookings@example.com",
  openToPaidWork: true,
  openToTrade: true,
  buildingPortfolio: false,
  avatarSrc:
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=640&h=640&q=80",
  workPhotoSrcs: [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&h=1200&q=80",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&h=1200&q=80",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&h=1200&q=80",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&h=1200&q=80",
  ],
  /** YouTube + Vimeo — resolved by the real media helpers. */
  videoUrls: [
    "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    "https://vimeo.com/148751763",
  ],
  /**
   * Real listen hosts. Profiles store at most 3; the showcase passes all four
   * so you can compare Spotify, Apple Music, SoundCloud, and Bandcamp together.
   */
  audioUrls: [
    "https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl",
    "https://music.apple.com/us/album/anti-hero/1649644718?i=1649644722",
    "https://soundcloud.com/forss/flickermood",
    "https://girlpool.bandcamp.com/track/one-for-the-angels",
  ],
} as const;

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(21, 0, 0, 0);
  return date;
}

export const exampleUpcomingEvents: Array<{
  event: Pick<
    Event,
    "slug" | "title" | "dateTime" | "location" | "categories" | "flyerKey"
  >;
  flyerSrc: string;
  roleNote: string;
  organisers: EventListingOrganiser[];
}> = [
  {
    event: {
      slug: "example-afterhours",
      title: "Afterhours at The Loft",
      dateTime: daysFromNow(12),
      location: "The Loft, West End",
      categories: ["music"],
      flyerKey: null,
    },
    flyerSrc:
      "https://images.unsplash.com/photo-1571266028247-d9173275acd5?auto=format&fit=crop&w=1200&h=750&q=80",
    roleNote: "DJ",
    organisers: [
      {
        id: "example-organiser",
        name: "Riley Chen",
        avatarKey: null,
      },
    ],
  },
  {
    event: {
      slug: "example-day-party",
      title: "Sunday Day Party",
      dateTime: daysFromNow(26),
      location: "Courtyard, Fortitude Valley",
      categories: ["music", "community"],
      flyerKey: null,
    },
    flyerSrc:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&h=750&q=80",
    roleNote: "Performer",
    organisers: [],
  },
];
