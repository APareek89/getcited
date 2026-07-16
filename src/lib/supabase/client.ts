"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components (browser). Uses the public anon/publishable
 * key only — never the service role. Safe to import into "use client" modules.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
