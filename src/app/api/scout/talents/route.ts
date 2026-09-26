import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { leaderboard } from "@/lib/rankings";

/* GET /api/scout/talents — جست‌وجوی استعداد برای چهره‌یاب‌ها
   query: categoryId?, skillId?, q?, sort=stars|new, page, limit
   برمی‌گرداند: لیست کاربران + جایگاه + ستاره + قاب + دسته + مهارت‌ها */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (!me.isScout) return NextResponse.json({ error: "این صفحه مخصوص چهره‌یاب‌هاست" }, { status: 403 });

  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || null;
  const skillId = url.searchParams.get("skillId") || null;
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") || 30)));
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));

  const rows = await leaderboard({ categoryId, skillId, limit: limit * page });

  let filtered = rows;
  if (q) {
    const needle = q.replace(/\u200c/g, " ");
    filtered = rows.filter(
      (r) => r.name.replace(/\u200c/g, " ").includes(needle) || r.bioShort.includes(needle) || (r.mainCategoryName || "").includes(needle)
    );
  }
  const paged = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    total: filtered.length,
    page,
    talents: paged.map((r) => ({
      id: r.userId,
      name: r.name,
      rank: r.rank,
      totalStars: r.totalStars,
      frame: r.frame,
      avatarUrl: r.avatarUrl,
      gender: r.gender,
      bioShort: r.bioShort,
      mainCategoryName: r.mainCategoryName,
    })),
  });
}

/* POST /api/scout/talents — دسته‌بندی‌ها/مهارت‌های در دسترس چهره‌یاب */
export async function POST() {
  const me = await getCurrentUser();
  if (!me || !me.isScout) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const cats = await db.category.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      iconUrl: true,
      color: true,
      skills: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ categories: cats });
}
