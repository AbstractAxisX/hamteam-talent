import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export type AdminUserItem = {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  role: string;
  isVerifiedBadge: boolean;
  isBanned: boolean;
  createdAt: string;
  city: string | null;
  province: string | null;
  bioShort: string;
  avatarUrl: string | null;
};

// GET /api/admin/users?q=&city=&categoryId=&banned=&verified=&page=&limit=
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || undefined;
  const city = url.searchParams.get("city")?.trim() || undefined;
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const bannedParam = url.searchParams.get("banned");
  const verifiedParam = url.searchParams.get("verified");
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "20")));

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { nationalId: { contains: q } },
    ];
  }
  if (city) {
    where.profile = { ...(where.profile as Prisma.ProfileWhereInput), city };
  }
  if (categoryId) {
    where.userCategories = { some: { categoryId } };
  }
  if (bannedParam === "true") where.isBanned = true;
  if (bannedParam === "false") where.isBanned = false;
  if (verifiedParam === "true") where.isVerifiedBadge = true;
  if (verifiedParam === "false") where.isVerifiedBadge = false;

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { profile: true },
    }),
  ]);

  const result: AdminUserItem[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    nationalId: u.nationalId,
    role: u.role,
    isVerifiedBadge: u.isVerifiedBadge,
    isBanned: u.isBanned,
    createdAt: u.createdAt.toISOString(),
    city: u.profile?.city ?? null,
    province: u.profile?.province ?? null,
    bioShort: u.profile?.bioShort ?? "",
    avatarUrl: u.profile?.avatarUrl ?? null,
  }));

  return NextResponse.json({
    users: result,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}
