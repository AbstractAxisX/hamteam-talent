import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/chat/conversations/[id]/read — mark all messages in a conversation
// from the other user as read.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const conv = await db.conversation.findUnique({ where: { id } });
  if (!conv) return NextResponse.json({ error: "گفتگو پیدا نشد" }, { status: 404 });
  if (conv.userAId !== me.id && conv.userBId !== me.id) {
    return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });
  }

  await db.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: me.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
