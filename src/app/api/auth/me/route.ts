import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userStarInfo } from "@/lib/stars";
import type { SafeUser } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  const si = await userStarInfo(user.id);
  const safe: SafeUser = {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: "user",
    isVerifiedBadge: user.isVerifiedBadge,
    isBanned: user.isBanned,
    isTopTalent: si.isTopTalent,
    frame: si.frame,
    totalStars: si.totalStars,
    isScout: user.isScout,
    scoutStatus: user.scoutStatus,
    isAdminElite: user.isAdminElite,
    createdAt: user.createdAt.toISOString(),
    profile: user.profile
      ? {
          id: user.profile.id,
          bioShort: user.profile.bioShort,
          bioLong: user.profile.bioLong,
          avatarUrl: user.profile.avatarUrl,
          bannerUrl: user.profile.bannerUrl,
          gender: (user.profile.gender as string | null) ?? null,
          province: user.profile.province,
          city: user.profile.city,
          phoneVisible: user.profile.phoneVisible,
        }
      : null,
  };
  return NextResponse.json({ user: safe });
}
