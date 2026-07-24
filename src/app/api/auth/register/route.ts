import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stageAuth, DEMO_OTP } from "@/lib/auth";
import { validateNationalId, normalizePhone, isValidIranPhone } from "@/lib/national-id";

// Stage an auth attempt: login if user exists, register if new.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const phone = normalizePhone(String(body.phone || ""));
  const nationalId = String(body.nationalId || "").replace(/\D/g, "");

  if (!isValidIranPhone(phone)) return NextResponse.json({ error: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { phone } });

  if (existing) {
    // LOGIN: nationalId must match
    if (existing.nationalId !== nationalId) {
      return NextResponse.json({ error: "کد ملی با شماره موبایل مطابقت ندارد" }, { status: 400 });
    }
    if (existing.isBanned) {
      return NextResponse.json({ error: "حساب شما مسدود شده است" }, { status: 403 });
    }
    const otp = stageAuth({
      mode: "login",
      name: existing.name,
      phone,
      nationalId,
      existingUserId: existing.id,
      otp: DEMO_OTP,
      expires: Date.now() + 5 * 60 * 1000,
    });
    return NextResponse.json({ ok: true, otp, mode: "login", message: "کد تایید ارسال شد (نسخه دمو)" });
  }

  // REGISTER
  if (name.length < 2) return NextResponse.json({ error: "نام را کامل وارد کنید" }, { status: 400 });
  if (!validateNationalId(nationalId)) return NextResponse.json({ error: "کد ملی معتبر نیست" }, { status: 400 });
  const dupNational = await db.user.findUnique({ where: { nationalId } });
  if (dupNational) return NextResponse.json({ error: "این کد ملی قبلاً ثبت شده" }, { status: 400 });

  const otp = stageAuth({
    mode: "register",
    name,
    phone,
    nationalId,
    otp: DEMO_OTP,
    expires: Date.now() + 5 * 60 * 1000,
  });
  return NextResponse.json({ ok: true, otp, mode: "register", message: "کد تایید ارسال شد (نسخه دمو)" });
}
