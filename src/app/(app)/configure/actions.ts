"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { saveConfigVersion, getActiveConfig, type ConfigView } from "@/lib/db/configs";
import { serverProviderKeys } from "@/lib/geo/keys";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  storeEncryptedKey,
  deleteStoredKey,
  listStoredProviders,
  type KeyProvider,
} from "@/lib/db/api-keys";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  suggestQueries,
  discoverCompetitors,
  normalizeUrl,
} from "@/lib/geo/assist";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

// FMEA #4: cap our-key Claude usage per user for the assist actions.
const ASSIST_LIMIT = { limit: 15, windowMs: 60_000 };

const urlish = z.string().trim().min(3).max(300);

const SaveSchema = z.object({
  brandUrl: urlish,
  brandName: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  competitors: z.array(z.string().trim().min(1).max(300)).max(15),
  // Parallel to competitors; "" when unknown (e.g. user typed a plain name).
  competitorDomains: z.array(z.string().trim().max(300)).max(15).optional(),
  queries: z.array(z.string().trim().min(1).max(400)).max(30),
  budgetUsd: z.number().min(0).max(1_000_000),
  teamSize: z.number().int().min(1).max(100),
  timelineWeeks: z.number().int().min(1).max(104),
  mode: z.enum(["we_serve", "self_serve"]).default("we_serve"),
});

/**
 * Competitors must be stored as brand NAMES (mention matching in AI answers) plus a
 * parallel domain (citation attribution). A URL-ish entry is split into both; a plain
 * name keeps the provided/empty domain. (Storing raw URLs as "names" was why SoV came
 * back empty — the parser can't find "https://runwayml.com" in prose.)
 */
function competitorNameAndDomain(entry: string, providedDomain?: string): { name: string; domain: string } {
  const trimmed = entry.trim();
  const urlish = /^https?:\/\//i.test(trimmed) || (!trimmed.includes(" ") && /\.[a-z]{2,}$/i.test(trimmed));
  if (urlish) {
    try {
      const host = new URL(normalizeUrl(trimmed)).host.replace(/^www\./, "").toLowerCase();
      const base = host.split(".")[0] ?? host;
      return { name: base.charAt(0).toUpperCase() + base.slice(1), domain: host };
    } catch {
      /* fall through */
    }
  }
  return { name: trimmed, domain: (providedDomain ?? "").toLowerCase() };
}

/** Derive candidate owned domains from a brand URL (host + apex). */
function deriveDomains(brandUrl: string): string[] {
  try {
    const host = new URL(normalizeUrl(brandUrl)).host.replace(/^www\./, "");
    const parts = host.split(".");
    const apex = parts.length > 2 ? parts.slice(-2).join(".") : host;
    return Array.from(new Set([host, apex]));
  } catch {
    return [];
  }
}

export async function saveConfigAction(
  raw: z.input<typeof SaveSchema>,
): Promise<ActionResult<ConfigView>> {
  const user = await requireUser("/configure");
  const parsed = SaveSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid config" };
  }
  const v = parsed.data;
  const pairs = v.competitors.map((c, i) => competitorNameAndDomain(c, v.competitorDomains?.[i]));
  try {
    const saved = await saveConfigVersion(user.id, {
      brandUrl: normalizeUrl(v.brandUrl),
      brandName: v.brandName || null,
      description: v.description || null,
      brandDomains: deriveDomains(v.brandUrl),
      competitors: pairs.map((p) => p.name),
      competitorDomains: pairs.map((p) => p.domain),
      queries: v.queries,
      budgetUsd: v.budgetUsd,
      teamSize: v.teamSize,
      timelineWeeks: v.timelineWeeks,
      mode: v.mode,
    });
    revalidatePath("/configure");
    revalidatePath("/dashboard");
    return { ok: true, data: saved };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save config" };
  }
}

const SuggestSchema = z.object({
  brand: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(200).optional(),
  competitors: z.array(z.string().trim()).max(15).optional(),
});

export async function suggestQueriesAction(
  raw: z.input<typeof SuggestSchema>,
): Promise<ActionResult<string[]>> {
  const user = await requireUser("/configure");
  const rl = checkRateLimit(`assist:${user.id}`, ASSIST_LIMIT);
  if (!rl.ok) {
    return { ok: false, error: `Too many requests — try again in ${Math.ceil(rl.retryAfterMs / 1000)}s` };
  }
  const parsed = SuggestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Enter a brand first" };
  const keys = serverProviderKeys();
  if (!keys.anthropic) {
    return { ok: false, error: "Anthropic key not configured on the server" };
  }
  try {
    const queries = await suggestQueries({ ...parsed.data, keys });
    return { ok: true, data: queries };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not suggest queries" };
  }
}

const DiscoverSchema = z.object({
  brandUrl: urlish,
  brandName: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
});

export async function discoverCompetitorsAction(
  raw: z.input<typeof DiscoverSchema>,
): Promise<ActionResult<{ name: string; url: string }[]>> {
  const user = await requireUser("/configure");
  const rl = checkRateLimit(`assist:${user.id}`, ASSIST_LIMIT);
  if (!rl.ok) {
    return { ok: false, error: `Too many requests — try again in ${Math.ceil(rl.retryAfterMs / 1000)}s` };
  }
  const parsed = DiscoverSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Enter your brand URL first" };
  const keys = serverProviderKeys();
  if (!keys.anthropic) {
    return { ok: false, error: "Anthropic key not configured on the server" };
  }
  try {
    const competitors = await discoverCompetitors({
      brandUrl: normalizeUrl(parsed.data.brandUrl),
      brandName: parsed.data.brandName,
      description: parsed.data.description,
      keys,
    });
    return { ok: true, data: competitors };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not discover competitors" };
  }
}

// ── Self Serve (Phase 4) ─────────────────────────────────────────────────────

const ModeSchema = z.enum(["we_serve", "self_serve"]);

/** Switch We Serve / Self Serve on the active config (in place, no new version). */
export async function saveModeAction(mode: string): Promise<ActionResult<{ mode: string }>> {
  await requireUser("/configure");
  const parsed = ModeSchema.safeParse(mode);
  if (!parsed.success) return { ok: false, error: "Invalid mode" };
  const cfg = await getActiveConfig();
  if (!cfg) return { ok: false, error: "Save your config first." };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("configs").update({ mode: parsed.data }).eq("id", cfg.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configure");
  return { ok: true, data: { mode: parsed.data } };
}

const StoreKeySchema = z.object({
  // "custom" carries a JSON blob {baseURL, model, apiKey}; its max is larger to fit
  // all three fields plus JSON overhead.
  provider: z.enum(["anthropic", "perplexity", "gemini", "groq", "custom"]),
  key: z.string().trim().min(8).max(2000),
});

/** Store an encrypted BYO key (opt-in). The plaintext is encrypted, never persisted raw. */
export async function storeKeyAction(
  raw: z.input<typeof StoreKeySchema>,
): Promise<ActionResult<{ provider: KeyProvider }>> {
  const user = await requireUser("/configure");
  const parsed = StoreKeySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Enter a valid key" };
  try {
    await storeEncryptedKey(user.id, parsed.data.provider, parsed.data.key);
    revalidatePath("/configure");
    return { ok: true, data: { provider: parsed.data.provider } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not store key" };
  }
}

export async function deleteKeyAction(provider: string): Promise<ActionResult<null>> {
  await requireUser("/configure");
  const parsed = z.enum(["anthropic", "perplexity", "gemini", "groq", "custom"]).safeParse(provider);
  if (!parsed.success) return { ok: false, error: "Invalid provider" };
  await deleteStoredKey(parsed.data);
  revalidatePath("/configure");
  return { ok: true, data: null };
}

export async function listStoredKeysAction(): Promise<ActionResult<KeyProvider[]>> {
  await requireUser("/configure");
  try {
    return { ok: true, data: await listStoredProviders() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not list keys" };
  }
}
