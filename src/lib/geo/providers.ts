import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createPerplexity } from "@ai-sdk/perplexity";
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
  }
}

/** The Anthropic model used for parsing/scoring/hallucination checks (per-call key). */
export function anthropicModel(modelId: string, apiKey: string): LanguageModel {
  if (!apiKey) throw new Error("Missing Anthropic API key for the parser");
  return createAnthropic({ apiKey })(modelId);
}
