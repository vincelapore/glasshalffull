import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { accountSettings } from "@/db/schema";
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
