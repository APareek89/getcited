/**
 * Read-only DB sanity check: lists our public tables, whether RLS is enabled, and
 * how many policies each has. Run: `pnpm exec tsx scripts/db-check.ts`.
 * Never prints secrets.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    const rows = await sql<{ table: string; rls: boolean; policies: number }[]>`
      SELECT c.relname AS table,
             c.relrowsecurity AS rls,
             (SELECT count(*) FROM pg_policies p
                WHERE p.schemaname = 'public' AND p.tablename = c.relname)::int AS policies
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname;
    `;
    const trig = await sql<{ ok: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
      ) AS ok;
    `;
    console.log("public tables:", rows.length);
    for (const r of rows) {
      console.log(`  ${r.table.padEnd(20)} rls=${r.rls ? "on " : "OFF"} policies=${r.policies}`);
    }
    console.log("on_auth_user_created trigger present:", trig[0]?.ok);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("db-check failed:", e.message);
  process.exit(1);
});
