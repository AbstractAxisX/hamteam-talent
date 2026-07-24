import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/chat/start — find or create a conversation between current user
// and a target user. Body: { userId }. Returns { conversationId }.
// We use the convention: userAId < userBId (lexicographic) so the pair is unique
// regardless of who initiated.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetId = String(body.userId || "");
  if (!targetId) {
    return NextResponse.json({ error: "شناسه کاربر الزامی است" }, { status: 400 });
  }
  if (targetId === me.id) {
    return NextResponse.json({ error: "نمی‌توانید با خودتان گفتگو کنید" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ error: "کاربر پیدا نشد" }, { status: 404 });
  }

  const [aId, bId] = me.id < targetId ? [me.id, targetId] : [targetId, me.id];
  const conv = await db.conversation.upsert({
    where: { userAId_userBId: { userAId: aId, userBId: bId } },
    update: {},
    create: { userAId: aId, userBId: bId },
  });

  return NextResponse.json({ conversationId: conv.id });
}
