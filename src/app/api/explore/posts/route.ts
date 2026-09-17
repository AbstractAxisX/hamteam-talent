import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categoryColorMap, resolveUserColor } from "@/lib/cat-color";
import { usersStarInfo, postsRatingStats } from "@/lib/stars";

/* GET /api/explore/posts — ویترین «چهره برتر»
   پست‌هایی که کاربرانِ دارای قاب (طلایی/رزگلد) یا ادمین فرستاده‌اند.
   ?categoryId=&skillId= */
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
      _count: { select: { comments: true } },
    },
  });

  const catMap = await categoryColorMap();
  const [ratings, starInfo] = await Promise.all([
    postsRatingStats(posts.map((p) => p.id), me?.id ?? null),
    usersStarInfo(posts.map((p) => p.userId)),
  ]);

  const result = posts.map((p) => {
    const r = ratings.get(p.id)!;
    const si = starInfo.get(p.userId)!;
    return {
      id: p.id,
      content: p.content,
      createdAt: p.createdAt.toISOString(),
      categoryId: p.categoryId,
      skillId: p.skillId,
      categoryName: p.category?.name ?? null,
      categoryIcon: p.category?.iconUrl ?? null,
      categoryColor: p.category?.color ?? null,
      skillName: p.skill?.name ?? null,
      isFeatured: true,
      canFeature: me ? p.userId === me.id : false,
      commentCount: p._count.comments,
      ratingAvg: r.ratingAvg,
      ratingCount: r.ratingCount,
      myRating: r.myRating,
      media: p.media.map((m) => ({ id: m.id, url: m.url, type: m.type, fileName: m.fileName, fileSize: m.fileSize })),
      user: {
        id: p.user.id,
        name: p.user.name,
        avatarUrl: p.user.profile?.avatarUrl ?? null,
        gender: p.user.profile?.gender ?? null,
        isTopTalent: si.isTopTalent,
        frame: si.frame,
        totalStars: si.totalStars,
        isVerifiedBadge: p.user.isVerifiedBadge,
        mainCategoryColor: resolveUserColor(
          catMap,
          p.user.profile?.mainCategoryId,
          p.user.userCategories?.[0]?.categoryId
        ),
      },
    };
  });

  return NextResponse.json({ posts: result });
}
