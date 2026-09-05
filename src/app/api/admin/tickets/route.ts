import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// GET /api/admin/tickets — list all tickets (open + closed) with user info
// 🔒 احراز هویت ادمین از سشن جداگانهٔ ادمین (قبلاً user.role بود که وجود نداشت → همیشه 403)
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const tickets = await db.ticket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { include: { profile: true } },
      _count: { select: { replies: true } },
    },
  });

  const result = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    replyCount: t._count.replies,
    user: {
      id: t.user.id,
      name: t.user.name,
      phone: t.user.phone,
      isVerifiedBadge: t.user.isVerifiedBadge,
      isBanned: t.user.isBanned,
      avatarUrl: t.user.profile?.avatarUrl ?? null,
    },
  }));

  return NextResponse.json({ tickets: result });
}
