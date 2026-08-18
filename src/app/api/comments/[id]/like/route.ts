import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/comments/[id]/like — toggle like/dislike on a comment
// Body: { type: "like" | "dislike" }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const type = body.type === "dislike" ? "dislike" : "like";

  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "کامنت پیدا نشد" }, { status: 404 });

  const existing = await db.commentLike.findUnique({
    where: { commentId_userId: { commentId: id, userId: me.id } },
  });

  if (existing) {
    if (existing.type === type) {
      // Same reaction → remove
      await db.commentLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ reaction: null });
    } else {
      // Different reaction → update
      await db.commentLike.update({ where: { id: existing.id }, data: { type } });
      return NextResponse.json({ reaction: type });
    }
  } else {
    await db.commentLike.create({ data: { commentId: id, userId: me.id, type } });
    // Notify comment author about like (not dislike)
    if (type === "like" && comment.userId !== me.id) {
      await db.notification.create({
        data: {
          userId: comment.userId,
          type: "comment_like",
          title: `${me.name} کامنت شما را لایک کرد`,
          body: comment.content.slice(0, 100),
          link: `#/post/${comment.postId}`,
        },
      });
    }
    return NextResponse.json({ reaction: type });
  }
}
