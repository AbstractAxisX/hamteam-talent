import { db } from "./db";
import { Prisma } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════
   stars.ts — منطق «چهره برتر» بر پایه ستاره و رأی
   · هر کاربر روی هر پست یک امتیاز ۱..۱۰ ثبت می‌کند (PostRating)
   · مجموع ستاره‌های دریافتی کاربر = جمع score همهٔ امتیازهای همهٔ پست‌هایش
   · تعداد رأی = تعداد امتیازهای دریافتی کاربر
   · ≥ ۵۰۰۰ ستاره یا ≥ ۵۰۰ رأی → قاب نقره‌ای (silver) + ارسال پست به چهره برتر
   · ≥ ۱۰۰۰۰ ستاره یا ≥ ۱۰۰۰ رأی → قاب طلایی (gold)
   · isAdminElite (مسیر جایگزین: تأیید ادمین) → حداقل قاب نقره‌ای
   · چهره برترها هفته‌ای فقط ۱ پست به ویترین می‌فرستند
   ═══════════════════════════════════════════════════════════════ */

export const SILVER_THRESHOLD = 5000;
export const GOLD_THRESHOLD = 10000;
/** مسیر رأی: ۵۰۰ رأی (امتیاز ثبت‌شده) هم قاب نقره‌ای می‌آورد */
export const SILVER_VOTES_THRESHOLD = 500;
export const GOLD_VOTES_THRESHOLD = 1000;
/** سقف پست‌های هم‌زمان هر کاربر در ویترین چهره برتر */
export const MAX_FEATURED_POSTS = 5;
/** سقف هفتگی ارسال به ویترین — هر ۷ روز فقط ۱ پست */
export const FEATURE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** سطح قاب کاربر — نقره‌ای (۵۰۰۰) یا طلایی (۱۰۰۰۰) */
export type FrameLevel = "silver" | "gold" | null;

/** سطح قاب ادمینی روی User.eliteLevel */
export type AdminEliteLevel = "none" | "silver" | "gold";

export function frameFor(
  totalStars: number,
  votes = 0,
  adminElite: AdminEliteLevel | boolean = "none"
): FrameLevel {
  const level: AdminEliteLevel =
    adminElite === true ? "silver" : adminElite === false ? "none" : adminElite;
  if (level === "gold") return "gold";
  if (totalStars >= GOLD_THRESHOLD || votes >= GOLD_VOTES_THRESHOLD) return "gold";
  if (totalStars >= SILVER_THRESHOLD || votes >= SILVER_VOTES_THRESHOLD || level === "silver") return "silver";
  return null;
}

export interface UserStarInfo {
  totalStars: number;
  /** تعداد رأی‌های دریافتی (امتیازهای ثبت‌شده روی پست‌های کاربر) */
  votes: number;
  frame: FrameLevel;
  /** همان مفهوم قدیمی — مشتق از ستاره/رأی یا تأیید ادمین */
  isTopTalent: boolean;
  /** آستانهٔ قاب بعدی (نقره‌ای، سپس طلایی) — null یعنی بیشترین سطح */
  nextAt: number | null;
  nextFrame: "silver" | "gold" | null;
}

const ZERO: UserStarInfo = { totalStars: 0, votes: 0, frame: null, isTopTalent: false, nextAt: SILVER_THRESHOLD, nextFrame: "silver" };

function infoFor(total: number, votes: number, adminElite: AdminEliteLevel = "none"): UserStarInfo {
  const frame = frameFor(total, votes, adminElite);
  const maxed = total >= GOLD_THRESHOLD || votes >= GOLD_VOTES_THRESHOLD;
  const silvered = maxed || total >= SILVER_THRESHOLD || votes >= SILVER_VOTES_THRESHOLD;
  return {
    totalStars: total,
    votes,
    frame,
    isTopTalent: frame != null,
    nextAt: maxed ? null : silvered ? GOLD_THRESHOLD : SILVER_THRESHOLD,
    nextFrame: maxed ? null : "gold",
  };
}

/** مجموع ستاره/رأی دریافتی چند کاربر + سطح ادمین — دو کوئری، همان API قبلی */
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
      select: { id: true, eliteLevel: true },
    }),
  ]);
  const eliteMap = new Map(adminElites.map((u) => [u.id, (u.eliteLevel as AdminEliteLevel) || "silver"]));
  for (const r of rows) map.set(r.userId, infoFor(Number(r.total), Number(r.votes), eliteMap.get(r.userId) ?? "none"));
  for (const id of uniq) {
    if (!map.has(id)) map.set(id, infoFor(0, 0, eliteMap.get(id) ?? "none"));
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
