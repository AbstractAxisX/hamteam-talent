import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/stats — dashboard counts + 14-day growth
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const [
    users,
    posts,
    openJobs,
    messages,
    connections,
    tickets,
    categories,
    skills,
  ] = await Promise.all([
    db.user.count(),
    db.post.count(),
    db.jobPost.count({ where: { status: "open" } }),
    db.message.count(),
    db.connection.count({ where: { status: "accepted" } }),
    db.ticket.count(),
    db.category.count(),
    db.skill.count(),
  ]);

  // 14-day user registration growth
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13); // 14 days including today

  const recentUsers = await db.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  // Build day buckets
  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const u of recentUsers) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + 1);
    }
  }

  const growthData = Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return NextResponse.json({
    stats: {
      users,
      posts,
      openJobs,
      messages,
      connections,
      tickets,
      categories,
      skills,
    },
    growthData,
  });
}
