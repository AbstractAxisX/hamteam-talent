import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { SafeUser } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  const safe: SafeUser = {
    id: user.id,
    phone: user.phone,
    username: user.username,
    name: user.name,
    role: "user",
    isVerifiedBadge: user.isVerifiedBadge,
    isBanned: user.isBanned,
    isTopTalent: user.isTopTalent,
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
