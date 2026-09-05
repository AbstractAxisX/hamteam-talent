import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// POST /api/tickets/[id]/close — close ticket (فقط مالک؛ ادمین از مسیر ادمین بسته/باز می‌کند)
export async function POST(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "تیکت یافت نشد" }, { status: 404 });
  }

  if (ticket.userId !== user.id) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  if (ticket.status === "closed") {
    return NextResponse.json({ ok: true, status: "closed" });
  }

  await db.ticket.update({
    where: { id },
    data: { status: "closed", updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, status: "closed" });
}
