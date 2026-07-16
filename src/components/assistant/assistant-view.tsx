"use client";

import { useRef, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Send,
  Square,
  Search,
  Target,
  LineChart,
  Compass,
  Bot,
  Plug,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ToolCallCard } from "./tool-call-card";
import { McpPanel } from "./mcp-panel";
import { getSessionKeys } from "@/lib/session-keys";

const AGENT_MODELS = [
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 · fast" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 · balanced" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8 · most capable" },
];

const CARDS = [
  {
    id: "benchmark",
    title: "Where do I stand?",
    subtitle: "Benchmark",
    icon: Search,
    prompt:
      "Benchmark my brand: load my config, run an AI panel, and show my share-of-voice, citation share and sentiment vs my competitors.",
  },
  {
    id: "diagnose",
    title: "Why am I here?",
    subtitle: "Diagnose",
    icon: Compass,
    prompt:
      "Diagnose why my competitors are cited more than me — look at where and why they win.",
  },
  {
    id: "plan",
    title: "Where can I get to?",
    subtitle: "Plan",
    icon: Target,
    prompt:
      "Build a costed action plan for my budget and team, with a projected citation-share target.",
  },
  {
    id: "track",
    title: "How am I progressing?",
    subtitle: "Track",
    icon: LineChart,
    prompt: "Track my progress against my last plan — what's done and what's the measured impact.",
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AssistantView() {
  const [tab, setTab] = useState<"agent" | "mcp">("agent");
  const [model, setModel] = useState(AGENT_MODELS[1]!.id);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [transport] = useState(() => new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status, stop } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    // Pass the selected agent model + any Self Serve SESSION keys (localStorage,
    // never persisted server-side) per-send. The server only uses them if present.
    const sessionKeys = getSessionKeys();
    const body: Record<string, unknown> = { model };
    if (Object.keys(sessionKeys).length > 0) body.keys = sessionKeys;
    sendMessage({ text: t }, { body });
    setInput("");
    setSelected(new Set());
  }

  function runSelected() {
    const chosen = CARDS.filter((c) => selected.has(c.id));
    if (chosen.length === 0) return;
    send(chosen.map((c) => c.prompt).join("\n"));
  }

  function toggleCard(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:h-screen">
      {/* Tab header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
          <TabButton active={tab === "agent"} onClick={() => setTab("agent")} icon={Bot}>
            Agent Mode
          </TabButton>
          <TabButton active={tab === "mcp"} onClick={() => setTab("mcp")} icon={Plug}>
            MCP
          </TabButton>
        </div>
        {tab === "agent" && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-ring"
            >
              {AGENT_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {tab === "mcp" ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <McpPanel />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="min-h-0 flex-1 overflow-auto px-5 py-6">
            <div className="mx-auto max-w-2xl space-y-6">
              {messages.length === 0 ? (
                <div className="pt-8 text-center">
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">GEO Assistant</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick a starter card below, or ask anything about your AI visibility.
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-full rounded-2xl px-4 py-2.5 text-sm",
                        m.role === "user"
                          ? "bg-primary/15 text-foreground"
                          : "w-full bg-transparent",
                      )}
                    >
                      {(m.parts as any[]).map((p, i) => {
                        if (p.type === "text") {
                          return (
                            <div key={i} className="whitespace-pre-wrap leading-relaxed">
                              {p.text}
                            </div>
                          );
                        }
                        if (p.type === "dynamic-tool" || (typeof p.type === "string" && p.type.startsWith("tool-"))) {
                          return <ToolCallCard key={i} part={p} />;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                ))
              )}
              {busy && (
                <div className="text-xs text-muted-foreground">
                  {status === "submitted" ? "Thinking…" : "Working…"}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Starter cards + composer */}
          <div className="border-t border-border px-5 py-4">
            <div className="mx-auto max-w-2xl space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CARDS.map((c) => {
                  const Icon = c.icon;
                  const on = selected.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCard(c.id)}
                      className={cn(
                        "rounded-xl border p-2.5 text-left transition-colors",
                        on
                          ? "border-primary/60 bg-primary/10"
                          : "border-border bg-card hover:bg-secondary",
                      )}
                    >
                      <Icon className={cn("mb-1.5 h-4 w-4", on ? "text-primary" : "text-muted-foreground")} />
                      <div className="text-xs font-medium leading-tight">{c.title}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {c.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (selected.size > 0) runSelected();
                      else send(input);
                    }
                  }}
                  placeholder="Ask about your AI visibility, or select cards and hit Go…"
                  className="max-h-40 min-h-[44px] resize-none bg-card"
                  rows={1}
                />
                {busy ? (
                  <Button type="button" variant="outline" onClick={() => stop()}>
                    <Square className="h-4 w-4" /> Stop
                  </Button>
                ) : selected.size > 0 ? (
                  <Button type="button" onClick={runSelected}>
                    Go ({selected.size})
                  </Button>
                ) : (
                  <Button type="button" onClick={() => send(input)} disabled={!input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-center text-[11px] text-muted-foreground">
                Projections are modeled estimates, not guarantees. Assumptions are always listed.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
