import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

/** App-layer view of a config row (camelCase). */
export interface ConfigView {
  id: string;
  version: number;
  isActive: boolean;
  brandUrl: string;
  brandName: string | null;
  description: string | null;
  brandDomains: string[];
  competitors: string[];
  /** Parallel to competitors: matching domain per competitor ("" when unknown). */
  competitorDomains: string[];
  queries: string[];
  budgetUsd: number;
  teamSize: number;
  timelineWeeks: number;
  mode: string;
  platformOption: string | null;
  instanceUrl: string | null;
  createdAt: string;
}

export interface SaveConfigInput {
  brandUrl: string;
  brandName?: string | null;
  description?: string | null;
  brandDomains: string[];
  competitors: string[];
  competitorDomains: string[];
  queries: string[];
  budgetUsd: number;
  teamSize: number;
  timelineWeeks: number;
  mode: string;
  platformOption?: string | null;
  instanceUrl?: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(r: any): ConfigView {
  return {
    id: r.id,
    version: r.version,
    isActive: r.is_active,
    brandUrl: r.brand_url,
    brandName: r.brand_name,
    description: r.description,
    brandDomains: r.brand_domains ?? [],
    competitors: r.competitors ?? [],
    competitorDomains: r.competitor_domains ?? [],
    queries: r.queries ?? [],
    budgetUsd: r.budget_usd,
    teamSize: r.team_size,
    timelineWeeks: r.timeline_weeks,
    mode: r.mode,
    platformOption: r.platform_option,
    instanceUrl: r.instance_url,
    createdAt: r.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The user's active config (highest version), or null. RLS scopes to the user. */
export async function getActiveConfig(): Promise<ConfigView | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("configs")
    .select("*")
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

/** All config versions for the user, newest first. */
export async function listConfigVersions(): Promise<ConfigView[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("configs")
    .select("*")
    .order("version", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

/**
 * Save a new config version. FMEA #2/#3: INSERT the new active row FIRST, then
 * deactivate the others — so a failed insert leaves the previous active config intact
 * (no "lost config"). A unique (user_id, version) index (migration 0003) makes a
 * concurrent double-save fail on the loser instead of duplicating a version. `userId`
 * sets the RLS-checked owner column.
 */
export async function saveConfigVersion(
  userId: string,
  input: SaveConfigInput,
): Promise<ConfigView> {
  const supabase = await createServerSupabase();

  const { data: latest, error: latestErr } = await supabase
    .from("configs")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestErr) throw new Error(latestErr.message);
  const nextVersion = (latest?.version ?? 0) + 1;

  // 1) Insert the new active row first.
  const { data, error } = await supabase
    .from("configs")
    .insert({
      user_id: userId,
      version: nextVersion,
      is_active: true,
      brand_url: input.brandUrl,
      brand_name: input.brandName ?? null,
      description: input.description ?? null,
      brand_domains: input.brandDomains,
      competitors: input.competitors,
      competitor_domains: input.competitorDomains,
      queries: input.queries,
      budget_usd: input.budgetUsd,
      team_size: input.teamSize,
      timeline_weeks: input.timelineWeeks,
      mode: input.mode,
      platform_option: input.platformOption ?? null,
      instance_url: input.instanceUrl ?? null,
    })
    .select("*")
    .single();
  if (error) {
    // 23505 = unique_violation → a concurrent save grabbed this version.
    if ((error as { code?: string }).code === "23505") {
      throw new Error("Another save just happened — please try again.");
    }
    throw new Error(error.message);
  }

  // 2) Deactivate every OTHER active row (the previous active version(s)).
  const { error: deactivateErr } = await supabase
    .from("configs")
    .update({ is_active: false })
    .eq("is_active", true)
    .neq("id", data.id);
  // Non-fatal: the new row has the highest version so getActiveConfig still resolves
  // to it; a stale extra active row will be tidied on the next successful save.
  if (deactivateErr) {
    console.error("[configs] deactivate-others failed (non-fatal):", deactivateErr.message);
  }

  return mapRow(data);
}
