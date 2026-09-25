import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ProfileMeta } from "@/lib/types";

// GET /api/profile/[id]/meta — supplementary profile data
// (mainCategoryId + وضعیت چهره برتر بر پایه ستاره). Public, read-only.
// We expose these via a separate endpoint to avoid modifying the existing
// GET /api/profile/[id] route contract.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const targetId = rawId === "me" ? null : rawId;

  // For "me" we need the current user — but we don't import auth here to keep
  // this route self-contained and avoid coupling. The UI can call /api/profile/me/meta
  // only when logged in; if no session, return empty meta.
  let userId = targetId;
  if (!userId) {
    // Try to resolve "me" via the auth cookie without a hard dependency.
    const { getCurrentUser } = await import("@/lib/auth");
    const me = await getCurrentUser();
    if (!me) {
      return NextResponse.json(
        { error: "ابتدا وارد شوید" },
        { status: 401 }
      );
    }
    userId = me.id;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { profile: { select: { mainCategoryId: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "کاربر پیدا نشد" }, { status: 404 });
  }

  // چهره برتر = مشتق از ستاره‌ها (≥5000 نقره‌ای / ≥10000 طلایی)
  const { userStarInfo } = await import("@/lib/stars");
  const si = await userStarInfo(userId);

  const meta: ProfileMeta = {
    mainCategoryId: user.profile?.mainCategoryId ?? null,
    isTopTalent: si.isTopTalent,
    frame: si.frame,
    totalStars: si.totalStars,
  };

  return NextResponse.json(meta);
}
