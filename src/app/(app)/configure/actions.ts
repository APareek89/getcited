"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { saveConfigVersion, type ConfigView } from "@/lib/db/configs";
import { serverProviderKeys } from "@/lib/geo/keys";
import {
  suggestQueries,
  discoverCompetitors,
  normalizeUrl,
} from "@/lib/geo/assist";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const urlish = z.string().trim().min(3).max(300);

const SaveSchema = z.object({
  brandUrl: urlish,
  brandName: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  competitors: z.array(z.string().trim().min(1).max(300)).max(15),
  queries: z.array(z.string().trim().min(1).max(400)).max(30),
  budgetUsd: z.number().min(0).max(1_000_000),
  teamSize: z.number().int().min(1).max(100),
  timelineWeeks: z.number().int().min(1).max(104),
  mode: z.enum(["we_serve", "self_serve"]).default("we_serve"),
});

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
  try {
    const saved = await saveConfigVersion(user.id, {
      brandUrl: normalizeUrl(v.brandUrl),
      brandName: v.brandName || null,
      description: v.description || null,
      brandDomains: deriveDomains(v.brandUrl),
      competitors: v.competitors.map(normalizeUrl),
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
  await requireUser("/configure");
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
  await requireUser("/configure");
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
