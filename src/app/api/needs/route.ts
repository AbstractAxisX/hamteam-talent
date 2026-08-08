import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { NeedListItem } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// GET /api/needs — list open needs with filters
//   ?categoryId=  ?skillId=  ?province=  ?city=  ?sort=recent|popular
//   Take 50, only status="open", include owner info, skills, applicationCount, appliedByMe
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const skillId = url.searchParams.get("skillId") || undefined;
  const province = url.searchParams.get("province") || undefined;
  const city = url.searchParams.get("city") || undefined;
  const sort = url.searchParams.get("sort") === "popular" ? "popular" : "recent";

  const me = await getCurrentUser();

  const where: {
    status: string;
    categoryId?: string;
    province?: string;
    city?: string;
    skills?: { some: { skillId: string } };
  } = { status: "open" };
  if (categoryId) where.categoryId = categoryId;
  if (province) where.province = province;
  if (city) where.city = city;
  if (skillId) where.skills = { some: { skillId } };

  const needs = await db.jobPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      user: { include: { profile: true } },
      category: true,
      skills: { include: { skill: true } },
      applications: me
        ? { where: { applicantId: me.id }, select: { id: true } }
        : false,
    },
  });

  let list: NeedListItem[] = needs.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    categoryName: n.category?.name ?? null,
    province: n.province ?? null,
    city: n.city ?? null,
    status: n.status,
    createdAt: n.createdAt.toISOString(),
    skills: n.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
    applicationCount: 0, // filled below
    appliedByMe: me ? n.applications.length > 0 : false,
    user: {
      id: n.user.id,
      name: n.user.name,
      isVerifiedBadge: n.user.isVerifiedBadge,
      avatarUrl: n.user.profile?.avatarUrl ?? null,
    },
  }));

  // Get application counts in a single batched query
  const counts = await db.jobApplication.groupBy({
    by: ["jobPostId"],
    where: { jobPostId: { in: list.map((n) => n.id) } },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.jobPostId, c._count._all]));
  list = list.map((n) => ({
    ...n,
    applicationCount: countMap.get(n.id) ?? 0,
  }));

  // Sort: popular = by applicationCount desc
  if (sort === "popular") {
    list.sort((a, b) => b.applicationCount - a.applicationCount);
  }

  return NextResponse.json({ needs: list });
}

// ─────────────────────────────────────────────────────────────
// POST /api/needs — create a new Need (auth required)
//   Body: { title, description, categoryId, skills: string[], province?, city?, attachments?: {url,fileName,fileSize}[] }
//   Validates skills belong to category. Creates JobPost + JobPostSkill + JobPostAttachment.
//   Then notifies all users (except creator) who have ANY of the selected skills in UserSkill.
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const categoryId = String(body.categoryId || "").trim() || null;
  const skillsRaw: unknown[] = Array.isArray(body.skills) ? body.skills : [];
  const skills = Array.from(
    new Set(skillsRaw.map((s) => String(s)).filter(Boolean))
  ).slice(0, 10);
  const province = String(body.province || "").trim() || null;
  const city = String(body.city || "").trim() || null;
  const attachmentsRaw: unknown[] = Array.isArray(body.attachments)
    ? body.attachments
    : [];

  if (title.length < 3) {
    return NextResponse.json(
      { error: "عنوان باید حداقل ۳ نویسه باشد" },
      { status: 400 }
    );
  }
  if (title.length > 120) {
    return NextResponse.json(
      { error: "عنوان نباید بیش از ۱۲۰ نویسه باشد" },
      { status: 400 }
    );
  }
  if (description.length < 10) {
    return NextResponse.json(
      { error: "توضیحات باید حداقل ۱۰ نویسه باشد" },
      { status: 400 }
    );
  }
  if (description.length > 5000) {
    return NextResponse.json(
      { error: "توضیحات نباید بیش از ۵۰۰۰ نویسه باشد" },
      { status: 400 }
    );
  }
  if (!categoryId) {
    return NextResponse.json(
      { error: "دسته‌بندی را انتخاب کنید" },
      { status: 400 }
    );
  }
  if (skills.length === 0) {
    return NextResponse.json(
      { error: "حداقل یک مهارت انتخاب کنید" },
      { status: 400 }
    );
  }

  // Validate category exists
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json(
      { error: "دسته‌بندی نامعتبر است" },
      { status: 400 }
    );
  }

  // Validate all skills belong to this category
  const validSkills = await db.skill.findMany({
    where: { id: { in: skills }, categoryId },
    select: { id: true },
  });
  if (validSkills.length !== skills.length) {
    return NextResponse.json(
      { error: "یکی از مهارت‌ها به این دسته‌بندی تعلق ندارد" },
      { status: 400 }
    );
  }

  // Build attachments list (validate shape)
  const attachments = attachmentsRaw
    .map((a) => {
      if (!a || typeof a !== "object") return null;
      const obj = a as Record<string, unknown>;
      const url = String(obj.url || "").trim();
      const fileName = String(obj.fileName || "").trim();
      const fileSize = Number(obj.fileSize || 0);
      if (!url) return null;
      return { url, fileName: fileName || "فایل", fileSize: Number.isFinite(fileSize) ? fileSize : 0 };
    })
    .filter((a): a is { url: string; fileName: string; fileSize: number } => a !== null)
    .slice(0, 8);

  // Create JobPost + skills + attachments in one transaction
  const need = await db.jobPost.create({
    data: {
      userId: me.id,
      title,
      description,
      categoryId,
      province,
      city,
      status: "open",
      skills: {
        create: skills.map((skillId) => ({ skillId })),
      },
      attachments:
        attachments.length > 0
          ? { create: attachments }
          : undefined,
    },
    include: {
      category: true,
      skills: { include: { skill: true } },
      attachments: true,
    },
  });

  // Notify all users (except creator) who have ANY of the selected skills
  // via UserSkill. Use distinct to avoid duplicates per user.
  const matchingUserSkills = await db.userSkill.findMany({
    where: { skillId: { in: skills }, userId: { not: me.id } },
    select: { userId: true },
    distinct: ["userId"],
  });

  if (matchingUserSkills.length > 0) {
    const link = `#/need/${need.id}`;
    const notifTitle = "نیازمندی جدید مطابق مهارت شما";
    const notifBody = title;
    await db.notification.createMany({
      data: matchingUserSkills.map((us) => ({
        userId: us.userId,
        type: "job_match",
        title: notifTitle,
        body: notifBody,
        link,
        data: JSON.stringify({ needId: need.id }),
      })),
    });
  }

  return NextResponse.json({
    ok: true,
    id: need.id,
    need: {
      id: need.id,
      title: need.title,
      description: need.description,
      categoryName: need.category?.name ?? null,
      province: need.province ?? null,
      city: need.city ?? null,
      status: need.status,
      createdAt: need.createdAt.toISOString(),
      skills: need.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
      attachments: need.attachments.map((a) => ({
        id: a.id,
        url: a.url,
        fileName: a.fileName,
        fileSize: a.fileSize,
      })),
      applicationCount: 0,
      appliedByMe: false,
      user: {
        id: me.id,
        name: me.name,
        isVerifiedBadge: me.isVerifiedBadge,
        avatarUrl: me.profile?.avatarUrl ?? null,
      },
    },
  });
}
