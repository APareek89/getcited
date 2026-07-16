/**
 * Self Serve SESSION keys — kept only in the browser's localStorage and sent per
 * request. NEVER persisted server-side. Cleared on demand. Client-only.
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
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionKeys) : {};
  } catch {
    return {};
  }
}

export function setSessionKey(provider: keyof SessionKeys, value: string) {
  const keys = getSessionKeys();
  if (value) keys[provider] = value;
  else delete keys[provider];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function clearSessionKeys() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasAnySessionKey(): boolean {
  const k = getSessionKeys();
  return Boolean(k.anthropic || k.perplexity || k.gemini || k.groq);
}
