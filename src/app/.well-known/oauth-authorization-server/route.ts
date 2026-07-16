import { NextResponse, type NextRequest } from "next/server";
import { authorizationServerMetadata, publicOrigin } from "@/lib/mcp/auth";

/** RFC 8414 authorization-server metadata — we ARE the AS (self-hosted OAuth). */
export async function GET(req: NextRequest) {
  return NextResponse.json(authorizationServerMetadata(publicOrigin(req)), {
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
