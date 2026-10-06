import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { creatives } from "@/db/schema";
import {
  isWorkKeyOwnedBy,
  MAX_WORK_PHOTOS,
  workKeyPattern,
} from "@/lib/media";
import { deleteMediaObjects } from "@/lib/r2";

type AcceptedKeys =
  | { ok: true; keys: string[]; removed: string[] }
  | { ok: false; message: string };

/**
 * Keep keys the profile already had, plus new keys uploaded by this account.
 * `removed` is safe to delete only after the new list is stored.
 */
export async function resolveWorkPhotoKeys(options: {
  creativeId: string | null;
  nextKeys: string[];
  actorUserId: string;
}): Promise<AcceptedKeys> {
  if (options.nextKeys.length > MAX_WORK_PHOTOS) {
    return { ok: false, message: "You can add up to 6 photos." };
  }

  let previous: string[] = [];
  if (options.creativeId) {
    const [row] = await db
      .select({ keys: creatives.workPhotoKeys })
      .from(creatives)
      .where(eq(creatives.id, options.creativeId))
      .limit(1);
    previous = row?.keys ?? [];
  }

  const alreadyStored = new Set(previous);
  const keys: string[] = [];

  for (const key of options.nextKeys) {
    if (keys.includes(key)) continue;
    if (!workKeyPattern.test(key)) {
      return { ok: false, message: "Upload a valid photo." };
    }
    if (!alreadyStored.has(key) && !isWorkKeyOwnedBy(key, options.actorUserId)) {
      return { ok: false, message: "Upload a valid photo." };
    }
    keys.push(key);
  }

  const kept = new Set(keys);
  return {
    ok: true,
    keys,
    removed: previous.filter((key) => !kept.has(key)),
  };
}

async function findReferencedWorkPhotoKeys(keys: string[]) {
  const rows = await db
    .select({ keys: creatives.workPhotoKeys })
    .from(creatives)
    .where(
      sql`${creatives.workPhotoKeys} && ARRAY[${sql.join(
        keys.map((key) => sql`${key}`),
        sql`, `
      )}]::text[]`
    );

  const looking = new Set(keys);
  const referenced = new Set<string>();
  for (const row of rows) {
    for (const key of row.keys) {
      if (looking.has(key)) referenced.add(key);
    }
  }
  return referenced;
}

/** Delete objects no profile still points at. Failures are logged, not thrown. */
export async function releaseWorkPhotoKeys(keys: string[]) {
  const candidates = keys.filter((key) => workKeyPattern.test(key));
  if (candidates.length === 0) return;

  try {
    const referenced = await findReferencedWorkPhotoKeys(candidates);
    const stale = candidates.filter((key) => !referenced.has(key));
    await deleteMediaObjects(stale);
  } catch (error) {
    console.error("releaseWorkPhotoKeys", error);
  }
}
