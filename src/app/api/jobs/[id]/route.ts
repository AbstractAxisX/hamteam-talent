import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { JobPostWithRelations } from "@/lib/types";

export type JobDetailResponse = JobPostWithRelations & {
  applications?: {
    id: string;
    message: string;
    createdAt: string;
    applicant: {
      id: string;
      name: string;
      isVerifiedBadge: boolean;
      avatarUrl: string | null;
    };
  }[];
};

// GET /api/jobs/[id] — single job detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const post = await db.jobPost.findUnique({
    where: { id },
    include: {
      user: { include: { profile: true } },
      category: true,
      skills: { include: { skill: true } },
      applications: user
        ? {
            where: { applicantId: user.id },
            select: { id: true },
          }
        : false,
      _count: { select: { applications: true } },
    },
  });

  if (!post)
    return NextResponse.json({ error: "نیازمندی پیدا نشد" }, { status: 404 });

  const isOwner = user?.id === post.userId;

  // If owner, fetch applications list separately (with applicant info)
  let ownerApplications: {
    id: string;
    message: string;
    createdAt: string;
    applicant: {
      id: string;
      name: string;
      isVerifiedBadge: boolean;
      avatarUrl: string | null;
    };
  }[] = [];
  if (isOwner) {
    const apps = await db.jobApplication.findMany({
      where: { jobPostId: id },
      orderBy: { createdAt: "desc" },
      include: {
        applicant: { include: { profile: true } },
      },
    });
    ownerApplications = apps.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
      applicant: {
        id: a.applicant.id,
        name: a.applicant.name,
        isVerifiedBadge: a.applicant.isVerifiedBadge,
        avatarUrl: a.applicant.profile?.avatarUrl ?? null,
      },
    }));
  }

  const result: JobDetailResponse = {
    id: post.id,
    title: post.title,
    description: post.description,
    city: post.city,
    province: post.province,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    categoryId: post.categoryId,
    categoryName: post.category?.name ?? null,
    skills: post.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
    user: {
      id: post.user.id,
      name: post.user.name,
      isVerifiedBadge: post.user.isVerifiedBadge,
      avatarUrl: post.user.profile?.avatarUrl ?? null,
    },
    applicationCount: post._count.applications,
    appliedByMe: user ? post.applications.length > 0 : false,
    ...(isOwner ? { applications: ownerApplications } : {}),
  };

  return NextResponse.json({ job: result });
}

// PUT /api/jobs/[id] — update / close (only owner)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const post = await db.jobPost.findUnique({ where: { id } });
  if (!post)
    return NextResponse.json({ error: "نیازمندی پیدا نشد" }, { status: 404 });

  if (post.userId !== user.id) {
    return NextResponse.json({ error: "اجازه ویرایش ندارید" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  // Closing / reopening status
  if (typeof body.status === "string") {
    if (body.status !== "open" && body.status !== "closed") {
      return NextResponse.json({ error: "وضعیت نامعتبر است" }, { status: 400 });
    }
    const updated = await db.jobPost.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  // Update title/description/province/city
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t.length < 3)
      return NextResponse.json({ error: "عنوان حداقل ۳ نویسه باشد" }, { status: 400 });
    if (t.length > 120)
      return NextResponse.json({ error: "عنوان بیش از حد طولانی است" }, { status: 400 });
    data.title = t;
  }
  if (typeof body.description === "string") {
    const d = body.description.trim();
    if (d.length < 10)
      return NextResponse.json({ error: "توضیحات حداقل ۱۰ نویسه باشد" }, { status: 400 });
    if (d.length > 5000)
      return NextResponse.json({ error: "توضیحات بیش از حد طولانی است" }, { status: 400 });
    data.description = d;
  }
  if (body.province !== undefined) data.province = body.province ? String(body.province) : null;
  if (body.city !== undefined) data.city = body.city ? String(body.city) : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "چیزی برای به‌روزرسانی نیست" }, { status: 400 });
  }

  await db.jobPost.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE /api/jobs/[id] — only owner or admin
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const post = await db.jobPost.findUnique({ where: { id } });
  if (!post)
    return NextResponse.json({ error: "نیازمندی پیدا نشد" }, { status: 404 });

  if (post.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "اجازه حذف ندارید" }, { status: 403 });
  }

  await db.jobPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
