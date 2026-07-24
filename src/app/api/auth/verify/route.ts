import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, getPendingAuth, clearPendingAuth, DEMO_OTP } from "@/lib/auth";

// Verify OTP and complete login or registration.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rawPhone = String(body.phone || "").replace(/\D/g, "");
  const phone = rawPhone.startsWith("0")
    ? rawPhone
    : rawPhone.startsWith("98")
    ? "0" + rawPhone.slice(2)
    : "0" + rawPhone;
  const otp = String(body.otp || "");

  const pending = getPendingAuth(phone);
  if (!pending) return NextResponse.json({ error: "درخواست پیدا نشد یا منقضی شد. دوباره تلاش کنید." }, { status: 400 });
  if (otp !== pending.otp && otp !== DEMO_OTP) {
    return NextResponse.json({ error: "کد تایید اشتباه است" }, { status: 400 });
  }

  if (pending.mode === "login" && pending.existingUserId) {
    await createSession(pending.existingUserId);
    clearPendingAuth(phone);
    return NextResponse.json({ ok: true, mode: "login", userId: pending.existingUserId });
  }

  // REGISTER
  const user = await db.user.create({
    data: {
      name: pending.name,
      phone: pending.phone,
      nationalId: pending.nationalId,
      profile: {
        create: {
          resume: { create: {} },
        },
      },
    },
    include: { profile: true },
  });

  await createSession(user.id);
  clearPendingAuth(phone);

  return NextResponse.json({ ok: true, mode: "register", userId: user.id });
}
