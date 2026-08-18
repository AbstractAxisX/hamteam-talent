import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// GET /api/top-talent/requests/[id] — admin sees detail with ID photo
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const r = await db.topTalentRequest.findUnique({
    where: { id },
    include: { user: { include: { profile: { include: { resume: { include: { experiences: true, educations: true } } } } } } },
  });
  if (!r) return NextResponse.json({ error: "درخواست پیدا نشد" }, { status: 404 });

  return NextResponse.json({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    userPhone: r.user.phone,
    userAvatar: r.user.profile?.avatarUrl ?? null,
    userBio: r.user.profile?.bioShort ?? "",
    userBioLong: r.user.profile?.bioLong ?? "",
    userProvince: r.user.profile?.province ?? null,
    userCity: r.user.profile?.city ?? null,
    nationalIdPhotoUrl: r.nationalIdPhotoUrl,
    phoneNumber: r.phoneNumber,
    socialMediaId: r.socialMediaId,
    description: r.description,
    status: r.status,
    rejectReason: r.rejectReason,
    createdAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    experiences: r.user.profile?.resume?.experiences || [],
    educations: r.user.profile?.resume?.educations || [],
  });
}

// POST /api/top-talent/requests/[id] — approve or reject
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "approve" | "reject";
  const rejectReason = body.rejectReason ? String(body.rejectReason).trim() : null;

  const r = await db.topTalentRequest.findUnique({ where: { id }, include: { user: true } });
  if (!r) return NextResponse.json({ error: "درخواست پیدا نشد" }, { status: 404 });

  if (action === "approve") {
    await db.$transaction([
      db.topTalentRequest.update({ where: { id }, data: { status: "approved", reviewedAt: new Date() } }),
      db.user.update({ where: { id: r.userId }, data: { isTopTalent: true } }),
    ]);
    await db.notification.create({
      data: { userId: r.userId, type: "top_talent_approved", title: "تبریک! شما استعداد برتر شدید", body: "درخواست شما تایید شد. اکنون پست‌های شما می‌تواند در صفحه استعدادهای برتر نمایش داده شود.", link: "#/explore" },
    });
    return NextResponse.json({ ok: true });
  } else if (action === "reject") {
    if (!rejectReason) return NextResponse.json({ error: "دلیل رد را وارد کنید" }, { status: 400 });
    await db.topTalentRequest.update({ where: { id }, data: { status: "rejected", rejectReason, reviewedAt: new Date() } });
    await db.notification.create({
      data: { userId: r.userId, type: "top_talent_rejected", title: "درخواست استعداد برتر رد شد", body: rejectReason, link: "#/feed" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "اکشن نامعتبر" }, { status: 400 });
}
