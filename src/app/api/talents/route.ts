import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { provinceCandidates } from "@/lib/geo";
import { categoryColorMap, resolveUserColor } from "@/lib/cat-color";
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
    // DB دوفرمتی است (id یا نام فارسی) — فیلتر هر دو را می‌پذیرد
    where.profile = { ...where.profile, province: { in: provinceCandidates(province) } };
  }
  if (city) {
    where.profile = { ...where.profile, city };
  }
  if (q) {
    if (q.startsWith("@")) {
      // مود جستجوی آیدی — فقط نام‌کاربری
      const uname = q.slice(1).toLowerCase();
      if (uname) where.username = { contains: uname };
    } else {
      where.OR = [
        { name: { contains: q } },
        { profile: { bioShort: { contains: q } } },
      ];
    }
  }

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

  const catMap = await categoryColorMap();

  const result: TalentListItem[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    isVerifiedBadge: u.isVerifiedBadge,
    isTopTalent: u.isTopTalent,
    bioShort: u.profile?.bioShort || "",
    avatarUrl: u.profile?.avatarUrl ?? null,
    gender: (u.profile?.gender as string | null) ?? null,
    province: u.profile?.province ?? null,
    city: u.profile?.city ?? null,
    categories: u.userCategories.map((uc) => ({
      id: uc.category.id,
      name: uc.category.name,
      iconUrl: uc.category.iconUrl,
      color: uc.category.color,
    })),
    followersCount: u.connectionsRec.length,
    mainCategoryColor: resolveUserColor(
      catMap,
      u.profile?.mainCategoryId,
      u.userCategories?.[0]?.categoryId
    ),
  }));

  // Sort by followers if requested
  if (sort === "followers") {
    result.sort((a, b) => b.followersCount - a.followersCount);
  }

  return NextResponse.json({ talents: result });
}
