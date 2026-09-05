import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/admin/tickets/[id] — ticket detail with replies (admin view)
export async function GET(_req: Request, ctx: RouteCtx) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await ctx.params;
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      user: { include: { profile: true } },
      replies: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      body: ticket.body,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      user: {
        id: ticket.user.id,
        name: ticket.user.name,
        phone: ticket.user.phone,
        avatarUrl: ticket.user.profile?.avatarUrl ?? null,
      },
      replies: ticket.replies.map((r) => ({
        id: r.id,
        content: r.content,
        isAdmin: r.isAdmin,
        createdAt: r.createdAt.toISOString(),
        authorName: r.isAdmin ? "پشتیبانی همتیم" : ticket.user.name,
      })),
    },
  });
}

// PATCH /api/admin/tickets/[id] — { status: "open" | "closed" }
export async function PATCH(req: Request, ctx: RouteCtx) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "");
  if (status !== "open" && status !== "closed") {
    return NextResponse.json({ error: "وضعیت نامعتبر" }, { status: 400 });
  }

  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });

  await db.ticket.update({ where: { id }, data: { status } });

  // اعلان به کاربر دربارهٔ تغییر وضعیت
  await db.notification.create({
    data: {
      userId: ticket.userId,
      type: "broadcast",
      title: status === "closed" ? "تیکت شما بسته شد" : "تیکت شما بازگشایی شد",
      body: ticket.subject,
      link: `#/ticket/${id}`,
    },
  });

  return NextResponse.json({ ok: true, status });
}
