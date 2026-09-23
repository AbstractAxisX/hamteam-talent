import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  userStarInfo,
  MAX_FEATURED_POSTS,
  GOLD_THRESHOLD,
  GOLD_VOTES_THRESHOLD,
  FEATURE_WEEK_MS,
} from "@/lib/stars";

/* POST /api/posts/[id]/feature — ارسال پست خود به ویترین «چهره برتر»
   شرط: قاب چهره برتر (≥۵۰۰۰ ستاره یا ≥۵۰۰ رأی یا تأیید ادمین)
   سقف: هفته‌ای فقط ۱ پست (۷ روز بین ارسال‌ها) + حداکثر ۵ پست هم‌زمان
   بدنه: { featured: boolean } — پیش‌فرض true */

function faDays(ms: number): string {
  const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  return new Intl.NumberFormat("fa-IR").format(days);
}

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
          error: `برای ارسال پست به چهره برتر باید ${GOLD_THRESHOLD} ستاره یا ${GOLD_VOTES_THRESHOLD} رأی دریافت کرده باشید. ستارهٔ فعلی: ${si.totalStars} · رأی: ${si.votes}`,
          totalStars: si.totalStars,
          votes: si.votes,
          nextAt: si.nextAt,
        },
        { status: 403 }
      );
    }

    // سقف هفتگی — ۱ پست در ۷ روز
    const weekAgo = new Date(Date.now() - FEATURE_WEEK_MS);
    const lastFeatured = await db.post.findFirst({
      where: { userId: user.id, isFeatured: true, featuredAt: { gte: weekAgo }, NOT: { id } },
      orderBy: { featuredAt: "desc" },
      select: { featuredAt: true },
    });
    if (lastFeatured?.featuredAt) {
      const waitMs = lastFeatured.featuredAt.getTime() + FEATURE_WEEK_MS - Date.now();
      return NextResponse.json(
        {
          error: `هر هفته فقط یک پست می‌توانید به چهره برتر بفرستید — ${faDays(waitMs)} روز دیگر دوباره امتحان کنید.`,
          retryAt: new Date(lastFeatured.featuredAt.getTime() + FEATURE_WEEK_MS).toISOString(),
        },
        { status: 429 }
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
    data: { isFeatured: featured, featuredAt: featured ? new Date() : null },
  });

  const si = await userStarInfo(user.id);
  return NextResponse.json({
    ok: true,
    isFeatured: updated.isFeatured,
    totalStars: si.totalStars,
    votes: si.votes,
    frame: si.frame,
  });
}
