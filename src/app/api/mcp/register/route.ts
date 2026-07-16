import { NextResponse, type NextRequest } from "next/server";
import { registerClient } from "@/lib/mcp/auth";

/**
 * OAuth 2.0 Dynamic Client Registration (RFC 7591) — Claude calls this when a user
 * installs the custom connector. We mint a client_id and remember redirect_uris.
 */
export async function POST(req: NextRequest) {
  let body: { client_name?: string; redirect_uris?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400 });
  }
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u) => typeof u === "string") : [];
  if (redirectUris.length === 0) {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "redirect_uris required" },
      { status: 400 },
    );
  }
  const client = await registerClient(body.client_name ?? null, redirectUris);
  return NextResponse.json(
    {
      client_id: client.clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
    },
    { status: 201 },
  );
}
