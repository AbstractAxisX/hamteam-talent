import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/username/check — check if username is available
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim().toLowerCase();

  if (!username) return NextResponse.json({ available: false, error: "نام کاربری را وارد کنید" }, { status: 400 });
  if (username.length < 3) return NextResponse.json({ available: false, error: "حداقل ۳ کاراکتر" }, { status: 400 });
  if (username.length > 20) return NextResponse.json({ available: false, error: "حداکثر ۲۰ کاراکتر" }, { status: 400 });
  if (!/^[a-z0-9_]+$/.test(username)) return NextResponse.json({ available: false, error: "فقط حروف انگلیسی، اعداد و _" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ available: false, error: "این نام کاربری قبلاً گرفته شده" });

  return NextResponse.json({ available: true });
}
