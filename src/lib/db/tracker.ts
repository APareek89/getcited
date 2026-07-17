import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { trackerRowsFromRoadmap } from "@/lib/geo/schedule";
import type { PlanView } from "@/lib/db/plans";

export const TRACKER_STATUSES = ["not_started", "in_progress", "done", "blocked"] as const;
export type TrackerStatus = (typeof TRACKER_STATUSES)[number];

export function isTrackerStatus(s: string): s is TrackerStatus {
  return (TRACKER_STATUSES as readonly string[]).includes(s);
}

export interface TrackerItemView {
  id: string;
  planId: string;
  week: number;
  dueDate: string; // yyyy-mm-dd
  action: string;
  ownerRole: string | null;
  hours: number | null;
  deliverable: string | null;
  status: TrackerStatus;
  remarks: string | null;
  updatedAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapItem(r: any): TrackerItemView {
  return {
    id: r.id,
    planId: r.plan_id,
    week: r.week,
    dueDate: r.due_date,
    action: r.action,
    ownerRole: r.owner_role,
    hours: r.hours,
    deliverable: r.deliverable,
    status: r.status,
    remarks: r.remarks,
    updatedAt: r.updated_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Populate tracker_items from an approved plan's roadmap. Idempotent: a plan that
 * already has items is not re-inserted (the user's edits are the source of truth).
 */
export async function approvePlanToTracker(
  userId: string,
  plan: PlanView,
): Promise<{ created: number; alreadyApproved: boolean }> {
  const supabase = await createServerSupabase();
  const { count, error: countErr } = await supabase
    .from("tracker_items")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", plan.id);
  if (countErr) throw new Error(countErr.message);
  if ((count ?? 0) > 0) return { created: 0, alreadyApproved: true };

  const rows = trackerRowsFromRoadmap(plan.createdAt, plan.roadmap);
  if (rows.length === 0) return { created: 0, alreadyApproved: false };
  const { error } = await supabase.from("tracker_items").insert(
    rows.map((r) => ({
      user_id: userId,
      plan_id: plan.id,
      week: r.week,
      due_date: r.due_date,
      action: r.action,
      owner_role: r.owner_role,
      hours: r.hours,
      deliverable: r.deliverable,
    })),
  );
  if (error) throw new Error(error.message);
  return { created: rows.length, alreadyApproved: false };
}

export async function listTrackerItems(planId: string): Promise<TrackerItemView[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tracker_items")
    .select("*")
    .eq("plan_id", planId)
    .order("week", { ascending: true })
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapItem);
}

/** The newest plan (by plans.created_at) that has tracker items, with its items. */
export async function latestTrackedPlanItems(): Promise<{
  planId: string;
  items: TrackerItemView[];
} | null> {
  const supabase = await createServerSupabase();
  const { data: plans, error: pErr } = await supabase
    .from("plans")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(25);
  if (pErr) throw new Error(pErr.message);
  const { data: itemPlanIds, error: iErr } = await supabase
    .from("tracker_items")
    .select("plan_id");
  if (iErr) throw new Error(iErr.message);
  const tracked = new Set((itemPlanIds ?? []).map((r) => r.plan_id));
  const planId = (plans ?? []).map((p) => p.id).find((id) => tracked.has(id));
  if (!planId) return null;
  return { planId, items: await listTrackerItems(planId) };
}

export async function updateTrackerItem(
  id: string,
  patch: { status?: TrackerStatus; remarks?: string },
): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("tracker_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
