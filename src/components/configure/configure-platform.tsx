"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
      className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1"
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

/**
 * Strip-C right cluster (mode segmented + Keys entry) and the API Keys dialog.
 * Mode persists instantly via saveModeAction (excluded from the form's dirty
 * state); key handling keeps the Session vs Encrypted-store logic intact.
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
    onModeChange(next); // optimistic — segment moves instantly
    startTransition(async () => {
      const res = await saveModeAction(next);
      if (!res.ok) {
        toast.error(res.error);
        onModeChange(prev); // revert the segment
        return;
      }
      setModePulse((p) => p + 1); // subtle 150ms glow pulse on the active pill
    });
  }

  /** Single per-row Save; routes on the dialog-level storage choice. */
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

  return (
    <div className="ml-auto flex shrink-0 items-center gap-3">
      <Segmented
        ariaLabel="Platform mode"
        value={mode}
        pulse={modePulse}
        options={[
          { value: "we_serve", label: "We run it" },
          { value: "self_serve", label: "Your keys" },
        ]}
        onChange={toggleMode}
      />

      {mode === "self_serve" ? (
        <div key="keys-entry" className="animate-in fade-in duration-200">
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg border-white/[0.12] bg-white/5"
                />
              }
            >
              <KeyRound className="size-3.5" />
              Keys
              <span
                className={cn(
                  "ml-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 font-mono text-[10px] tabular-nums",
                  configuredCount === 0 && "text-warning",
                )}
              >
                {configuredCount === 0 && (
                  <span className="size-1.5 rounded-full bg-warning" aria-hidden />
                )}
                {configuredCount}
              </span>
            </DialogTrigger>

            {/* D · API Keys dialog — portal, never affects page height. */}
            <DialogContent className="rounded-[20px] border border-white/[0.12] bg-[#0B1020]/90 ring-0 backdrop-blur-xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Your API keys</DialogTitle>
              </DialogHeader>

              {/* Security note — one compressed Tier-2 line, not a banner. */}
              <div className="flex gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
                <span>
                  Session keys never leave this tab and clear when it closes · stored keys
                  are AES-GCM encrypted, never logged.
                </span>
              </div>

              {/* Storage choice — decided once, applies to subsequent Saves. */}
              <Segmented
                ariaLabel="Key storage"
                value={storage}
                options={[
                  { value: "session", label: "This session only" },
                  { value: "server", label: "Encrypted on server" },
                ]}
                onChange={(v) => setStorage(v as "session" | "server")}
              />

              <div className="space-y-3">
                {PROVIDERS.map((p) => {
                  const hasSession = Boolean(session[p.id]);
                  const hasStored = stored.includes(p.id as string);
                  const val = inputs[p.id] ?? "";
                  return (
                    <div key={p.id}>
                      <div className="group flex items-center gap-2">
                        <span className="flex w-24 shrink-0 items-center gap-1.5 text-xs font-medium">
                          {(hasSession || hasStored) && (
                            <span
                              aria-hidden
                              className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                hasStored ? "bg-[#22D3EE]" : "bg-positive",
                              )}
                            />
                          )}
                          <span className="truncate">
                            {p.label}
                            {p.required && <span className="text-destructive"> *</span>}
                          </span>
                        </span>
                        {hasSession && (
                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 text-[9px] uppercase text-muted-foreground">
                            session
                          </span>
                        )}
                        {hasStored && (
                          <span className="inline-flex items-center gap-1">
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
                        <Input
                          type="password"
                          value={val}
                          placeholder={p.placeholder}
                          aria-label={`${p.label} API key`}
                          onChange={(e) =>
                            setInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          className="h-9 flex-1 rounded-xl border-white/10 bg-white/5"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-9"
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
                      {p.required && (
                        <p className="mt-1 pl-[104px] text-[10px] text-muted-foreground/70">
                          Required to run panels
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground"
                  onClick={() => {
                    clearSessionKeys();
                    setSession({});
                  }}
                >
                  Clear session keys
                </Button>
                <a
                  href="https://vercel.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Self-hosting guide <ExternalLink className="size-3" />
                </a>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <span
          key="we-run"
          className="animate-in fade-in inline-flex items-center gap-1.5 text-[11px] text-muted-foreground duration-200"
        >
          <ShieldCheck className="size-3.5 text-positive" />
          Runs on our keys — nothing to set up.
        </span>
      )}
    </div>
  );
}
