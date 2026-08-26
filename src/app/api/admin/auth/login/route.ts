import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminSession, verifyPassword, hashPassword } from "@/lib/auth";

// Admin login: username + password (no OTP, no national ID)
// اگه جدول ادمین خالی باشه (دیتابیس تازه)، اکانت پیش‌فرض خودکار ساخته می‌شود
// تا ورود به پنل ادمین همیشه ممکن باشد — حتی قبل از اجرای seed
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";

async function ensureDefaultAdmin() {
  const count = await db.adminUser.count();
  if (count === 0) {
    await db.adminUser.create({
      data: {
        username: DEFAULT_ADMIN_USERNAME,
        password: hashPassword(DEFAULT_ADMIN_PASSWORD),
        name: "مدیر همتیم",
      },
    });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "نام کاربری و رمز عبور را وارد کنید" }, { status: 400 });
  }

  // اطمینان از وجود حداقل یک ادمین (در دیتابیس خالی)
  await ensureDefaultAdmin().catch(() => {});

  const admin = await db.adminUser.findUnique({ where: { username } });
  if (!admin || !verifyPassword(password, admin.password)) {
    return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  await createAdminSession(admin.id);
  return NextResponse.json({ ok: true, admin: { id: admin.id, name: admin.name, username: admin.username } });
}
