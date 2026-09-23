import { db } from "./db";
import { Prisma } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════
   stars.ts — منطق «چهره برتر» بر پایه ستاره و رأی
   · هر کاربر روی هر پست یک امتیاز ۱..۱۰ ثبت می‌کند (PostRating)
   · مجموع ستاره‌های دریافتی کاربر = جمع score همهٔ رتبه‌های همهٔ پست‌هایش
   · تعداد رأی = تعداد امتیازهای دریافتی کاربر
   · ≥ ۵۰۰۰ ستاره یا ≥ ۵۰۰ رأی → قاب طلایی (gold) + ارسال پست به چهره برتر
   · ≥ ۱۰۰۰۰ ستاره یا ≥ ۱۰۰۰ رأی → قاب رزگلد (rosegold)
   · isAdminElite (مسیر جایگزین: تأیید ادمین) → حداقل قاب طلایی
   · چهره برترها هفته‌ای فقط ۱ پست به ویترین می‌فرستند
   ═══════════════════════════════════════════════════════════════ */

export const GOLD_THRESHOLD = 5000;
export const ROSE_GOLD_THRESHOLD = 10000;
/** مسیر رأی: ۵۰۰ رأی (امتیاز ثبت‌شده) هم قاب طلایی می‌آورد */
export const GOLD_VOTES_THRESHOLD = 500;
export const ROSE_GOLD_VOTES_THRESHOLD = 1000;
/** سقف پست‌های هم‌زمان هر کاربر در ویترین چهره برتر */
export const MAX_FEATURED_POSTS = 5;
/** سقف هفتگی ارسال به ویترین — هر ۷ روز فقط ۱ پست */
export const FEATURE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type FrameLevel = "gold" | "rosegold" | null;

export function frameFor(totalStars: number, votes = 0, isAdminElite = false): FrameLevel {
  if (totalStars >= ROSE_GOLD_THRESHOLD || votes >= ROSE_GOLD_VOTES_THRESHOLD) return "rosegold";
  if (totalStars >= GOLD_THRESHOLD || votes >= GOLD_VOTES_THRESHOLD || isAdminElite) return "gold";
  return null;
}

export interface UserStarInfo {
  totalStars: number;
  /** تعداد رأی‌های دریافتی (امتیازهای ثبت‌شده روی پست‌های کاربر) */
  votes: number;
  frame: FrameLevel;
  /** همان مفهوم قدیمی — مشتق از ستاره/رأی یا تأیید ادمین */
  isTopTalent: boolean;
  /** ستارهٔ مانده تا قاب بعدی بر پایهٔ ستاره (null یعنی بیشترین سطح) */
  nextAt: number | null;
}

const ZERO: UserStarInfo = { totalStars: 0, votes: 0, frame: null, isTopTalent: false, nextAt: GOLD_THRESHOLD };

function infoFor(total: number, votes: number, adminElite = false): UserStarInfo {
  const frame = frameFor(total, votes, adminElite);
  return {
    totalStars: total,
    votes,
    frame,
    isTopTalent: frame != null,
    nextAt: total >= ROSE_GOLD_THRESHOLD || votes >= ROSE_GOLD_VOTES_THRESHOLD ? null : GOLD_THRESHOLD,
  };
}

/** مجموع ستاره/رأی دریافتی چند کاربر + فلگ ادمین — دو کوئری، همان API قبلی */
export async function usersStarInfo(userIds: string[]): Promise<Map<string, UserStarInfo>> {
  const uniq = [...new Set(userIds)].filter(Boolean);
  const map = new Map<string, UserStarInfo>();
  if (uniq.length === 0) return map;
  const [rows, adminElites] = await Promise.all([
    db.$queryRaw<{ userId: string; total: number; votes: number }[]>(
      Prisma.sql`SELECT p."userId" AS "userId", COALESCE(SUM(r."score"), 0) AS "total", COUNT(r."id") AS "votes"
                 FROM "Post" p LEFT JOIN "PostRating" r ON r."postId" = p."id"
                 WHERE p."userId" IN (${Prisma.join(uniq)})
                 GROUP BY p."userId"`
    ),
    db.user.findMany({
      where: { id: { in: uniq }, isAdminElite: true },
      select: { id: true },
    }),
  ]);
  const eliteSet = new Set(adminElites.map((u) => u.id));
  for (const r of rows) map.set(r.userId, infoFor(Number(r.total), Number(r.votes), eliteSet.has(r.userId)));
  for (const id of uniq) {
    if (!map.has(id)) map.set(id, eliteSet.has(id) ? infoFor(0, 0, true) : ZERO);
  }
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
