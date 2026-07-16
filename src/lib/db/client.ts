import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Server-only Drizzle client over the Supabase Postgres pooler. `prepare: false`
 * keeps it compatible with the transaction-mode pooler (which doesn't support
 * prepared statements). A single lazy connection is reused across the module.
 *
 * This client runs with the `postgres` role and BYPASSES Row-Level Security — use
 * it only in server code that has already authenticated the user and scopes every
 * query by `user_id`. User-facing reads that must honor RLS go through the Supabase
 * client (`createServerSupabase`) instead.
 */
declare global {
  // eslint-disable-next-line no-var
  var __getcitedPg: ReturnType<typeof postgres> | undefined;
}

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — add the Supabase pooler URL to .env.local");
  }
  return url;
}

const client =
  global.__getcitedPg ??
  postgres(connectionString(), { prepare: false, max: 5, idle_timeout: 20 });

if (process.env.NODE_ENV !== "production") {
  global.__getcitedPg = client;
}

export const db = drizzle(client, { schema });
export { schema };
