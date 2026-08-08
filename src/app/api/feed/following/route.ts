import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
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
    orderBy: sort === "popular" ? { likes: { _count: "desc" } } : { createdAt: "desc" },
    take: 50,
    include: {
      user: { include: { profile: true } },
      category: true,
      skill: true,
      likes: { where: { userId: me.id }, select: { id: true } },
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
    likedByMe: p.likes.length > 0,
    media: p.media.map((m) => ({ id: m.id, url: m.url, type: m.type })),
  }));

  return NextResponse.json({ posts: result });
}
