import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// POST /api/admin/tickets/[id]/reply — پاسخ ادمین به تیکت { content }
// 🔒 احراز هویت با سشن ادمین؛ پاسخ با isAdmin=true ثبت می‌شود
export async function POST(req: Request, ctx: RouteCtx) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  if (content.length < 1) return NextResponse.json({ error: "متن پاسخ خالی است" }, { status: 400 });
  if (content.length > 5000) return NextResponse.json({ error: "متن پاسخ بیش از حد طولانی است" }, { status: 400 });

  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
  if (ticket.status === "closed") {
    return NextResponse.json({ error: "این تیکت بسته است — ابتدا آن را بازگشایی کنید" }, { status: 400 });
  }

  const reply = await db.ticketReply.create({
    data: {
      ticketId: id,
      // شناسهٔ ادمین به‌عنوان نویسنده + پرچم isAdmin
      userId: admin.id,
      isAdmin: true,
      content,
    },
  });

  // بازگشایی خودکار اگر تیکت منتظر پاسخ پشتیبانی بود
  await db.ticket.update({ where: { id }, data: { updatedAt: new Date(), status: "open" } });

  // اعلان به کاربر
  await db.notification.create({
    data: {
      userId: ticket.userId,
      type: "broadcast",
      title: "پاسخ پشتیبانی به تیکت شما",
      body: content.slice(0, 80),
      link: `#/ticket/${id}`,
    },
  });

  return NextResponse.json({
    ok: true,
    reply: {
      id: reply.id,
      content: reply.content,
      isAdmin: true,
      createdAt: reply.createdAt.toISOString(),
      authorName: "پشتیبانی همتیم",
    },
  });
}
