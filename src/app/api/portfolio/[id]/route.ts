import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// DELETE /api/portfolio/[id] — حذف نمونه کار (فقط مالک)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const item = await db.portfolioItem.findUnique({ where: { id }, select: { userId: true } });
  if (!item) return NextResponse.json({ error: "نمونه کار پیدا نشد" }, { status: 404 });
  if (item.userId !== me.id) return NextResponse.json({ error: "اجازه حذف ندارید" }, { status: 403 });

  await db.portfolioItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
