import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/posts — list all posts with author + counts (moderation)
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "50")));

  const [total, posts] = await Promise.all([
    db.post.count(),
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { include: { profile: true } },
        category: true,
        _count: { select: { likes: true, media: true } },
      },
    }),
  ]);

  const result = posts.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    categoryName: p.category?.name ?? null,
    likeCount: p._count.likes,
    mediaCount: p._count.media,
    user: {
      id: p.user.id,
      name: p.user.name,
      phone: p.user.phone,
      role: p.user.role,
      isBanned: p.user.isBanned,
      avatarUrl: p.user.profile?.avatarUrl ?? null,
    },
  }));

  return NextResponse.json({
    posts: result,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}
