import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { userStarInfo, MAX_FEATURED_POSTS, GOLD_THRESHOLD } from "@/lib/stars";

/* POST /api/posts/[id]/feature — ارسال پست خود به ویترین «چهره برتر»
   شرط: مجموع ستاره‌های دریافتی کاربر ≥ ۵۰۰۰ (قاب طلایی یا رزگلد)
   بدنه: { featured: boolean } — پیش‌فرض true */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });
  if (post.userId !== user.id) {
    return NextResponse.json({ error: "فقط پست خودتان را می‌توانید به چهره برتر بفرستید" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const featured = body.featured !== false; // پیش‌فرض: true

  if (featured) {
    const si = await userStarInfo(user.id);
    if (!si.isTopTalent) {
      return NextResponse.json(
        {
          error: `برای ارسال پست به چهره برتر باید مجموعاً ${GOLD_THRESHOLD} ستاره دریافت کرده باشید. ستارهٔ فعلی: ${si.totalStars}`,
          totalStars: si.totalStars,
          nextAt: si.nextAt,
        },
        { status: 403 }
      );
    }
    const active = await db.post.count({ where: { userId: user.id, isFeatured: true, NOT: { id } } });
    if (active >= MAX_FEATURED_POSTS) {
      return NextResponse.json(
        { error: `حداکثر ${MAX_FEATURED_POSTS} پست هم‌زمان در ویترین چهره برتر دارید — یکی را بردار` },
        { status: 409 }
      );
    }
  }

  const updated = await db.post.update({
    where: { id },
    data: { isFeatured: featured },
  });

  const si = await userStarInfo(user.id);
  return NextResponse.json({
    ok: true,
    isFeatured: updated.isFeatured,
    totalStars: si.totalStars,
    frame: si.frame,
  });
}
