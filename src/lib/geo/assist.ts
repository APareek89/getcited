import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { anthropicModel } from "./providers";
import { PARSER_MODEL_ID } from "./models";
import type { ProviderKeys } from "./types";

/**
 * Configure-page AI helpers: suggest buyer-intent queries and discover competitors.
 * Both use the given per-call Anthropic key. Query suggestion is grounded with free
 * Google Suggest terms (no key, single request, cached-by-caller). Never logs keys.
 */

const QueriesSchema = z.object({
  queries: z
    .array(z.string().min(3))
    .min(4)
    .max(12)
    .describe("Buyer-intent search prompts a real buyer would ask an AI assistant."),
});

const CompetitorsSchema = z.object({
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().min(3).describe("Homepage URL or domain."),
      }),
    )
    .max(8),
});

/** Free Google Suggest autocomplete terms for a seed (no API key). Best-effort. */
export async function googleSuggest(term: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(term)}`;
    // FMEA #5: cap the wait so a slow/unresponsive upstream can't hang the action.
    const res = await fetch(url, {
      headers: { "user-agent": "GetCited/1.0 (+https://getcited.app)" },
      signal: signal ?? AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as [string, string[]];
    return Array.isArray(data?.[1]) ? data[1].slice(0, 10) : [];
  } catch {
    return [];
  }
}

export interface SuggestQueriesInput {
  brand: string;
  description?: string;
  category?: string;
  competitors?: string[];
  keys: ProviderKeys;
}

/** Claude-generated, Google-Suggest-grounded buyer-intent prompts. */
export async function suggestQueries(input: SuggestQueriesInput): Promise<string[]> {
  if (!input.keys.anthropic) throw new Error("Anthropic key required to suggest queries");

  const seeds = [input.category, input.brand, `best ${input.category ?? input.brand}`].filter(
    Boolean,
  ) as string[];
  const grounded = (
    await Promise.all(seeds.slice(0, 3).map((s) => googleSuggest(s)))
  ).flat();
  const groundingBlock = grounded.length
    ? `\nReal autocomplete phrases people search (for grounding):\n- ${grounded.slice(0, 20).join("\n- ")}`
    : "";

  const res = await generateObject({
    model: anthropicModel(PARSER_MODEL_ID, input.keys.anthropic),
    schema: QueriesSchema,
    system:
      "You write buyer-intent prompts that a real buyer would ask an AI assistant (ChatGPT, " +
      "Perplexity, Claude) when choosing a product in this category. Prompts must be answerable " +
      "with product/brand recommendations, NOT mention the brand by name, and reflect genuine " +
      "purchase intent (comparison, best-of, use-case).",
    prompt:
      `Brand: ${input.brand}\n` +
      (input.description ? `What they do: ${input.description}\n` : "") +
      (input.competitors?.length ? `Competitors: ${input.competitors.join(", ")}\n` : "") +
      groundingBlock +
      `\nReturn 6–10 diverse buyer-intent prompts.`,
    maxOutputTokens: 500,
    experimental_telemetry: { isEnabled: true, functionId: "suggest-queries" },
  });
  return dedupe(res.object.queries.map((q) => q.trim())).slice(0, 10);
}

export interface DiscoverCompetitorsInput {
  brandUrl: string;
  brandName?: string;
  description?: string;
  keys: ProviderKeys;
}

/** Claude-suggested competitor brands + URLs for the given brand. */
export async function discoverCompetitors(
  input: DiscoverCompetitorsInput,
): Promise<{ name: string; url: string }[]> {
  if (!input.keys.anthropic) throw new Error("Anthropic key required to discover competitors");

  const res = await generateObject({
    model: anthropicModel(PARSER_MODEL_ID, input.keys.anthropic),
    schema: CompetitorsSchema,
    system:
      "You identify direct competitors of a company from its website. Return well-known, real " +
      "competitors in the same category with their homepage URL. Do not include the brand itself.",
    prompt:
      `Brand website: ${input.brandUrl}\n` +
      (input.brandName ? `Brand name: ${input.brandName}\n` : "") +
      (input.description ? `What they do: ${input.description}\n` : "") +
      `\nReturn up to 5 direct competitors.`,
    maxOutputTokens: 400,
    experimental_telemetry: { isEnabled: true, functionId: "discover-competitors" },
  });
  const brandHost = safeHost(input.brandUrl);
  return res.object.competitors
    .filter((c) => safeHost(c.url) !== brandHost)
    .slice(0, 5)
    .map((c) => ({ name: c.name.trim(), url: normalizeUrl(c.url) }));
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function safeHost(url: string): string {
  try {
    return new URL(normalizeUrl(url)).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
