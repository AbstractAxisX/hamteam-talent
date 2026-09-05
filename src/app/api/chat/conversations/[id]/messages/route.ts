import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/chat/conversations/[id]/messages — messages for a conversation.
// Validates current user is a participant. Returns oldest-first, take 100.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const conv = await db.conversation.findUnique({
    where: { id },
    select: { userAId: true, userBId: true },
  });
  if (!conv) {
    return NextResponse.json({ error: "گفتگو پیدا نشد" }, { status: 404 });
  }
  if (conv.userAId !== me.id && conv.userBId !== me.id) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      content: true,
      createdAt: true,
      readAt: true,
    },
  });

  // Also fetch the "other" user info for the header + status
  const otherId = conv.userAId === me.id ? conv.userBId : conv.userAId;
  const convFull = await db.conversation.findUnique({
    where: { id },
    select: { status: true, initiatorId: true, userAId: true, userBId: true },
  });
  const other = await db.user.findUnique({
    where: { id: otherId },
    include: { profile: true },
  });

  return NextResponse.json({
    conversation: {
      id,
      status: convFull?.status ?? "active",
      initiatorId: convFull?.initiatorId ?? null,
      otherUser: other
        ? {
            id: other.id,
            name: other.name,
            username: other.username ?? null,
            isVerifiedBadge: other.isVerifiedBadge,
            isTopTalent: other.isTopTalent,
            avatarUrl: other.profile?.avatarUrl ?? null,
            bioShort: other.profile?.bioShort ?? "",
            city: other.profile?.city ?? null,
            province: other.profile?.province ?? null,
          }
        : null,
    },
    messages: messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt ? m.readAt.toISOString() : null,
    })),
  });
}
