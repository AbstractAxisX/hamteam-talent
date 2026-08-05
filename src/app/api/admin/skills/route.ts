import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const categoryId = String(body.categoryId || "");
  const name = String(body.name || "").trim();

  if (!categoryId || name.length < 1) return NextResponse.json({ error: "دسته و نام مهارت را وارد کنید" }, { status: 400 });

  const existing = await db.skill.findUnique({
    where: { categoryId_name: { categoryId, name } },
  });
  if (existing) return NextResponse.json({ error: "این مهارت قبلاً ثبت شده" }, { status: 400 });

  const skill = await db.skill.create({ data: { categoryId, name } });
  return NextResponse.json({ ok: true, id: skill.id });
}
