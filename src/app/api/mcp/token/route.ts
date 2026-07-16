import { NextResponse, type NextRequest } from "next/server";
import { consumeCode, signAccessToken, publicOrigin, tokenTtlSeconds } from "@/lib/mcp/auth";

/**
 * OAuth token endpoint (authorization_code + PKCE only; public client, no secret).
 * Exchanges the one-time code for an HS256 JWT whose `sub` is the GetCited user id.
 * No refresh tokens — Claude re-runs the fast same-origin flow on expiry (same
 * behavior as geo-radar's self-hosted mode).
 */
export async function POST(req: NextRequest) {
  let params: URLSearchParams;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    params = new URLSearchParams(Object.entries((await req.json()) as Record<string, string>));
  } else {
    params = new URLSearchParams(await req.text());
  }

  const err = (error: string, description: string, status = 400) =>
    NextResponse.json({ error, error_description: description }, { status });

  if (params.get("grant_type") !== "authorization_code") {
    return err("unsupported_grant_type", "only authorization_code is supported");
  }
  const code = params.get("code") ?? "";
  const clientId = params.get("client_id") ?? "";
  const codeVerifier = params.get("code_verifier") ?? "";
  const redirectUri = params.get("redirect_uri") ?? undefined;
  if (!code || !clientId || !codeVerifier) {
    return err("invalid_request", "code, client_id and code_verifier are required");
  }

  try {
    const consumed = await consumeCode(code, clientId, codeVerifier, redirectUri);
    const issuer = publicOrigin(req);
    const access_token = await signAccessToken({
      issuer,
      userId: consumed.userId,
      clientId: consumed.clientId,
      scopes: consumed.scopes,
      resource: consumed.resource,
    });
    return NextResponse.json({
      access_token,
      token_type: "bearer",
      expires_in: tokenTtlSeconds(),
      scope: consumed.scopes.join(" ") || undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid_grant";
    const [error, description] = msg.includes(":")
      ? [msg.slice(0, msg.indexOf(":")), msg.slice(msg.indexOf(":") + 1).trim()]
      : ["invalid_grant", msg];
    return err(error, description);
  }
}
