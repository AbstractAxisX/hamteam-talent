import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

/* PUT /api/admin/users/[id] — { action, level?, note? }
   actions: ban | unban | verify | unverify | elite | unelite
   elite: level = "gold" | "rosegold" (پیش‌فرض gold) */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "ban" | "unban" | "verify" | "unverify" | "elite" | "unelite";

  const data: any = {};
  if (action === "ban") data.isBanned = true;
  else if (action === "unban") data.isBanned = false;
  else if (action === "verify") data.isVerifiedBadge = true;
  else if (action === "unverify") data.isVerifiedBadge = false;
  else if (action === "elite") {
    const level = body.level === "rosegold" ? "rosegold" : "gold";
    data.isAdminElite = true;
    data.eliteLevel = level;
  } else if (action === "unelite") {
    data.isAdminElite = false;
    data.eliteLevel = "none";
  } else return NextResponse.json({ error: "اکشن نامعتبر" }, { status: 400 });

  const user = await db.user.update({ where: { id }, data });

  if (action === "elite") {
    const levelFa = data.eliteLevel === "rosegold" ? "رزگلد" : "طلایی";
    await db.notification.create({
      data: {
        userId: id,
        type: "broadcast",
        title: `قاب چهره برتر ${levelFa} فعال شد ⭐`,
        body: `ادمین صلاح‌دید شما را تأیید کرد — قاب ${levelFa} چهره برتر فعال است و می‌توانید هفته‌ای یک پست به صفحهٔ چهره برتر بفرستید.`,
      },
    });
  }

  return NextResponse.json({ ok: true, eliteLevel: user.eliteLevel });
}
