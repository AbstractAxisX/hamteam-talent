import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// GET /api/admin/jobs — list all job posts (open + closed) with owner info + app counts
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const jobs = await db.jobPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { include: { profile: true } },
      category: true,
      skills: { include: { skill: true } },
      _count: { select: { applications: true } },
    },
    take: 200,
  });

  const result = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description,
    status: j.status,
    province: j.province,
    city: j.city,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    applicationCount: j._count.applications,
    category: j.category ? { id: j.category.id, name: j.category.name } : null,
    skills: j.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
    user: {
      id: j.user.id,
      name: j.user.name,
      phone: j.user.phone,
      isVerifiedBadge: j.user.isVerifiedBadge,
      avatarUrl: j.user.profile?.avatarUrl ?? null,
    },
  }));

  return NextResponse.json({ jobs: result });
}
