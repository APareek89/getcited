import { NextResponse, type NextRequest } from "next/server";
import { publicOrigin } from "@/lib/mcp/auth";

/**
 * RFC 9728 protected-resource metadata — tells MCP clients (Claude) which
 * authorization server guards /api/mcp (ourselves; same-origin self-hosted AS).
 * Shape ported from geo-radar's protectedResourceMetadata().
 */
function metadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ["header"],
  };
}

export async function GET(req: NextRequest) {
  return NextResponse.json(metadata(publicOrigin(req)), {
    headers: { "cache-control": "public, max-age=3600" },
  });
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
