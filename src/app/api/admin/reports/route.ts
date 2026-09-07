import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// GET /api/admin/reports?status=open|resolved|dismissed — لیست گزارش‌های تخلف
export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";

  const reports = await db.postReport.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { id: true, name: true, isVerifiedBadge: true } },
      post: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          isFeatured: true,
          user: { select: { id: true, name: true, isBanned: true } },
          _count: { select: { reports: true } },
        },
      },
    },
  });

  const result = reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    reporter: r.reporter,
    post: {
      ...r.post,
      createdAt: r.post.createdAt.toISOString(),
      reportCount: r.post._count.reports,
    },
  }));

  const openCount = await db.postReport.count({ where: { status: "open" } });

  return NextResponse.json({ reports, openCount });
}
