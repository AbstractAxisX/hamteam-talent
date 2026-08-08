import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/chat/start — find or create a conversation between current user
// and a target user. Body: { userId, initialMessage? }.
// If they are accepted connections → conversation is "active" immediately.
// If NOT connected → creates a "pending_request" conversation + notification.
// Returns { conversationId, status }.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetId = String(body.userId || "");
  const initialMessage = String(body.initialMessage || "").trim();
  if (!targetId) return NextResponse.json({ error: "شناسه کاربر الزامی است" }, { status: 400 });
  if (targetId === me.id) return NextResponse.json({ error: "نمی‌توانید با خودتان گفتگو کنید" }, { status: 400 });

  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) return NextResponse.json({ error: "کاربر پیدا نشد" }, { status: 404 });

  // Check if they have an accepted connection
  const [aId, bId] = me.id < targetId ? [me.id, targetId] : [targetId, me.id];
  const connection = await db.connection.findFirst({
    where: {
      OR: [
        { requesterId: me.id, receiverId: targetId, status: "accepted" },
        { requesterId: targetId, receiverId: me.id, status: "accepted" },
      ],
    },
  });

  const isActive = !!connection;

  // Upsert conversation
  const conv = await db.conversation.upsert({
    where: { userAId_userBId: { userAId: aId, userBId: bId } },
    update: isActive ? { status: "active", initiatorId: null } : {},
    create: {
      userAId: aId,
      userBId: bId,
      status: isActive ? "active" : "pending_request",
      initiatorId: isActive ? null : me.id,
    },
  });

  // If pending and there's an initial message, create it + notify the target
  if (!isActive && initialMessage) {
    await db.message.create({
      data: {
        conversationId: conv.id,
        senderId: me.id,
        content: initialMessage,
      },
    });
    await db.notification.create({
      data: {
        userId: targetId,
        type: "chat",
        title: "درخواست پیام جدید",
        body: `${me.name} یک پیام برای شما ارسال کرد`,
        link: `#/chat/${conv.id}`,
      },
    });
  }

  return NextResponse.json({
    conversationId: conv.id,
    status: conv.status,
  });
}
