import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createPerplexity } from "@ai-sdk/perplexity";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { PanelistId, ProviderKeys } from "./types";
import { PANELIST_MODELS } from "./models";

/**
 * Build a Vercel AI SDK model for a panelist using a PER-CALL api key (never
 * process.env). Providers are constructed on each call because keys differ per
 * user; the call count per run is small so this is cheap. Throws if the key for
 * this panelist's provider is missing (the runner only calls this when it decided
 * the panelist runs for real).
 */
export function panelistModel(id: PanelistId, keys: ProviderKeys): LanguageModel {
  const { provider, modelId, keyField } = PANELIST_MODELS[id];
  const apiKey = keys[keyField];
  if (!apiKey) {
    throw new Error(`Missing ${keyField} API key for panelist "${id}"`);
  }
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "groq":
      return createGroq({ apiKey })(modelId);
    case "perplexity":
      return createPerplexity({ apiKey })(modelId);
    case "custom": {
      // The custom panelist stores all three fields as a JSON blob in keys.custom.
      const cfg = parseCustomConfig(apiKey);
      return createOpenAICompatible({ baseURL: cfg.baseURL, name: "custom", apiKey: cfg.apiKey })(
        cfg.model,
      );
    }
  }
}

/** Parsed shape of the custom OpenAI-compatible panelist config blob. */
export interface CustomModelConfig {
  baseURL: string;
  model: string;
  apiKey: string;
}

/**
 * Parse the `keys.custom` JSON blob into a {baseURL, model, apiKey}. Throws a clear
 * error if the blob is malformed or any field is missing, so a bad config surfaces
 * loudly instead of silently building an unusable model.
 */
export function parseCustomConfig(blob: string): CustomModelConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(blob);
  } catch {
    throw new Error("Custom model config is not valid JSON (expected {baseURL, model, apiKey})");
  }
  const cfg = parsed as Partial<CustomModelConfig>;
  const baseURL = typeof cfg.baseURL === "string" ? cfg.baseURL.trim() : "";
  const model = typeof cfg.model === "string" ? cfg.model.trim() : "";
  const apiKey = typeof cfg.apiKey === "string" ? cfg.apiKey.trim() : "";
  if (!baseURL || !model || !apiKey) {
    const missing = [
      !baseURL && "baseURL",
      !model && "model",
      !apiKey && "apiKey",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Custom model config is missing: ${missing}`);
  }
  return { baseURL, model, apiKey };
}

/** The Anthropic model used for parsing/scoring/hallucination checks (per-call key). */
export function anthropicModel(modelId: string, apiKey: string): LanguageModel {
  if (!apiKey) throw new Error("Missing Anthropic API key for the parser");
  return createAnthropic({ apiKey })(modelId);
}
