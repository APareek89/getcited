import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { publicOrigin } from "@/lib/http/origin";

/**
 * OAuth / magic-link callback. Exchanges the `code` for a session (sets cookies via
 * the SSR client) then redirects to `next` (default /configure). On error, back to
 * /login with a message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // publicOrigin, NOT request.url's origin — Render's proxy rewrites Host to
  // the internal localhost:$PORT; the public host is in x-forwarded-host.
  const origin = publicOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/configure";
  const safeNext = next.startsWith("/") ? next : "/configure";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }
  return NextResponse.redirect(`${origin}${safeNext}`);
}
