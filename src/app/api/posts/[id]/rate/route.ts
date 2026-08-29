import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

// POST /api/posts/[id]/rate — ثبت/ویرایش امتیاز ۱ تا ۱۰ (upsert یکتا per کاربر/پست)
// پاسخ: { ok, avg, count, myScore } — میانگین از سرور (منبع حقیقت)
const BodySchema = z.object({ score: z.number().int().min(1).max(10) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "امتیاز باید عددی بین ۱ تا ۱۰ باشد" }, { status: 400 });
  }
  const { score } = parsed.data;

  const post = await db.post.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });

  await db.postRating.upsert({
    where: { postId_userId: { postId: id, userId: me.id } },
    create: { postId: id, userId: me.id, score },
    update: { score },
  });

  const agg = await db.postRating.aggregate({
    where: { postId: id },
    _avg: { score: true },
    _count: { _all: true },
  });

  const avg = agg._avg.score ? Math.round(agg._avg.score * 10) / 10 : 0;

  return NextResponse.json({ ok: true, avg, count: agg._count._all, myScore: score });
}
