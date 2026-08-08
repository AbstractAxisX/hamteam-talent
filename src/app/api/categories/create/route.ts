import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/categories/create — user creates a new category (no admin approval needed)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const iconUrl = body.iconUrl ? String(body.iconUrl) : "✨";

  if (name.length < 2) return NextResponse.json({ error: "نام دسته‌بندی را کامل وارد کنید" }, { status: 400 });

  const existing = await db.category.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "این دسته‌بندی قبلاً ثبت شده" }, { status: 400 });

  const maxOrder = await db.category.aggregate({ _max: { order: true } });
  const cat = await db.category.create({
    data: { name, iconUrl, order: (maxOrder._max.order || 0) + 1 },
  });
  return NextResponse.json({ ok: true, id: cat.id, name: cat.name });
}
