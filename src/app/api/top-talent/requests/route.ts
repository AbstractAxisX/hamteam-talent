import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// GET /api/top-talent/requests — admin lists all requests
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const requests = await db.topTalentRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { include: { profile: true } } },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      userAvatar: r.user.profile?.avatarUrl ?? null,
      phoneNumber: r.phoneNumber,
      socialMediaId: r.socialMediaId,
      description: r.description,
      status: r.status,
      rejectReason: r.rejectReason,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
    })),
  });
}
