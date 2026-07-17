import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { publicOrigin } from "@/lib/http/origin";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  // publicOrigin, not request.url — behind Render's proxy Host is localhost:$PORT.
  return NextResponse.redirect(new URL("/", publicOrigin(request)), { status: 303 });
}
