import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/jobs — list all job posts (including closed) with owner info
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const jobs = await db.jobPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { include: { profile: true } },
      category: true,
      _count: { select: { applications: true } },
    },
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
    categoryName: j.category?.name ?? null,
    applicationCount: j._count.applications,
    user: {
      id: j.user.id,
      name: j.user.name,
      phone: j.user.phone,
      role: j.user.role,
      isVerifiedBadge: j.user.isVerifiedBadge,
      isBanned: j.user.isBanned,
      avatarUrl: j.user.profile?.avatarUrl ?? null,
    },
  }));

  return NextResponse.json({ jobs: result });
}
