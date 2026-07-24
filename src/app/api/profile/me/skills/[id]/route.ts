import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// DELETE /api/profile/me/skills/[id] — remove a user skill.
// `id` here is the skillId (matching what the profile detail returns).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const { id: skillId } = await params;

  const us = await db.userSkill.findUnique({
    where: { userId_skillId: { userId: me.id, skillId } },
  });
  if (!us) {
    return NextResponse.json({ error: "مورد پیدا نشد" }, { status: 404 });
  }

  await db.userSkill.delete({ where: { id: us.id } });
  return NextResponse.json({ ok: true });
}
