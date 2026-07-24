import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET current user's categories & skills (for post/job selectors)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const userCats = await db.userCategory.findMany({
    where: { userId: user.id },
    include: { category: { include: { skills: { orderBy: { name: "asc" } } } } },
  });
  const userSkills = await db.userSkill.findMany({
    where: { userId: user.id },
    select: { skillId: true },
  });
  const skillIds = new Set(userSkills.map((s) => s.skillId));

  const categories = userCats.map((uc) => ({
    id: uc.category.id,
    name: uc.category.name,
    iconUrl: uc.category.iconUrl,
    skills: uc.category.skills.filter((s) => skillIds.has(s.id)).map((s) => ({ id: s.id, name: s.name })),
  }));

  return NextResponse.json({ categories });
}
