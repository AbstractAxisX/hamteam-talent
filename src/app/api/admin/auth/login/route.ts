import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminSession, verifyPassword } from "@/lib/auth";

// Admin login: username + password (no OTP, no national ID)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "نام کاربری و رمز عبور را وارد کنید" }, { status: 400 });
  }

  const admin = await db.adminUser.findUnique({ where: { username } });
  if (!admin || !verifyPassword(password, admin.password)) {
    return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  await createAdminSession(admin.id);
  return NextResponse.json({ ok: true, admin: { id: admin.id, name: admin.name, username: admin.username } });
}
