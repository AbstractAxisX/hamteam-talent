import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { userStarInfo } from "@/lib/stars";

/* GET /api/elite/request — وضعیت درخواست مستقیم خودم
   POST /api/elite/request — ثبت درخواست «مسیر جایگزین»:
   کاربری که ادعای استعداد برتری دارد، از ادمین بررسی مستقیم می‌خواهد
   بدنه: { reason } */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ request: null, isTopTalent: false });
  const [req, si] = await Promise.all([
    db.eliteRequest.findFirst({
      where: { userId: me.id, source: "user" },
      orderBy: { createdAt: "desc" },
    }),
    userStarInfo(me.id),
  ]);
  return NextResponse.json({
    isTopTalent: si.isTopTalent,
    frame: si.frame,
    request: req
      ? {
          id: req.id,
          status: req.status,
          reason: req.reason,
          adminNote: req.adminNote,
          createdAt: req.createdAt.toISOString(),
          reviewedAt: req.reviewedAt?.toISOString() ?? null,
        }
      : null,
  });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (me.isBanned) return NextResponse.json({ error: "حساب شما مسدود است" }, { status: 403 });

  const si = await userStarInfo(me.id);
  if (si.isTopTalent) {
    return NextResponse.json({ error: "شما از قبل چهره برتر هستید" }, { status: 409 });
  }
  const pending = await db.eliteRequest.findFirst({
    where: { userId: me.id, status: "pending" },
  });
  if (pending) {
    return NextResponse.json({ error: "درخواست شما در انتظار بررسی ادمین است" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason || "").trim();
  if (reason.length < 30) {
    return NextResponse.json(
      { error: "توضیح ادعا حداقل ۳۰ کاراکتر باشد — سابقه، افتخارات و دلیل برتری شما" },
      { status: 400 }
    );
  }

  // درخواست‌های ردشدهٔ قبلی → اجازهٔ درخواست مجدد (رکورد جدید)
  await db.eliteRequest.create({
    data: { userId: me.id, source: "user", reason },
  });

  return NextResponse.json({
    ok: true,
    message: "درخواست بررسی مستقیم ثبت شد — ادمین با صلاح‌دید خود و نظر چهره‌یاب بررسی می‌کند",
  });
}
