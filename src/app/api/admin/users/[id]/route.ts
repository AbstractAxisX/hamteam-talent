import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/admin/users/[id] — full user detail with counts
export async function GET(_req: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const target = await db.user.findUnique({
    where: { id },
    include: { profile: { include: { resume: { include: { experiences: true, educations: true } } } } },
  });

  if (!target) {
    return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
  }

  const [
    postCount,
    jobPostCount,
    applicationCount,
    connectionCount,
    conversationCount,
    ticketCount,
    categories,
    skills,
  ] = await Promise.all([
    db.post.count({ where: { userId: id } }),
    db.jobPost.count({ where: { userId: id } }),
    db.jobApplication.count({ where: { applicantId: id } }),
    db.connection.count({
      where: { status: "accepted", OR: [{ requesterId: id }, { receiverId: id }] },
    }),
    db.conversation.count({ where: { OR: [{ userAId: id }, { userBId: id }] } }),
    db.ticket.count({ where: { userId: id } }),
    db.userCategory.findMany({
      where: { userId: id },
      include: { category: true },
    }),
    db.userSkill.findMany({
      where: { userId: id },
      include: { skill: { include: { category: true } } },
    }),
  ]);

  const followersCount = await db.connection.count({
    where: { status: "accepted", receiverId: id },
  });
  const followingCount = await db.connection.count({
    where: { status: "accepted", requesterId: id },
  });

  return NextResponse.json({
    user: {
      id: target.id,
      name: target.name,
      phone: target.phone,
      nationalId: target.nationalId,
      role: target.role,
      isVerifiedBadge: target.isVerifiedBadge,
      isBanned: target.isBanned,
      createdAt: target.createdAt.toISOString(),
      updatedAt: target.updatedAt.toISOString(),
      profile: target.profile
        ? {
            id: target.profile.id,
            bioShort: target.profile.bioShort,
            bioLong: target.profile.bioLong,
            avatarUrl: target.profile.avatarUrl,
            bannerUrl: target.profile.bannerUrl,
            province: target.profile.province,
            city: target.profile.city,
            phoneVisible: target.profile.phoneVisible,
          }
        : null,
      counts: {
        posts: postCount,
        jobPosts: jobPostCount,
        applications: applicationCount,
        connections: connectionCount,
        conversations: conversationCount,
        tickets: ticketCount,
        followers: followersCount,
        following: followingCount,
      },
      categories: categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        iconUrl: c.category.iconUrl,
      })),
      skills: skills.map((s) => ({
        id: s.skill.id,
        name: s.skill.name,
        categoryName: s.skill.category.name,
      })),
      experiences: target.profile?.resume?.experiences ?? [],
      educations: target.profile?.resume?.educations ?? [],
    },
  });
}

// PATCH /api/admin/users/[id] — { action: "ban"|"unban"|"verify"|"unverify" }
export async function PATCH(req: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "").trim();

  const allowed = ["ban", "unban", "verify", "unverify"];
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: "action نامعتبر است" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
  }

  // Don't allow self-ban/unverify to lock yourself out
  if (id === user.id && (action === "ban" || action === "unverify")) {
    return NextResponse.json({ error: "نمی‌توانید حساب خود را مسدود یا تایید خود را لغو کنید" }, { status: 400 });
  }

  const data: { isBanned?: boolean; isVerifiedBadge?: boolean } = {};
  if (action === "ban") data.isBanned = true;
  if (action === "unban") data.isBanned = false;
  if (action === "verify") data.isVerifiedBadge = true;
  if (action === "unverify") data.isVerifiedBadge = false;

  const updated = await db.user.update({ where: { id }, data });

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      isBanned: updated.isBanned,
      isVerifiedBadge: updated.isVerifiedBadge,
    },
  });
}
