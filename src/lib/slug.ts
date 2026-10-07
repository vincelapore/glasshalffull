import { and, eq, like, ne, or } from "drizzle-orm";

import { db } from "@/db";
import { creatives, events, overflowEpisodes } from "@/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function slugify(input: string, fallback: string) {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug || fallback;
}

async function nextUniqueSlug(
  table: typeof creatives | typeof events | typeof overflowEpisodes,
  base: string,
  excludeId?: string
) {
  const conditions = [or(eq(table.slug, base), like(table.slug, `${base}-%`))];

  if (excludeId) {
    conditions.push(ne(table.id, excludeId));
  }

  const rows = await db
    .select({ slug: table.slug })
    .from(table)
    .where(and(...conditions));

  const taken = new Set(rows.map((row) => row.slug));

  if (!taken.has(base)) return base;

  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }

  throw new Error("Could not allocate a unique slug");
}

export async function uniqueCreativeSlug(name: string, excludeId?: string) {
  return nextUniqueSlug(creatives, slugify(name, "creative"), excludeId);
}

export async function uniqueEventSlug(title: string, excludeId?: string) {
  return nextUniqueSlug(events, slugify(title, "event"), excludeId);
}

export async function uniqueOverflowSlug(title: string, excludeId?: string) {
  return nextUniqueSlug(overflowEpisodes, slugify(title, "overflow"), excludeId);
}
