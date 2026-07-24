import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// DELETE /api/profile/me/education/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const { id } = await params;

  const edu = await db.resumeEducation.findUnique({
    where: { id },
    include: { resume: { include: { profile: true } } },
  });
  if (!edu || edu.resume.profile.userId !== me.id) {
    return NextResponse.json({ error: "مورد پیدا نشد" }, { status: 404 });
  }

  await db.resumeEducation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
