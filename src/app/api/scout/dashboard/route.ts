import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { usersStarInfo, postsRatingStats } from "@/lib/stars";
import { categoryColorMap, resolveUserColor } from "@/lib/cat-color";
import { GOLD_THRESHOLD, GOLD_VOTES_THRESHOLD } from "@/lib/stars";

/* GET /api/scout/dashboard — صفحهٔ «چهره‌یاب» (فقط چهره‌یاب‌های فعال)
   · چهره‌های برتر (دارای قاب طلایی/رزگلد یا تأیید ادمین)
   · استعدادهای در حال رشد (مرتب بر اساس ستاره)
   · نیازمندی‌های فعال خودم
   · آمار کلی */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (!me.isScout) return NextResponse.json({ error: "این صفحه مخصوص چهره‌یاب‌هاست" }, { status: 403 });

  const [users, myNeeds, featuredCount] = await Promise.all([
    db.user.findMany({
      where: { isBanned: false, id: { not: me.id } },
      include: {
        profile: true,
        userCategories: { include: { category: true } },
        connectionsRec: { where: { status: "accepted" }, select: { id: true } },
        posts: {
          where: { isFeatured: true },
          select: { id: true },
        },
      },
      take: 120,
    }),
    db.jobPost.findMany({
      where: { userId: me.id, status: "open" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        category: true,
        skills: { include: { skill: true } },
        applications: { select: { id: true } },
      },
    }),
    db.post.count({ where: { isFeatured: true } }),
  ]);

  const catMap = await categoryColorMap();
  const starInfo = await usersStarInfo(users.map((u) => u.id));

  const all = users.map((u) => {
    const si = starInfo.get(u.id)!;
    return {
      id: u.id,
      name: u.name,
      isVerifiedBadge: u.isVerifiedBadge,
      isAdminElite: u.isAdminElite,
      isScout: u.isScout,
      isTopTalent: si.isTopTalent,
      frame: si.frame,
      totalStars: si.totalStars,
      votes: si.votes,
      bioShort: u.profile?.bioShort || "",
      avatarUrl: u.profile?.avatarUrl ?? null,
      gender: (u.profile?.gender as string | null) ?? null,
      province: u.profile?.province ?? null,
      city: u.profile?.city ?? null,
      categories: u.userCategories.slice(0, 3).map((uc) => ({
        id: uc.category.id,
        name: uc.category.name,
        iconUrl: uc.category.iconUrl,
        color: uc.category.color,
      })),
      followersCount: u.connectionsRec.length,
      featuredPosts: u.posts.length,
      mainCategoryColor: resolveUserColor(catMap, u.profile?.mainCategoryId, u.userCategories?.[0]?.categoryId),
    };
  });

  const elite = all
    .filter((u) => u.isTopTalent)
    .sort((a, b) => (b.totalStars ?? 0) - (a.totalStars ?? 0))
    .slice(0, 24);
  const rising = all
    .filter((u) => !u.isTopTalent && !u.isScout)
    .sort((a, b) => (b.totalStars ?? 0) - (a.totalStars ?? 0) || (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 12);

  // میانگین امتیاز پست‌های ویترین چهره‌های برتر — برای نمایش کیفیت
  const featuredPostIds = await db.post.findMany({
    where: { isFeatured: true },
    select: { id: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
  const ratings = await postsRatingStats(featuredPostIds.map((p) => p.id));
  let ratingSum = 0;
  let ratingN = 0;
  ratings.forEach((r) => {
    if (r.ratingCount > 0) {
      ratingSum += r.ratingAvg;
      ratingN++;
    }
  });

  return NextResponse.json({
    me: { id: me.id, name: me.name },
    stats: {
      eliteCount: elite.length,
      featuredCount,
      risingCount: rising.length,
      showcaseAvg: ratingN > 0 ? Math.round((ratingSum / ratingN) * 10) / 10 : 0,
      myNeedsCount: myNeeds.length,
    },
    thresholds: { stars: GOLD_THRESHOLD, votes: GOLD_VOTES_THRESHOLD },
    elite,
    rising,
    myNeeds: myNeeds.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      categoryName: n.category?.name ?? null,
      province: n.province ?? null,
      city: n.city ?? null,
      status: n.status,
      createdAt: n.createdAt.toISOString(),
      skills: n.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
      applicationCount: n.applications.length,
      appliedByMe: false,
      user: {
        id: me.id,
        name: me.name,
        isVerifiedBadge: me.isVerifiedBadge,
        isScout: true,
        avatarUrl: me.profile?.avatarUrl ?? null,
      },
    })),
  });
}
