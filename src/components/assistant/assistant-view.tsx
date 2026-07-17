"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Send,
  Square,
  Search,
  Target,
  LineChart,
  Compass,
  Sparkles,
  Paperclip,
  Download,
  Rocket,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ToolCallCard } from "./tool-call-card";
import { Markdown } from "./markdown";
import { ThreadSidebar, type ThreadItem } from "./thread-sidebar";
import { getSessionKeys } from "@/lib/session-keys";

const AGENT_MODELS = [
  { id: "claude-haiku-4-5", label: "Haiku · fast" },
  { id: "claude-sonnet-4-6", label: "Sonnet · balanced" },
  { id: "claude-opus-4-8", label: "Opus · best" },
];

const CARDS = [
  {
    id: "benchmark",
    title: "Where do I stand?",
    subtitle: "Benchmark",
    icon: Search,
    prompt:
      "Benchmark my brand: load my config, run the AI panel, and show my share-of-voice, citation share and sentiment vs my competitors.",
  },
  {
    id: "diagnose",
    title: "Why am I here?",
    subtitle: "Diagnose",
    icon: Compass,
    prompt:
      "Diagnose why my competitors are cited more than me — categorize where AI cites in my space and show my biggest gaps.",
  },
  {
    id: "improve",
    title: "How can I improve?",
    subtitle: "Action plan",
    icon: Rocket,
    prompt:
      "Build my costed action plan: fill my biggest citation gaps within my budget and team, expand it into a week-by-week roadmap, and give me the projection with its assumptions.",
  },
  {
    id: "plan",
    title: "Where can I get to?",
    subtitle: "Projection",
    icon: Target,
    prompt:
      "What citation share, AI traffic and conversions can I realistically get to with my current budget, team and timeline? Show the modeled projection and its assumptions.",
  },
  {
    id: "track",
    title: "How am I progressing?",
    subtitle: "Track",
    icon: LineChart,
    prompt: "Track my progress against my last plan — what's done, what's pending, and the measured impact.",
  },
];

const LAST_THREAD_KEY = "getcited_last_thread";
const MAX_UPLOAD_BYTES = 120_000;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AssistantView() {
  const [model, setModel] = useState(AGENT_MODELS[1]!.id);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ name: string; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transport] = useState(() => new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status, stop, setMessages } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshThreads = useCallback(async (): Promise<ThreadItem[]> => {
    try {
      const res = await fetch("/api/threads");
      if (!res.ok) return [];
      const data = await res.json();
      const list: ThreadItem[] = (data.threads ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        updatedAt: t.updatedAt,
      }));
      setThreads(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const openThread = useCallback(
    async (id: string) => {
      setThreadId(id);
      window.localStorage.setItem(LAST_THREAD_KEY, id);
      try {
        const res = await fetch(`/api/threads/${id}`);
        const data = await res.json();
        setMessages((data.messages ?? []) as any);
      } catch {
        setMessages([]);
      }
    },
    [setMessages],
  );

  // On mount: load threads and restore the last-open one (fixes "thread went away").
  useEffect(() => {
    (async () => {
      const list = await refreshThreads();
      const last = window.localStorage.getItem(LAST_THREAD_KEY);
      if (last && list.some((t) => t.id === last)) await openThread(last);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureThread(firstText: string): Promise<string | null> {
    if (threadId) return threadId;
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: firstText.slice(0, 80) }),
      });
      const data = await res.json();
      const id = data.thread?.id as string;
      if (id) {
        setThreadId(id);
        window.localStorage.setItem(LAST_THREAD_KEY, id);
        refreshThreads();
        return id;
      }
    } catch {
      /* run un-persisted rather than blocking the user */
    }
    return null;
  }

  async function newThread() {
    setThreadId(null);
    window.localStorage.removeItem(LAST_THREAD_KEY);
    setMessages([]);
    setSelected(new Set());
  }

  async function deleteThreadById(id: string) {
    await fetch(`/api/threads/${id}`, { method: "DELETE" });
    if (id === threadId) await newThread();
    refreshThreads();
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    let finalText = t;
    if (attachment) {
      finalText = `Attached file "${attachment.name}":\n\n\`\`\`\n${attachment.text}\n\`\`\`\n\n${t}`;
      setAttachment(null);
    }
    const tid = await ensureThread(t);
    const sessionKeys = getSessionKeys();
    const body: Record<string, unknown> = { model, threadId: tid ?? undefined };
    if (Object.keys(sessionKeys).length > 0) body.keys = sessionKeys;
    sendMessage({ text: finalText }, { body });
    setInput("");
    setSelected(new Set());
    // Title/updated_at change server-side after the turn — refresh shortly after.
    setTimeout(() => refreshThreads(), 4000);
  }

  function runSelected() {
    const chosen = CARDS.filter((c) => selected.has(c.id));
    if (chosen.length === 0) return;
    const extra = input.trim();
    send(chosen.map((c) => c.prompt).join("\n\n") + (extra ? `\n\nAlso: ${extra}` : ""));
  }

  function toggleCard(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File too large — up to ~120KB of text (md, txt, csv, json).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({ name: file.name, text: String(reader.result ?? "").slice(0, MAX_UPLOAD_BYTES) });
      toast.success(`Attached ${file.name} — it will be included with your next message.`);
    };
    reader.readAsText(file);
  }

  function downloadMessage(m: any) {
    const text = (m.parts as any[])
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `getcited-answer-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <ThreadSidebar
        threads={threads}
        activeId={threadId}
        onSelect={openThread}
        onNew={newThread}
        onDelete={deleteThreadById}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <>
            {/* Messages */}
            <div className="min-h-0 flex-1 overflow-auto px-5 py-6">
              <div className="mx-auto max-w-2xl space-y-5">
                {messages.length === 0 ? (
                  <div className="pt-8 text-center">
                    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">GEO Assistant</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pick starter cards below, upload a plan for content, or ask anything about
                      your AI visibility.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-full",
                          m.role === "user"
                            ? "rounded-2xl bg-primary/15 px-4 py-2.5 text-sm"
                            : "group w-full",
                        )}
                      >
                        {(m.parts as any[]).map((p, i) => {
                          if (p.type === "text") {
                            return m.role === "user" ? (
                              <div key={i} className="whitespace-pre-wrap leading-relaxed">
                                {p.text}
                              </div>
                            ) : (
                              <Markdown key={i}>{p.text}</Markdown>
                            );
                          }
                          if (p.type === "dynamic-tool" || (typeof p.type === "string" && p.type.startsWith("tool-"))) {
                            return <ToolCallCard key={i} part={p} />;
                          }
                          return null;
                        })}
                        {m.role === "assistant" &&
                          (m.parts as any[]).some((p) => p.type === "text" && p.text?.trim()) && (
                            <button
                              type="button"
                              onClick={() => downloadMessage(m)}
                              className="mt-1.5 hidden items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground group-hover:inline-flex"
                            >
                              <Download className="h-3 w-3" /> Download as markdown
                            </button>
                          )}
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

            {/* Starter cards + composer (no divider line above the cards) */}
            <div className="px-5 pb-4 pt-1">
              <div className="mx-auto max-w-2xl space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
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
                          on ? "border-primary/60 bg-primary/10" : "border-border bg-card hover:bg-secondary",
                        )}
                      >
                        <Icon className={cn("mb-1.5 h-4 w-4", on ? "text-primary" : "text-muted-foreground")} />
                        <div className="text-xs font-medium leading-tight">{c.title}</div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.subtitle}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Composer: upload + textarea + model + send inside one surface */}
                <div className="rounded-xl border border-border bg-card p-2">
                  {attachment && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs">
                      <Paperclip className="h-3 w-3 text-primary" />
                      <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                      <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment">
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  )}
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
                    className="max-h-40 min-h-[44px] resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0"
                    rows={1}
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,.txt,.csv,.json,.html"
                      className="hidden"
                      onChange={onPickFile}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                      aria-label="Attach a file (e.g. your plan) for the agent"
                      title="Attach a file — e.g. upload your plan and ask for the content"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground outline-none focus:border-ring"
                      aria-label="Agent model"
                    >
                      {AGENT_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex-1" />
                    {busy ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => stop()}>
                        <Square className="h-3.5 w-3.5" /> Stop
                      </Button>
                    ) : selected.size > 0 ? (
                      <Button type="button" size="sm" onClick={runSelected}>
                        Go ({selected.size})
                      </Button>
                    ) : (
                      <Button type="button" size="sm" onClick={() => send(input)} disabled={!input.trim()}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">
                  Projections are modeled estimates, not guarantees. Assumptions are always listed.
                </p>
              </div>
            </div>
        </>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

