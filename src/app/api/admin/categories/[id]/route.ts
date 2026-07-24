import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// PUT /api/admin/categories/[id] — { name?, iconUrl? }
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

  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "دسته‌بندی یافت نشد" }, { status: 404 });
  }

  const data: { name?: string; iconUrl?: string | null } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 1) {
      return NextResponse.json({ error: "نام خالی است" }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json({ error: "نام بیش از حد طولانی است" }, { status: 400 });
    }
    const dup = await db.category.findUnique({ where: { name } });
    if (dup && dup.id !== id) {
      return NextResponse.json({ error: "نام تکراری است" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.iconUrl !== undefined) {
    data.iconUrl = body.iconUrl ? String(body.iconUrl) : null;
  }

  const updated = await db.category.update({ where: { id }, data });
  return NextResponse.json({
    ok: true,
    category: { id: updated.id, name: updated.name, iconUrl: updated.iconUrl },
  });
}

// DELETE /api/admin/categories/[id] — cascades to skills (Prisma onDelete: Cascade)
export async function DELETE(_req: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "دسته‌بندی یافت نشد" }, { status: 404 });
  }

  await db.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
