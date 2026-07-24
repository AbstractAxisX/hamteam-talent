import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/admin/users/[id]/posts — admin: list user's posts
export async function GET(_req: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const target = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
  }

  const posts = await db.post.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      skill: true,
      _count: { select: { likes: true } },
      media: true,
    },
  });

  const result = posts.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    categoryName: p.category?.name ?? null,
    skillName: p.skill?.name ?? null,
    likeCount: p._count.likes,
    mediaCount: p.media.length,
  }));

  return NextResponse.json({ posts: result });
}
