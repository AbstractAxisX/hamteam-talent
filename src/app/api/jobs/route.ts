import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { JobPostWithRelations } from "@/lib/types";

// GET /api/jobs?categoryId=&skillId=&province=&city=&sort=recent|popular
export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const skillId = url.searchParams.get("skillId") || undefined;
  const province = url.searchParams.get("province") || undefined;
  const city = url.searchParams.get("city") || undefined;
  const sort = url.searchParams.get("sort") === "popular" ? "popular" : "recent";
  const user = await getCurrentUser();

  // Build where clause — only show open posts publicly
  const where: Record<string, unknown> = { status: "open" };
  if (categoryId) where.categoryId = categoryId;
  if (province) where.province = province;
  if (city) where.city = city;
  if (skillId) {
    where.skills = { some: { skillId } };
  }

  const orderBy =
    sort === "popular"
      ? { applications: { _count: "desc" as const } }
      : { createdAt: "desc" as const };

  const posts = await db.jobPost.findMany({
    where,
    orderBy,
    take: 50,
    include: {
      user: { include: { profile: true } },
      category: true,
      skills: { include: { skill: true } },
      applications: user
        ? { where: { applicantId: user.id }, select: { id: true } }
        : false,
      _count: { select: { applications: true } },
    },
  });

  const result: JobPostWithRelations[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    city: p.city,
    province: p.province,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    skills: p.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
    user: {
      id: p.user.id,
      name: p.user.name,
      isVerifiedBadge: p.user.isVerifiedBadge,
      avatarUrl: p.user.profile?.avatarUrl ?? null,
    },
    applicationCount: p._count.applications,
    appliedByMe: user ? p.applications.length > 0 : false,
  }));

  return NextResponse.json({ jobs: result });
}

// POST /api/jobs — create job post (auth required)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const categoryId = body.categoryId ? String(body.categoryId) : null;
  const province = body.province ? String(body.province) : null;
  const city = body.city ? String(body.city) : null;
  const skillsRaw = Array.isArray(body.skills) ? body.skills : [];
  const skillIds = Array.from(
    new Set(skillsRaw.map((s) => String(s)).filter(Boolean))
  ).slice(0, 10);

  if (title.length < 3)
    return NextResponse.json({ error: "عنوان حداقل ۳ نویسه باشد" }, { status: 400 });
  if (title.length > 120)
    return NextResponse.json({ error: "عنوان بیش از حد طولانی است" }, { status: 400 });
  if (description.length < 10)
    return NextResponse.json({ error: "توضیحات حداقل ۱۰ نویسه باشد" }, { status: 400 });
  if (description.length > 5000)
    return NextResponse.json({ error: "توضیحات بیش از حد طولانی است" }, { status: 400 });
  if (!categoryId)
    return NextResponse.json({ error: "دسته‌بندی را انتخاب کنید" }, { status: 400 });
  if (skillIds.length === 0)
    return NextResponse.json({ error: "حداقل یک مهارت انتخاب کنید" }, { status: 400 });

  // Validate category exists
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category)
    return NextResponse.json({ error: "دسته‌بندی نامعتبر است" }, { status: 400 });

  // Validate all skills belong to the category
  const validSkills = await db.skill.findMany({
    where: { id: { in: skillIds }, categoryId },
    select: { id: true },
  });
  if (validSkills.length !== skillIds.length) {
    return NextResponse.json(
      { error: "برخی مهارت‌ها به این دسته‌بندی تعلق ندارند" },
      { status: 400 }
    );
  }

  // Create job post + skills
  const job = await db.jobPost.create({
    data: {
      userId: user.id,
      title,
      description,
      categoryId,
      province,
      city,
      skills: { create: skillIds.map((skillId) => ({ skillId })) },
    },
  });

  // Notify users whose profile has any of the selected skills (excluding creator)
  try {
    const matchingUsers = await db.userSkill.findMany({
      where: { skillId: { in: skillIds }, userId: { not: user.id } },
      select: { userId: true },
      distinct: ["userId"],
    });
    if (matchingUsers.length > 0) {
      const link = `#/job/${job.id}`;
      await db.notification.createMany({
        data: matchingUsers.map((m) => ({
          userId: m.userId,
          type: "job_match",
          title: "نیازمندی جدید مطابق مهارت شما",
          body: title,
          link,
        })),
      });
    }
  } catch {
    // Non-critical: don't fail creation if notifications fail
  }

  return NextResponse.json({ ok: true, id: job.id });
}
