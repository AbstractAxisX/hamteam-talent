import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { NeedDetail, NeedListItem } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// GET /api/needs/[id] — single need detail
//   - Full description, skills, owner info, attachments, applicationCount, appliedByMe
//   - If requester is owner: include applications list (applicant info + message + time)
// ─────────────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await getCurrentUser();

  const need = await db.jobPost.findUnique({
    where: { id },
    include: {
      user: { include: { profile: true } },
      category: true,
      skills: { include: { skill: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          applicant: { include: { profile: true } },
        },
      },
    },
  });

  if (!need) {
    return NextResponse.json(
      { error: "نیازمندی یافت نشد" },
      { status: 404 }
    );
  }

  const isOwner = me ? me.id === need.userId : false;
  const myApplication = me
    ? need.applications.find((a) => a.applicantId === me.id)
    : undefined;

  // For non-owners, do not expose applications list
  const applications = isOwner
    ? need.applications.map((a) => ({
        id: a.id,
        message: a.message,
        createdAt: a.createdAt.toISOString(),
        applicant: {
          id: a.applicant.id,
          name: a.applicant.name,
          isVerifiedBadge: a.applicant.isVerifiedBadge,
          avatarUrl: a.applicant.profile?.avatarUrl ?? null,
          bioShort: a.applicant.profile?.bioShort ?? null,
        },
      }))
    : [];

  const detail: NeedDetail = {
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
    applicationCount: need.applications.length,
    appliedByMe: Boolean(myApplication),
    user: {
      id: need.user.id,
      name: need.user.name,
      isVerifiedBadge: need.user.isVerifiedBadge,
      avatarUrl: need.user.profile?.avatarUrl ?? null,
    },
    // NeedDetail extends NeedListItem; description is already present
    applications,
  };

  return NextResponse.json({ need: detail });
}

// ─────────────────────────────────────────────────────────────
// PUT /api/needs/[id] — update (owner only)
//   Body: { title?, description?, categoryId?, skills?, province?, city?, status? }
//   status can be "open" | "closed" (used to close/reopen)
// ─────────────────────────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const need = await db.jobPost.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!need) {
    return NextResponse.json(
      { error: "نیازمندی یافت نشد" },
      { status: 404 }
    );
  }
  if (need.userId !== me.id) {
    return NextResponse.json(
      { error: "فقط سازنده می‌تواند ویرایش کند" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));

  // Build update data — only fields actually present
  const data: {
    title?: string;
    description?: string;
    categoryId?: string | null;
    province?: string | null;
    city?: string | null;
    status?: string;
  } = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t.length < 3 || t.length > 120) {
      return NextResponse.json(
        { error: "عنوان باید ۳ تا ۱۲۰ نویسه باشد" },
        { status: 400 }
      );
    }
    data.title = t;
  }
  if (typeof body.description === "string") {
    const d = body.description.trim();
    if (d.length < 10 || d.length > 5000) {
      return NextResponse.json(
        { error: "توضیحات باید ۱۰ تا ۵۰۰۰ نویسه باشد" },
        { status: 400 }
      );
    }
    data.description = d;
  }
  if (typeof body.province === "string") {
    data.province = body.province.trim() || null;
  }
  if (typeof body.city === "string") {
    data.city = body.city.trim() || null;
  }
  if (
    typeof body.status === "string" &&
    (body.status === "open" || body.status === "closed")
  ) {
    data.status = body.status;
  }

  // Handle category + skills change as a unit
  if (typeof body.categoryId === "string") {
    const newCategoryId = body.categoryId.trim();
    if (!newCategoryId) {
      return NextResponse.json(
        { error: "دسته‌بندی الزامی است" },
        { status: 400 }
      );
    }
    const cat = await db.category.findUnique({ where: { id: newCategoryId } });
    if (!cat) {
      return NextResponse.json(
        { error: "دسته‌بندی نامعتبر است" },
        { status: 400 }
      );
    }
    data.categoryId = newCategoryId;

    // If skills provided, validate and replace
    if (Array.isArray(body.skills)) {
      const newSkills = Array.from(
        new Set(body.skills.map((s: unknown) => String(s)).filter(Boolean))
      ).slice(0, 10);
      if (newSkills.length === 0) {
        return NextResponse.json(
          { error: "حداقل یک مهارت انتخاب کنید" },
          { status: 400 }
        );
      }
      const newSkillIds = newSkills.map((s: unknown) => String(s));
      const validSkills = await db.skill.findMany({
        where: { id: { in: newSkillIds }, categoryId: newCategoryId },
        select: { id: true },
      });
      if (validSkills.length !== newSkillIds.length) {
        return NextResponse.json(
          { error: "یکی از مهارت‌ها به این دسته‌بندی تعلق ندارد" },
          { status: 400 }
        );
      }
      // Replace: delete old, create new
      await db.jobPostSkill.deleteMany({ where: { jobPostId: id } });
      await db.jobPostSkill.createMany({
        data: newSkillIds.map((skillId) => ({ jobPostId: id, skillId: String(skillId) })),
      });
    }
  }

  const updated = await db.jobPost.update({
    where: { id },
    data,
    include: {
      user: { include: { profile: true } },
      category: true,
      skills: { include: { skill: true } },
      attachments: true,
    },
  });

  const response: NeedListItem = {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    categoryName: updated.category?.name ?? null,
    province: updated.province ?? null,
    city: updated.city ?? null,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    skills: updated.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
    applicationCount: 0,
    appliedByMe: false,
    user: {
      id: updated.user.id,
      name: updated.user.name,
      isVerifiedBadge: updated.user.isVerifiedBadge,
      avatarUrl: updated.user.profile?.avatarUrl ?? null,
    },
  };

  // Add the count
  const count = await db.jobApplication.count({
    where: { jobPostId: id },
  });
  response.applicationCount = count;

  return NextResponse.json({ ok: true, need: response });
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/needs/[id] — owner or admin
// ─────────────────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const need = await db.jobPost.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!need) {
    return NextResponse.json(
      { error: "نیازمندی یافت نشد" },
      { status: 404 }
    );
  }
  if (need.userId !== me.id) {
    return NextResponse.json(
      { error: "فقط سازنده می‌تواند حذف کند" },
      { status: 403 }
    );
  }

  await db.jobPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
