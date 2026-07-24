import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// DELETE /api/profile/me/categories/[id] — remove a user category (and its userSkills).
// `id` here is the categoryId (matching what the profile detail returns).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const { id: categoryId } = await params;

  const uc = await db.userCategory.findUnique({
    where: { userId_categoryId: { userId: me.id, categoryId } },
  });
  if (!uc) {
    return NextResponse.json({ error: "مورد پیدا نشد" }, { status: 404 });
  }

  // Remove userSkills belonging to this user under skills of this category.
  const category = await db.category.findUnique({
    where: { id: uc.categoryId },
    select: { skills: { select: { id: true } } },
  });
  const skillIds = (category?.skills ?? []).map((s) => s.id);
  if (skillIds.length > 0) {
    await db.userSkill.deleteMany({
      where: { userId: me.id, skillId: { in: skillIds } },
    });
  }

  await db.userCategory.delete({ where: { id: uc.id } });

  return NextResponse.json({ ok: true });
}
