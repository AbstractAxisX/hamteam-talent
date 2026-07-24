import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/chat/conversations — list current user's conversations with
// the "other user" and last message preview, sorted by last message time desc.
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ userAId: me.id }, { userBId: me.id }],
    },
    include: {
      userA: { include: { profile: true } },
      userB: { include: { profile: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
    },
  });

  const result = conversations
    .map((c) => {
      const other = c.userAId === me.id ? c.userB : c.userA;
      const last = c.messages[0];
      return {
        id: c.id,
        otherUser: {
          id: other.id,
          name: other.name,
          isVerifiedBadge: other.isVerifiedBadge,
          avatarUrl: other.profile?.avatarUrl ?? null,
        },
        lastMessage: last
          ? {
              content: last.content,
              createdAt: last.createdAt.toISOString(),
              senderId: last.senderId,
            }
          : null,
      };
    })
    .sort((a, b) => {
      const at = a.lastMessage?.createdAt || "0";
      const bt = b.lastMessage?.createdAt || "0";
      return at < bt ? 1 : -1;
    });

  return NextResponse.json({ conversations: result });
}
