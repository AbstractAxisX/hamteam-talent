import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const iconUrl = body.iconUrl ? String(body.iconUrl) : null;
  const color = body.color ? String(body.color) : null;

  if (name.length < 1) return NextResponse.json({ error: "نام را وارد کنید" }, { status: 400 });

  const existing = await db.category.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "این دسته قبلاً ثبت شده" }, { status: 400 });

  const cat = await db.category.create({ data: { name, iconUrl, color } });
  return NextResponse.json({ ok: true, id: cat.id });
}
