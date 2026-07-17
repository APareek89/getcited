import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth";
import { getActiveConfig, type ConfigView } from "@/lib/db/configs";
import { SupabaseGeoStore } from "@/lib/db/geo-store";
import { savePlan, getLatestPlan } from "@/lib/db/plans";
import { saveThreadMessages } from "@/lib/db/threads";
import { listMemories, saveMemory, memoryPromptBlock } from "@/lib/db/memories";
import { persistCitations } from "@/lib/mcp/data";
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
import { getStoredProviderKeys } from "@/lib/db/api-keys";
import { diagnoseFromReport } from "@/lib/geo/diagnose";
import { generateRoadmap, type RoadmapDoc } from "@/lib/geo/roadmap";
import { isoDate, weekDueDate } from "@/lib/geo/schedule";
import { generateContent, CONTENT_TYPES } from "@/lib/geo/content";
import { AGENT_SYSTEM_PROMPT, DEFAULT_AGENT_MODEL, isAgentModel } from "@/lib/geo/agent";

export const maxDuration = 300;

function panelFor(keys: ProviderKeys): PanelistId[] {
  const panel: PanelistId[] = ["haiku"];
  if (keys.perplexity) panel.push("perplexity");
  return panel;
}

async function resolveKeys(
  session: Partial<ProviderKeys> | undefined,
  mode: string | undefined,
): Promise<ProviderKeys> {
  const hasSession = session && (session.anthropic || session.perplexity || session.gemini || session.groq);
  if (hasSession) return { ...session };
  if (mode === "self_serve") return getStoredProviderKeys();
  return serverProviderKeys();
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

async function reportById(user: User, reportId: string): Promise<FullReport | null> {
  return buildReport(new SupabaseGeoStore(user.id), reportId);
}

/** Diagnose + persist crawled evidence to the citations table. */
async function diagnoseAndPersist(
  user: User,
  report: FullReport,
  brand: string,
  ownedDomains: string[],
) {
  const dx = await diagnoseFromReport(report, { brand, ownedDomains, crawl: true });
  if (dx.crawled?.length) {
    try {
      await persistCitations(user.id, report.report_id, dx.crawled);
    } catch {
      // evidence cache is best-effort; never fail the tool on it
    }
  }
  return dx;
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = (await req.json()) as {
    messages: UIMessage[];
    model?: string;
    keys?: Partial<ProviderKeys>;
    threadId?: string;
  };
  const modelId = body.model && isAgentModel(body.model) ? body.model : DEFAULT_AGENT_MODEL;
  const threadId = body.threadId;

  const cfgForKeys = await getActiveConfig();
  const keys = await resolveKeys(body.keys, cfgForKeys?.mode);
  if (!keys.anthropic) {
    return new Response(
      cfgForKeys?.mode === "self_serve"
        ? "No Anthropic key. Add your key under Configure → Platform (Self Serve)."
        : "Anthropic key not configured on the server",
      { status: 400 },
    );
  }
  const anthropic = createAnthropic({ apiKey: keys.anthropic });

  // Persistent memory → system prompt.
  let memoryBlock = "";
  try {
    memoryBlock = memoryPromptBlock(await listMemories());
  } catch {
    memoryBlock = "";
  }

  const result = streamText({
    model: anthropic(modelId),
    system: AGENT_SYSTEM_PROMPT + memoryBlock,
    messages: await convertToModelMessages(body.messages),
    stopWhen: stepCountIs(8),
    experimental_telemetry: { isEnabled: true, functionId: "geo-assistant" },
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
          "Card 1 (Benchmark). Run an AI panel → share-of-voice, citation share, sentiment for the brand vs competitors.",
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
          "Card 2 (Diagnose). Categorize where AI cites in this category vs where you're cited; find the biggest gaps. Crawls top cited pages (robots.txt respected) and caches the evidence.",
        inputSchema: z.object({ report_id: z.string().optional() }),
        async execute({ report_id }) {
          const cfg = await getActiveConfig();
          let report: FullReport | null = report_id ? await reportById(user, report_id) : null;
          let brand = cfg?.brandName || cfg?.brandUrl || "";
          let ownedDomains = cfg?.brandDomains ?? [];
          if (!report) {
            const r = await runBenchmark(user, cfg, keys);
            if ("error" in r) return { error: r.error };
            report = r.report;
            brand = r.brand;
            ownedDomains = r.ownedDomains;
          }
          const dx = await diagnoseAndPersist(user, report, brand, ownedDomains);
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
          "Card 3 (How can I improve? / Plan). Build a costed action plan filling the biggest citation gaps, EXPAND it into a week-by-week roadmap (actions, owner, hours, deliverable, KPI per week), and persist it. Returns a MODELED projection with assumptions + confidence.",
        inputSchema: z.object({
          report_id: z.string().optional(),
          budget_usd: z.number().optional(),
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
          const dx = await diagnoseAndPersist(user, report, brand, ownedDomains);

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

          // Week-by-week roadmap (manager-shareable detail: WHAT/WHY/HOW/WHO + guidelines).
          let roadmap: RoadmapDoc = { weeks: [], guidelines: [] };
          try {
            roadmap = await generateRoadmap({
              anthropicKey: keys.anthropic!,
              brand,
              tactics: allocation.tactics,
              gaps: dx.gap,
              projection,
              timelineWeeks: weeks,
              teamSize: team,
            });
          } catch {
            roadmap = { weeks: [], guidelines: [] };
          }

          const saved = await savePlan({
            userId: user.id,
            configId: cfg?.id ?? null,
            configVersion: cfg?.version ?? null,
            runId,
            tactics: allocation.tactics,
            projection,
            roadmap,
          });

          const capacityNote =
            budget < 100 || team * weeks * 25 < 100
              ? "NOTE: budget/team capacity is very low — only free, low-effort tactics fit. Suggest the user raise budget or team size in Configure for a stronger plan."
              : undefined;

          // Trimmed for chat: the card shows a summary; full WHY/HOW detail lives in
          // the downloadable document (?format=docx|pdf|xlsx|html) — don't re-stream it.
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
            roadmap_overview: roadmap.weeks.map((w) => ({
              week: w.week,
              theme: w.theme,
              kpi_checkpoint: w.kpi_checkpoint,
              due_date: isoDate(weekDueDate(saved.createdAt, w.week)),
              action_count: w.actions.length,
            })),
            execution_guidelines: roadmap.guidelines,
            gap: dx.gap,
            capacity_note: capacityNote,
          };
        },
      }),

      track_progress: tool({
        description:
          "Card 4 (Track). Pull the latest plan, re-benchmark, and report before→after + pending tactics.",
        inputSchema: z.object({
          done_tactic_ids: z.array(z.string()).optional(),
        }),
        async execute({ done_tactic_ids }) {
          const plan = await getLatestPlan();
          if (!plan) return { error: "No plan yet. Build a plan first (How can I improve?)." };
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

      generate_content: tool({
        description:
          "Write GEO-optimized content for a plan tactic: blog_post, comparison_page, reddit_answer, linkedin_post, guest_post_pitch, review_request_email, youtube_brief. Returns ready-to-edit markdown (placeholders where real data is needed).",
        inputSchema: z.object({
          type: z.enum(CONTENT_TYPES),
          topic: z
            .string()
            .min(3)
            .describe("The assignment, e.g. 'PixelBin vs Cloudinary comparison' or 'answer: best background remover'."),
        }),
        async execute({ type, topic }) {
          const cfg = await getActiveConfig();
          const plan = await getLatestPlan();
          const planContext = plan
            ? `Active plan targets citation share ${(plan.projection?.currentCitationShare ?? 0) * 100}% → ${(plan.targetCitationShare ?? 0) * 100}%; tactics: ${plan.tactics.map((t) => t.name).join("; ")}`
            : undefined;
          const markdown = await generateContent({
            anthropicKey: keys.anthropic!,
            type,
            topic,
            brand: cfg?.brandName || cfg?.brandUrl || "the brand",
            brandUrl: cfg?.brandUrl,
            description: cfg?.description,
            competitors: cfg?.competitors,
            queries: cfg?.queries,
            planContext,
          });
          return { type, topic, markdown };
        },
      }),

      save_memory: tool({
        description:
          "Persist something worth remembering across sessions. kind: 'structural' (durable facts about the brand/market/results), 'procedural' (how this user wants things done — formats, tone, preferences), 'working' (current goals/in-flight work). Use when the user states a preference, a durable fact emerges, or a goal is set.",
        inputSchema: z.object({
          kind: z.enum(["working", "procedural", "structural"]),
          content: z.string().min(5).max(1200),
        }),
        async execute({ kind, content }) {
          await saveMemory(user.id, kind, content);
          return { saved: true, kind };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: body.messages,
    onFinish: threadId
      ? async ({ messages }) => {
          try {
            await saveThreadMessages(user.id, threadId, messages);
          } catch (e) {
            console.error("[chat] thread persistence failed:", e instanceof Error ? e.message : e);
          }
        }
      : undefined,
  });
}
