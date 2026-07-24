import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { PostWithRelations } from "@/lib/types";

// GET /api/posts?sort=recent|popular&userId=xxx
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") || "recent";
  const userIdFilter = url.searchParams.get("userId");
  const user = await getCurrentUser();

  const orderBy = sort === "popular"
    ? { likes: { _count: "desc" as const } }
    : { createdAt: "desc" as const };

  const posts = await db.post.findMany({
    where: userIdFilter ? { userId: userIdFilter } : undefined,
    orderBy,
    take: 50,
    include: {
      user: { include: { profile: true } },
      category: true,
      skill: true,
      likes: user ? { where: { userId: user.id }, select: { id: true } } : false,
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
