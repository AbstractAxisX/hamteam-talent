import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { TalentListItem } from "@/lib/types";

// GET /api/talents — browse talents (users) with filters
// Query: ?categoryId=&skillId=&province=&city=&q=&sort=recent|followers
export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId");
  const skillId = url.searchParams.get("skillId");
  const province = url.searchParams.get("province");
  const city = url.searchParams.get("city");
  const q = url.searchParams.get("q")?.trim();
  const sort = url.searchParams.get("sort") || "recent";
  const currentUser = await getCurrentUser();

  const where: any = { isBanned: false };
  if (currentUser) where.id = { not: currentUser.id };

  if (categoryId) {
    where.userCategories = { some: { categoryId } };
  }
  if (skillId) {
    where.userSkills = { some: { skillId } };
  }
  if (province) {
    where.profile = { ...where.profile, province };
  }
  if (city) {
    where.profile = { ...where.profile, city };
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { profile: { bioShort: { contains: q } } },
    ];
  }

  const users = await db.user.findMany({
    where,
    take: 60,
    orderBy: sort === "recent" ? { createdAt: "desc" } : { createdAt: "desc" },
    include: {
      profile: true,
      userCategories: { include: { category: true } },
      connectionsRec: { where: { status: "accepted" }, select: { id: true } },
    },
  });

  const result: TalentListItem[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    isVerifiedBadge: u.isVerifiedBadge,
    bioShort: u.profile?.bioShort || "",
    avatarUrl: u.profile?.avatarUrl ?? null,
    province: u.profile?.province ?? null,
    city: u.profile?.city ?? null,
    categories: u.userCategories.map((uc) => ({
      id: uc.category.id,
      name: uc.category.name,
      iconUrl: uc.category.iconUrl,
    })),
    followersCount: u.connectionsRec.length,
  }));

  // Sort by followers if requested
  if (sort === "followers") {
    result.sort((a, b) => b.followersCount - a.followersCount);
  }

  return NextResponse.json({ talents: result });
}
