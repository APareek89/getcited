import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes that require an authenticated user. Everything else is public. */
// NOTE: /mcp is NOT here — it is the MCP tool endpoint (bearer-token auth via
// withMcpAuth); a session redirect there would break the connector OAuth flow.
const PROTECTED_PREFIXES = ["/configure", "/assistant", "/connector", "/tracker", "/dashboard"];

/**
 * Refreshes the Supabase auth session on every request (keeps cookies fresh) and
 * redirects unauthenticated users away from protected routes to /login. Called from
 * `src/proxy.ts` (Next 16 proxy convention).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // FMEA #1: never let a Supabase auth blip 500 the whole site (incl. public pages).
  // On error, treat as unauthenticated — public routes still render, protected routes
  // fail CLOSED (redirect to /login) rather than exposing anything.
  let user = null;
  try {
    // IMPORTANT: getUser() (not getSession) revalidates the token with Supabase.
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
