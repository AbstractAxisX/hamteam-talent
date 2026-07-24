import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/admin/skills — { categoryId, name }
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const categoryId = String(body.categoryId || "");
  const name = String(body.name || "").trim();

  if (!categoryId) {
    return NextResponse.json({ error: "دسته‌بندی را انتخاب کنید" }, { status: 400 });
  }
  if (name.length < 1) {
    return NextResponse.json({ error: "نام مهارت خالی است" }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "نام مهارت بیش از حد طولانی است" }, { status: 400 });
  }

  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "دسته‌بندی یافت نشد" }, { status: 404 });
  }

  const dup = await db.skill.findUnique({
    where: { categoryId_name: { categoryId, name } },
  });
  if (dup) {
    return NextResponse.json({ error: "این مهارت قبلاً ثبت شده است" }, { status: 400 });
  }

  const skill = await db.skill.create({ data: { categoryId, name } });
  return NextResponse.json({
    ok: true,
    skill: { id: skill.id, name: skill.name, categoryId: skill.categoryId },
  });
}
