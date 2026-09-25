import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

/* GET /api/admin/scouts — درخواست‌های چهره‌یابی + لیست چهره‌یاب‌های فعال
   POST /api/admin/scouts — { id, action: "approve"|"reject"|"revoke", note? }
   approve → isScout=true · reject → پیام · revoke → لغو دسترسی چهره‌یاب */
export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "all";

  const apps = await db.scoutApplication.findMany({
    where: status === "all" ? {} : { status },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { user: { include: { profile: true } } },
  });

  const scouts = await db.user.findMany({
    where: { isScout: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { profile: true },
  });

  const needsCount = await db.jobPost.groupBy({
    by: ["userId"],
    where: { user: { isScout: true } },
    _count: { _all: true },
  });
  const needMap = new Map(needsCount.map((n) => [n.userId, n._count._all]));

  return NextResponse.json({
    applications: apps.map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.user.name,
      phone: a.user.phone,
      avatarUrl: a.user.profile?.avatarUrl ?? null,
      nationalCode: a.nationalCode,
      cardImageUrl: a.cardImageUrl,
      description: a.description,
      status: a.status,
      adminNote: a.adminNote,
      createdAt: a.createdAt.toISOString(),
      reviewedAt: a.reviewedAt?.toISOString() ?? null,
    })),
    scouts: scouts.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      avatarUrl: s.profile?.avatarUrl ?? null,
      isBanned: s.isBanned,
      needsCount: needMap.get(s.id) ?? 0,
      since: s.updatedAt.toISOString(),
    })),
    pendingCount: apps.filter((a) => a.status === "pending").length,
  });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const action = String(body.action || "");
  const note = String(body.note || "").trim();

  const app = await db.scoutApplication.findUnique({ where: { id }, include: { user: true } });
  if (!app) return NextResponse.json({ error: "درخواست پیدا نشد" }, { status: 404 });

  if (action === "approve") {
    await db.$transaction([
      db.scoutApplication.update({
        where: { id },
        data: { status: "approved", adminNote: note, reviewedAt: new Date() },
      }),
      db.user.update({ where: { id: app.userId }, data: { isScout: true, scoutStatus: "approved" } }),
    ]);
    await db.notification.create({
      data: {
        userId: app.userId,
        type: "broadcast",
        title: "حساب چهره‌یاب فعال شد 🎯",
        body: "درخواست چهره‌یابی شما تأیید شد — صفحهٔ چهره‌یاب برای شما فعال است. استعدادها را کشف و معرفی کنید!",
      },
    });
    return NextResponse.json({ ok: true, message: `حساب «${app.user.name}» چهره‌یاب شد` });
  }

  if (action === "reject") {
    await db.$transaction([
      db.scoutApplication.update({
        where: { id },
        data: { status: "rejected", adminNote: note, reviewedAt: new Date() },
      }),
      db.user.update({ where: { id: app.userId }, data: { isScout: false, scoutStatus: "rejected" } }),
    ]);
    await db.notification.create({
      data: {
        userId: app.userId,
        type: "broadcast",
        title: "درخواست چهره‌یابی رد شد",
        body: note ? `تأیید نشد: ${note}` : "درخواست چهره‌یابی شما تأیید نشد.",
      },
    });
    return NextResponse.json({ ok: true, message: "درخواست رد شد" });
  }

  if (action === "revoke") {
    // لغو دسترسی چهره‌یاب فعال — id = userId
    const userId = String(body.userId || app.userId);
    await db.user.update({ where: { id: userId }, data: { isScout: false, scoutStatus: "rejected" } });
    await db.scoutApplication.updateMany({ where: { userId }, data: { status: "rejected", reviewedAt: new Date() } });
    await db.notification.create({
      data: {
        userId,
        type: "broadcast",
        title: "دسترسی چهره‌یاب لغو شد",
        body: "دسترسی حساب چهره‌یاب شما توسط ادمین لغو شد.",
      },
    });
    return NextResponse.json({ ok: true, message: "دسترسی چهره‌یاب لغو شد" });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
