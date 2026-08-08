import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { NotificationCounts } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// GET /api/notifications
//   Returns:
//     - notifications: newest first, take 50 (filtered by ?type= if provided)
//     - unreadCount: total unread
//     - counts: { all, job_match, connection, chat, broadcast } (unread only)
// ─────────────────────────────────────────────────────────────

// Map raw Notification.type values into 5 categories:
//   - job_match:        type === "job_match"
//   - connection:        type starts with "connection" (connection_request, connection_accepted)
//   - chat:             type === "chat" || type === "chat_message"
//   - broadcast:         type === "broadcast"
//   - all:              every unread (sum)
function bucket(type: string): keyof NotificationCounts | null {
  switch (true) {
    case type === "job_match":
      return "job_match";
    case type.startsWith("connection"):
      return "connection";
    case type === "chat" || type === "chat_message":
      return "chat";
    case type === "broadcast":
      return "broadcast";
    default:
      return null;
  }
}

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const url = new URL(req.url);
  const typeFilter = url.searchParams.get("type") || "";

  // Build where clause — apply type filter (mapped) if provided
  const where: { userId: string; type?: { in: string[] } } = { userId: me.id };
  if (typeFilter) {
    switch (typeFilter) {
      case "job_match":
        where.type = { in: ["job_match"] };
        break;
      case "connection":
        where.type = { in: ["connection_request", "connection_accepted"] };
        break;
      case "chat":
        where.type = { in: ["chat", "chat_message"] };
        break;
      case "broadcast":
        where.type = { in: ["broadcast"] };
        break;
      default:
        break;
    }
  }

  const [rows, unreadCount, unreadRows] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({
      where: { userId: me.id, read: false },
    }),
    db.notification.findMany({
      where: { userId: me.id, read: false },
      select: { type: true },
    }),
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

  // Build counts object — unread only
  const counts: NotificationCounts = {
    all: unreadCount,
    job_match: 0,
    connection: 0,
    chat: 0,
    broadcast: 0,
  };
  for (const r of unreadRows) {
    const b = bucket(r.type);
    if (b) counts[b] = (counts[b] ?? 0) + 1;
  }

  return NextResponse.json({ notifications, unreadCount, counts });
}

// ─────────────────────────────────────────────────────────────
// POST /api/notifications
//   { action: "markAllRead" }                  — mark all as read
//   { id, action: "markRead" }                 — mark one as read
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "markAllRead") {
    await db.notification.updateMany({
      where: { userId: me.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({
      ok: true,
      unreadCount: 0,
      counts: { all: 0, job_match: 0, connection: 0, chat: 0, broadcast: 0 },
    });
  }

  if (action === "markRead") {
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json(
        { error: "شناسه اعلان الزامی است" },
        { status: 400 }
      );
    }
    await db.notification.updateMany({
      where: { id, userId: me.id },
      data: { read: true },
    });

    // Recompute counts
    const unreadCount = await db.notification.count({
      where: { userId: me.id, read: false },
    });
    const unreadRows = await db.notification.findMany({
      where: { userId: me.id, read: false },
      select: { type: true },
    });
    const counts: NotificationCounts = {
      all: unreadCount,
      job_match: 0,
      connection: 0,
      chat: 0,
      broadcast: 0,
    };
    for (const r of unreadRows) {
      const b = bucket(r.type);
      if (b) counts[b] = (counts[b] ?? 0) + 1;
    }

    return NextResponse.json({ ok: true, unreadCount, counts });
  }

  return NextResponse.json({ error: "اقدام نامعتبر است" }, { status: 400 });
}
