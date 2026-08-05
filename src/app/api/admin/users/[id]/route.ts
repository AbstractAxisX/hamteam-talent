import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "ban" | "unban" | "verify" | "unverify";

  const data: any = {};
  if (action === "ban") data.isBanned = true;
  else if (action === "unban") data.isBanned = false;
  else if (action === "verify") data.isVerifiedBadge = true;
  else if (action === "unverify") data.isVerifiedBadge = false;
  else return NextResponse.json({ error: "اکشن نامعتبر" }, { status: 400 });

  const user = await db.user.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
