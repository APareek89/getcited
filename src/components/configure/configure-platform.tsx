"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Check,
  ExternalLink,
  KeyRound,
  Loader2,
  Server,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getSessionKeys,
  setSessionKey,
  clearSessionKeys,
  type SessionKeys,
} from "@/lib/session-keys";
import {
  saveModeAction,
  storeKeyAction,
  deleteKeyAction,
  listStoredKeysAction,
} from "@/app/(app)/configure/actions";

/* Mirrors the Aurora Glass tier system defined in configure-form.tsx. */
const TIER1 =
  "rounded-[20px] border border-white/[0.12] bg-white/[0.05] backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-colors";
const TIER2 =
  "rounded-xl border border-white/[0.08] bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
const TIER3 = "rounded-full border border-white/10 bg-white/[0.06]";
const CODE = "rounded bg-white/[0.07] px-1 py-0.5 font-mono text-[10px] text-foreground/90";

const REPO_URL = "https://github.com/APareek89/getcited";

const PROVIDERS: {
  id: keyof SessionKeys;
  label: string;
  required?: boolean;
  placeholder: string;
}[] = [
  { id: "anthropic", label: "Anthropic", required: true, placeholder: "sk-ant-…" },
  { id: "perplexity", label: "Perplexity", placeholder: "pplx-…" },
  { id: "gemini", label: "Gemini", placeholder: "AIza…" },
  { id: "groq", label: "Groq", placeholder: "gsk_…" },
];

/** Segmented pill control (role=radiogroup, roving tabindex, ←/→ switches). */
function Segmented({
  value,
  options,
  onChange,
  ariaLabel,
  pulse = 0,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
  pulse?: number;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const idx = options.findIndex((o) => o.value === value);
    const next = (idx + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className="flex shrink-0 items-center gap-1 self-start rounded-full border border-white/10 bg-white/[0.03] p-1"
    >
      {options.map((o, i) => {
        const active = value === o.value;
        return (
          <button
            // Remounting the active pill (selection change or post-save pulse)
            // retriggers the 150ms glow-in — no toast needed on mode persist.
            key={active ? `${o.value}-active-${pulse}` : o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs transition-all",
              active
                ? "animate-in fade-in zoom-in-95 bg-aurora font-medium text-white shadow-[0_0_14px_rgba(124,58,237,0.3)] duration-150"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Icon chip + title row shared by the three platform cards. */
function CardHead({
  icon: Icon,
  title,
  sub,
  chip,
  right,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  chip?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-start gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-gradient-to-br from-[#7C3AED]/25 to-[#22D3EE]/10">
        <Icon className="h-4 w-4 text-violet-300" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {chip}
        </div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {right}
    </div>
  );
}

/** Active/Select affordance — the unselected state is a real button for keyboard users. */
function SelectChip({
  selected,
  pulse,
  onSelect,
  label,
}: {
  selected: boolean;
  pulse: number;
  onSelect: () => void;
  label: string;
}) {
  return selected ? (
    <span
      key={pulse}
      className="animate-in fade-in zoom-in-95 inline-flex shrink-0 items-center gap-1 rounded-full bg-aurora px-2 py-1 text-[10px] font-medium text-white duration-150"
    >
      <Check className="size-3" /> Active
    </span>
  ) : (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground"
    >
      Select
    </button>
  );
}

function Point({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <Check className="mt-0.5 size-3 shrink-0 text-positive" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-mono text-[9px] text-muted-foreground">
        {n}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/**
 * Platform tab — three first-class option cards. We Serve / Self Serve persist
 * instantly via saveModeAction (optimistic, excluded from the form's dirty
 * state); Self Host is informational only. The Self Serve card hosts the
 * inline key entry that used to live in the (removed) API Keys dialog — the
 * Session vs Encrypted-store logic is unchanged.
 */
export function ConfigurePlatform({
  mode,
  onModeChange,
}: {
  mode: string;
  onModeChange: (mode: string) => void;
}) {
  const [, startTransition] = useTransition();
  const [stored, setStored] = useState<string[]>([]);
  const [session, setSession] = useState<SessionKeys>({});
  const [inputs, setInputs] = useState<SessionKeys>({});
  const [storage, setStorage] = useState<"session" | "server">("session");
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [modePulse, setModePulse] = useState(0);

  useEffect(() => {
    // sessionStorage is client-only, so this read must happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(getSessionKeys());
    listStoredKeysAction().then((r) => r.ok && setStored(r.data));
  }, []);

  const configuredCount = PROVIDERS.filter(
    (p) => Boolean(session[p.id]) || stored.includes(p.id as string),
  ).length;

  function toggleMode(next: string) {
    if (next === mode) return;
    const prev = mode;
    onModeChange(next); // optimistic — the card highlight moves instantly
    startTransition(async () => {
      const res = await saveModeAction(next);
      if (!res.ok) {
        toast.error(res.error);
        onModeChange(prev); // revert the highlight
        return;
      }
      setModePulse((p) => p + 1); // subtle 150ms glow pulse on the Active chip
    });
  }

  /** Single per-row Save; routes on the card-level storage choice. */
  function saveRow(id: keyof SessionKeys) {
    const val = (inputs[id] ?? "").trim();
    if (!val) return;
    if (storage === "session") {
      // Session keys stay in this tab (sessionStorage); sent per request, never persisted.
      setSessionKey(id, val);
      setSession(getSessionKeys());
      setInputs((p) => ({ ...p, [id]: "" }));
      return;
    }
    setSavingRow(id as string);
    startTransition(async () => {
      const res = await storeKeyAction({ provider: id as never, key: val });
      setSavingRow(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setStored((p) => Array.from(new Set([...p, id as string])));
      setInputs((p) => ({ ...p, [id]: "" }));
    });
  }

  function removeStored(id: string) {
    startTransition(async () => {
      const res = await deleteKeyAction(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setStored((p) => p.filter((x) => x !== id));
    });
  }

  const selfServe = mode === "self_serve";
  const SELECTED =
    "border-violet-400/40 bg-white/[0.06] shadow-[0_0_28px_rgba(124,58,237,0.22)] hover:border-violet-400/50";

  return (
    <div className="flex flex-col gap-3">
      <p className="shrink-0 text-xs text-muted-foreground">
        Where model calls run. We Serve and Self Serve apply instantly — no Save needed.
        Self Host runs your own copy outside this app.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch">
        {/* Card 1 · We Serve (default mode) */}
        <section
          aria-label="We Serve mode"
          onClick={() => toggleMode("we_serve")}
          className={cn(
            TIER1,
            "flex h-full cursor-pointer flex-col gap-3 p-4",
            !selfServe ? SELECTED : "hover:border-white/[0.18]",
          )}
        >
          <CardHead
            icon={ShieldCheck}
            title="We Serve"
            sub="Runs end-to-end on our side."
            chip={
              <span className={cn(TIER3, "px-1.5 py-0.5 text-[10px] text-muted-foreground")}>
                Default
              </span>
            }
            right={
              <SelectChip
                selected={!selfServe}
                pulse={modePulse}
                onSelect={() => toggleMode("we_serve")}
                label="Use We Serve"
              />
            }
          />
          <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <Point>
              The AI answer panel runs Anthropic Claude (Haiku) plus Perplexity Sonar for
              answer-engine coverage — Gemini and Llama-class models are available.
            </Point>
            <Point>Roadmap writing uses a stronger Claude model.</Point>
            <Point>Runs on our keys — every run reports its exact cost.</Point>
            <Point>A hard per-run cost ceiling is enforced.</Point>
          </ul>
          <div
            className={cn(
              TIER2,
              "mt-auto flex items-center gap-2 px-3 py-2 text-[11px] text-muted-foreground",
            )}
          >
            <ShieldCheck className="size-3.5 shrink-0 text-positive" />
            Nothing to configure — it just runs.
          </div>
        </section>

        {/* Card 2 · Self Serve (BYO keys, inline entry — old Keys dialog content) */}
        <section
          aria-label="Self Serve mode"
          onClick={() => toggleMode("self_serve")}
          className={cn(
            TIER1,
            "flex h-full cursor-pointer flex-col gap-3 p-4",
            selfServe ? SELECTED : "hover:border-white/[0.18]",
          )}
        >
          <CardHead
            icon={KeyRound}
            title="Self Serve"
            sub="Bring your own provider keys."
            chip={
              <span
                className={cn(
                  TIER3,
                  "px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                  configuredCount === 0 ? "text-warning" : "text-muted-foreground",
                )}
              >
                {configuredCount}/4 keys
              </span>
            }
            right={
              <SelectChip
                selected={selfServe}
                pulse={modePulse}
                onSelect={() => toggleMode("self_serve")}
                label="Use Self Serve"
              />
            }
          />

          {/* Security note — one compressed Tier-2 line, not a banner. */}
          <div
            className={cn(
              TIER2,
              "flex gap-2 px-3 py-2 text-[11px] text-muted-foreground",
            )}
          >
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
            <span>
              Session keys never leave this tab and clear when it closes · stored keys are
              AES-GCM encrypted, never logged.
            </span>
          </div>

          {/* Inline key entry — storage choice decided once, applies to subsequent Saves. */}
          <div className={cn(TIER2, "flex flex-col gap-3 p-3")}>
            <Segmented
              ariaLabel="Key storage"
              value={storage}
              options={[
                { value: "session", label: "Session only" },
                { value: "server", label: "Encrypted" },
              ]}
              onChange={(v) => setStorage(v as "session" | "server")}
            />
            <p className="text-[10px] leading-snug text-muted-foreground/70">
              {storage === "session"
                ? "Keys stay in this browser tab — sent per request, never sent for storage."
                : "Keys are AES-GCM encrypted at rest on the server — delete them here anytime."}
            </p>

            <div className="space-y-2.5">
              {PROVIDERS.map((p) => {
                const hasSession = Boolean(session[p.id]);
                const hasStored = stored.includes(p.id as string);
                const val = inputs[p.id] ?? "";
                return (
                  <div key={p.id} className="group">
                    <div className="flex h-5 min-w-0 items-center gap-1.5">
                      {(hasSession || hasStored) && (
                        <span
                          aria-hidden
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            hasStored ? "bg-[#22D3EE]" : "bg-positive",
                          )}
                        />
                      )}
                      <span className="truncate text-xs font-medium">
                        {p.label}
                        {p.required && <span className="text-destructive"> *</span>}
                      </span>
                      {hasSession && (
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-1.5 text-[9px] uppercase text-muted-foreground">
                          session
                        </span>
                      )}
                      {hasStored && (
                        <span className="inline-flex shrink-0 items-center gap-1">
                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 text-[9px] uppercase text-muted-foreground">
                            stored
                          </span>
                          <button
                            type="button"
                            onClick={() => removeStored(p.id as string)}
                            aria-label={`Remove stored ${p.label} key`}
                            className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {p.required && (
                        <span className="ml-auto shrink truncate text-right text-[10px] text-muted-foreground/70">
                          Required to run panels
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="password"
                        value={val}
                        placeholder={p.placeholder}
                        aria-label={`${p.label} API key`}
                        onChange={(e) =>
                          setInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        className="h-8 flex-1 rounded-lg border-white/10 bg-white/5 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={!val.trim() || savingRow === p.id}
                        onClick={() => saveRow(p.id)}
                      >
                        {savingRow === p.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="self-start text-muted-foreground"
              onClick={() => {
                clearSessionKeys();
                setSession({});
              }}
            >
              Clear session keys
            </Button>
          </div>
        </section>

        {/* Card 3 · Self Host — informational, NOT a mode. Equal prominence. */}
        <section
          aria-label="Self Host"
          className={cn(TIER1, "flex h-full flex-col gap-3 p-4 hover:border-white/[0.16]")}
        >
          <CardHead
            icon={Server}
            title="Self Host"
            sub="Your infra, your keys, your data."
            chip={
              <span className={cn(TIER3, "px-1.5 py-0.5 text-[10px] text-muted-foreground")}>
                Runs outside GetCited
              </span>
            }
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Run your own GetCited instance end-to-end — the full app is open source.
          </p>
          <ol className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <Step n={1}>Clone the repo below.</Step>
            <Step n={2}>
              Copy <code className={CODE}>.env.example</code> to{" "}
              <code className={CODE}>.env.local</code> and set your provider keys.
            </Step>
            <Step n={3}>
              Run <code className={CODE}>pnpm install &amp;&amp; pnpm dev</code>.
            </Step>
          </ol>
          <p className="text-[11px] text-muted-foreground/70">
            Or deploy the same repo to Render or Vercel with the same env vars.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/5 text-xs font-medium transition-colors hover:border-white/[0.25] hover:bg-white/[0.08]"
          >
            Open the repo <ExternalLink className="size-3.5" />
          </a>
        </section>
      </div>
    </div>
  );
}
