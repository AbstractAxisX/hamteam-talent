import { db } from "./db";
import { Prisma } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════
   stars.ts — منطق «چهره برتر» بر پایه ستاره
   · هر کاربر روی هر پست یک امتیاز ۱..۱۰ ثبت می‌کند (PostRating)
   · مجموع ستاره‌های دریافتی کاربر = جمع score همهٔ رتبه‌های همهٔ پست‌هایش
   · ≥ 5000  → قاب طلایی (gold)   + امکان ویترین کردن پست در «چهره برتر»
   · ≥ 10000 → قاب رزگلد (rosegold) — سطح خیلی خاص
   ═══════════════════════════════════════════════════════════════ */

export const GOLD_THRESHOLD = 5000;
export const ROSE_GOLD_THRESHOLD = 10000;
/** سقف پست‌های هم‌زمان هر کاربر در ویترین چهره برتر */
export const MAX_FEATURED_POSTS = 5;

export type FrameLevel = "gold" | "rosegold" | null;

export function frameFor(totalStars: number): FrameLevel {
  if (totalStars >= ROSE_GOLD_THRESHOLD) return "rosegold";
  if (totalStars >= GOLD_THRESHOLD) return "gold";
  return null;
}

export interface UserStarInfo {
  totalStars: number;
  frame: FrameLevel;
  /** همان مفهوم قدیمی — حالا کاملاً مشتق از ستاره‌هاست */
  isTopTalent: boolean;
  /** ستارهٔ مانده تا قاب بعدی (null یعنی بیشترین سطح) */
  nextAt: number | null;
}

const ZERO: UserStarInfo = { totalStars: 0, frame: null, isTopTalent: false, nextAt: GOLD_THRESHOLD };

function infoFor(total: number): UserStarInfo {
  const frame = frameFor(total);
  return {
    totalStars: total,
    frame,
    isTopTalent: frame != null,
    nextAt: total >= ROSE_GOLD_THRESHOLD ? null : total >= GOLD_THRESHOLD ? ROSE_GOLD_THRESHOLD : GOLD_THRESHOLD,
  };
}

/** مجموع ستاره‌های دریافتی چند کاربر — یک کوئری */
export async function usersStarInfo(userIds: string[]): Promise<Map<string, UserStarInfo>> {
  const uniq = [...new Set(userIds)].filter(Boolean);
  const map = new Map<string, UserStarInfo>();
  if (uniq.length === 0) return map;
  const rows = await db.$queryRaw<{ userId: string; total: number }[]>(
    Prisma.sql`SELECT p."userId" AS "userId", COALESCE(SUM(r."score"), 0) AS "total"
               FROM "Post" p LEFT JOIN "PostRating" r ON r."postId" = p."id"
               WHERE p."userId" IN (${Prisma.join(uniq)})
               GROUP BY p."userId"`
  );
  for (const r of rows) map.set(r.userId, infoFor(Number(r.total)));
  for (const id of uniq) if (!map.has(id)) map.set(id, ZERO);
  return map;
}

export async function userStarInfo(userId: string): Promise<UserStarInfo> {
  return (await usersStarInfo([userId])).get(userId) ?? ZERO;
}

/* ─────────── آمار امتیاز پست‌ها (میانگین/تعداد/امتیاز من) ─────────── */

export interface PostRatingStats {
  ratingAvg: number;
  ratingCount: number;
  myRating: number | null;
}

export async function postsRatingStats(
  postIds: string[],
  viewerId?: string | null
): Promise<Map<string, PostRatingStats>> {
  const uniq = [...new Set(postIds)].filter(Boolean);
  const map = new Map<string, PostRatingStats>();
  if (uniq.length === 0) return map;
  const agg = await db.postRating.groupBy({
    by: ["postId"],
    where: { postId: { in: uniq } },
    _avg: { score: true },
    _count: { _all: true },
  });
  for (const a of agg) {
    map.set(a.postId, {
      ratingAvg: Math.round((a._avg.score ?? 0) * 10) / 10,
      ratingCount: a._count._all,
      myRating: null,
    });
  }
  if (viewerId) {
    const mine = await db.postRating.findMany({
      where: { postId: { in: uniq }, userId: viewerId },
      select: { postId: true, score: true },
    });
    for (const m of mine) {
      const cur = map.get(m.postId) ?? { ratingAvg: 0, ratingCount: 0, myRating: null };
      map.set(m.postId, { ...cur, myRating: m.score });
    }
  }
  for (const id of uniq) if (!map.has(id)) map.set(id, { ratingAvg: 0, ratingCount: 0, myRating: null });
  return map;
}
