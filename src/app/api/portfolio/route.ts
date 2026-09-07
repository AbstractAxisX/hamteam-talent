import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

// GET /api/portfolio?userId= — لیست نمونه کارهای کاربر (با رسانه، لایک)
// POST /api/portfolio — ایجاد نمونه کار جدید (دسته/زیردسته از مهارت‌های پروفایل)
const CreateSchema = z.object({
  title: z.string().trim().min(2, "عنوان حداقل ۲ حرف").max(120),
  description: z.string().trim().max(1000).optional().default(""),
  categoryId: z.string().min(1, "دسته‌بندی الزامی است"),
  skillId: z.string().min(1, "مهارت الزامی است"),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "شناسه کاربر لازم است" }, { status: 400 });
  const me = await getCurrentUser();

  const items = await db.portfolioItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      media: { orderBy: { order: "asc" } },
      category: { select: { name: true, iconUrl: true, color: true } },
      skill: { select: { name: true } },
      _count: { select: { likes: true } },
      likes: me ? { where: { userId: me.id }, select: { id: true } } : false,
    },
  });

  const result = items.map((it) => ({
    id: it.id,
    title: it.title,
    description: it.description,
    categoryName: it.category?.name ?? null,
    categoryIcon: it.category?.iconUrl ?? null,
    categoryColor: it.category?.color ?? null,
    skillName: it.skill?.name ?? null,
    createdAt: it.createdAt.toISOString(),
    likeCount: it._count.likes,
    likedByMe: Array.isArray(it.likes) ? it.likes.length > 0 : false,
    media: it.media.map((m) => ({ id: m.id, url: m.url, type: m.type, fileName: m.fileName, fileSize: m.fileSize })),
  }));

  return NextResponse.json({ items: result });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const parsed = CreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "ورودی نامعتبر" }, { status: 400 });
  }
  const { title, description, categoryId, skillId } = parsed.data;

  // مهارت باید به دسته تعلق داشته باشد و در پروفایل کاربر ثبت شده باشد
  const skill = await db.skill.findUnique({ where: { id: skillId } });
  if (!skill || skill.categoryId !== categoryId) {
    return NextResponse.json({ error: "مهارت به این دسته‌بندی تعلق ندارد" }, { status: 400 });
  }
  const userSkill = await db.userSkill.findUnique({
    where: { userId_skillId: { userId: me.id, skillId } },
  });
  if (!userSkill) {
    return NextResponse.json({ error: "این مهارت در پروفایل شما ثبت نشده است" }, { status: 403 });
  }

  const item = await db.portfolioItem.create({
    data: { userId: me.id, title, description, categoryId, skillId },
  });

  return NextResponse.json({ ok: true, id: item.id });
}
