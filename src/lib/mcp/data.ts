import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import type {
  GeoStore,
  BeginRunParams,
  BeginRunResult,
  FinishRunParams,
  StoredReport,
} from "@/lib/geo/store";
import type { ConfigView } from "@/lib/db/configs";
import type { ChosenTactic, Projection } from "@/lib/geo/plan";
import { trackerRowsFromRoadmap } from "@/lib/geo/schedule";

/**
 * Data access for MCP tool calls. MCP requests carry a JWT (sub = user id), not
 * Supabase cookies, so the RLS-enforced client is unavailable — we use the Drizzle
 * service client and scope EVERY query by user_id explicitly (the standing rule for
 * this client; see Learning.MD).
 */

export async function mcpActiveConfig(userId: string): Promise<ConfigView | null> {
  const rows = await db
    .select()
    .from(schema.configs)
    .where(and(eq(schema.configs.userId, userId), eq(schema.configs.isActive, true)))
    .orderBy(desc(schema.configs.version))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    version: r.version,
    isActive: r.isActive,
    brandUrl: r.brandUrl,
    brandName: r.brandName,
    description: r.description,
    brandDomains: r.brandDomains,
    competitors: r.competitors,
    competitorDomains: r.competitorDomains,
    queries: r.queries,
    budgetUsd: r.budgetUsd,
    teamSize: r.teamSize,
    timelineWeeks: r.timelineWeeks,
    mode: r.mode,
    platformOption: r.platformOption,
    instanceUrl: r.instanceUrl,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function mcpSavePlan(params: {
  userId: string;
  configId: string | null;
  configVersion: number | null;
  runId: string | null;
  tactics: ChosenTactic[];
  projection: Projection;
  roadmap?: unknown | null;
}): Promise<{ id: string }> {
  const rows = await db
    .insert(schema.plans)
    .values({
      userId: params.userId,
      configId: params.configId,
      configVersion: params.configVersion,
      runId: params.runId,
      tactics: params.tactics,
      projection: params.projection as unknown as Record<string, unknown>,
      roadmap: params.roadmap ?? null,
      targetCitationShare: params.projection.targetCitationShare,
      timelineWeeks: params.projection.timelineWeeks,
      confidence: params.projection.confidence,
    })
    .returning({ id: schema.plans.id });
  return rows[0]!;
}

export async function mcpLatestPlan(userId: string): Promise<{
  id: string;
  tactics: ChosenTactic[];
  projection: Projection | null;
  roadmap: unknown | null;
  targetCitationShare: number | null;
  createdAt: string;
} | null> {
  const rows = await db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.userId, userId))
    .orderBy(desc(schema.plans.createdAt))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    tactics: (r.tactics ?? []) as ChosenTactic[],
    projection: (r.projection ?? null) as Projection | null,
    roadmap: (r.roadmap ?? null) as unknown | null,
    targetCitationShare: r.targetCitationShare,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * MCP twin of approvePlanToTracker (lib/db/tracker.ts): flatten a plan's roadmap
 * into tracker_items with due dates from plan creation + week offsets. Idempotent.
 */
export async function mcpApprovePlan(
  userId: string,
  planId?: string,
): Promise<{ plan_id: string; created: number; already_approved: boolean } | { error: string }> {
  let plan: { id: string; roadmap: unknown; createdAt: string } | null = null;
  if (planId) {
    const rows = await db
      .select()
      .from(schema.plans)
      .where(and(eq(schema.plans.id, planId), eq(schema.plans.userId, userId)))
      .limit(1);
    const r = rows[0];
    plan = r ? { id: r.id, roadmap: r.roadmap ?? null, createdAt: r.createdAt.toISOString() } : null;
  } else {
    const latest = await mcpLatestPlan(userId);
    plan = latest ? { id: latest.id, roadmap: latest.roadmap, createdAt: latest.createdAt } : null;
  }
  if (!plan) return { error: "No plan found — run build_plan first." };

  const existing = await db
    .select({ id: schema.trackerItems.id })
    .from(schema.trackerItems)
    .where(and(eq(schema.trackerItems.userId, userId), eq(schema.trackerItems.planId, plan.id)))
    .limit(1);
  if (existing.length > 0) return { plan_id: plan.id, created: 0, already_approved: true };

  const rows = trackerRowsFromRoadmap(plan.createdAt, plan.roadmap);
  if (rows.length === 0) return { error: "This plan has no roadmap actions to track — rebuild it with build_plan." };
  await db.insert(schema.trackerItems).values(
    rows.map((r) => ({
      userId,
      planId: plan.id,
      week: r.week,
      dueDate: r.due_date,
      action: r.action,
      ownerRole: r.owner_role,
      hours: r.hours,
      deliverable: r.deliverable,
    })),
  );
  return { plan_id: plan.id, created: rows.length, already_approved: false };
}

export interface McpTrackerItem {
  week: number;
  due_date: string;
  action: string;
  owner_role: string | null;
  hours: number | null;
  deliverable: string | null;
  status: string;
  remarks: string | null;
}

/** Tracker items for a plan (default: the newest plan that has items). */
export async function mcpTrackerItems(
  userId: string,
  planId?: string,
): Promise<{ plan_id: string; items: McpTrackerItem[] } | null> {
  let pid = planId ?? null;
  if (!pid) {
    const trackedRows = await db
      .select({ planId: schema.trackerItems.planId })
      .from(schema.trackerItems)
      .where(eq(schema.trackerItems.userId, userId));
    const tracked = new Set(trackedRows.map((r) => r.planId));
    if (tracked.size === 0) return null;
    const plans = await db
      .select({ id: schema.plans.id })
      .from(schema.plans)
      .where(eq(schema.plans.userId, userId))
      .orderBy(desc(schema.plans.createdAt))
      .limit(25);
    pid = plans.map((p) => p.id).find((id) => tracked.has(id)) ?? null;
    if (!pid) return null;
  }
  const items = await db
    .select()
    .from(schema.trackerItems)
    .where(and(eq(schema.trackerItems.userId, userId), eq(schema.trackerItems.planId, pid)))
    .orderBy(schema.trackerItems.week, schema.trackerItems.dueDate);
  if (items.length === 0) return null;
  return {
    plan_id: pid,
    items: items.map((i) => ({
      week: i.week,
      due_date: i.dueDate,
      action: i.action,
      owner_role: i.ownerRole,
      hours: i.hours,
      deliverable: i.deliverable,
      status: i.status,
      remarks: i.remarks,
    })),
  };
}

/** Drizzle-backed GeoStore scoped to one user (MCP twin of SupabaseGeoStore). */
export class McpGeoStore implements GeoStore {
  constructor(
    private readonly userId: string,
    private readonly configId: string | null = null,
  ) {}

  async beginRun(params: BeginRunParams): Promise<BeginRunResult> {
    const rows = await db
      .insert(schema.runs)
      .values({
        userId: this.userId,
        configId: params.configId ?? this.configId,
        brand: params.brand,
        brandDomains: params.brandDomains,
        competitors: params.competitors,
        panel: params.panel,
        status: "running",
      })
      .returning({ id: schema.runs.id });
    return { runId: rows[0]!.id };
  }

  async finishRun(runId: string, params: FinishRunParams): Promise<void> {
    if (params.answers.length > 0) {
      await db.insert(schema.answers).values(
        params.answers.map((a) => ({
          runId,
          userId: this.userId,
          model: a.model,
          prompt: a.prompt,
          rawAnswer: a.rawAnswer,
          mentions: a.mentions,
          citedDomains: a.citedDomains,
          sentiment: a.sentiment,
        })),
      );
    }
    await db
      .update(schema.runs)
      .set({ status: "completed", costUsd: params.costUsd, completedAt: new Date() })
      .where(and(eq(schema.runs.id, runId), eq(schema.runs.userId, this.userId)));
    await db.insert(schema.sovHistory).values({
      userId: this.userId,
      configId: params.configId ?? this.configId,
      runId,
      date: params.date,
      sov: params.sov,
      sentimentScore: params.sentimentScore,
    });
  }

  async failRun(runId: string, error: string): Promise<void> {
    await db
      .update(schema.runs)
      .set({ status: "failed", error, completedAt: new Date() })
      .where(and(eq(schema.runs.id, runId), eq(schema.runs.userId, this.userId)));
  }

  async getReport(runId: string): Promise<StoredReport | null> {
    const runRows = await db
      .select()
      .from(schema.runs)
      .where(and(eq(schema.runs.id, runId), eq(schema.runs.userId, this.userId)))
      .limit(1);
    const run = runRows[0];
    if (!run) return null;
    const answers = await db
      .select()
      .from(schema.answers)
      .where(and(eq(schema.answers.runId, runId), eq(schema.answers.userId, this.userId)))
      .orderBy(schema.answers.createdAt);
    return {
      run: {
        id: run.id,
        status: run.status,
        panel: run.panel,
        costUsd: run.costUsd,
        error: run.error,
        createdAt: run.createdAt.toISOString(),
        completedAt: run.completedAt?.toISOString() ?? null,
      },
      brand: run.brand,
      competitors: run.competitors,
      brandDomains: run.brandDomains,
      answers: answers.map((a) => ({
        model: a.model,
        prompt: a.prompt,
        rawAnswer: a.rawAnswer,
        mentions: a.mentions,
        citedDomains: a.citedDomains,
        sentiment: (a.sentiment ?? null) as StoredReport["answers"][number]["sentiment"],
      })),
    };
  }
}

/**
 * Persist crawled citation evidence (spec §5: cache in Supabase). Called after a
 * diagnose crawl so insights accumulate and the dashboard can show evidence depth.
 */
export async function persistCitations(
  userId: string,
  runId: string | null,
  results: {
    url: string;
    domain: string;
    sourceType: string;
    title: string | null;
    excerpt: string | null;
    mentionsBrand: boolean;
    mentionsCompetitor: string | null;
    fetched: boolean;
    skippedReason?: string;
  }[],
): Promise<void> {
  if (results.length === 0) return;
  await db.insert(schema.citations).values(
    results.map((r) => ({
      userId,
      runId,
      url: r.url,
      domain: r.domain,
      sourceType: r.sourceType,
      citesCompetitor: r.mentionsCompetitor,
      mentionsBrand: r.mentionsBrand,
      title: r.title,
      excerpt: r.excerpt,
      signals: { fetched: r.fetched, skippedReason: r.skippedReason ?? null },
    })),
  );
}
