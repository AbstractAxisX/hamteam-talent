import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Toggle like on a post — now sends notification to post owner
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });

  const existing = await db.postLike.findUnique({
    where: { postId_userId: { postId: id, userId: user.id } },
  });

  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  } else {
    await db.postLike.create({ data: { postId: id, userId: user.id } });
    // Notify post owner about the like
    if (post.userId !== user.id) {
      await db.notification.create({
        data: {
          userId: post.userId,
          type: "like",
          title: `${user.name} پست شما را لایک کرد`,
          body: post.content.slice(0, 100),
          link: `#/post/${id}`,
        },
      });
    }
    return NextResponse.json({ liked: true });
  }
}
