import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// PUT /api/admin/skills/[id] — { name }
export async function PUT(req: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();

  if (name.length < 1) {
    return NextResponse.json({ error: "نام مهارت خالی است" }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "نام مهارت بیش از حد طولانی است" }, { status: 400 });
  }

  const skill = await db.skill.findUnique({ where: { id } });
  if (!skill) {
    return NextResponse.json({ error: "مهارت یافت نشد" }, { status: 404 });
  }

  const dup = await db.skill.findUnique({
    where: { categoryId_name: { categoryId: skill.categoryId, name } },
  });
  if (dup && dup.id !== id) {
    return NextResponse.json({ error: "این نام قبلاً در همین دسته ثبت شده" }, { status: 400 });
  }

  const updated = await db.skill.update({ where: { id }, data: { name } });
  return NextResponse.json({ ok: true, skill: { id: updated.id, name: updated.name, categoryId: updated.categoryId } });
}

// DELETE /api/admin/skills/[id]
export async function DELETE(_req: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const skill = await db.skill.findUnique({ where: { id } });
  if (!skill) {
    return NextResponse.json({ error: "مهارت یافت نشد" }, { status: 404 });
  }

  await db.skill.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
