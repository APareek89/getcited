import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { getActiveConfig, type ConfigView } from "./configs";
import { getLatestPlan, type PlanView } from "./plans";
import { SupabaseGeoStore } from "./geo-store";
import {
  buildReport,
  computeCitations,
  computeSentiment,
  type ShareOfVoiceEntry,
  type AnalysisAnswer,
} from "@/lib/geo";

export interface DashboardKpis {
  sov: number;
  sovDelta: number | null;
  citationShare: number;
  sentimentScore: number | null;
  hallucinations: number;
}

export interface DashboardData {
  config: ConfigView | null;
  hasRuns: boolean;
  kpis: DashboardKpis | null;
  leaderboard: ShareOfVoiceEntry[];
  trend: { date: string; sov: number }[];
  plan: PlanView | null;
  reports: { id: string; kind: string; format: string; title: string | null; createdAt: string }[];
  lastRunAt: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function loadDashboard(userId: string): Promise<DashboardData> {
  const supabase = await createServerSupabase();
  const config = await getActiveConfig();

  // Latest two completed runs (KPIs + delta).
  const { data: runRows } = await supabase
    .from("runs")
    .select("id, created_at, status")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(2);
  const runs = runRows ?? [];

  // SoV trend.
  const { data: sovRows } = await supabase
    .from("sov_history")
    .select("date, sov")
    .order("date", { ascending: true })
    .limit(60);
  const trend = (sovRows ?? []).map((r: any) => ({ date: r.date, sov: r.sov }));

  // Recent reports.
  const { data: reportRows } = await supabase
    .from("reports")
    .select("id, kind, format, title, created_at")
    .order("created_at", { ascending: false })
    .limit(6);
  const reports = (reportRows ?? []).map((r: any) => ({
    id: r.id,
    kind: r.kind,
    format: r.format,
    title: r.title,
    createdAt: r.created_at,
  }));

  const plan = await getLatestPlan();

  let kpis: DashboardKpis | null = null;
  let leaderboard: ShareOfVoiceEntry[] = [];
  let lastRunAt: string | null = null;

  if (runs.length > 0) {
    const store = new SupabaseGeoStore(userId);
    const latest = await buildReport(store, runs[0]!.id);
    lastRunAt = runs[0]!.created_at;
    if (latest) {
      leaderboard = [...latest.share_of_voice].sort((a, b) => b.sov - a.sov);
      const analysis: AnalysisAnswer[] = latest.answers.map((a) => ({
        prompt: a.prompt,
        rawAnswer: "",
        citedDomains: a.cited_domains,
        sentiment: a.sentiment,
      }));
      const ownedDomains = config?.brandDomains ?? [];
      const brand = latest.brand;
      const citations = computeCitations(brand, analysis, ownedDomains);
      const sentiment = computeSentiment(brand, analysis);
      const brandSov = leaderboard.find((e) => e.brand === brand)?.sov ?? 0;

      let sovDelta: number | null = null;
      if (runs.length > 1) {
        const prev = await buildReport(store, runs[1]!.id);
        const prevBrandSov = prev?.share_of_voice.find((e) => e.brand === brand)?.sov ?? null;
        if (prevBrandSov != null) sovDelta = brandSov - prevBrandSov;
      }

      kpis = {
        sov: brandSov,
        sovDelta,
        citationShare: citations.your_citation_share,
        sentimentScore: sentiment.sentiment_score,
        hallucinations: 0,
      };
    }
  }

  return {
    config,
    hasRuns: runs.length > 0,
    kpis,
    leaderboard,
    trend,
    plan,
    reports,
    lastRunAt,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
