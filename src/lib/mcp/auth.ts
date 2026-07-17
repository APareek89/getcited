import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { eq, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";

/**
 * Self-hosted OAuth for the MCP endpoint — ported from geo-radar-mcp
 * (apps/mcp-server/src/{self-oauth,auth}.ts) and adapted for GetCited:
 *
 *   Claude ─DCR POST /api/mcp/register─▶ us   (mint client_id, remember redirect_uris)
 *   Claude ─GET  /api/mcp/authorize───▶ us    (gate = the user's GetCited Supabase
 *                                              session, NOT a shared password → the
 *                                              issued token is BOUND to that user)
 *   Claude ─POST /api/mcp/token───────▶ us    (PKCE S256 verified → HS256 JWT)
 *   Claude ─POST /mcp      Bearer JWT─▶ us    (verify our own JWT; sub = user id)
 *
 * The tool endpoint is TOP-LEVEL /mcp (not /api/mcp) so the deployed URL equals
 * the legacy geo-radar connector URL https://geo-radar-mcp.onrender.com/mcp.
 *
 * Differences vs geo-radar: clients/codes live in Postgres (serverless-safe, not
 * in-memory Maps), and `sub` is the Supabase user id so MCP tools read that user's
 * data. Tokens signed with OAUTH_SIGNING_SECRET. No refresh tokens (Claude re-runs
 * the fast same-origin flow on expiry). Static MCP_API_KEY bypass kept for scripts.
 */

const CODE_TTL_MS = 5 * 60_000;
const DEFAULT_TOKEN_TTL_S = 604_800; // 7 days

function signingKey(): Uint8Array {
  const secret = process.env.OAUTH_SIGNING_SECRET || process.env.MCP_API_KEY;
  if (!secret) throw new Error("OAUTH_SIGNING_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function tokenTtlSeconds(): number {
  return Number(process.env.OAUTH_TOKEN_TTL_SECONDS ?? DEFAULT_TOKEN_TTL_S) || DEFAULT_TOKEN_TTL_S;
}

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Public origin of THIS deployment (issuer + audience) — see lib/http/origin. */
export { publicOrigin } from "@/lib/http/origin";

// ── DCR clients ───────────────────────────────────────────────────────────────
export interface McpClient {
  clientId: string;
  redirectUris: string[];
}

export async function registerClient(name: string | null, redirectUris: string[]): Promise<McpClient> {
  const clientId = `mcp_${randomToken(12)}`;
  await db.insert(schema.mcpOauthClients).values({ clientId, name, redirectUris });
  return { clientId, redirectUris };
}

export async function getClient(clientId: string): Promise<McpClient | null> {
  const rows = await db
    .select()
    .from(schema.mcpOauthClients)
    .where(eq(schema.mcpOauthClients.clientId, clientId))
    .limit(1);
  const r = rows[0];
  return r ? { clientId: r.clientId, redirectUris: r.redirectUris } : null;
}

// ── Authorization codes (one-time, PKCE-bound, user-bound) ───────────────────
export interface IssueCodeParams {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  resource?: string;
}

export async function issueCode(params: IssueCodeParams): Promise<string> {
  const code = randomToken();
  await db.insert(schema.mcpOauthCodes).values({
    code,
    clientId: params.clientId,
    userId: params.userId,
    redirectUri: params.redirectUri,
    codeChallenge: params.codeChallenge,
    scopes: params.scopes,
    resource: params.resource ?? null,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  // Opportunistic GC of expired codes.
  await db.delete(schema.mcpOauthCodes).where(lt(schema.mcpOauthCodes.expiresAt, new Date()));
  return code;
}

export interface ConsumedCode {
  userId: string;
  clientId: string;
  scopes: string[];
  resource: string | null;
}

/** Verify + consume a code (one-time use). Throws with an OAuth error message. */
export async function consumeCode(
  code: string,
  clientId: string,
  codeVerifier: string,
  redirectUri?: string,
): Promise<ConsumedCode> {
  const rows = await db
    .select()
    .from(schema.mcpOauthCodes)
    .where(eq(schema.mcpOauthCodes.code, code))
    .limit(1);
  const entry = rows[0];
  // Delete immediately — a failed exchange must also burn the code (spec).
  if (entry) await db.delete(schema.mcpOauthCodes).where(eq(schema.mcpOauthCodes.code, code));

  if (!entry || entry.expiresAt.getTime() < Date.now()) {
    throw new Error("invalid_grant: invalid or expired authorization code");
  }
  if (entry.clientId !== clientId) {
    throw new Error("invalid_grant: code was issued to a different client");
  }
  if (redirectUri && redirectUri !== entry.redirectUri) {
    throw new Error("invalid_grant: redirect_uri does not match the authorization request");
  }
  // PKCE S256: BASE64URL(SHA256(verifier)) must equal the stored challenge.
  const expected = createHash("sha256").update(codeVerifier).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(entry.codeChallenge);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("invalid_grant: PKCE verification failed");
  }
  return {
    userId: entry.userId,
    clientId: entry.clientId,
    scopes: entry.scopes,
    resource: entry.resource,
  };
}

// ── Tokens ────────────────────────────────────────────────────────────────────
export async function signAccessToken(params: {
  issuer: string;
  userId: string;
  clientId: string;
  scopes: string[];
  resource?: string | null;
}): Promise<string> {
  return new SignJWT({ scope: params.scopes.join(" "), client_id: params.clientId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.userId)
    .setIssuer(params.issuer)
    .setAudience(params.resource ?? params.issuer)
    .setIssuedAt()
    .setExpirationTime(`${tokenTtlSeconds()}s`)
    .sign(signingKey());
}

export interface McpAuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  /** The Supabase user id this token acts as. */
  userId: string;
}

/** Verify a token WE issued (HS256). Issuer must be this deployment's origin. */
export async function verifyMcpToken(token: string, issuer: string): Promise<McpAuthInfo> {
  const { payload } = await jwtVerify(token, signingKey(), {
    issuer: [issuer, `${issuer}/`],
  });
  if (!payload.sub) throw new Error("token has no subject");
  const scopes = typeof payload.scope === "string" ? payload.scope.split(" ").filter(Boolean) : [];
  return {
    token,
    clientId: (payload.client_id as string | undefined) ?? "self",
    scopes,
    expiresAt: typeof payload.exp === "number" ? payload.exp : undefined,
    userId: payload.sub,
  };
}

// ── RFC 8414 authorization-server metadata ────────────────────────────────────
export function authorizationServerMetadata(origin: string): Record<string, unknown> {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/api/mcp/authorize`,
    token_endpoint: `${origin}/api/mcp/token`,
    registration_endpoint: `${origin}/api/mcp/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["mcp"],
  };
}
