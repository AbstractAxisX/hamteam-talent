import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { ProfileDetail } from "@/lib/types";
import { PROVINCES } from "@/lib/geo";

// GET /api/profile/me — full profile of current user (for editing).
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: me.id },
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
      : ([] as { id: string; name: string }[]),
    skillIdsForExp.length
      ? db.skill.findMany({ where: { id: { in: skillIdsForExp } }, select: { id: true, name: true } })
      : ([] as { id: string; name: string }[]),
  ]);
  const catMap = new Map(expCats.map((c) => [c.id, c.name]));
  const skillMap = new Map(expSkills.map((s) => [s.id, s.name]));

  // Followers/following counts (accepted connections).
  const [followersCount, followingCount] = await Promise.all([
    db.connection.count({ where: { receiverId: user.id, status: "accepted" } }),
    db.connection.count({ where: { requesterId: user.id, status: "accepted" } }),
  ]);

  const skillIds = new Set(user.userSkills.map((s) => s.skillId));
  const categories = user.userCategories.map((uc) => ({
    id: uc.category.id,
    name: uc.category.name,
    iconUrl: uc.category.iconUrl ?? null,
    skills: uc.category.skills
      .filter((s) => skillIds.has(s.id))
      .map((s) => ({ id: s.id, name: s.name })),
  }));

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

  const educations = (user.profile?.resume?.educations ?? []).map((e) => ({
    id: e.id,
    degree: e.degree,
    institution: e.institution,
    year: e.year,
    description: e.description,
  }));

  const detail: ProfileDetail = {
    id: user.profile?.id ?? "",
    userId: user.id,
    username: user.username,
    name: user.name,
    isVerifiedBadge: user.isVerifiedBadge,
    bioShort: user.profile?.bioShort ?? "",
    bioLong: user.profile?.bioLong ?? "",
    avatarUrl: user.profile?.avatarUrl ?? null,
    bannerUrl: user.profile?.bannerUrl ?? null,
    gender: (user.profile?.gender as string | null) ?? null,
    province: user.profile?.province ?? null,
    city: user.profile?.city ?? null,
    phoneVisible: user.profile?.phoneVisible ?? false,
    phone: user.phone,
    createdAt: user.createdAt.toISOString(),
    categories,
    experiences,
    educations,
    postCount: user.posts.length,
    followersCount,
    followingCount,
    connectionStatus: "self",
    isBanned: user.isBanned,
  };

  return NextResponse.json(detail);
}

// PUT /api/profile/me — update profile fields.
export async function PUT(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const bioShort = typeof body.bioShort === "string" ? body.bioShort.slice(0, 200) : undefined;
  const bioLong = typeof body.bioLong === "string" ? body.bioLong.slice(0, 4000) : undefined;
  const avatarUrl =
    typeof body.avatarUrl === "string" ? body.avatarUrl.trim().slice(0, 1024) || null : undefined;
  const bannerUrl =
    typeof body.bannerUrl === "string"
      ? body.bannerUrl.trim().slice(0, 1024) || null
      : undefined;
  const phoneVisible =
    typeof body.phoneVisible === "boolean" ? body.phoneVisible : undefined;

  // Gender: "male" | "female" | null
  let gender: string | null | undefined = undefined;
  if (body.gender === null || body.gender === "") gender = null;
  else if (body.gender === "male" || body.gender === "female") gender = body.gender;

  // Province: validate against known IDs (or null to clear)
  let province: string | null | undefined = undefined;
  if (body.province === null || body.province === "") province = null;
  else if (typeof body.province === "string") {
    if (!PROVINCES.some((p) => p.id === body.province)) {
      return NextResponse.json({ error: "استان نامعتبر است" }, { status: 400 });
    }
    province = body.province;
  }

  let city: string | null | undefined = undefined;
  if (body.city === null || body.city === "") city = null;
  else if (typeof body.city === "string") city = String(body.city).slice(0, 100);

  // Ensure profile row exists
  const existing = await db.profile.findUnique({ where: { userId: me.id } });
  if (!existing) {
    await db.profile.create({
      data: {
        userId: me.id,
        bioShort: bioShort ?? "",
        bioLong: bioLong ?? "",
        avatarUrl: avatarUrl ?? null,
        bannerUrl: bannerUrl ?? null,
        province: province ?? null,
        city: city ?? null,
        phoneVisible: phoneVisible ?? false,
      },
    });
  } else {
    const patch: Record<string, unknown> = {};
    if (bioShort !== undefined) patch.bioShort = bioShort;
    if (bioLong !== undefined) patch.bioLong = bioLong;
    if (avatarUrl !== undefined) patch.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) patch.bannerUrl = bannerUrl;
    if (province !== undefined) patch.province = province;
    if (city !== undefined) patch.city = city;
    if (phoneVisible !== undefined) patch.phoneVisible = phoneVisible;
    if (gender !== undefined) patch.gender = gender;
    if (body.mainCategoryId !== undefined) {
      // Validate: the category must be in user's selected categories (or null to clear)
      const catId = body.mainCategoryId ? String(body.mainCategoryId) : null;
      if (catId) {
        const hasCat = await db.userCategory.findUnique({
          where: { userId_categoryId: { userId: me.id, categoryId: catId } },
        });
        if (!hasCat) return NextResponse.json({ error: "این دسته‌بندی در پروفایل شما ثبت نشده" }, { status: 400 });
      }
      patch.mainCategoryId = catId;
    }
    if (Object.keys(patch).length > 0) {
      await db.profile.update({ where: { userId: me.id }, data: patch });
    }
  }

  return NextResponse.json({ ok: true });
}
