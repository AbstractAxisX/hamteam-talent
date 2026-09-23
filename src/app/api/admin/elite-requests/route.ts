import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { usersStarInfo } from "@/lib/stars";

/* GET /api/admin/elite-requests — درخواست‌های مستقیم «چهره برتر»
   (خودِ کاربر + معرفی چهره‌یاب)
   POST /api/admin/elite-requests — { id, action: "approve"|"reject", note? }
   approve → user.isAdminElite=true (قاب طلایی مستقیم) */
export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "all";

  const requests = await db.eliteRequest.findMany({
    where: status === "all" ? {} : { status },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      user: { include: { profile: true } },
      nominator: { include: { profile: true } },
    },
  });

  const starInfo = await usersStarInfo(requests.map((r) => r.userId));

  return NextResponse.json({
    requests: requests.map((r) => {
      const si = starInfo.get(r.userId)!;
      return {
        id: r.id,
        source: r.source,
        reason: r.reason,
        status: r.status,
        adminNote: r.adminNote,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        user: {
          id: r.user.id,
          name: r.user.name,
          phone: r.user.phone,
          avatarUrl: r.user.profile?.avatarUrl ?? null,
          totalStars: si.totalStars,
          votes: si.votes,
          frame: si.frame,
        },
        nominator: r.nominator
          ? {
              id: r.nominator.id,
              name: r.nominator.name,
              avatarUrl: r.nominator.profile?.avatarUrl ?? null,
            }
          : null,
      };
    }),
    pendingCount: requests.filter((r) => r.status === "pending").length,
  });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const action = String(body.action || "");
  const note = String(body.note || "").trim();

  const reqRow = await db.eliteRequest.findUnique({ where: { id }, include: { user: true } });
  if (!reqRow) return NextResponse.json({ error: "درخواست پیدا نشد" }, { status: 404 });

  if (action === "approve") {
    await db.$transaction([
      db.eliteRequest.update({
        where: { id },
        data: { status: "approved", adminNote: note, reviewedAt: new Date() },
      }),
      db.user.update({ where: { id: reqRow.userId }, data: { isAdminElite: true } }),
    ]);
    await db.notification.create({
      data: {
        userId: reqRow.userId,
        type: "broadcast",
        title: "قاب چهره برتر شما فعال شد ⭐",
        body: "ادمین صلاح‌دید شما را تأیید کرد — قاب طلایی چهره برتر فعال است و می‌توانید هفته‌ای یک پست به صفحهٔ چهره برتر بفرستید.",
      },
    });
    return NextResponse.json({ ok: true, message: `«${reqRow.user.name}» چهره برتر شد` });
  }

  if (action === "reject") {
    await db.eliteRequest.update({
      where: { id },
      data: { status: "rejected", adminNote: note, reviewedAt: new Date() },
    });
    await db.notification.create({
      data: {
        userId: reqRow.userId,
        type: "broadcast",
        title: "درخواست چهره برتر رد شد",
        body: note ? `تأیید نشد: ${note}` : "درخواست مستقیم چهره برتر شما تأیید نشد.",
      },
    });
    return NextResponse.json({ ok: true, message: "درخواست رد شد" });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
