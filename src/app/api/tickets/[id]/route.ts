import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/tickets/[id] — ticket detail with replies
// User can view own tickets; admin can view any ticket.
export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      user: { include: { profile: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { user: { include: { profile: true } } },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
  }

  const isOwner = ticket.userId === user.id;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
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
      role: ticket.user.role,
      isVerifiedBadge: ticket.user.isVerifiedBadge,
      isBanned: ticket.user.isBanned,
      avatarUrl: ticket.user.profile?.avatarUrl ?? null,
      phone: ticket.user.phone,
      nationalId: ticket.user.nationalId,
      createdAt: ticket.user.createdAt.toISOString(),
      bioShort: ticket.user.profile?.bioShort ?? "",
      province: ticket.user.profile?.province ?? null,
      city: ticket.user.profile?.city ?? null,
    },
    replies: ticket.replies.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      user: {
        id: r.user.id,
        name: r.user.name,
        role: r.user.role,
        avatarUrl: r.user.profile?.avatarUrl ?? null,
      },
    })),
  };

  return NextResponse.json({ ticket: result });
}

// POST /api/tickets/[id] — add reply { content }
// User (ticket owner) or admin can reply.
export async function POST(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
  }

  const isOwner = ticket.userId === user.id;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  if (ticket.status === "closed") {
    return NextResponse.json({ error: "این تیکت بسته شده است" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  if (content.length < 1) {
    return NextResponse.json({ error: "متن پاسخ خالی است" }, { status: 400 });
  }
  if (content.length > 5000) {
    return NextResponse.json({ error: "متن پاسخ بیش از حد طولانی است" }, { status: 400 });
  }

  const reply = await db.ticketReply.create({
    data: { ticketId: ticket.id, userId: user.id, content },
  });

  // Touch ticket updatedAt for ordering
  await db.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    ok: true,
    reply: {
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatarUrl: user.profile?.avatarUrl ?? null,
      },
    },
  });
}
