import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getThreadMessages, deleteThread } from "@/lib/db/threads";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  await requireUser();
  const { threadId } = await params;
  const messages = await getThreadMessages(threadId); // RLS → only own threads
  return NextResponse.json({ messages });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  await requireUser();
  const { threadId } = await params;
  await deleteThread(threadId);
  return NextResponse.json({ ok: true });
}
