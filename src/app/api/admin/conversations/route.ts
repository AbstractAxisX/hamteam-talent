import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/conversations — list all conversations (read-only oversight)
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "50")));

  const [total, conversations] = await Promise.all([
    db.conversation.count(),
    db.conversation.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        userA: { include: { profile: true } },
        userB: { include: { profile: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const result = conversations.map((c) => ({
    id: c.id,
    createdAt: c.createdAt.toISOString(),
    messageCount: c._count.messages,
    lastMessage: c.messages[0]
      ? {
          content: c.messages[0].content,
          createdAt: c.messages[0].createdAt.toISOString(),
        }
      : null,
    userA: {
      id: c.userA.id,
      name: c.userA.name,
      phone: c.userA.phone,
      role: c.userA.role,
      isBanned: c.userA.isBanned,
      avatarUrl: c.userA.profile?.avatarUrl ?? null,
    },
    userB: {
      id: c.userB.id,
      name: c.userB.name,
      phone: c.userB.phone,
      role: c.userB.role,
      isBanned: c.userB.isBanned,
      avatarUrl: c.userB.profile?.avatarUrl ?? null,
    },
  }));

  return NextResponse.json({
    conversations: result,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}
