import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/explore/people — top talent users
// ?categoryId=
export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId");
  const me = await getCurrentUser();

  const where: any = { isTopTalent: true, isBanned: false };
  if (me) where.id = { not: me.id };
  if (categoryId) where.userCategories = { some: { categoryId } };

  const users = await db.user.findMany({
    where,
    take: 60,
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
      userCategories: { include: { category: true } },
      connectionsRec: { where: { status: "accepted" }, select: { id: true } },
    },
  });

  const result = users.map((u) => {
    const mainCat = u.userCategories.find((uc) => uc.categoryId === u.profile?.mainCategoryId) || u.userCategories[0];
    return {
      id: u.id,
      name: u.name,
      isVerifiedBadge: u.isVerifiedBadge,
      isTopTalent: u.isTopTalent,
      bioShort: u.profile?.bioShort || "",
      avatarUrl: u.profile?.avatarUrl ?? null,
      gender: u.profile?.gender ?? null,
      province: u.profile?.province ?? null,
      city: u.profile?.city ?? null,
      categories: u.userCategories.map((uc) => ({ id: uc.category.id, name: uc.category.name, iconUrl: uc.category.iconUrl, color: uc.category.color })),
      mainCategoryColor: mainCat?.category?.color ?? null,
      followersCount: u.connectionsRec.length,
    };
  });

  return NextResponse.json({ people: result });
}
