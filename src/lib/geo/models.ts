import type { PanelistId, ProviderKeys } from "./types";

export type Provider = "anthropic" | "google" | "groq" | "perplexity" | "custom";

export interface PanelistModel {
  provider: Provider;
  modelId: string;
  label: string;
  /** Which ProviderKeys field this panelist needs. */
  keyField: keyof ProviderKeys;
}

/**
 * Panelist registry. Each panelist runs for real only when its provider key is
 * present in the per-call ProviderKeys, otherwise the runner falls back to the
 * deterministic mock. Model ids are centralized here so they're easy to bump.
 */
export const PANELIST_MODELS: Record<PanelistId, PanelistModel> = {
  haiku: {
    provider: "anthropic",
    modelId: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    keyField: "anthropic",
  },
  gemini: {
    provider: "google",
    modelId: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    keyField: "gemini",
  },
  groq: {
    provider: "groq",
    modelId: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B (Groq)",
    keyField: "groq",
  },
  perplexity: {
    provider: "perplexity",
    modelId: "sonar",
    label: "Perplexity Sonar",
    keyField: "perplexity",
  },
  custom: {
    provider: "custom",
    // modelId is dynamic for the custom panelist: the real model id is read from the
    // JSON blob (keys.custom → { baseURL, model, apiKey }) at build time in
    // providers.panelistModel. This registry value is intentionally unused.
    modelId: "",
    label: "Custom model",
    keyField: "custom",
  },
};

/** Parser/scorer + hallucination checker model (always Anthropic Haiku). */
export const PARSER_MODEL_ID = "claude-haiku-4-5";
export const PARSER_PROVIDER: Provider = "anthropic";

/**
 * Approximate pricing in USD per 1M tokens — used ONLY for the cost-cap guardrail,
 * so rough values are fine. Unknown/mock models contribute $0.
 */
export const MODEL_PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  "claude-haiku-4-5": { inputPerM: 1.0, outputPerM: 5.0 },
  "gemini-2.0-flash": { inputPerM: 0.1, outputPerM: 0.4 },
  "llama-3.3-70b-versatile": { inputPerM: 0.59, outputPerM: 0.79 },
  sonar: { inputPerM: 1.0, outputPerM: 1.0 },
  // NOTE: the custom OpenAI-compatible panelist has no entry here — its model id is
  // user-supplied and unknown, so CostMeter treats it as $0 and it never counts
  // toward the per-run cost cap. Accepted tradeoff for a BYO panelist.
};

/** Rough per-call cost estimate (USD) used to abort BEFORE spending near the cap. */
export const REAL_CALL_COST_ESTIMATE_USD = 0.01;

/** Is the Anthropic key present in the given per-call keys? */
export function hasAnthropicKey(keys: ProviderKeys): boolean {
  return Boolean(keys.anthropic);
}

/** Is the key for this panelist's provider present in the given per-call keys? */
export function hasPanelistKey(id: PanelistId, keys: ProviderKeys): boolean {
  return Boolean(keys[PANELIST_MODELS[id].keyField]);
}

/** The upstream provider a panelist calls (rate-limit bucket key). */
export function providerFor(id: PanelistId): Provider {
  return PANELIST_MODELS[id].provider;
}
