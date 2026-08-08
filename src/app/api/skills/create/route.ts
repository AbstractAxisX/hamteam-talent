import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/skills/create — user creates a new skill under a category (no admin approval)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const categoryId = String(body.categoryId || "");
  const name = String(body.name || "").trim();

  if (!categoryId || name.length < 2) {
    return NextResponse.json({ error: "دسته‌بندی و نام مهارت را کامل وارد کنید" }, { status: 400 });
  }

  const cat = await db.category.findUnique({ where: { id: categoryId } });
  if (!cat) return NextResponse.json({ error: "دسته‌بندی پیدا نشد" }, { status: 404 });

  const existing = await db.skill.findUnique({
    where: { categoryId_name: { categoryId, name } },
  });
  if (existing) return NextResponse.json({ error: "این مهارت قبلاً در این دسته ثبت شده" }, { status: 400 });

  const skill = await db.skill.create({ data: { categoryId, name } });
  return NextResponse.json({ ok: true, id: skill.id, name: skill.name });
}
