import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/top-talent/request — user submits a Top Talent application
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const nationalIdPhotoUrl = String(body.nationalIdPhotoUrl || "").trim();
  const phoneNumber = String(body.phoneNumber || "").trim();
  const socialMediaId = String(body.socialMediaId || "").trim();
  const description = String(body.description || "").trim();

  if (!nationalIdPhotoUrl) return NextResponse.json({ error: "عکس کارت ملی الزامی است" }, { status: 400 });
  if (!phoneNumber) return NextResponse.json({ error: "شماره تلفن الزامی است" }, { status: 400 });

  // Check if user already has a pending/approved request
  const existing = await db.topTalentRequest.findFirst({
    where: { userId: me.id, status: { in: ["pending", "approved"] } },
  });
  if (existing) {
    if (existing.status === "approved") return NextResponse.json({ error: "شما قبلاً استعداد برتر شده‌اید" }, { status: 400 });
    return NextResponse.json({ error: "درخواست شما در حال بررسی است" }, { status: 400 });
  }

  const req_ = await db.topTalentRequest.create({
    data: { userId: me.id, nationalIdPhotoUrl, phoneNumber, socialMediaId, description },
  });

  return NextResponse.json({ ok: true, id: req_.id });
}
