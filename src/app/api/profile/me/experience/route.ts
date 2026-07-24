import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/profile/me/experience — create a resume experience.
// Body: { jobTitle, organization, startDate?, endDate?, description, categoryId?, skillId? }
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const jobTitle = String(body.jobTitle || "").trim();
  const organization = String(body.organization || "").trim();
  if (!jobTitle) return NextResponse.json({ error: "عنوان شغلی الزامی است" }, { status: 400 });
  if (!organization) return NextResponse.json({ error: "نام سازمان الزامی است" }, { status: 400 });

  const startDate = body.startDate ? String(body.startDate).slice(0, 50) : null;
  const endDate = body.endDate ? String(body.endDate).slice(0, 50) : null;
  const description = String(body.description || "").slice(0, 4000);

  let categoryId: string | null = null;
  let skillId: string | null = null;
  if (body.categoryId) {
    const cat = await db.category.findUnique({ where: { id: String(body.categoryId) } });
    if (!cat) return NextResponse.json({ error: "دسته‌بندی نامعتبر است" }, { status: 400 });
    categoryId = cat.id;
  }
  if (body.skillId) {
    const sk = await db.skill.findUnique({ where: { id: String(body.skillId) } });
    if (!sk) return NextResponse.json({ error: "مهارت نامعتبر است" }, { status: 400 });
    if (categoryId && sk.categoryId !== categoryId) {
      return NextResponse.json({ error: "مهارت به این دسته‌بندی تعلق ندارد" }, { status: 400 });
    }
    skillId = sk.id;
    // Make sure skill's category is set too if user only picked a skill.
    if (!categoryId) categoryId = sk.categoryId;
  }

  // Ensure profile + resume exist
  const profile = await db.profile.upsert({
    where: { userId: me.id },
    update: {},
    create: { userId: me.id },
  });
  const resume = await db.resume.upsert({
    where: { profileId: profile.id },
    update: {},
    create: { profileId: profile.id },
  });

  const exp = await db.resumeExperience.create({
    data: {
      resumeId: resume.id,
      jobTitle,
      organization,
      startDate,
      endDate,
      description,
      categoryId,
      skillId,
    },
  });

  return NextResponse.json({ ok: true, id: exp.id });
}
