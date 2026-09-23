import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { usersStarInfo } from "@/lib/stars";

// GET /api/chat/conversations — list current user's conversations with
// the "other user", last message preview, status, and unread count.
// Returns: { conversations, requests, unreadCount }
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
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: me.id },
              readAt: null,
            },
          },
        },
      },
    },
  });

  /* قاب چهره برتر (طلایی/رزگلد) برای همهٔ طرف‌های گفتگو */
  const starInfo = await usersStarInfo(
    conversations.map((c) => (c.userAId === me.id ? c.userBId : c.userAId))
  );

  const active: any[] = [];
  const requests: any[] = [];

  for (const c of conversations) {
    const other = c.userAId === me.id ? c.userB : c.userA;
    const si = starInfo.get(other.id);
    const last = c.messages[0];
    const item = {
      id: c.id,
      otherUser: {
        id: other.id,
        name: other.name,
        isVerifiedBadge: other.isVerifiedBadge,
        isScout: other.isScout,
        isTopTalent: si?.isTopTalent ?? false,
        frame: si?.frame ?? null,
        totalStars: si?.totalStars ?? 0,
        avatarUrl: other.profile?.avatarUrl ?? null,
        gender: (other.profile?.gender as string | null) ?? null,
      },
      lastMessage: last
        ? {
            content: last.content,
            createdAt: last.createdAt.toISOString(),
            senderId: last.senderId,
          }
        : null,
      status: c.status,
      initiatorId: c.initiatorId,
      unreadCount: c._count?.messages || 0,
    };

    if (c.status === "pending_request" && c.initiatorId !== me.id) {
      // This is a message request FOR me
      requests.push(item);
    } else if (c.status === "active") {
      active.push(item);
    } else if (c.status === "pending_request" && c.initiatorId === me.id) {
      // My own pending request — show in active list with a "pending" label
      active.push({ ...item, myRequestPending: true });
    }
  }

  active.sort((a, b) => {
    const at = a.lastMessage?.createdAt || "0";
    const bt = b.lastMessage?.createdAt || "0";
    return at < bt ? 1 : -1;
  });

  const unreadCount = active.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return NextResponse.json({
    conversations: active,
    requests,
    unreadCount,
  });
}
