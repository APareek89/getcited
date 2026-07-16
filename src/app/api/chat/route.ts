import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth";
import { getActiveConfig, type ConfigView } from "@/lib/db/configs";
import { SupabaseGeoStore } from "@/lib/db/geo-store";
import { savePlan, getLatestPlan } from "@/lib/db/plans";
import {
  InProcessPanelRunner,
  buildReport,
  computeCitations,
  computeSentiment,
  allocatePlan,
  projectImpact,
  type PanelistId,
  type AnalysisAnswer,
  type ProviderKeys,
  type FullReport,
} from "@/lib/geo";
import { serverProviderKeys, costCapUsd } from "@/lib/geo/keys";
import { diagnoseFromReport } from "@/lib/geo/diagnose";
import { AGENT_SYSTEM_PROMPT, DEFAULT_AGENT_MODEL, isAgentModel } from "@/lib/geo/agent";

export const maxDuration = 300;

function panelFor(keys: ProviderKeys): PanelistId[] {
  const panel: PanelistId[] = ["haiku"];
  if (keys.perplexity) panel.push("perplexity");
  return panel;
}

/** Run (or fetch) a benchmark and return its stored report. */
async function runBenchmark(
  user: User,
  cfg: ConfigView | null,
  keys: ProviderKeys,
  overrides?: { brand?: string; competitors?: string[]; queries?: string[] },
): Promise<{ report: FullReport; brand: string; ownedDomains: string[] } | { error: string }> {
  const brand = overrides?.brand || cfg?.brandName || cfg?.brandUrl;
  const competitors = overrides?.competitors ?? cfg?.competitors ?? [];
  const queries = overrides?.queries ?? cfg?.queries ?? [];
  const ownedDomains = cfg?.brandDomains ?? [];
  if (!brand) return { error: "No brand set. Ask the user for their brand or to fill Configure." };
  if (competitors.length === 0) return { error: "No competitors set. Ask the user for at least one." };
  if (queries.length === 0) return { error: "No queries configured. Ask the user to add queries in Configure." };

  const store = new SupabaseGeoStore(user.id, cfg?.id ?? null);
  const runner = new InProcessPanelRunner(store, { costCapUsd: costCapUsd(), keys });
  const out = await runner.run({
    brand,
    brand_domains: ownedDomains,
    competitors,
    prompts: queries,
    panel: panelFor(keys),
  });
  const report = await buildReport(store, out.report_id);
  if (!report) return { error: "Benchmark ran but the report could not be loaded." };
  return { report, brand, ownedDomains };
}

async function reportById(
  user: User,
  reportId: string,
): Promise<FullReport | null> {
  const store = new SupabaseGeoStore(user.id);
  return buildReport(store, reportId);
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = (await req.json()) as { messages: UIMessage[]; model?: string };
  const modelId = body.model && isAgentModel(body.model) ? body.model : DEFAULT_AGENT_MODEL;

  const keys = serverProviderKeys();
  if (!keys.anthropic) {
    return new Response("Anthropic key not configured on the server", { status: 500 });
  }
  const anthropic = createAnthropic({ apiKey: keys.anthropic });

  const result = streamText({
    model: anthropic(modelId),
    system: AGENT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(body.messages),
    stopWhen: stepCountIs(8),
    tools: {
      get_active_config: tool({
        description: "Load the user's saved config (brand, competitors, queries, budget, team).",
        inputSchema: z.object({}),
        async execute() {
          const cfg = await getActiveConfig();
          if (!cfg) return { configured: false, message: "No config yet. Ask the user to fill Configure." };
          return {
            configured: true,
            brand: cfg.brandName || cfg.brandUrl,
            competitors: cfg.competitors,
            query_count: cfg.queries.length,
            budget_usd: cfg.budgetUsd,
            team_size: cfg.teamSize,
            timeline_weeks: cfg.timelineWeeks,
          };
        },
      }),

      run_benchmark: tool({
        description:
          "Card 1 (Benchmark). Run an AI panel → share-of-voice, citation share, sentiment for the brand vs competitors. Uses saved config unless overrides are given.",
        inputSchema: z.object({
          brand: z.string().optional(),
          competitors: z.array(z.string()).optional(),
          queries: z.array(z.string()).optional(),
        }),
        async execute(input) {
          const cfg = await getActiveConfig();
          const r = await runBenchmark(user, cfg, keys, input);
          if ("error" in r) return { error: r.error };
          const analysis: AnalysisAnswer[] = r.report.answers.map((a) => ({
            prompt: a.prompt,
            rawAnswer: "",
            citedDomains: a.cited_domains,
            sentiment: a.sentiment,
          }));
          const citations = computeCitations(r.brand, analysis, r.ownedDomains);
          const sentiment = computeSentiment(r.brand, analysis);
          return {
            report_id: r.report.report_id,
            brand: r.brand,
            panel: r.report.panel,
            answer_count: r.report.answers.length,
            cost_usd: r.report.cost_usd,
            share_of_voice: r.report.share_of_voice,
            your_citation_share: citations.your_citation_share,
            total_citations: citations.total_citations,
            top_cited_domains: citations.by_domain.slice(0, 8),
            citation_gap_count: citations.competitor_gap.length,
            sentiment: { score: sentiment.sentiment_score, distribution: sentiment.distribution },
          };
        },
      }),

      diagnose_citations: tool({
        description:
          "Card 2 (Diagnose). Categorize where AI cites in this category vs where you're cited, and find the biggest gaps. Crawls top cited pages (respecting robots.txt). Pass report_id from a benchmark, or it runs a fresh one.",
        inputSchema: z.object({
          report_id: z.string().optional().describe("A benchmark report_id to analyze."),
        }),
        async execute({ report_id }) {
          const cfg = await getActiveConfig();
          let report: FullReport | null = null;
          let brand = cfg?.brandName || cfg?.brandUrl || "";
          let ownedDomains = cfg?.brandDomains ?? [];
          if (report_id) {
            report = await reportById(user, report_id);
          }
          if (!report) {
            const r = await runBenchmark(user, cfg, keys);
            if ("error" in r) return { error: r.error };
            report = r.report;
            brand = r.brand;
            ownedDomains = r.ownedDomains;
          }
          const dx = await diagnoseFromReport(report, { brand, ownedDomains, crawl: true });
          return {
            report_id: report.report_id,
            current_citation_share: dx.currentCitationShare,
            gap: dx.gap,
            category_profile: dx.categoryProfile,
            your_profile: dx.yourProfile,
            top_domains: dx.topDomains.slice(0, 10),
            crawl_grounded: dx.crawlGrounded,
            crawled_count: dx.crawled?.filter((c) => c.fetched).length ?? 0,
          };
        },
      }),

      build_plan: tool({
        description:
          "Card 3 (Plan). Build a costed action plan for the user's budget + team that fills the biggest citation gaps, with a MODELED projection (target citation share, traffic, conversions, assumptions, confidence). Persists the plan. Pass report_id or it runs a fresh benchmark.",
        inputSchema: z.object({
          report_id: z.string().optional(),
          budget_usd: z.number().optional().describe("Override the saved budget."),
          team_size: z.number().optional(),
          timeline_weeks: z.number().optional(),
        }),
        async execute(input) {
          const cfg = await getActiveConfig();
          let report: FullReport | null = input.report_id ? await reportById(user, input.report_id) : null;
          let brand = cfg?.brandName || cfg?.brandUrl || "";
          let ownedDomains = cfg?.brandDomains ?? [];
          let runId: string | null = input.report_id ?? null;
          if (!report) {
            const r = await runBenchmark(user, cfg, keys);
            if ("error" in r) return { error: r.error };
            report = r.report;
            brand = r.brand;
            ownedDomains = r.ownedDomains;
            runId = r.report.report_id;
          }
          const dx = await diagnoseFromReport(report, { brand, ownedDomains, crawl: true });

          const budget = input.budget_usd ?? cfg?.budgetUsd ?? 400;
          const team = input.team_size ?? cfg?.teamSize ?? 2;
          const weeks = input.timeline_weeks ?? cfg?.timelineWeeks ?? 8;

          const allocation = allocatePlan({ budgetUsd: budget, teamSize: team, timelineWeeks: weeks, gaps: dx.gap });
          const projection = projectImpact({
            currentCitationShare: dx.currentCitationShare,
            tactics: allocation.tactics,
            timelineWeeks: weeks,
            grounding: { crawl: dx.crawlGrounded },
          });

          const saved = await savePlan({
            userId: user.id,
            configId: cfg?.id ?? null,
            configVersion: cfg?.version ?? null,
            runId,
            tactics: allocation.tactics,
            projection,
          });

          return {
            plan_id: saved.id,
            report_id: report.report_id,
            budget_usd: budget,
            team_size: team,
            timeline_weeks: weeks,
            person_hours: allocation.personHours,
            spent_usd: allocation.spentUsd,
            spent_hours: allocation.spentHours,
            tactics: allocation.tactics,
            projection,
            gap: dx.gap,
          };
        },
      }),

      track_progress: tool({
        description:
          "Card 4 (Track). Pull the user's latest plan and compare their current AI citation share to the plan's baseline. Reports before→after and which tactics are still pending.",
        inputSchema: z.object({
          done_tactic_ids: z.array(z.string()).optional().describe("Tactic ids the user says are done."),
        }),
        async execute({ done_tactic_ids }) {
          const plan = await getLatestPlan();
          if (!plan) return { error: "No plan yet. Build a plan first (Card 3)." };
          const cfg = await getActiveConfig();
          const r = await runBenchmark(user, cfg, keys);
          if ("error" in r) return { error: r.error };
          const analysis: AnalysisAnswer[] = r.report.answers.map((a) => ({
            prompt: a.prompt,
            rawAnswer: "",
            citedDomains: a.cited_domains,
            sentiment: a.sentiment,
          }));
          const citations = computeCitations(r.brand, analysis, r.ownedDomains);
          const done = new Set(done_tactic_ids ?? []);
          return {
            plan_id: plan.id,
            baseline_citation_share: plan.projection?.currentCitationShare ?? null,
            target_citation_share: plan.targetCitationShare,
            current_citation_share: citations.your_citation_share,
            tactics: plan.tactics.map((t) => ({ id: t.id, name: t.name, done: done.has(t.id) })),
            pending: plan.tactics.filter((t) => !done.has(t.id)).map((t) => t.name),
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
