import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// PATCH /api/admin/reports/[id] — { action: "resolve" | "dismiss" | "delete-post" }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  const report = await db.postReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "گزارش یافت نشد" }, { status: 404 });

  if (action === "resolve" || action === "dismiss") {
    await db.postReport.update({
      where: { id },
      data: { status: action === "resolve" ? "resolved" : "dismissed" },
    });
    return NextResponse.json({ ok: true, status: action === "resolve" ? "resolved" : "dismissed" });
  }

  if (action === "delete-post") {
    // پست متخلف حذف + همه گزارش‌هایش رسیدگی‌شده می‌شوند (cascade)
    await db.post.delete({ where: { id: report.postId } });
    return NextResponse.json({ ok: true, deletedPost: true });
  }

  return NextResponse.json({ error: "اکشن نامعتبر" }, { status: 400 });
}
