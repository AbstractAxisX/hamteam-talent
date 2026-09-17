import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categoryColorMap, resolveUserColor } from "@/lib/cat-color";
import { usersStarInfo, postsRatingStats } from "@/lib/stars";
import type { PostWithRelations } from "@/lib/types";

// GET /api/feed/following — posts from users that the current user follows (accepted connections)
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ posts: [] });

  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") || "recent";

  // Find accepted connections — people I follow (I am the requester)
  const following = await db.connection.findMany({
    where: { requesterId: me.id, status: "accepted" },
    select: { receiverId: true },
  });
  const followingIds = following.map((f) => f.receiverId);

  if (followingIds.length === 0) return NextResponse.json({ posts: [] });

  const posts = await db.post.findMany({
    where: { userId: { in: followingIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { include: { profile: true, userCategories: { select: { categoryId: true }, take: 1 } } },
      category: true,
      skill: true,
      _count: { select: { comments: true } },
      media: true,
    },
  });

  const [ratings, starInfo, catMap] = await Promise.all([
    postsRatingStats(posts.map((p) => p.id), me.id),
    usersStarInfo(posts.map((p) => p.userId)),
    categoryColorMap(),
  ]);

  if (sort === "popular" || sort === "top") {
    posts.sort((a, b) => {
      const ra = ratings.get(a.id)!, rb = ratings.get(b.id)!;
      const va = sort === "top" ? ra.ratingAvg : ra.ratingCount;
      const vb = sort === "top" ? rb.ratingAvg : rb.ratingCount;
      return vb - va;
    });
  }

  const result: PostWithRelations[] = posts.map((p) => {
    const r = ratings.get(p.id)!;
    const si = starInfo.get(p.userId)!;
    return {
      id: p.id,
      content: p.content,
      createdAt: p.createdAt.toISOString(),
      categoryId: p.categoryId,
      skillId: p.skillId,
      categoryName: p.category?.name ?? null,
      categoryColor: p.category?.color ?? null,
      skillName: p.skill?.name ?? null,
      isFeatured: p.isFeatured,
      canFeature: p.userId === me.id && si.isTopTalent,
      user: {
        id: p.user.id,
        name: p.user.name,
        isVerifiedBadge: p.user.isVerifiedBadge,
        avatarUrl: p.user.profile?.avatarUrl ?? null,
        gender: p.user.profile?.gender ?? null,
        isTopTalent: si.isTopTalent,
        frame: si.frame,
        totalStars: si.totalStars,
        mainCategoryColor: resolveUserColor(
          catMap,
          p.user.profile?.mainCategoryId,
          p.user.userCategories?.[0]?.categoryId
        ),
      },
      commentCount: p._count.comments,
      ratingAvg: r.ratingAvg,
      ratingCount: r.ratingCount,
      myRating: r.myRating,
      media: p.media.map((m) => ({ id: m.id, url: m.url, type: m.type, fileName: m.fileName, fileSize: m.fileSize })),
    };
  });

  return NextResponse.json({ posts: result });
}
