"use client";

/** Compact render of a run_benchmark tool result inside a tool-call card. */

interface SovEntry {
  brand: string;
  mentions: number;
  sov: number;
}

export interface BenchmarkOutput {
  brand: string;
  panel: string[];
  answer_count: number;
  cost_usd: number;
  share_of_voice: SovEntry[];
  your_citation_share: number;
  total_citations: number;
  citation_gap_count: number;
  sentiment: { score: number | null; distribution: { positive: number; neutral: number; negative: number } };
  report_id: string;
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function BenchmarkResult({ data }: { data: BenchmarkOutput }) {
  const rows = [...(data.share_of_voice ?? [])].sort((a, b) => b.sov - a.sov);
  const yourSov = rows.find((r) => r.brand === data.brand)?.sov ?? 0;
  const sentLabel =
    data.sentiment.score == null
      ? "n/a"
      : data.sentiment.score > 0.2
        ? "positive"
        : data.sentiment.score < -0.2
          ? "negative"
          : "neutral";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Kpi label="Your SoV" value={pct(yourSov)} />
        <Kpi label="Citation share" value={pct(data.your_citation_share)} />
        <Kpi label="Sentiment" value={sentLabel} />
      </div>

      <div>
        <div className="mb-2 text-xs text-muted-foreground">Share of voice</div>
        <div className="space-y-2">
          {rows.map((r) => {
            const isBrand = r.brand === data.brand;
            return (
              <div key={r.brand}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className={isBrand ? "font-medium text-foreground" : "text-muted-foreground"}>
                    {r.brand}
                    {isBrand && <span className="ml-1.5 text-[10px] uppercase text-primary">you</span>}
                  </span>
                  <span className={isBrand ? "text-foreground" : "text-muted-foreground"}>{pct(r.sov)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: pct(r.sov), background: isBrand ? "#635BFF" : "#3A414B" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {data.total_citations} citations across {data.answer_count} answers · {data.citation_gap_count}{" "}
        answers cited others but not you · panel: {data.panel.join(", ")} · ~${data.cost_usd.toFixed(4)}
      </p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
