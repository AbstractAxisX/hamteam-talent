import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* GET /api/banners?placement=hero — بنرهای فعال عمومی (مرتب بر اساس order)
   شمارش بازدید به‌صورت fire-and-forget انجام می‌شود. */
export async function GET(req: NextRequest) {
  try {
    const placement = req.nextUrl.searchParams.get("placement") || "hero";
    const now = new Date();
    const banners = await db.banner.findMany({
      where: {
        placement,
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        linkUrl: true,
      },
    });
    // شمارش بازدید — بدون بلاک کردن پاسخ
    if (banners.length > 0) {
      db.banner
        .updateMany({
          where: { id: { in: banners.map((b) => b.id) } },
          data: { views: { increment: 1 } },
        })
        .catch(() => {});
    }
    return NextResponse.json({ banners });
  } catch {
    return NextResponse.json({ banners: [] });
  }
}
