import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import type {
  GeoStore,
  BeginRunParams,
  BeginRunResult,
  FinishRunParams,
  StoredReport,
} from "@/lib/geo/store";

/**
 * Supabase-backed GeoStore, scoped to one user. Runs through the RLS-enforced server
 * client (the user's JWT from cookies), and always sets user_id on inserts to satisfy
 * the WITH CHECK policy. Used by real panel runs from the GEO Assistant.
 */
export class SupabaseGeoStore implements GeoStore {
  constructor(
    private readonly userId: string,
    private readonly configId: string | null = null,
  ) {}

  async beginRun(params: BeginRunParams): Promise<BeginRunResult> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("runs")
      .insert({
        user_id: this.userId,
        config_id: params.configId ?? this.configId,
        brand: params.brand,
        brand_domains: params.brandDomains,
        competitors: params.competitors,
        panel: params.panel,
        status: "running",
      })
      .select("id")
      .single();
    if (error) throw new Error(`beginRun failed: ${error.message}`);
    return { runId: data.id as string };
  }

  async finishRun(runId: string, params: FinishRunParams): Promise<void> {
    const supabase = await createServerSupabase();

    if (params.answers.length > 0) {
      const rows = params.answers.map((a) => ({
        run_id: runId,
        user_id: this.userId,
        model: a.model,
        prompt: a.prompt,
        raw_answer: a.rawAnswer,
        mentions: a.mentions,
        cited_domains: a.citedDomains,
        sentiment: a.sentiment,
      }));
      const { error: ansErr } = await supabase.from("answers").insert(rows);
      if (ansErr) throw new Error(`finishRun(answers) failed: ${ansErr.message}`);
    }

    const { error: runErr } = await supabase
      .from("runs")
      .update({ status: "completed", cost_usd: params.costUsd, completed_at: new Date().toISOString() })
      .eq("id", runId);
    if (runErr) throw new Error(`finishRun(run) failed: ${runErr.message}`);

    const { error: sovErr } = await supabase.from("sov_history").insert({
      user_id: this.userId,
      config_id: params.configId ?? this.configId,
      run_id: runId,
      date: params.date,
      sov: params.sov,
      sentiment_score: params.sentimentScore,
    });
    if (sovErr) throw new Error(`finishRun(sov_history) failed: ${sovErr.message}`);
  }

  async failRun(runId: string, error: string): Promise<void> {
    const supabase = await createServerSupabase();
    await supabase
      .from("runs")
      .update({ status: "failed", error, completed_at: new Date().toISOString() })
      .eq("id", runId);
  }

  async getReport(runId: string): Promise<StoredReport | null> {
    const supabase = await createServerSupabase();
    const { data: run, error } = await supabase
      .from("runs")
      .select("*")
      .eq("id", runId)
      .maybeSingle();
    if (error) throw new Error(`getReport failed: ${error.message}`);
    if (!run) return null;

    const { data: answers, error: ansErr } = await supabase
      .from("answers")
      .select("*")
      .eq("run_id", runId)
      .order("created_at", { ascending: true });
    if (ansErr) throw new Error(`getReport(answers) failed: ${ansErr.message}`);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return {
      run: {
        id: run.id,
        status: run.status,
        panel: run.panel ?? [],
        costUsd: run.cost_usd ?? 0,
        error: run.error,
        createdAt: run.created_at,
        completedAt: run.completed_at,
      },
      brand: run.brand,
      competitors: run.competitors ?? [],
      brandDomains: run.brand_domains ?? [],
      answers: (answers ?? []).map((a: any) => ({
        model: a.model,
        prompt: a.prompt,
        rawAnswer: a.raw_answer,
        mentions: a.mentions ?? [],
        citedDomains: a.cited_domains ?? [],
        sentiment: a.sentiment,
      })),
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}
