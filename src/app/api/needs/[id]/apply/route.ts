import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────
// POST /api/needs/[id]/apply — submit an application (auth required)
//   Body: { message }
//   - Prevent duplicates (one application per user per need)
//   - Prevent applying to own need or closed need
//   - Notify the need owner
// ─────────────────────────────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const need = await db.jobPost.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, title: true },
  });
  if (!need) {
    return NextResponse.json(
      { error: "نیازمندی یافت نشد" },
      { status: 404 }
    );
  }
  if (need.userId === me.id) {
    return NextResponse.json(
      { error: "شما سازنده این نیازمندی هستید" },
      { status: 400 }
    );
  }
  if (need.status === "closed") {
    return NextResponse.json(
      { error: "این نیازمندی بسته شده است" },
      { status: 400 }
    );
  }

  // Check existing application
  const existing = await db.jobApplication.findUnique({
    where: {
      jobPostId_applicantId: { jobPostId: id, applicantId: me.id },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "شما قبلاً برای این نیازمندی درخواست ثبت کرده‌اید" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || "").trim().slice(0, 1000);

  const application = await db.jobApplication.create({
    data: {
      jobPostId: id,
      applicantId: me.id,
      message,
    },
  });

  // Notify the owner (skip if owner is somehow self)
  if (need.userId !== me.id) {
    await db.notification.create({
      data: {
        userId: need.userId,
        type: "chat", // category: chat (covers applications)
        title: "درخواست جدید برای نیازمندی شما",
        body: `${me.name}: ${need.title}`,
        link: `#/need/${need.id}`,
        data: JSON.stringify({ needId: need.id, applicationId: application.id }),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    applicationId: application.id,
  });
}
