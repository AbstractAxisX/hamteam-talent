import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateNationalId } from "@/lib/national-id";

/* POST /api/scout/apply — درخواست فعال‌سازی حساب «چهره‌یاب»
   بدنه: { nationalCode, cardImageUrl?, description }
   → ScoutApplication (pending) + user.scoutStatus="pending"
   ادمین بعداً تأیید می‌کند → isScout=true */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (me.isBanned) return NextResponse.json({ error: "حساب شما مسدود است" }, { status: 403 });

  if (me.isScout) {
    return NextResponse.json({ error: "حساب شما از قبل چهره‌یاب فعال است" }, { status: 409 });
  }
  const pending = await db.scoutApplication.findFirst({
    where: { userId: me.id, status: "pending" },
  });
  if (pending) {
    return NextResponse.json({ error: "درخواست چهره‌یابی شما در انتظار بررسی ادمین است" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const nationalCode = String(body.nationalCode || "").replace(/\D/g, "");
  const description = String(body.description || "").trim();
  const cardImageUrl = body.cardImageUrl ? String(body.cardImageUrl) : null;

  if (!validateNationalId(nationalCode)) {
    return NextResponse.json({ error: "کد ملی معتبر نیست" }, { status: 400 });
  }
  if (description.length < 20) {
    return NextResponse.json(
      { error: "توضیحات حداقل ۲۰ کاراکتر باشد — سابقه و هدف شما از استعدادیابی" },
      { status: 400 }
    );
  }
  if (!cardImageUrl) {
    return NextResponse.json({ error: "تصویر کارت ملی الزامی است" }, { status: 400 });
  }

  await db.$transaction([
    db.scoutApplication.upsert({
      where: { userId: me.id },
      create: { userId: me.id, nationalCode, cardImageUrl, description },
      update: { nationalCode, cardImageUrl, description, status: "pending", adminNote: "", reviewedAt: null },
    }),
    db.user.update({ where: { id: me.id }, data: { scoutStatus: "pending" } }),
  ]);

  return NextResponse.json({
    ok: true,
    message: "درخواست چهره‌یابی ثبت شد — پس از بررسی و تأیید ادمین، حساب چهره‌یاب شما فعال می‌شود",
  });
}

/* GET /api/scout/apply — وضعیت درخواست خودم */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ application: null, isScout: false });
  const app = await db.scoutApplication.findUnique({ where: { userId: me.id } });
  return NextResponse.json({
    isScout: me.isScout,
    application: app
      ? {
          status: app.status,
          adminNote: app.adminNote,
          description: app.description,
          nationalCode: app.nationalCode,
          cardImageUrl: app.cardImageUrl,
          createdAt: app.createdAt.toISOString(),
          reviewedAt: app.reviewedAt?.toISOString() ?? null,
        }
      : null,
  });
}
