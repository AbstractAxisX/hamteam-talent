import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// PATCH /api/admin/jobs/[id] — close / reopen a job post
// DELETE /api/admin/jobs/[id] — delete a job post (cascades to skills, applications, attachments)

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body.status as "open" | "closed";

  if (status !== "open" && status !== "closed") {
    return NextResponse.json({ error: "وضعیت نامعتبر" }, { status: 400 });
  }

  const job = await db.jobPost.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ ok: true, status: job.status });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  await db.jobPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
