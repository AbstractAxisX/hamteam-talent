import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/username/set — set/update username for current user
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim().toLowerCase();

  if (!username) return NextResponse.json({ error: "نام کاربری را وارد کنید" }, { status: 400 });
  if (username.length < 3 || username.length > 20) return NextResponse.json({ error: "نام کاربری باید ۳ تا ۲۰ کاراکتر باشد" }, { status: 400 });
  if (!/^[a-z0-9_]+$/.test(username)) return NextResponse.json({ error: "فقط حروف انگلیسی، اعداد و _" }, { status: 400 });

  const existing = await db.user.findFirst({ where: { username, NOT: { id: me.id } } });
  if (existing) return NextResponse.json({ error: "این نام کاربری قبلاً گرفته شده" }, { status: 400 });

  await db.user.update({ where: { id: me.id }, data: { username } });
  return NextResponse.json({ ok: true, username });
}
