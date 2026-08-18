import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { TopTalentMyStatus } from "@/lib/types";

// GET /api/top-talent/my-status — current user's top talent application status.
// Used by the landing page form to decide whether to render the form or a
// status message (pending / approved / rejected).
export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  // Most recent request wins (admin may have rejected an old one and the user
  // submitted a new one). Order by createdAt desc.
  const req = await db.topTalentRequest.findFirst({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, rejectReason: true },
  });

  const status: TopTalentMyStatus = req
    ? {
        hasRequest: true,
        status: req.status as TopTalentMyStatus["status"],
        rejectReason: req.rejectReason,
      }
    : { hasRequest: false, status: "none" };

  return NextResponse.json(status);
}
