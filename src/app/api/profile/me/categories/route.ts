import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/profile/me/categories — add a category to current user's profile.
// Body: { categoryId }
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const categoryId = String(body.categoryId || "");

  if (!categoryId) {
    return NextResponse.json({ error: "شناسه دسته‌بندی الزامی است" }, { status: 400 });
  }

  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "دسته‌بندی نامعتبر است" }, { status: 400 });
  }

  // Ensure profile exists (auto-create)
  const profile = await db.profile.upsert({
    where: { userId: me.id },
    update: {},
    create: { userId: me.id },
  });

  // Idempotent add
  const existing = await db.userCategory.findUnique({
    where: { userId_categoryId: { userId: me.id, categoryId } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, id: existing.id, already: true });
  }

  const uc = await db.userCategory.create({
    data: { userId: me.id, categoryId },
  });

  // Also ensure resume exists for this profile.
  await db.resume.upsert({
    where: { profileId: profile.id },
    update: {},
    create: { profileId: profile.id },
  });

  return NextResponse.json({ ok: true, id: uc.id });
}
