"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, ServerCog, Code2, Check, Trash2, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSessionKeys, setSessionKey, clearSessionKeys, type SessionKeys } from "@/lib/session-keys";
import {
  saveModeAction,
  storeKeyAction,
  deleteKeyAction,
  listStoredKeysAction,
} from "@/app/(app)/configure/actions";

const PROVIDERS: { id: keyof SessionKeys; label: string; required?: boolean }[] = [
  { id: "anthropic", label: "Anthropic (Claude)", required: true },
  { id: "perplexity", label: "Perplexity" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" },
];

const OPTIONS = [
  { id: "trust", label: "Trust us (BYO keys)", icon: KeyRound },
  { id: "instance", label: "Own instance", icon: ServerCog },
  { id: "code", label: "Code base", icon: Code2 },
] as const;

export function ConfigurePlatform({ initialMode }: { initialMode: string }) {
  const [mode, setMode] = useState(initialMode);
  const [option, setOption] = useState<(typeof OPTIONS)[number]["id"]>("trust");
  const [pending, startTransition] = useTransition();
  const [stored, setStored] = useState<string[]>([]);
  const [session, setSession] = useState<SessionKeys>({});
  const [inputs, setInputs] = useState<SessionKeys>({});

  useEffect(() => {
    // localStorage is client-only, so this read must happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(getSessionKeys());
    listStoredKeysAction().then((r) => r.ok && setStored(r.data));
  }, []);

  function toggleMode(next: string) {
    setMode(next);
    startTransition(async () => {
      const res = await saveModeAction(next);
      if (!res.ok) toast.error(res.error);
    });
  }

  function saveSession(id: keyof SessionKeys) {
    const val = (inputs[id] ?? "").trim();
    if (!val) return;
    setSessionKey(id, val);
    setSession(getSessionKeys());
    setInputs((p) => ({ ...p, [id]: "" }));
    toast.success(`${id} key saved in this browser (session only)`);
  }

  function storeEncrypted(id: keyof SessionKeys) {
    const val = (inputs[id] ?? "").trim();
    if (!val) return;
    startTransition(async () => {
      const res = await storeKeyAction({ provider: id as never, key: val });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setStored((p) => Array.from(new Set([...p, id as string])));
      setInputs((p) => ({ ...p, [id]: "" }));
      toast.success(`${id} key encrypted & stored`);
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
      toast.success(`${id} key removed`);
    });
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Platform</div>
          <p className="text-xs text-muted-foreground">Who runs the AI panel and crawls.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
          {[
            { id: "we_serve", label: "We Serve" },
            { id: "self_serve", label: "Self Serve" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMode(m.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs transition-colors",
                mode === m.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "we_serve" ? (
        <p className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          We Serve: runs use our infrastructure and keys. Nothing to configure — head to the
          GEO Assistant.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {OPTIONS.map((o) => {
              const Icon = o.icon;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOption(o.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                    option === o.id ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {o.label}
                </button>
              );
            })}
          </div>

          {option === "trust" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-positive/20 bg-positive/5 p-2.5 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
                <span>
                  <span className="text-foreground">Session keys</span> stay in this browser and
                  are sent per request — never persisted. Or opt in to{" "}
                  <span className="text-foreground">encrypted storage</span> (AES-GCM). Keys are
                  never logged.
                </span>
              </div>
              {PROVIDERS.map((p) => {
                const hasSession = Boolean(session[p.id]);
                const hasStored = stored.includes(p.id as string);
                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{p.label}</span>
                      {p.required && <span className="text-danger">*</span>}
                      {hasSession && <Badge tone="pos">session</Badge>}
                      {hasStored && (
                        <span className="inline-flex items-center gap-1">
                          <Badge tone="accent">stored</Badge>
                          <button
                            type="button"
                            onClick={() => removeStored(p.id as string)}
                            className="text-muted-foreground hover:text-danger"
                            aria-label="Remove stored key"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        placeholder={`${p.label} API key`}
                        value={inputs[p.id] ?? ""}
                        onChange={(e) => setInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => saveSession(p.id)}>
                        Session
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => storeEncrypted(p.id)} disabled={pending}>
                        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Store
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearSessionKeys();
                  setSession({});
                  toast.success("Session keys cleared from this browser");
                }}
              >
                Clear session keys
              </Button>
            </div>
          )}

          {option === "instance" && (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Deploy your own GetCited on Vercel and point it at your Supabase + keys.</p>
              <ol className="ml-4 list-decimal space-y-1 text-xs">
                <li>Click deploy → pick a Vercel project.</li>
                <li>Set env: Supabase URL/keys, ANTHROPIC_API_KEY, KEY_ENCRYPTION_SECRET.</li>
                <li>Deploy, then paste your instance URL back here.</li>
              </ol>
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary"
              >
                <ServerCog className="h-3.5 w-3.5 text-primary" /> Deploy on Vercel <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {option === "code" && (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Self-host from source: clone, set env, and deploy anywhere Node runs.</p>
              <ol className="ml-4 list-decimal space-y-1 text-xs">
                <li>Download / clone the repo.</li>
                <li>Push to your GitHub.</li>
                <li>Connect to Vercel / your host and set env vars.</li>
              </ol>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <Code2 className="h-3.5 w-3.5" /> Repo link added on publish
              </span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "pos" | "accent" }) {
  return (
    <span
      className={cn(
        "rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wide",
        tone === "pos" ? "border-positive/30 bg-positive/10 text-positive" : "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      {children}
    </span>
  );
}
