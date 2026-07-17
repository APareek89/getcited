"use server";

import { requireUser } from "@/lib/auth";
import { updateTrackerItem, isTrackerStatus, type TrackerStatus } from "@/lib/db/tracker";

type Result = { ok: true } | { ok: false; error: string };

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
