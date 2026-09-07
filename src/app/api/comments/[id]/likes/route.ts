import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/comments/[id]/likes?page=1 — لیست لایک‌کنندگان کامنت (فقط type=like)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const take = 20;

  const comment = await db.comment.findUnique({ where: { id }, select: { id: true } });
  if (!comment) return NextResponse.json({ error: "کامنت پیدا نشد" }, { status: 404 });

  const likes = await db.commentLike.findMany({
    where: { commentId: id, type: "like" },
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
