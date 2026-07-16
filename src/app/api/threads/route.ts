import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listThreads, createThread } from "@/lib/db/threads";

export async function GET() {
  await requireUser();
  const threads = await listThreads();
  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  let title = "New thread";
  try {
    const body = await req.json();
    if (typeof body?.title === "string" && body.title.trim()) title = body.title.trim();
  } catch {
    /* default title */
  }
  const thread = await createThread(user.id, title);
  return NextResponse.json({ thread }, { status: 201 });
}
