import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/posts/[id]/report — گزارش تخلف پست (مدیریت محتوا)
// هر کاربر هر پست را یک بار گزارش می‌کند (upsert روی unique[postId, reporterId])
const REASONS = ["spam", "inappropriate", "insult", "illegal", "other"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason || "");
  const note = String(body.note || "").trim().slice(0, 500);

  if (!REASONS.includes(reason)) {
    return NextResponse.json({ error: "دلیل گزارش نامعتبر است" }, { status: 400 });
  }

  const post = await db.post.findUnique({ where: { id }, select: { userId: true } });
  if (!post) return NextResponse.json({ error: "پست یافت نشد" }, { status: 404 });
  if (post.userId === me.id) {
    return NextResponse.json({ error: "نمی‌توانید پست خودتان را گزارش کنید" }, { status: 400 });
  }

  const report = await db.postReport.upsert({
    where: { postId_reporterId: { postId: id, reporterId: me.id } },
    update: { reason, note, status: "open" },
    create: { postId: id, reporterId: me.id, reason, note },
  });

  return NextResponse.json({ ok: true, id: report.id });
}
