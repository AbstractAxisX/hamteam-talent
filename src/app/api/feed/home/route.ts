import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { PostWithRelations, TalentListItem } from "@/lib/types";

// GET /api/feed/home — home page with 3 sections:
// 1. Posts from followed users
// 2. Newest relevant talents (based on user's skills)
// 3. People with same skills
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  // 1. Posts from followed users
  const following = await db.connection.findMany({
    where: { requesterId: me.id, status: "accepted" },
    select: { receiverId: true },
  });
  const followingIds = following.map((f) => f.receiverId);

  let followedPosts: PostWithRelations[] = [];
  if (followingIds.length > 0) {
    const posts = await db.post.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { include: { profile: true } },
        category: true,
        skill: true,
        likes: { where: { userId: me.id }, select: { id: true } },
        _count: { select: { likes: true } },
        media: true,
      },
    });
    followedPosts = posts.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt.toISOString(),
      categoryId: p.categoryId,
      skillId: p.skillId,
      categoryName: p.category?.name ?? null,
      skillName: p.skill?.name ?? null,
      user: {
        id: p.user.id,
        name: p.user.name,
        isVerifiedBadge: p.user.isVerifiedBadge,
        avatarUrl: p.user.profile?.avatarUrl ?? null,
      },
      likeCount: p._count.likes,
      likedByMe: p.likes.length > 0,
      media: p.media.map((m) => ({ id: m.id, url: m.url, type: m.type })),
    }));
  }

  // 2 & 3. Get user's skills to find relevant talents
  const mySkills = await db.userSkill.findMany({
    where: { userId: me.id },
    select: { skillId: true },
  });
  const mySkillIds = mySkills.map((s) => s.skillId);

  let relevantTalents: TalentListItem[] = [];
  let sameSkillPeople: TalentListItem[] = [];

  if (mySkillIds.length > 0) {
    // Find users who share at least one skill (excluding self + already followed)
    const excludeIds = [...followingIds, me.id];
    const usersWithSameSkill = await db.user.findMany({
      where: {
        isBanned: false,
        id: { notIn: excludeIds },
        userSkills: { some: { skillId: { in: mySkillIds } } },
      },
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
        userCategories: { include: { category: true } },
        connectionsRec: { where: { status: "accepted" }, select: { id: true } },
      },
    });

    const mapToTalent = (u: typeof usersWithSameSkill[number]): TalentListItem => ({
      id: u.id,
      name: u.name,
      isVerifiedBadge: u.isVerifiedBadge,
      bioShort: u.profile?.bioShort || "",
      avatarUrl: u.profile?.avatarUrl ?? null,
      gender: (u.profile?.gender as string | null) ?? null,
      province: u.profile?.province ?? null,
      city: u.profile?.city ?? null,
      categories: u.userCategories.map((uc) => ({
        id: uc.category.id,
        name: uc.category.name,
        iconUrl: uc.category.iconUrl,
      })),
      followersCount: u.connectionsRec.length,
    });

    sameSkillPeople = usersWithSameSkill.map(mapToTalent);

    // Relevant newest talents — sort by followers
    relevantTalents = [...usersWithSameSkill]
      .sort((a, b) => b.connectionsRec.length - a.connectionsRec.length)
      .slice(0, 6)
      .map(mapToTalent);
  } else {
    // No skills set — show recent talents
    const recent = await db.user.findMany({
      where: { isBanned: false, id: { not: me.id } },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
        userCategories: { include: { category: true } },
        connectionsRec: { where: { status: "accepted" }, select: { id: true } },
      },
    });
    relevantTalents = recent.map((u) => ({
      id: u.id,
      name: u.name,
      isVerifiedBadge: u.isVerifiedBadge,
      bioShort: u.profile?.bioShort || "",
      avatarUrl: u.profile?.avatarUrl ?? null,
      gender: (u.profile?.gender as string | null) ?? null,
      province: u.profile?.province ?? null,
      city: u.profile?.city ?? null,
      categories: u.userCategories.map((uc) => ({
        id: uc.category.id,
        name: uc.category.name,
        iconUrl: uc.category.iconUrl,
      })),
      followersCount: u.connectionsRec.length,
    }));
  }

  return NextResponse.json({
    followedPosts,
    relevantTalents,
    sameSkillPeople,
    followingCount: followingIds.length,
  });
}
