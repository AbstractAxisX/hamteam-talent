import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { MyNeedsData, NeedListItem } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// GET /api/needs/my-needs — current user's posted needs + applied applications
//   Returns: { posted: NeedListItem[], applied: { id, message, createdAt, need: NeedListItem }[] }
// ─────────────────────────────────────────────────────────────
export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  // Posted needs: include applications so we can count them
  const postedRows = await db.jobPost.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { include: { profile: true } },
      category: true,
      skills: { include: { skill: true } },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          applicant: { include: { profile: true } },
        },
      },
    },
  });

  const posted: NeedListItem[] = postedRows.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    categoryName: n.category?.name ?? null,
    province: n.province ?? null,
    city: n.city ?? null,
    status: n.status,
    createdAt: n.createdAt.toISOString(),
    skills: n.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
    applicationCount: n.applications.length,
    appliedByMe: false, // owner can't apply to own need
    user: {
      id: n.user.id,
      name: n.user.name,
      isVerifiedBadge: n.user.isVerifiedBadge,
      avatarUrl: n.user.profile?.avatarUrl ?? null,
    },
  }));

  // Applied applications: include the parent JobPost + its owner info
  const appliedRows = await db.jobApplication.findMany({
    where: { applicantId: me.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      jobPost: {
        include: {
          user: { include: { profile: true } },
          category: true,
          skills: { include: { skill: true } },
          applications: {
            where: { applicantId: me.id },
            select: { id: true },
          },
        },
      },
    },
  });

  const applied = appliedRows.map((a) => {
    const need = a.jobPost;
    const needItem: NeedListItem = {
      id: need.id,
      title: need.title,
      description: need.description,
      categoryName: need.category?.name ?? null,
      province: need.province ?? null,
      city: need.city ?? null,
      status: need.status,
      createdAt: need.createdAt.toISOString(),
      skills: need.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
      applicationCount: 0, // not relevant for applied list
      appliedByMe: true,
      user: {
        id: need.user.id,
        name: need.user.name,
        isVerifiedBadge: need.user.isVerifiedBadge,
        avatarUrl: need.user.profile?.avatarUrl ?? null,
      },
    };
    return {
      id: a.id,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
      need: needItem,
    };
  });

  const result: MyNeedsData = { posted, applied };
  return NextResponse.json(result);
}
