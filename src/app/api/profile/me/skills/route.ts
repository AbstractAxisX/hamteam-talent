import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/profile/me/skills — add a skill to current user's profile.
// Body: { skillId }
// The skill's category must already be in user's categories.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const skillId = String(body.skillId || "");

  if (!skillId) {
    return NextResponse.json({ error: "شناسه مهارت الزامی است" }, { status: 400 });
  }

  const skill = await db.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    return NextResponse.json({ error: "مهارت نامعتبر است" }, { status: 400 });
  }

  // Ensure user has the parent category
  const hasCat = await db.userCategory.findUnique({
    where: { userId_categoryId: { userId: me.id, categoryId: skill.categoryId } },
  });
  if (!hasCat) {
    return NextResponse.json(
      { error: "ابتدا دسته‌بندی این مهارت را به پروفایل خود اضافه کنید" },
      { status: 400 }
    );
  }

  const existing = await db.userSkill.findUnique({
    where: { userId_skillId: { userId: me.id, skillId } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, id: existing.id, already: true });
  }

  const us = await db.userSkill.create({ data: { userId: me.id, skillId } });
  return NextResponse.json({ ok: true, id: us.id });
}
