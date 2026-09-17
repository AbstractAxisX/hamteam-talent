import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categoryColorMap, resolveUserColor } from "@/lib/cat-color";
import { usersStarInfo, postsRatingStats } from "@/lib/stars";
import type { PostWithRelations, TalentListItem } from "@/lib/types";

/* GET /api/feed/home — صفحهٔ خانهٔ شخصی (سبک لینکدین)
   1. پست‌های خودم + پست‌های ارتباط‌های متصل (ارتباط دوطرفهٔ تأییدشده)
   2. پیشنهاد افراد (شاید بشناسید) — هم‌مهارت‌ها و تازه‌واردها
   3. آمار شخصی برای نوار خلاصه + ستاره‌های من برای CTA چهره برتر */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const catMap = await categoryColorMap();

  // ── ارتباطات تأییدشده (دوطرفه) ──
  const conns = await db.connection.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: me.id }, { receiverId: me.id }],
    },
    select: { requesterId: true, receiverId: true },
  });
  const connectionIds = Array.from(
    new Set(conns.flatMap((c) => [c.requesterId, c.receiverId]).filter((id) => id !== me.id))
  );

  // ── ۱. پست‌های من + ارتباط‌ها ──
  const feedUserIds = [me.id, ...connectionIds];
  const posts = await db.post.findMany({
    where: { userId: { in: feedUserIds }, user: { isBanned: false } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: {
        include: {
          profile: true,
          userCategories: { select: { categoryId: true }, take: 1 },
        },
      },
      category: true,
      skill: true,
      _count: { select: { comments: true } },
      media: true,
    },
  });

  // ── آمار ستاره: میانگین/تعداد پست‌ها + مجموع ستارهٔ نویسنده‌ها ──
  const [ratings, authorStars] = await Promise.all([
    postsRatingStats(posts.map((p) => p.id), me.id),
    usersStarInfo([...feedUserIds]),
  ]);

  const feedPosts: PostWithRelations[] = posts.map((p) => {
    const r = ratings.get(p.id)!;
    const si = authorStars.get(p.userId)!;
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

  // ── ۲. پیشنهاد افراد (شاید بشناسید) ──
  const mySkillIds = (
    await db.userSkill.findMany({ where: { userId: me.id }, select: { skillId: true } })
  ).map((s) => s.skillId);

  const excludeIds = [...connectionIds, me.id];
  // موارد رد/منتظر‌شده هم پیشنهاد نشوند
  const pendingOrRejected = await db.connection.findMany({
    where: { OR: [{ requesterId: me.id }, { receiverId: me.id }] },
    select: { requesterId: true, receiverId: true },
  });
  for (const c of pendingOrRejected) {
    const other = c.requesterId === me.id ? c.receiverId : c.requesterId;
    if (!excludeIds.includes(other)) excludeIds.push(other);
  }

  const suggestInclude = {
    profile: true,
    userCategories: { include: { category: true }, take: 1 },
    connectionsRec: { where: { status: "accepted" }, select: { id: true } },
    connectionsReq: { where: { status: "accepted" }, select: { id: true } },
  };

  let suggestUsers: any[] = [];
  if (mySkillIds.length > 0) {
    suggestUsers = await db.user.findMany({
      where: {
        isBanned: false,
        id: { notIn: excludeIds },
        userSkills: { some: { skillId: { in: mySkillIds } } },
      },
      take: 12,
      orderBy: { createdAt: "desc" },
      include: suggestInclude,
    });
  }
  if (suggestUsers.length < 6) {
    const extra = await db.user.findMany({
      where: { isBanned: false, id: { notIn: [...excludeIds, ...suggestUsers.map((u) => u.id)] } },
      take: 12 - suggestUsers.length,
      orderBy: { createdAt: "desc" },
      include: suggestInclude,
    });
    suggestUsers = [...suggestUsers, ...extra];
  }

  const suggestStars = await usersStarInfo(suggestUsers.map((u) => u.id));
  const suggestions: TalentListItem[] = suggestUsers
    .slice()
    .sort((a, b) => (suggestStars.get(b.id)?.totalStars ?? 0) - (suggestStars.get(a.id)?.totalStars ?? 0))
    .slice(0, 10)
    .map((u) => ({
      id: u.id,
      name: u.name,
      isVerifiedBadge: u.isVerifiedBadge,
      isTopTalent: suggestStars.get(u.id)?.isTopTalent ?? false,
      frame: suggestStars.get(u.id)?.frame ?? null,
      totalStars: suggestStars.get(u.id)?.totalStars ?? 0,
      bioShort: u.profile?.bioShort || "",
      avatarUrl: u.profile?.avatarUrl ?? null,
      gender: u.profile?.gender ?? null,
      province: u.profile?.province ?? null,
      city: u.profile?.city ?? null,
      categories: u.userCategories.map((uc: any) => ({
        id: uc.category.id,
        name: uc.category.name,
        iconUrl: uc.category.iconUrl,
        color: uc.category.color,
      })),
      followersCount: (u.connectionsRec?.length || 0) + (u.connectionsReq?.length || 0),
      mainCategoryColor: resolveUserColor(
        catMap,
        u.profile?.mainCategoryId,
        u.userCategories?.[0]?.categoryId
      ),
    }));

  // ── ۳. آمار شخصی + ستاره‌های من ──
  const [myPostsCount, myFollowers, myStars] = await Promise.all([
    db.post.count({ where: { userId: me.id } }),
    db.connection.count({ where: { receiverId: me.id, status: "accepted" } }),
    usersStarInfo([me.id]).then((m) => m.get(me.id)!),
  ]);

  return NextResponse.json({
    posts: feedPosts,
    suggestions,
    stats: {
      connectionsCount: connectionIds.length,
      postsCount: myPostsCount,
      followersCount: myFollowers,
      totalStars: myStars.totalStars,
      frame: myStars.frame,
      nextAt: myStars.nextAt,
    },
  });
}
