import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getActiveConfig } from "@/lib/db/configs";
import { SupabaseGeoStore } from "@/lib/db/geo-store";
import {
  InProcessPanelRunner,
  buildReport,
  computeCitations,
  computeSentiment,
  type PanelistId,
  type AnalysisAnswer,
} from "@/lib/geo";
import { serverProviderKeys, costCapUsd } from "@/lib/geo/keys";
import {
  AGENT_SYSTEM_PROMPT,
  DEFAULT_AGENT_MODEL,
  isAgentModel,
} from "@/lib/geo/agent";

export const maxDuration = 120;

export async function POST(req: Request) {
  const user = await requireUser();
  const body = (await req.json()) as { messages: UIMessage[]; model?: string };
  const modelId = body.model && isAgentModel(body.model) ? body.model : DEFAULT_AGENT_MODEL;

  const keys = serverProviderKeys();
  if (!keys.anthropic) {
    return new Response("Anthropic key not configured on the server", { status: 500 });
  }
  const anthropic = createAnthropic({ apiKey: keys.anthropic });

  // Panel = Claude Haiku + Perplexity (if available) for web-grounded citations.
  const panel: PanelistId[] = ["haiku"];
  if (keys.perplexity) panel.push("perplexity");

  const result = streamText({
    model: anthropic(modelId),
    system: AGENT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(body.messages),
    stopWhen: stepCountIs(5),
    tools: {
      get_active_config: tool({
        description:
          "Load the user's saved GetCited configuration (brand, competitors, queries, budget, team).",
        inputSchema: z.object({}),
        async execute() {
          const cfg = await getActiveConfig();
          if (!cfg) {
            return { configured: false, message: "No config yet. Ask the user to fill in Configure." };
          }
          return {
            configured: true,
            brand: cfg.brandName || cfg.brandUrl,
            brand_url: cfg.brandUrl,
            competitors: cfg.competitors,
            query_count: cfg.queries.length,
            queries: cfg.queries.slice(0, 12),
            budget_usd: cfg.budgetUsd,
            team_size: cfg.teamSize,
            timeline_weeks: cfg.timelineWeeks,
          };
        },
      }),

      run_benchmark: tool({
        description:
          "Run an AI panel to measure share-of-voice, citation share and sentiment for the brand vs its competitors. Uses the saved config unless brand/competitors/queries are provided.",
        inputSchema: z.object({
          brand: z.string().optional().describe("Override the brand to measure."),
          competitors: z.array(z.string()).optional().describe("Override competitor list."),
          queries: z.array(z.string()).optional().describe("Override the buyer-intent queries."),
        }),
        async execute(input) {
          const cfg = await getActiveConfig();
          const brand = input.brand || cfg?.brandName || cfg?.brandUrl;
          const competitors = input.competitors ?? cfg?.competitors ?? [];
          const queries = input.queries ?? cfg?.queries ?? [];
          const brandDomains = cfg?.brandDomains ?? [];

          if (!brand) return { error: "No brand set. Ask the user for their brand or to fill Configure." };
          if (competitors.length === 0) return { error: "No competitors set. Ask the user for at least one competitor." };
          if (queries.length === 0) {
            return {
              error:
                "No queries configured. Ask the user to add buyer-intent queries in Configure (or use Fetch queries).",
            };
          }

          const store = new SupabaseGeoStore(user.id, cfg?.id ?? null);
          const runner = new InProcessPanelRunner(store, {
            costCapUsd: costCapUsd(),
            keys,
          });

          const out = await runner.run({
            brand,
            brand_domains: brandDomains,
            competitors,
            prompts: queries,
            panel,
          });

          const report = await buildReport(store, out.report_id);
          const analysisAnswers: AnalysisAnswer[] = (report?.answers ?? []).map((a) => ({
            prompt: a.prompt,
            rawAnswer: "",
            citedDomains: a.cited_domains,
            sentiment: a.sentiment,
          }));
          const citations = computeCitations(brand, analysisAnswers, brandDomains);
          const sentiment = computeSentiment(brand, analysisAnswers);

          return {
            report_id: out.report_id,
            brand,
            panel: out.panel,
            answer_count: out.answer_count,
            cost_usd: out.cost_usd,
            share_of_voice: out.share_of_voice,
            your_citation_share: citations.your_citation_share,
            total_citations: citations.total_citations,
            top_cited_domains: citations.by_domain.slice(0, 8),
            citation_gap_count: citations.competitor_gap.length,
            sentiment: {
              score: sentiment.sentiment_score,
              distribution: sentiment.distribution,
            },
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
