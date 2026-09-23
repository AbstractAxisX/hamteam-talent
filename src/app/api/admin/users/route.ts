import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersStarInfo } from "@/lib/stars";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const users = await db.user.findMany({
    where,
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { profile: true },
  });

  const starInfo = await usersStarInfo(users.map((u) => u.id));

  return NextResponse.json({
    users: users.map((u) => {
      const si = starInfo.get(u.id)!;
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        isVerifiedBadge: u.isVerifiedBadge,
        isBanned: u.isBanned,
        isTopTalent: si.isTopTalent,
        frame: si.frame,
        totalStars: si.totalStars,
        votes: si.votes,
        isAdminElite: u.isAdminElite,
        isScout: u.isScout,
        scoutStatus: u.scoutStatus,
        avatarUrl: u.profile?.avatarUrl ?? null,
        createdAt: u.createdAt.toISOString(),
      };
    }),
  });
}
