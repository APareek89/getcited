import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import type { ProviderKeys } from "@/lib/geo/types";

export type KeyProvider = "anthropic" | "perplexity" | "gemini" | "groq";
export const KEY_PROVIDERS: KeyProvider[] = ["anthropic", "perplexity", "gemini", "groq"];

/** Store (or replace) an encrypted BYO key for a provider. Plaintext never persisted. */
export async function storeEncryptedKey(
  userId: string,
  provider: KeyProvider,
  plaintext: string,
): Promise<void> {
  const supabase = await createServerSupabase();
  const enc = encryptSecret(plaintext);
  await supabase.from("api_keys").delete().eq("provider", provider);
  const { error } = await supabase.from("api_keys").insert({
    user_id: userId,
    provider,
    ciphertext: enc.ciphertext,
    iv: enc.iv,
    auth_tag: enc.authTag,
  });
  if (error) throw new Error(`storeEncryptedKey failed: ${error.message}`);
}

export async function deleteStoredKey(provider: KeyProvider): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.from("api_keys").delete().eq("provider", provider);
}

/** Which providers the user has stored (names only — never returns key material). */
export async function listStoredProviders(): Promise<KeyProvider[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("api_keys").select("provider");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.provider as KeyProvider);
}

/** Decrypt all stored keys into ProviderKeys (server-only; never log the result). */
export async function getStoredProviderKeys(): Promise<ProviderKeys> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("api_keys").select("provider, ciphertext, iv, auth_tag");
  if (error) throw new Error(error.message);
  const keys: ProviderKeys = {};
  for (const r of data ?? []) {
    try {
      const value = decryptSecret({ ciphertext: r.ciphertext, iv: r.iv, authTag: r.auth_tag });
      (keys as Record<string, string>)[r.provider] = value;
    } catch {
      // skip a key that fails to decrypt (e.g. secret rotated)
    }
  }
  return keys;
}
