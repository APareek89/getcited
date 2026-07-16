import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { anthropicModel } from "./providers";
import type { ChosenTactic, Gap, Projection } from "./plan";

/**
 * Week-by-week execution roadmap: expands the allocator's tactic list into a
 * manager-shareable schedule (actions, owner role, hours, deliverable, KPI per
 * week). Grounded strictly in the chosen tactics + gaps — the model schedules and
 * details, it does not invent new spend.
 */

export const ROADMAP_MODEL_ID = "claude-sonnet-4-6";

const WeekSchema = z.object({
  week: z.number().int().min(1),
  theme: z.string().describe("One-line focus of the week."),
  actions: z
    .array(
      z.object({
        tactic_id: z.string().describe("Id of the tactic this action belongs to."),
        action: z.string().describe("Concrete, assignable action (verb-first)."),
        owner_role: z.string().describe("Who does it, as a role (e.g. 'Content writer')."),
        hours: z.number().describe("Estimated person-hours."),
        deliverable: z.string().describe("The tangible output of the action."),
      }),
    )
    .min(1)
    .max(6),
  kpi_checkpoint: z.string().describe("What to measure at the end of this week."),
});

export const RoadmapSchema = z.object({ weeks: z.array(WeekSchema).min(2).max(16) });
export type RoadmapWeek = z.infer<typeof WeekSchema>;

export async function generateRoadmap(params: {
  anthropicKey: string;
  brand: string;
  tactics: ChosenTactic[];
  gaps: Gap[];
  projection: Projection;
  timelineWeeks: number;
  teamSize: number;
}): Promise<RoadmapWeek[]> {
  const tacticLines = params.tactics
    .map(
      (t) =>
        `- id=${t.id} "${t.name}" — $${t.costUsd.toFixed(0)}, ~${Math.round(t.effortHours)}h, lead ${t.leadWeeks[0]}–${t.leadWeeks[1]}wk${t.closesGap ? `, closes the "${t.closesGap}" gap` : ""}`,
    )
    .join("\n");
  const gapLines = params.gaps
    .slice(0, 6)
    .map((g) => `- ${g.sourceType}: you ${g.you} vs category ${g.leader} (deficit ${g.deficit})`)
    .join("\n");

  const res = await generateObject({
    model: anthropicModel(ROADMAP_MODEL_ID, params.anthropicKey),
    schema: RoadmapSchema,
    system:
      "You are a GEO (Generative Engine Optimization) program manager. Turn an approved tactic " +
      "list into a realistic week-by-week execution roadmap a manager can hand to their team. " +
      "Sequence by lead time (outreach-heavy tactics start early), respect the team's weekly " +
      "capacity, make every action concrete and assignable, and only use the given tactics — " +
      "never invent new spend.",
    prompt:
      `Brand: ${params.brand}\n` +
      `Timeline: ${params.timelineWeeks} weeks · Team: ${params.teamSize} people (~${params.teamSize * 25}h/wk)\n` +
      `Target: citation share ${(params.projection.currentCitationShare * 100).toFixed(0)}% → ~${(params.projection.targetCitationShare * 100).toFixed(0)}%\n\n` +
      `Citation gaps to close:\n${gapLines || "- (none identified)"}\n\n` +
      `Approved tactics:\n${tacticLines}\n\n` +
      `Produce ${Math.min(params.timelineWeeks, 12)} weeks. Every tactic must appear in at least one week.`,
    maxOutputTokens: 4000,
    experimental_telemetry: { isEnabled: true, functionId: "roadmap" },
  });
  return res.object.weeks;
}
