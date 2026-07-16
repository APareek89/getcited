import "server-only";
import type { UIMessage } from "ai";
import { createServerSupabase } from "@/lib/supabase/server";

export interface ThreadView {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function listThreads(): Promise<ThreadView[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("threads")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createThread(userId: string, title: string): Promise<ThreadView> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("threads")
    .insert({ user_id: userId, title: title.slice(0, 80) })
    .select("id, title, created_at, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, title: data.title, createdAt: data.created_at, updatedAt: data.updated_at };
}

export async function deleteThread(threadId: string): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.from("thread_messages").delete().eq("thread_id", threadId);
  await supabase.from("threads").delete().eq("id", threadId);
}

export async function getThreadMessages(threadId: string): Promise<UIMessage[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("thread_messages")
    .select("message_id, role, parts")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.message_id,
    role: r.role,
    parts: r.parts ?? [],
  })) as UIMessage[];
}

/**
 * Replace a thread's messages with the given UIMessages (idempotent upsert of the
 * whole conversation — simplest correct persistence for the stateless chat route)
 * and bump updated_at. Also sets the title from the first user message when the
 * thread still has the default title.
 */
export async function saveThreadMessages(
  userId: string,
  threadId: string,
  messages: UIMessage[],
): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.from("thread_messages").delete().eq("thread_id", threadId);
  if (messages.length > 0) {
    const rows = messages.map((m) => ({
      thread_id: threadId,
      user_id: userId,
      message_id: m.id,
      role: m.role,
      parts: m.parts as unknown[],
    }));
    const { error } = await supabase.from("thread_messages").insert(rows);
    if (error) throw new Error(error.message);
  }
  const firstUserText = firstText(messages);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const { data: t } = await supabase.from("threads").select("title").eq("id", threadId).maybeSingle();
  if (t && t.title === "New thread" && firstUserText) {
    patch.title = firstUserText.slice(0, 80);
  }
  await supabase.from("threads").update(patch).eq("id", threadId);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function firstText(messages: UIMessage[]): string | null {
  for (const m of messages) {
    if (m.role !== "user") continue;
    for (const p of m.parts as { type: string; text?: string }[]) {
      if (p.type === "text" && p.text) return p.text;
    }
  }
  return null;
}
