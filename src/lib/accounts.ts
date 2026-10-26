import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { accountSettings } from "@/db/schema";
import { cachedPublic, publicTags } from "@/lib/public-cache";
import { isUuid } from "@/lib/slug";

export type AccountRecord = {
  id: string;
  name: string;
  email: string;
};

/** Signed-up accounts. Admin access is granted from this list, not a typed email. */
export async function listAccounts() {
  const result = await db.execute<AccountRecord>(sql`
    select id::text as id, name, lower(email) as email
    from neon_auth."user"
    where coalesce(banned, false) = false
    order by lower(name), lower(email)
  `);

  return result.rows;
}

export async function getAccountsByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(isUuid))];
  if (unique.length === 0) return [];

  const result = await db.execute<AccountRecord>(sql`
    select id::text as id, name, lower(email) as email
    from neon_auth."user"
    where coalesce(banned, false) = false
      and id in (${sql.join(
        unique.map((id) => sql`${id}::uuid`),
        sql`, `
      )})
  `);

  return result.rows;
}

/** Missing settings mean the account is public. */
export async function getAccountVisibility(userId: string) {
  const [row] = await db
    .select({ isPublic: accountSettings.isPublic })
    .from(accountSettings)
    .where(eq(accountSettings.userId, userId))
    .limit(1);

  return row?.isPublic ?? true;
}

/** Same lookup, cached for public profile pages. */
export async function getPublicAccountVisibility(userId: string) {
  return cachedAccountVisibility(userId);
}

/** Account name and email shown on a public profile. */
export async function getPublicAccountContact(userId: string) {
  return cachedPublicAccountContact(userId);
}

const cachedAccountVisibility = cachedPublic(
  async (userId: string) => getAccountVisibility(userId),
  "account-visibility",
  [publicTags.creatives],
);

const cachedPublicAccountContact = cachedPublic(
  async (userId: string) => {
    const [account] = await getAccountsByIds([userId]);
    return account ?? null;
  },
  "public-account-contact",
  [publicTags.creatives],
);
