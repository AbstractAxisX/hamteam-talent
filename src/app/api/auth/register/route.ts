import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stageAuth, DEMO_OTP } from "@/lib/auth";
import { normalizePhone, isValidIranPhone } from "@/lib/national-id";

// Stage an auth attempt: login if user exists, register if new.
// User auth is simple: name + phone + OTP (no national ID).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const phone = normalizePhone(String(body.phone || ""));

  if (!isValidIranPhone(phone)) {
    return NextResponse.json({ error: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { phone } });

  if (existing) {
    // LOGIN — no name needed
    if (existing.isBanned) {
      return NextResponse.json({ error: "حساب شما مسدود شده است" }, { status: 403 });
    }
    stageAuth({
      name: existing.name,
      phone,
      otp: DEMO_OTP,
      expires: Date.now() + 5 * 60 * 1000,
    });
    // در تولید، کد هرگز به کلاینت برنمی‌گردد (باید از SMS بیاید)
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json({
      ok: true,
      ...(isProd ? {} : { otp: DEMO_OTP }),
      mode: "login",
      message: "کد تایید ارسال شد",
    });
  }

  // REGISTER — name required
  if (name.length < 2) {
    return NextResponse.json({ error: "نام را کامل وارد کنید" }, { status: 400 });
  }
  stageAuth({
    name,
    phone,
    otp: DEMO_OTP,
    expires: Date.now() + 5 * 60 * 1000,
  });
  const isProd = process.env.NODE_ENV === "production";
  return NextResponse.json({
    ok: true,
    ...(isProd ? {} : { otp: DEMO_OTP }),
    mode: "register",
    message: "کد تایید ارسال شد",
  });
}
