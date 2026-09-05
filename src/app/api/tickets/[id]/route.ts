import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/tickets/[id] — ticket detail with replies
// مالک تیکت جزئیات را می‌بیند؛ پاسخ‌های ادمین با پرچم isAdmin و نام «پشتیبانی» نگاشت می‌شوند
export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      user: { include: { profile: true } },
      replies: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });

  if (ticket.userId !== user.id) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const result = {
    id: ticket.id,
    subject: ticket.subject,
    body: ticket.body,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    userId: ticket.userId,
    user: {
      id: ticket.user.id,
      name: ticket.user.name,
      isVerifiedBadge: ticket.user.isVerifiedBadge,
      avatarUrl: ticket.user.profile?.avatarUrl ?? null,
    },
    replies: ticket.replies.map((r) => ({
      id: r.id,
      content: r.content,
      isAdmin: r.isAdmin,
      createdAt: r.createdAt.toISOString(),
      user: r.isAdmin
        ? { id: "support", name: "پشتیبانی همتیم", avatarUrl: null }
        : {
            id: ticket.user.id,
            name: ticket.user.name,
            avatarUrl: ticket.user.profile?.avatarUrl ?? null,
          },
    })),
  };

  return NextResponse.json({ ticket: result });
}

// POST /api/tickets/[id] — add reply { content } (only ticket owner; admins use /api/admin/tickets/[id]/reply)
export async function POST(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });

  if (ticket.userId !== user.id) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  if (ticket.status === "closed") {
    return NextResponse.json({ error: "این تیکت بسته شده است" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  if (content.length < 1) return NextResponse.json({ error: "متن پاسخ خالی است" }, { status: 400 });
  if (content.length > 5000) return NextResponse.json({ error: "متن پاسخ بیش از حد طولانی است" }, { status: 400 });

  const reply = await db.ticketReply.create({
    data: { ticketId: ticket.id, userId: user.id, isAdmin: false, content },
  });

  // Touch ticket updatedAt for ordering
  await db.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    ok: true,
    reply: {
      id: reply.id,
      content: reply.content,
      isAdmin: false,
      createdAt: reply.createdAt.toISOString(),
      user: { id: user.id, name: user.name, avatarUrl: user.profile?.avatarUrl ?? null },
    },
  });
}
