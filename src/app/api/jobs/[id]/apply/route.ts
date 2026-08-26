import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/jobs/[id]/apply — apply with { message }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const post = await db.jobPost.findUnique({ where: { id } });
  if (!post)
    return NextResponse.json({ error: "نیازمندی پیدا نشد" }, { status: 404 });
  if (post.status === "closed") {
    return NextResponse.json(
      { error: "این نیازمندی بسته شده و دیگر قابل درخواست نیست" },
      { status: 400 }
    );
  }
  if (post.userId === user.id) {
    return NextResponse.json(
      { error: "نمی‌توانید به نیازمندی خودتان درخواست بفرستید" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || "").trim().slice(0, 2000);

  // Prevent duplicate applications
  const existing = await db.jobApplication.findUnique({
    where: { jobPostId_applicantId: { jobPostId: id, applicantId: user.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "شما قبلاً برای این نیازمندی درخواست ارسال کرده‌اید" },
      { status: 400 }
    );
  }

  // Create application
  await db.jobApplication.create({
    data: { jobPostId: id, applicantId: user.id, message },
  });

  // Notify the post owner
  try {
    await db.notification.create({
      data: {
        userId: post.userId,
        type: "job_match",
        title: "درخواست جدید برای نیازمندی شما",
        body: post.title,
        link: `#/job/${id}`,
      },
    });
  } catch {
    // non-critical
  }

  // Optionally create a conversation between applicant and owner (if doesn't exist)
  try {
    const [aId, bId] =
      user.id < post.userId ? [user.id, post.userId] : [post.userId, user.id];
    await db.conversation.upsert({
      where: { userAId_userBId: { userAId: aId, userBId: bId } },
      update: {},
      create: { userAId: aId, userBId: bId },
    });
  } catch {
    // non-critical
  }

  return NextResponse.json({ ok: true });
}
