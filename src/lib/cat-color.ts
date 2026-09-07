import { db } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════
   رنگ دسته‌بندی کاربر — منبع حقیقتِ واحد برای «رنگ فرد»
   · اولویت: profile.mainCategoryId → اولین دستهٔ انتخابی کاربر
   · همهٔ APIها و همهٔ رینگ‌آواتارها/نوارهای پست از همین حل می‌شوند
   ═══════════════════════════════════════════════════════════ */

/** نقشهٔ id دسته → رنگ (فقط یک query) */
export async function categoryColorMap(): Promise<Map<string, string | null>> {
  const cats = await db.category.findMany({ select: { id: true, color: true } });
  return new Map(cats.map((c) => [c.id, c.color ?? null]));
}

/** رنگ اصلی کاربر بر اساس شناسه دسته‌هایش */
export function resolveUserColor(
  catMap: Map<string, string | null>,
  mainCategoryId?: string | null,
  firstCategoryId?: string | null
): string | null {
  if (mainCategoryId && catMap.has(mainCategoryId)) return catMap.get(mainCategoryId) ?? null;
  if (firstCategoryId && catMap.has(firstCategoryId)) return catMap.get(firstCategoryId) ?? null;
  return null;
}
