/**
 * Self Serve SESSION keys — kept only in the browser's sessionStorage and sent
 * per request. NEVER persisted server-side. Cleared on demand. Client-only.
 * Tradeoff: sessionStorage is per-tab, so keys survive only the current tab —
 * closing it (or opening a new one) means re-entering keys. That is the
 * product promise: session-only, never lingering on disk across sessions.
 */
export interface SessionKeys {
  anthropic?: string;
  perplexity?: string;
  gemini?: string;
  groq?: string;
}

const STORAGE_KEY = "getcited_session_keys";

export function getSessionKeys(): SessionKeys {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionKeys) : {};
  } catch {
    return {};
  }
}

export function setSessionKey(provider: keyof SessionKeys, value: string) {
  const keys = getSessionKeys();
  if (value) keys[provider] = value;
  else delete keys[provider];
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function clearSessionKeys() {
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function hasAnySessionKey(): boolean {
  const k = getSessionKeys();
  return Boolean(k.anthropic || k.perplexity || k.gemini || k.groq);
}
