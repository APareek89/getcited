"use server";

import { requireUser } from "@/lib/auth";
import {
  approvePlanToTracker,
  updateTrackerItem,
  isTrackerStatus,
  type TrackerStatus,
} from "@/lib/db/tracker";
import { getPlanById } from "@/lib/db/plans";

type Result = { ok: true } | { ok: false; error: string };

/**
 * One-click approve from the chat plan card (same idempotent path the agent's
 * approve_plan tool uses — both converge on approvePlanToTracker).
 */
export async function approvePlanAction(
  planId: string,
): Promise<{ ok: true; created: number; alreadyApproved: boolean } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const plan = await getPlanById(planId); // RLS-scoped: only the owner's plan resolves
    if (!plan) return { ok: false, error: "Plan not found" };
    const res = await approvePlanToTracker(user.id, plan);
    return { ok: true, ...res };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Approve failed" };
  }
}

/** Inline edits from the Tracker table (status dropdown + remarks). RLS-scoped. */
export async function updateTrackerItemAction(input: {
  id: string;
  status?: string;
  remarks?: string;
}): Promise<Result> {
  try {
    await requireUser();
    const patch: { status?: TrackerStatus; remarks?: string } = {};
    if (input.status !== undefined) {
      if (!isTrackerStatus(input.status)) return { ok: false, error: "Invalid status" };
      patch.status = input.status;
    }
    if (input.remarks !== undefined) patch.remarks = input.remarks.slice(0, 2000);
    if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to update" };
    await updateTrackerItem(input.id, patch);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}
