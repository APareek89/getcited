import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getClient, issueCode } from "@/lib/mcp/auth";
import { publicOrigin } from "@/lib/http/origin";

/**
 * OAuth authorization endpoint. The login gate is the user's GetCited Supabase
 * session (browser cookies) — no shared password (improvement over geo-radar's
 * Basic-auth gate): the one-time code, and later the JWT, are BOUND to the signed-in
 * user, so MCP tools act on that user's data only. Not signed in → redirect to
 * /login and bounce back here to finish the flow.
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const clientId = p.get("client_id") ?? "";
  const redirectUri = p.get("redirect_uri") ?? "";
  const state = p.get("state") ?? "";
  const codeChallenge = p.get("code_challenge") ?? "";
  const challengeMethod = p.get("code_challenge_method") ?? "S256";
  const scopes = (p.get("scope") ?? "").split(" ").filter(Boolean);
  const resource = p.get("resource") ?? undefined;

  const fail = (error: string, description: string, status = 400) =>
    NextResponse.json({ error, error_description: description }, { status });

  if (!clientId || !redirectUri) return fail("invalid_request", "client_id and redirect_uri are required");
  if ((p.get("response_type") ?? "code") !== "code") return fail("unsupported_response_type", "only code is supported");
  if (!codeChallenge || challengeMethod !== "S256") return fail("invalid_request", "PKCE S256 code_challenge required");

  const client = await getClient(clientId);
  if (!client) return fail("invalid_client", "unknown client_id", 401);
  if (!client.redirectUris.includes(redirectUri)) {
    // Never redirect to an unregistered URI (open-redirect guard) — error inline.
    return fail("invalid_request", "redirect_uri is not registered for this client");
  }

  // Login gate: the GetCited session. Preserve the FULL authorize URL through login.
  const user = await getUser();
  if (!user) {
    // publicOrigin, NOT req.nextUrl: behind Render's proxy nextUrl's host is the
    // internal bind address (localhost:$PORT) — a clone() here 307s to localhost.
    const login = new URL("/login", publicOrigin(req));
    login.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  const code = await issueCode({
    clientId,
    userId: user.id,
    redirectUri,
    codeChallenge,
    scopes,
    resource,
  });

  const back = new URL(redirectUri);
  back.searchParams.set("code", code);
  if (state) back.searchParams.set("state", state);
  return NextResponse.redirect(back);
}
