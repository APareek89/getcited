"use client";

import { useState } from "react";
import { ChevronDown, TrendingUp, AlertCircle, CircleDot, FileText, FileSpreadsheet, FileType } from "lucide-react";
import { cn } from "@/lib/utils";

function pct(n: number | null | undefined) {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

const CONF_STYLE: Record<string, string> = {
  high: "border-positive/40 bg-positive/10 text-positive",
  medium: "border-warning/40 bg-warning/10 text-warning",
  low: "border-danger/40 bg-danger/10 text-danger",
};

// ── Diagnose ─────────────────────────────────────────────────────────────────
interface Gap {
  sourceType: string;
  you: number;
  leader: number;
  deficit: number;
}
export interface DiagnoseOutput {
  current_citation_share: number;
  gap: Gap[];
  top_domains: { domain: string; count: number; is_yours: boolean; sourceType: string }[];
  crawl_grounded: boolean;
  crawled_count: number;
}

export function DiagnoseResult({ data }: { data: DiagnoseOutput }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Your citation share</span>
        <span className="font-semibold">{pct(data.current_citation_share)}</span>
        {data.crawl_grounded && (
          <span className="ml-auto rounded-full border border-positive/30 bg-positive/10 px-2 py-0.5 text-[10px] text-positive">
            {data.crawled_count} pages crawled
          </span>
        )}
      </div>
      <div>
        <div className="mb-2 text-xs text-muted-foreground">Biggest citation gaps (where AI cites others, not you)</div>
        <div className="space-y-1.5">
          {data.gap.slice(0, 6).map((g) => (
            <div key={g.sourceType} className="flex items-center gap-2 text-sm">
              <CircleDot className="h-3.5 w-3.5 text-warning" />
              <span className="capitalize">{g.sourceType}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                you {g.you} · category {g.leader} · <span className="text-warning">−{g.deficit}</span>
              </span>
            </div>
          ))}
          {data.gap.length === 0 && <div className="text-sm text-muted-foreground">No major gaps found.</div>}
        </div>
      </div>
    </div>
  );
}

// ── Plan ─────────────────────────────────────────────────────────────────────
interface ChosenTactic {
  id: string;
  name: string;
  costUsd: number;
  effortHours: number;
  leadWeeks: [number, number];
  closesGap: string | null;
}
interface Projection {
  currentCitationShare: number;
  targetCitationShare: number;
  projectedShareGain: number;
  projectedTrafficUplift: number;
  projectedConversions: number;
  timelineWeeks: number;
  confidence: string;
  assumptions: string[];
  disclaimer: string;
}
export interface PlanOutput {
  plan_id: string;
  budget_usd: number;
  team_size: number;
  timeline_weeks: number;
  person_hours: number;
  spent_usd: number;
  spent_hours: number;
  tactics: ChosenTactic[];
  projection: Projection;
}

export function PlanResult({ data }: { data: PlanOutput }) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const p = data.projection;
  return (
    <div className="space-y-4">
      {/* Projection headline */}
      <div className="rounded-xl border border-border bg-secondary/40 p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Projected citation share</span>
          <span
            className={cn(
              "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
              CONF_STYLE[p.confidence] ?? CONF_STYLE.low,
            )}
          >
            {p.confidence} confidence
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight">{pct(p.currentCitationShare)}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-2xl font-semibold tracking-tight text-primary">
            {pct(p.targetCitationShare)}
          </span>
          <span className="text-xs text-muted-foreground">in ~{p.timelineWeeks} weeks</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-background/50 p-2">
            <div className="text-[11px] text-muted-foreground">Extra AI sessions / mo</div>
            <div className="font-semibold">≈ +{p.projectedTrafficUplift.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-background/50 p-2">
            <div className="text-[11px] text-muted-foreground">Extra conversions / mo</div>
            <div className="font-semibold">≈ +{p.projectedConversions.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tactics */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Plan · {data.tactics.length} tactics</span>
          <span>
            ${data.spent_usd.toFixed(0)} / ${data.budget_usd.toFixed(0)} · {Math.round(data.spent_hours)} /{" "}
            {Math.round(data.person_hours)} hrs
          </span>
        </div>
        <div className="space-y-1.5">
          {data.tactics.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{t.name}</div>
                {t.closesGap && (
                  <div className="text-[10px] uppercase tracking-wide text-primary">closes {t.closesGap} gap</div>
                )}
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <div>{t.costUsd === 0 ? "free" : `$${t.costUsd.toFixed(0)}`}</div>
                <div>{Math.round(t.effortHours)}h</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assumptions + disclaimer */}
      <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <p className="text-xs text-muted-foreground">{p.disclaimer}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAssumptions((s) => !s)}
          className="mt-2 flex items-center gap-1 text-xs text-warning"
        >
          Assumptions ({p.assumptions.length})
          <ChevronDown className={cn("h-3 w-3 transition-transform", showAssumptions && "rotate-180")} />
        </button>
        {showAssumptions && (
          <ul className="mt-2 space-y-1 pl-1">
            {p.assumptions.map((a, i) => (
              <li key={i} className="text-[11px] text-muted-foreground">
                • {a}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Download chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Download:</span>
        <DownloadChip planId={data.plan_id} format="html" icon={FileText} label="HTML" />
        <DownloadChip planId={data.plan_id} format="pdf" icon={FileType} label="PDF" />
        <DownloadChip planId={data.plan_id} format="xlsx" icon={FileSpreadsheet} label="Excel" />
      </div>
    </div>
  );
}

function DownloadChip({
  planId,
  format,
  icon: Icon,
  label,
}: {
  planId: string;
  format: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <a
      href={`/api/report/plan/${planId}?format=${format}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
    >
      <Icon className="h-3.5 w-3.5 text-primary" />
      {label}
    </a>
  );
}

// ── Track ────────────────────────────────────────────────────────────────────
export interface TrackOutput {
  baseline_citation_share: number | null;
  target_citation_share: number | null;
  current_citation_share: number;
  pending: string[];
  tactics: { id: string; name: string; done: boolean }[];
}

export function TrackResult({ data }: { data: TrackOutput }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Baseline" value={pct(data.baseline_citation_share)} />
        <Stat label="Now" value={pct(data.current_citation_share)} highlight />
        <Stat label="Target" value={pct(data.target_citation_share)} />
      </div>
      <div>
        <div className="mb-1.5 text-xs text-muted-foreground">
          {data.pending.length} tactic{data.pending.length === 1 ? "" : "s"} pending
        </div>
        <div className="space-y-1">
          {data.tactics.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm">
              <span className={cn("h-2 w-2 rounded-full", t.done ? "bg-positive" : "bg-muted-foreground/40")} />
              <span className={t.done ? "text-muted-foreground line-through" : ""}>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-lg font-semibold", highlight && "text-primary")}>{value}</div>
    </div>
  );
}
