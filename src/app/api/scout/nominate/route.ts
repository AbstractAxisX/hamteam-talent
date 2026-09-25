import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { userStarInfo } from "@/lib/stars";

/* POST /api/scout/nominate — چهره‌یاب یک کاربر را به ادمین معرفی می‌کند
   برای دریافت مستقیم قاب «چهره برتر» (مسیر جایگزین)
   بدنه: { userId, reason } */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (!me.isScout) {
    return NextResponse.json({ error: "فقط چهره‌یاب‌ها می‌توانند استعداد را معرفی کنند" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "");
  const reason = String(body.reason || "").trim();

  if (reason.length < 10) {
    return NextResponse.json({ error: "دلیل معرفی حداقل ۱۰ کاراکتر باشد" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "کاربر پیدا نشد" }, { status: 404 });
  if (target.id === me.id) {
    return NextResponse.json({ error: "نمی‌توانید خودتان را معرفی کنید" }, { status: 400 });
  }

  const si = await userStarInfo(target.id);
  if (si.isTopTalent) {
    return NextResponse.json({ error: "این کاربر از قبل چهره برتر است" }, { status: 409 });
  }

  const pending = await db.eliteRequest.findFirst({
    where: { userId: target.id, status: "pending" },
  });
  if (pending) {
    return NextResponse.json({ error: "برای این کاربر درخواست در انتظار بررسی وجود دارد" }, { status: 409 });
  }

  await db.eliteRequest.create({
    data: {
      userId: target.id,
      source: "scout",
      nominatorId: me.id,
      reason,
    },
  });

  // اطلاع به خود کاربر که توسط چهره‌یاب معرفی شده
  await db.notification.create({
    data: {
      userId: target.id,
      type: "broadcast",
      title: "معرفی به ادمین 🌟",
      body: `شما توسط چهره‌یاب «${me.name}» برای دریافت قاب چهره برتر به ادمین معرفی شدید — در انتظار تأیید.`,
    },
  });

  return NextResponse.json({
    ok: true,
    message: `«${target.name}» به ادمین معرفی شد — پس از تأیید، قاب چهره برتر می‌گیرد`,
  });
}
