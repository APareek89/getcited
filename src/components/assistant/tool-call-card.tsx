"use client";

import { useState } from "react";
import { Loader2, Check, AlertTriangle, ChevronDown, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { BenchmarkResult, type BenchmarkOutput } from "./benchmark-result";

const TOOL_LABELS: Record<string, string> = {
  get_active_config: "Loading your config",
  run_benchmark: "Running AI panel benchmark",
};

interface ToolPart {
  type: string; // "tool-run_benchmark" | "dynamic-tool" ...
  toolName?: string;
  state?: string; // input-streaming | input-available | output-available | output-error
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

function toolNameOf(part: ToolPart): string {
  if (part.toolName) return part.toolName;
  if (part.type.startsWith("tool-")) return part.type.slice("tool-".length);
  return "tool";
}

export function ToolCallCard({ part }: { part: ToolPart }) {
  const name = toolNameOf(part);
  const label = TOOL_LABELS[name] ?? name;
  const state = part.state ?? "input-available";
  const running = state === "input-streaming" || state === "input-available";
  const errored = state === "output-error";
  const [open, setOpen] = useState(false);

  const isBenchmark = name === "run_benchmark" && state === "output-available";
  const benchmarkErr = Boolean(
    isBenchmark &&
      part.output &&
      typeof part.output === "object" &&
      "error" in (part.output as object),
  );

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-border bg-card/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            errored ? "bg-danger/15 text-danger" : running ? "bg-primary/15 text-primary" : "bg-positive/15 text-positive",
          )}
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : errored ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </span>
        <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex-1 text-sm">{label}</span>
        <span className="text-[11px] text-muted-foreground">{state}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Specialized benchmark result (always shown when available & not an error) */}
      {isBenchmark && !benchmarkErr && (
        <div className="border-t border-border px-3.5 py-3">
          <BenchmarkResult data={part.output as BenchmarkOutput} />
        </div>
      )}
      {benchmarkErr && (
        <div className="border-t border-border px-3.5 py-2.5 text-sm text-warning">
          {(part.output as { error: string }).error}
        </div>
      )}

      {open && (
        <div className="border-t border-border bg-background/40 px-3.5 py-2.5">
          {part.input != null && (
            <Detail title="input" value={part.input} />
          )}
          {part.output != null && !isBenchmark && <Detail title="output" value={part.output} />}
          {part.errorText && <div className="text-xs text-danger">{part.errorText}</div>}
        </div>
      )}
    </div>
  );
}

function Detail({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{title}</div>
      <pre className="max-h-48 overflow-auto rounded-md bg-secondary/50 p-2 text-[11px] leading-relaxed text-muted-foreground">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
