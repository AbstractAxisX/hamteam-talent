import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/explore/posts — featured posts for Top Talents explore
// ?categoryId=&skillId=
export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId");
  const skillId = url.searchParams.get("skillId");
  const me = await getCurrentUser();

  const where: any = { isFeatured: true };
  if (categoryId) where.categoryId = categoryId;
  if (skillId) where.skillId = skillId;

  const posts = await db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        include: {
          profile: true,
          userCategories: { include: { category: true } },
        },
      },
      category: true,
      skill: true,
      media: true,
      _count: { select: { likes: true, comments: true } },
      likes: me ? { where: { userId: me.id }, select: { id: true } } : false,
    },
  });

  const result = posts.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    categoryId: p.categoryId,
    skillId: p.skillId,
    categoryName: p.category?.name ?? null,
    categoryIcon: p.category?.iconUrl ?? null,
    categoryColor: p.category?.color ?? null,
    skillName: p.skill?.name ?? null,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    likedByMe: Array.isArray(p.likes) ? p.likes.length > 0 : false,
    media: p.media.map((m) => ({ id: m.id, url: m.url, type: m.type })),
    user: {
      id: p.user.id,
      name: p.user.name,
      avatarUrl: p.user.profile?.avatarUrl ?? null,
      gender: p.user.profile?.gender ?? null,
      isTopTalent: p.user.isTopTalent,
      isVerifiedBadge: p.user.isVerifiedBadge,
      mainCategoryColor: p.user.userCategories?.[0]?.category?.color ?? null,
    },
  }));

  return NextResponse.json({ posts: result });
}
