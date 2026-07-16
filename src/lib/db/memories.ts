import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type MemoryKind = "working" | "procedural" | "structural";

export interface MemoryView {
  id: string;
  kind: MemoryKind;
  content: string;
  updatedAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function listMemories(): Promise<MemoryView[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("memories")
    .select("id, kind, content, updated_at")
    .order("updated_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    kind: r.kind,
    content: r.content,
    updatedAt: r.updated_at,
  }));
}

export async function saveMemory(userId: string, kind: MemoryKind, content: string): Promise<void> {
  const supabase = await createServerSupabase();
  // Working memory is a small rolling set: cap at 10 per kind (drop the oldest).
  const { data: existing } = await supabase
    .from("memories")
    .select("id, updated_at")
    .eq("kind", kind)
    .order("updated_at", { ascending: false });
  if ((existing?.length ?? 0) >= 10) {
    const oldest = existing![existing!.length - 1]!;
    await supabase.from("memories").delete().eq("id", oldest.id);
  }
  const { error } = await supabase
    .from("memories")
    .insert({ user_id: userId, kind, content: content.slice(0, 1500), source: "agent" });
  if (error) throw new Error(error.message);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Compact memory block injected into the agent's system prompt. */
export function memoryPromptBlock(memories: MemoryView[]): string {
  if (memories.length === 0) return "";
  const byKind = (k: MemoryKind) => memories.filter((m) => m.kind === k).map((m) => `- ${m.content}`);
  const sections: string[] = [];
  const structural = byKind("structural");
  const procedural = byKind("procedural");
  const working = byKind("working");
  if (structural.length) sections.push(`Structural (facts about the brand/market):\n${structural.join("\n")}`);
  if (procedural.length) sections.push(`Procedural (how this user likes things done):\n${procedural.join("\n")}`);
  if (working.length) sections.push(`Working (current goals/threads of work):\n${working.join("\n")}`);
  return `\n\n## Memory (persisted across sessions — use it, keep it fresh via save_memory)\n${sections.join("\n\n")}`;
}
