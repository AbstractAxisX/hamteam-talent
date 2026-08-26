import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { PostWithRelations } from "@/lib/types";

// GET /api/explore?categoryId=&skillId=&province=&city=&sort=recent|popular
// Posts with chained filters. Province/City filter on post author's profile.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const skillId = url.searchParams.get("skillId") || undefined;
  const province = url.searchParams.get("province") || undefined;
  const city = url.searchParams.get("city") || undefined;
  const sort = url.searchParams.get("sort") === "popular" ? "popular" : "recent";
  const user = await getCurrentUser();

  // Build the where clause with chained filters.
  // Note: if both categoryId and skillId are provided, Prisma applies both
  // (AND), which naturally enforces that the skill must belong to the
  // selected category — posts whose skillId's category != categoryId won't
  // satisfy both filters at once.
  const where: { categoryId?: string; skillId?: string; user?: { profile: { province?: string; city?: string } } } = {};

  if (categoryId) where.categoryId = categoryId;
  if (skillId) where.skillId = skillId;

  // Location filters apply to the post author's profile
  if (province || city) {
    const profileFilter: { province?: string; city?: string } = {};
    if (province) profileFilter.province = province;
    if (city) profileFilter.city = city;
    where.user = { profile: profileFilter };
  }

  const orderBy =
    sort === "popular"
      ? { likes: { _count: "desc" as const } }
      : { createdAt: "desc" as const };

  const posts = await db.post.findMany({
    where,
    orderBy,
    take: 60,
    include: {
      user: { include: { profile: true } },
      category: true,
      skill: true,
      likes: user
        ? { where: { userId: user.id }, select: { id: true } }
        : false,
      _count: { select: { likes: true } },
      media: true,
    },
  });

  const result: PostWithRelations[] = posts.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    categoryId: p.categoryId,
    skillId: p.skillId,
    categoryName: p.category?.name ?? null,
    skillName: p.skill?.name ?? null,
    user: {
      id: p.user.id,
      name: p.user.name,
      isVerifiedBadge: p.user.isVerifiedBadge,
      avatarUrl: p.user.profile?.avatarUrl ?? null,
    },
    likeCount: p._count.likes,
    likedByMe: user ? p.likes.length > 0 : false,
    media: p.media.map((m) => ({ id: m.id, url: m.url, type: m.type })),
  }));

  return NextResponse.json({ posts: result });
}
