import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { ProfileDetail } from "@/lib/types";

// GET /api/profile/[id] — public profile detail. Use "me" for current user.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const me = await getCurrentUser();

  // Resolve target user id
  let targetId: string;
  if (rawId === "me") {
    if (!me) {
      return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
    }
    targetId = me.id;
  } else {
    targetId = rawId;
  }

  const user = await db.user.findUnique({
    where: { id: targetId },
    include: {
      profile: {
        include: {
          resume: {
            include: {
              experiences: { orderBy: { createdAt: "desc" } },
              educations: { orderBy: { createdAt: "desc" } },
            },
          },
        },
      },
      userCategories: { include: { category: { include: { skills: { orderBy: { name: "asc" } } } } } },
      userSkills: { select: { skillId: true } },
      posts: { select: { id: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "کاربر پیدا نشد" }, { status: 404 });
  }

  // Resolve experience category/skill names manually (no Prisma relation declared).
  const expList = user.profile?.resume?.experiences ?? [];
  const catIds = Array.from(
    new Set(expList.map((e) => e.categoryId).filter(Boolean) as string[])
  );
  const skillIdsForExp = Array.from(
    new Set(expList.map((e) => e.skillId).filter(Boolean) as string[])
  );
  const [expCats, expSkills] = await Promise.all([
    catIds.length
      ? db.category.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } })
      : [],
    skillIdsForExp.length
      ? db.skill.findMany({ where: { id: { in: skillIdsForExp } }, select: { id: true, name: true } })
      : [],
  ]);
  const catMap = new Map(expCats.map((c) => [c.id, c.name]));
  const skillMap = new Map(expSkills.map((s) => [s.id, s.name]));

  // Compute connection status
  let connectionStatus: ProfileDetail["connectionStatus"] = "none";
  let followersCount = 0;
  let followingCount = 0;

  if (me && me.id === user.id) {
    connectionStatus = "self";
  } else {
    // followers = accepted connections where this user is receiver
    // following = accepted connections where this user is requester
    const [followersAgg, followingAgg] = await Promise.all([
      db.connection.count({
        where: { receiverId: user.id, status: "accepted" },
      }),
      db.connection.count({
        where: { requesterId: user.id, status: "accepted" },
      }),
    ]);
    followersCount = followersAgg;
    followingCount = followingAgg;

    if (me) {
      // Check existing connection (either direction)
      const sent = await db.connection.findUnique({
        where: {
          requesterId_receiverId: { requesterId: me.id, receiverId: user.id },
        },
      });
      const received = await db.connection.findUnique({
        where: {
          requesterId_receiverId: { requesterId: user.id, receiverId: me.id },
        },
      });
      if (sent) {
        connectionStatus =
          sent.status === "accepted"
            ? "accepted"
            : sent.status === "rejected"
            ? "none"
            : "pending-sent";
      } else if (received) {
        connectionStatus =
          received.status === "accepted"
            ? "accepted"
            : received.status === "rejected"
            ? "none"
            : "pending-received";
      }
    }
  }

  // Build categories with skills
  const skillIds = new Set(user.userSkills.map((s) => s.skillId));
  const categories = user.userCategories.map((uc) => ({
    id: uc.category.id,
    name: uc.category.name,
    skills: uc.category.skills
      .filter((s) => skillIds.has(s.id))
      .map((s) => ({ id: s.id, name: s.name })),
  }));

  // Experiences
  const experiences = expList.map((e) => ({
    id: e.id,
    jobTitle: e.jobTitle,
    organization: e.organization,
    startDate: e.startDate,
    endDate: e.endDate,
    description: e.description,
    categoryName: e.categoryId ? catMap.get(e.categoryId) ?? null : null,
    skillName: e.skillId ? skillMap.get(e.skillId) ?? null : null,
  }));

  // Educations
  const educations = (user.profile?.resume?.educations ?? []).map((e) => ({
    id: e.id,
    degree: e.degree,
    institution: e.institution,
    year: e.year,
    description: e.description,
  }));

  // Phone visibility: anyone can see if phoneVisible, otherwise only self.
  const isSelf = me?.id === user.id;
  const phone =
    user.profile?.phoneVisible || isSelf ? user.phone : null;

  const detail: ProfileDetail = {
    id: user.profile?.id ?? "",
    userId: user.id,
    name: user.name,
    isVerifiedBadge: user.isVerifiedBadge,
    role: user.role,
    bioShort: user.profile?.bioShort ?? "",
    bioLong: user.profile?.bioLong ?? "",
    avatarUrl: user.profile?.avatarUrl ?? null,
    bannerUrl: user.profile?.bannerUrl ?? null,
    gender: (user.profile?.gender as string | null) ?? null,
    province: user.profile?.province ?? null,
    city: user.profile?.city ?? null,
    phoneVisible: user.profile?.phoneVisible ?? false,
    phone,
    createdAt: user.createdAt.toISOString(),
    categories,
    experiences,
    educations,
    postCount: user.posts.length,
    followersCount,
    followingCount,
    connectionStatus,
    isBanned: user.isBanned,
  };

  return NextResponse.json(detail);
}
