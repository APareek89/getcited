import { NextResponse, type NextRequest } from "next/server";
import { publicOrigin } from "@/lib/mcp/auth";

/**
 * RFC 9728 path-suffixed variant: clients may GET
 * /.well-known/oauth-protected-resource/api/mcp — same metadata as the root doc.
 */
export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  return NextResponse.json(
    {
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      bearer_methods_supported: ["header"],
    },
    { headers: { "cache-control": "public, max-age=3600" } },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}
