import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { usersStarInfo } from "@/lib/stars";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const posts = await db.post.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { include: { profile: true } } },
  });

  const starInfo = await usersStarInfo(posts.map((p) => p.userId));

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content,
      isFeatured: p.isFeatured,
      createdAt: p.createdAt.toISOString(),
      user: { name: p.user.name, isTopTalent: starInfo.get(p.userId)?.isTopTalent ?? false },
    })),
  });
}
