import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type MyPostedJob = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  applicationCount: number;
  categoryName: string | null;
  city: string | null;
  province: string | null;
  applications: {
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

export type MyAppliedJob = {
  id: string; // application id
  message: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    status: string;
    city: string | null;
    province: string | null;
    createdAt: string;
    categoryName: string | null;
    user: {
      id: string;
      name: string;
      isVerifiedBadge: boolean;
      avatarUrl: string | null;
    };
  };
};

// GET /api/jobs/my-jobs — current user's posted and applied jobs
export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  // Posted jobs with applications list
  const postedPosts = await db.jobPost.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          applicant: { include: { profile: true } },
        },
      },
      _count: { select: { applications: true } },
    },
  });

  const posted: MyPostedJob[] = postedPosts.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    applicationCount: p._count.applications,
    categoryName: p.category?.name ?? null,
    city: p.city,
    province: p.province,
    applications: p.applications.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
      applicant: {
        id: a.applicant.id,
        name: a.applicant.name,
        isVerifiedBadge: a.applicant.isVerifiedBadge,
        avatarUrl: a.applicant.profile?.avatarUrl ?? null,
      },
    })),
  }));

  // Applied jobs
  const applications = await db.jobApplication.findMany({
    where: { applicantId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      jobPost: {
        include: {
          category: true,
          user: { include: { profile: true } },
        },
      },
    },
  });

  const applied: MyAppliedJob[] = applications.map((a) => ({
    id: a.id,
    message: a.message,
    createdAt: a.createdAt.toISOString(),
    job: {
      id: a.jobPost.id,
      title: a.jobPost.title,
      status: a.jobPost.status,
      city: a.jobPost.city,
      province: a.jobPost.province,
      createdAt: a.jobPost.createdAt.toISOString(),
      categoryName: a.jobPost.category?.name ?? null,
      user: {
        id: a.jobPost.user.id,
        name: a.jobPost.user.name,
        isVerifiedBadge: a.jobPost.user.isVerifiedBadge,
        avatarUrl: a.jobPost.user.profile?.avatarUrl ?? null,
      },
    },
  }));

  return NextResponse.json({ posted, applied });
}
