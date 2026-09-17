import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categoryColorMap, resolveUserColor } from "@/lib/cat-color";
import { usersStarInfo, postsRatingStats } from "@/lib/stars";
import type { PostWithRelations } from "@/lib/types";

// GET /api/posts?sort=recent|popular|top&userId=xxx
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") || "recent";
  const userIdFilter = url.searchParams.get("userId");
  const user = await getCurrentUser();

  // popular = بیشترین رأی؛ top = بالاترین میانگین
  const posts = await db.post.findMany({
    where: userIdFilter ? { userId: userIdFilter } : undefined,
    orderBy: { createdAt: "desc" as const },
    take: 50,
    include: {
      user: {
        include: {
          profile: true,
          userCategories: { select: { categoryId: true }, take: 1 },
        },
      },
      category: true,
      skill: true,
      media: true,
      _count: { select: { comments: true } },
    },
  });

  // ── آمار ستاره: میانگین/تعداد پست‌ها + مجموع ستارهٔ نویسنده‌ها ──
  const [ratings, starInfo] = await Promise.all([
    postsRatingStats(posts.map((p) => p.id), user?.id ?? null),
    usersStarInfo(posts.map((p) => p.userId)),
  ]);

  // مرتب‌سازی ستاره‌ای (بعد از محاسبه — SQLite نمی‌تواند join-aggregate کند)
  if (sort === "popular" || sort === "top") {
    posts.sort((a, b) => {
      const ra = ratings.get(a.id)!, rb = ratings.get(b.id)!;
      const va = sort === "top" ? ra.ratingAvg : ra.ratingCount;
      const vb = sort === "top" ? rb.ratingAvg : rb.ratingCount;
      return vb - va;
    });
  }

  const catMap = await categoryColorMap();

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
      canFeature: user ? p.userId === user.id && si.isTopTalent : false,
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

// POST /api/posts — create post
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  const categoryId = body.categoryId ? String(body.categoryId) : null;
  const skillId = body.skillId ? String(body.skillId) : null;

  if (content.length < 1) return NextResponse.json({ error: "متن پست خالی است" }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ error: "متن پست بسیار طولانی است" }, { status: 400 });
  if (!categoryId || !skillId) return NextResponse.json({ error: "دسته‌بندی و مهارت را انتخاب کنید" }, { status: 400 });

  // Validate: skill must belong to category AND be in user's profile
  const skill = await db.skill.findUnique({ where: { id: skillId } });
  if (!skill || skill.categoryId !== categoryId) {
    return NextResponse.json({ error: "مهارت به این دسته‌بندی تعلق ندارد" }, { status: 400 });
  }
  const userSkill = await db.userSkill.findUnique({
    where: { userId_skillId: { userId: user.id, skillId } },
  });
  if (!userSkill) {
    return NextResponse.json({ error: "این مهارت در پروفایل شما ثبت نشده. ابتدا آن را به پروفایل اضافه کنید." }, { status: 403 });
  }

  const post = await db.post.create({
    data: { userId: user.id, content, categoryId, skillId },
  });

  return NextResponse.json({ ok: true, id: post.id });
}
