import { revalidateTag, unstable_cache } from "next/cache";

export const publicTags = {
  events: "public-events",
  creatives: "public-creatives",
  overflow: "public-overflow",
} as const;

export type PublicTag = (typeof publicTags)[keyof typeof publicTags];

const REVALIDATE_SECONDS = 300;

export function cachedPublic<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  key: string,
  tags: PublicTag[],
) {
  return unstable_cache(fn, [key], {
    revalidate: REVALIDATE_SECONDS,
    tags,
  });
}

/** Mark public directory caches stale. The next visit refreshes them. */
export function revalidatePublicTags(...tags: PublicTag[]) {
  for (const tag of new Set(tags)) {
    revalidateTag(tag, "max");
  }
}
