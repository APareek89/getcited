// Ported GEO measurement pipeline (from geo-radar-mcp), adapted for per-user keys.
export * from "./types";
export {
  PANELIST_MODELS,
  MODEL_PRICING,
  PARSER_MODEL_ID,
  PARSER_PROVIDER,
  REAL_CALL_COST_ESTIMATE_USD,
  hasAnthropicKey,
  hasPanelistKey,
  providerFor,
  type Provider,
  type PanelistModel,
} from "./models";
export {
  type Panelist,
  type PanelAnswer,
  type TokenUsage,
  createRealPanelist,
  createMockPanelist,
} from "./panelist";
export {
  type Parser,
  type ParsedResult,
  type ParseContext,
  createAnthropicParser,
  createDeterministicParser,
} from "./parser";
export { computeShareOfVoice, type ScoringInput, type ScoringResult, type ScoringAnswer } from "./scoring";
export { CostMeter } from "./cost";
export { BUILTIN_PROMPT_SETS, resolvePromptSet, type PromptSet } from "./prompt-library";
export {
  computeCitations,
  computeSentiment,
  type AnalysisAnswer,
  type CitationsResult,
  type SentimentResult,
  type CitedDomainEntry,
} from "./analysis";
export { PanelRunError } from "./errors";
export {
  InProcessPanelRunner,
  planRun,
  beginRunParams,
  MAX_PANELIST_CALLS,
  type PanelRunner,
  type RunPlan,
  type RunnerOptions,
} from "./runner";
export {
  type GeoStore,
  type PersistedAnswer,
  type BeginRunParams,
  type BeginRunResult,
  type FinishRunParams,
  type StoredReport,
} from "./store";
export { MemoryGeoStore } from "./memory-store";
export { buildReport, type FullReport } from "./report";
// NOTE: `./keys` is server-only — import it directly from "@/lib/geo/keys" in server
// code. It is intentionally NOT re-exported here so client components can import
// types/pure helpers from "@/lib/geo" without pulling in server-only modules.
