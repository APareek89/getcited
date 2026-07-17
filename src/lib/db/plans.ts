import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ChosenTactic, Projection } from "@/lib/geo/plan";

export interface SavePlanInput {
  userId: string;
  configId: string | null;
  configVersion: number | null;
  runId: string | null;
  tactics: ChosenTactic[];
  projection: Projection;
  /** Legacy plans store RoadmapWeek[]; current ones store {weeks, guidelines}. */
  roadmap?: unknown | null;
}

export interface PlanView {
  id: string;
  tactics: ChosenTactic[];
  projection: Projection | null;
  roadmap: unknown | null;
  targetCitationShare: number | null;
  timelineWeeks: number | null;
  confidence: string | null;
  createdAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapPlan(r: any): PlanView {
  return {
    id: r.id,
    tactics: (r.tactics ?? []) as ChosenTactic[],
    projection: (r.projection ?? null) as Projection | null,
    roadmap: (r.roadmap ?? null) as unknown | null,
    targetCitationShare: r.target_citation_share,
    timelineWeeks: r.timeline_weeks,
    confidence: r.confidence,
    createdAt: r.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function savePlan(input: SavePlanInput): Promise<PlanView> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("plans")
    .insert({
      user_id: input.userId,
      config_id: input.configId,
      config_version: input.configVersion,
      run_id: input.runId,
      tactics: input.tactics,
      projection: input.projection,
      roadmap: input.roadmap ?? null,
      target_citation_share: input.projection.targetCitationShare,
      timeline_weeks: input.projection.timelineWeeks,
      confidence: input.projection.confidence,
    })
    .select("*")
    .single();
  if (error) throw new Error(`savePlan failed: ${error.message}`);
  return mapPlan(data);
}

export async function getLatestPlan(): Promise<PlanView | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPlan(data) : null;
}

export async function getPlanById(id: string): Promise<PlanView | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPlan(data) : null;
}

export async function listPlans(limit = 12): Promise<PlanView[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPlan);
}
