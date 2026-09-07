import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/portfolio/[id]/likes?page=1 — لیست لایک‌کنندگان نمونه کار
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const take = 20;

  const item = await db.portfolioItem.findUnique({ where: { id }, select: { id: true } });
  if (!item) return NextResponse.json({ error: "نمونه کار پیدا نشد" }, { status: 404 });

  const likes = await db.portfolioLike.findMany({
    where: { itemId: id },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take: take + 1,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          isVerifiedBadge: true,
          isTopTalent: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });

  const hasMore = likes.length > take;
  const users = likes.slice(0, take).map((l) => ({
    id: l.user.id,
    name: l.user.name,
    username: l.user.username,
    avatarUrl: l.user.profile?.avatarUrl ?? null,
    isVerifiedBadge: l.user.isVerifiedBadge,
    isTopTalent: l.user.isTopTalent,
  }));

  return NextResponse.json({ users, hasMore });
}
