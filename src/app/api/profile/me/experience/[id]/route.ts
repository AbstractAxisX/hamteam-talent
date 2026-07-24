import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// DELETE /api/profile/me/experience/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const { id } = await params;

  const exp = await db.resumeExperience.findUnique({
    where: { id },
    include: { resume: { include: { profile: true } } },
  });
  if (!exp || exp.resume.profile.userId !== me.id) {
    return NextResponse.json({ error: "مورد پیدا نشد" }, { status: 404 });
  }

  await db.resumeExperience.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
