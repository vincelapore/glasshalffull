import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDbClient> | undefined;
};

function createDbClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local."
    );
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = createDbClient();
  }

  return globalForDb.db;
}

/** Prefer `getDb()` in server actions/routes. Alias kept for convenience. */
export const db = new Proxy({} as ReturnType<typeof createDbClient>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Database = ReturnType<typeof createDbClient>;
