import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export type PeopleListItem = {
  id: string;
  name: string;
  isVerifiedBadge: boolean;
  bioShort: string;
  avatarUrl: string | null;
  province: string | null;
  city: string | null;
  categories: { name: string }[];
  followersCount: number;
};

// GET /api/people?categoryId=&skillId=&province=&city=&q=&sort=recent|followers
// Returns profiles with filters, excluding banned users and the current user.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const skillId = url.searchParams.get("skillId") || undefined;
  const province = url.searchParams.get("province") || undefined;
  const city = url.searchParams.get("city") || undefined;
  const q = url.searchParams.get("q")?.trim() || undefined;
  const sort = url.searchParams.get("sort") === "followers" ? "followers" : "recent";
  const currentUser = await getCurrentUser();

  const where: Prisma.UserWhereInput = {
    isBanned: false,
    ...(currentUser ? { id: { not: currentUser.id } } : {}),
  };

  // Text search on name OR bioShort
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { profile: { bioShort: { contains: q } } },
    ];
  }

  // Location filters via profile
  const profileFilter: { province?: string; city?: string } = {};
  if (province) profileFilter.province = province;
  if (city) profileFilter.city = city;
  if (Object.keys(profileFilter).length > 0) {
    where.profile = profileFilter;
  }

  // Category filter: users who have that category in UserCategory
  if (categoryId) {
    where.userCategories = { some: { categoryId } };
  }

  // Skill filter: users who have that skill in UserSkill
  if (skillId) {
    where.userSkills = { some: { skillId } };
  }

  // For "recent" sort, orderBy createdAt desc and take 60 directly.
  // For "followers" sort, take a larger sample (200) and sort in JS by
  // accepted connection count, then slice to 60. SQLite + Prisma can't
  // easily order by a filtered relation count.
  const takeLimit = sort === "followers" ? 200 : 60;

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: takeLimit,
    include: {
      profile: true,
      userCategories: { include: { category: { select: { name: true } } } },
      // accepted connections where this user is the receiver = followers
      connectionsRec: {
        where: { status: "accepted" },
        select: { id: true },
      },
    },
  });

  let result: PeopleListItem[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    isVerifiedBadge: u.isVerifiedBadge,
    bioShort: u.profile?.bioShort ?? "",
    avatarUrl: u.profile?.avatarUrl ?? null,
    province: u.profile?.province ?? null,
    city: u.profile?.city ?? null,
    categories: u.userCategories.map((uc) => ({ name: uc.category.name })),
    followersCount: u.connectionsRec.length,
  }));

  if (sort === "followers") {
    result = result
      .sort((a, b) => b.followersCount - a.followersCount)
      .slice(0, 60);
  }

  return NextResponse.json({ users: result });
}
