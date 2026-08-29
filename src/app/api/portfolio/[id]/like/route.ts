import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/portfolio/[id]/like — لایک/حذف لایک نمونه کار (toggle)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const item = await db.portfolioItem.findUnique({ where: { id }, select: { userId: true } });
  if (!item) return NextResponse.json({ error: "نمونه کار پیدا نشد" }, { status: 404 });

  const existing = await db.portfolioLike.findUnique({
    where: { itemId_userId: { itemId: id, userId: me.id } },
  });

  if (existing) {
    await db.portfolioLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await db.portfolioLike.create({ data: { itemId: id, userId: me.id } });
  if (item.userId !== me.id) {
    await db.notification.create({
      data: {
        userId: item.userId,
        type: "like",
        title: `${me.name} نمونه کار شما را لایک کرد`,
        body: "",
        link: `#/profile/${me.id}`,
      },
    });
  }
  return NextResponse.json({ liked: true });
}
