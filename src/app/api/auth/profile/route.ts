import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/* PUT /api/auth/profile — ثبت نامِ کاربر تازه‌ثبت‌نام‌شده (ورود فقط با شماره).
   مسیر جدا از /api/profile/me است چون آن مسیر فقط فیلدهای Profile را
   به‌روز می‌کند و User.name را تغییر نمی‌دهد. اینجا فقط user.name
   نوشته می‌شود و سطر Profile/کش دست‌نخورده می‌ماند. */
export async function PUT(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 40);
  if (name.length < 2) {
    return NextResponse.json(
      { error: "نام معتبر نیست — ۲ تا ۴۰ نویسه وارد کنید" },
      { status: 400 }
    );
  }

  await db.user.update({ where: { id: me.id }, data: { name } });
  return NextResponse.json({ ok: true, name });
}
