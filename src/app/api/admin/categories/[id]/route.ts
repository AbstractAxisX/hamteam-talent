import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  await db.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PUT — update category name, icon, color
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.iconUrl !== undefined) data.iconUrl = body.iconUrl || null;
  if (body.color !== undefined) data.color = body.color || null;

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "هیچ فیلدی برای ویرایش ارسال نشده" }, { status: 400 });

  const updated = await db.category.update({ where: { id }, data });
  return NextResponse.json({ ok: true, id: updated.id });
}
