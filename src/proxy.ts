import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 "proxy" convention (formerly "middleware"). Refreshes the Supabase
// session on every request and guards protected routes.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except static assets/images AND the machine-facing
  // surfaces: /mcp (MCP endpoint — bearer auth, a session 307 would kill the
  // connector OAuth flow), /api (route handlers manage their own auth),
  // /.well-known (public OAuth discovery docs) and /healthz (Render checks).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|mcp$|api/|\\.well-known/|healthz$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
