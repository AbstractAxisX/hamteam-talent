import { db } from "./db";
import { Prisma } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════
   rankings.ts — جایگاه کاربران بر پایهٔ مجموع ستاره‌ها
   · جایگاه کل: بین همهٔ اعضا (غیر چهره‌یاب و غیر مسدود)
   · جایگاه در دسته: بین اعضای همان دسته (userCategories)
   · جایگاه در مهارت: بین اعضای همان مهارت (userSkills)
   جایگاه فقط عدد است — قبل/بعد نمایش داده نمی‌شود.
   ═══════════════════════════════════════════════════════════════ */

export interface RankRow {
  rank: number;
  total: number;
}
export interface MyRank {
  overall: RankRow;
  category: { name: string; iconUrl?: string | null } & RankRow | null;
  skill: { name: string } & RankRow | null;
}

interface StarRow {
  userId: string;
  total: number;
}

/** مجموع ستارهٔ همهٔ کاربران (یک کوئری) */
async function allStars(): Promise<Map<string, number>> {
  const rows = await db.$queryRaw<StarRow[]>(
    Prisma.sql`SELECT p."userId" AS "userId", COALESCE(SUM(r."score"), 0) AS "total"
               FROM "Post" p LEFT JOIN "PostRating" r ON r."postId" = p."id"
               GROUP BY p."userId"`
  );
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.userId, Number(r.total));
  return map;
}

/** اعضای رقابت‌پذیر: غیر چهره‌یاب، غیر مسدود */
function eligible(users: { id: string; isScout: boolean; isBanned: boolean }[]): string[] {
  return users.filter((u) => !u.isScout && !u.isBanned).map((u) => u.id);
}

function rankOf(sortedIds: string[], meId: string): RankRow {
  return { rank: sortedIds.indexOf(meId) + 1, total: sortedIds.length };
}

/** جایگاه من: کل + دستهٔ اصلی + اولین مهارت — برای پنل خانه */
export async function myRank(userId: string): Promise<MyRank | null> {
  const me = await db.user.findUnique({ where: { id: userId }, select: { id: true, isScout: true, isBanned: true } });
  if (!me || me.isScout) return null;

  const [users, stars, myCats, mySkills] = await Promise.all([
    db.user.findMany({ select: { id: true, isScout: true, isBanned: true } }),
    allStars(),
    db.userCategory.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true, iconUrl: true } } },
    }),
    db.userSkill.findMany({
      where: { userId },
      include: { skill: { select: { id: true, name: true } } },
    }),
  ]);
  if (users.length === 0) return null;

  const ids = eligible(users);
  const overallSorted = [...ids].sort((a, b) => (stars.get(b) ?? 0) - (stars.get(a) ?? 0));
  const overall = rankOf(overallSorted, userId);

  /* دستهٔ اصلی من — رقابت با اعضای همان دسته */
  let category: MyRank["category"] = null;
  const mainCat = myCats[0]?.category ?? null;
  if (mainCat) {
    const inCat = await db.userCategory.findMany({
      where: { categoryId: mainCat.id },
      select: { userId: true },
    });
    const catUserIds = new Set(inCat.map((uc) => uc.userId));
    const sortedInCat = ids.filter((id) => catUserIds.has(id)).sort((a, b) => (stars.get(b) ?? 0) - (stars.get(a) ?? 0));
    const rr = rankOf(sortedInCat, userId);
    category = { name: mainCat.name, iconUrl: mainCat.iconUrl, rank: rr.rank, total: rr.total };
  }

  /* مهارت اول من — رقابت با اعضای همان مهارت */
  let skill: MyRank["skill"] = null;
  const mainSkill = mySkills[0]?.skill ?? null;
  if (mainSkill) {
    const inSkill = await db.userSkill.findMany({
      where: { skillId: mainSkill.id },
      select: { userId: true },
    });
    const skillUserIds = new Set(inSkill.map((us) => us.userId));
    const sortedInSkill = ids.filter((id) => skillUserIds.has(id)).sort((a, b) => (stars.get(b) ?? 0) - (stars.get(a) ?? 0));
    const rr = rankOf(sortedInSkill, userId);
    skill = { name: mainSkill.name, rank: rr.rank, total: rr.total };
  }

  return { overall, category, skill };
}

/** جدول کامل جایگاه‌ها برای چهره‌یاب — scope: all | category | skill */
export async function leaderboard(opts: {
  categoryId?: string | null;
  skillId?: string | null;
  limit?: number;
}): Promise<
  Array<{
    userId: string;
    name: string;
    rank: number;
    totalStars: number;
    avatarUrl: string | null;
    gender: string | null;
    frame: "silver" | "gold" | null;
    bioShort: string;
    mainCategoryName: string | null;
  }>
> {
  const limit = opts.limit ?? 50;
  const stars = await allStars();

  const where: any = { isBanned: false, isScout: false };
  if (opts.categoryId) where.userCategories = { some: { categoryId: opts.categoryId } };
  if (opts.skillId) where.userSkills = { some: { skillId: opts.skillId } };

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      isAdminElite: true,
      eliteLevel: true,
      profile: { select: { avatarUrl: true, gender: true, bioShort: true, mainCategoryId: true } },
      userCategories: { take: 1, include: { category: { select: { name: true } } } },
    },
    take: 400,
  });

  const sorted = users
    .map((u) => ({ u, total: stars.get(u.id) ?? 0 }))
    .sort((a, b) => b.total - a.total || a.u.name.localeCompare(b.u.name, "fa"))
    .slice(0, limit);

  return sorted.map(({ u, total }, i) => {
    const level = u.isAdminElite ? (u.eliteLevel as string) : "none";
    const frame =
      total >= 10000 || level === "gold" ? "gold" : total >= 5000 || level === "silver" ? "silver" : null;
    return {
      userId: u.id,
      name: u.name,
      rank: i + 1,
      totalStars: total,
      avatarUrl: u.profile?.avatarUrl ?? null,
      gender: u.profile?.gender ?? null,
      frame: frame as "silver" | "gold" | null,
      bioShort: u.profile?.bioShort ?? "",
      mainCategoryName: u.userCategories[0]?.category.name ?? null,
    };
  });
}
