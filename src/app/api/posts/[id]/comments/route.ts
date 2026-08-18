import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET comments for a post (with replies, likes)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });

  const me = await getCurrentUser();
  const comments = await db.comment.findMany({
    where: { postId: id, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      user: { include: { profile: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { include: { profile: true } },
          _count: { select: { likes: true } },
          likes: me ? { where: { userId: me.id }, select: { id: true, type: true } } : false,
        },
      },
      _count: { select: { likes: true } },
      likes: me ? { where: { userId: me.id }, select: { id: true, type: true } } : false,
    },
  });

  const format = (c: any) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    user: {
      id: c.user.id,
      name: c.user.name,
      avatarUrl: c.user.profile?.avatarUrl ?? null,
      gender: c.user.profile?.gender ?? null,
      isTopTalent: c.user.isTopTalent,
    },
    likeCount: c._count?.likes || 0,
    myReaction: c.likes?.length > 0 ? c.likes[0].type : null,
    replies: c.replies?.map(format) || [],
  });

  return NextResponse.json({ comments: comments.map(format) });
}

// POST a comment (or reply)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  const parentId = body.parentId ? String(body.parentId) : null;

  if (!content) return NextResponse.json({ error: "متن کامنت خالی است" }, { status: 400 });

  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });

  if (parentId) {
    const parent = await db.comment.findUnique({ where: { id: parentId } });
    if (!parent) return NextResponse.json({ error: "کامنت والد پیدا نشد" }, { status: 404 });
  }

  const comment = await db.comment.create({
    data: { postId: id, userId: me.id, content, parentId },
  });

  // Notifications
  if (parentId) {
    // Reply notification to the parent comment author
    const parent = await db.comment.findUnique({ where: { id: parentId }, include: { user: true } });
    if (parent && parent.userId !== me.id) {
      await db.notification.create({
        data: {
          userId: parent.userId,
          type: "comment_reply",
          title: `${me.name} به کامنت شما پاسخ داد`,
          body: content.slice(0, 100),
          link: `#/post/${id}`,
        },
      });
    }
  } else {
    // New comment notification to post owner
    if (post.userId !== me.id) {
      await db.notification.create({
        data: {
          userId: post.userId,
          type: "comment",
          title: `${me.name} روی پست شما کامنت گذاد`,
          body: content.slice(0, 100),
          link: `#/post/${id}`,
        },
      });
    }
  }

  return NextResponse.json({ ok: true, id: comment.id });
}
