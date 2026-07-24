import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/notifications — newest first, take 50, with unread count.
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const [rows, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({ where: { userId: me.id, read: false } }),
  ]);

  const notifications = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return NextResponse.json({ notifications, unreadCount });
}

// POST /api/notifications
//   { action: "markAllRead" }                  — mark all as read
//   { id, action: "markRead" }                 — mark one as read
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "markAllRead") {
    await db.notification.updateMany({
      where: { userId: me.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true, unreadCount: 0 });
  }

  if (action === "markRead") {
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "شناسه اعلان الزامی است" }, { status: 400 });
    }
    await db.notification.updateMany({
      where: { id, userId: me.id },
      data: { read: true },
    });
    const unreadCount = await db.notification.count({
      where: { userId: me.id, read: false },
    });
    return NextResponse.json({ ok: true, unreadCount });
  }

  return NextResponse.json({ error: "اقدام نامعتبر است" }, { status: 400 });
}
