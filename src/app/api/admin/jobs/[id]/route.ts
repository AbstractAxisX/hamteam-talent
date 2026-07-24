import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

// PATCH /api/admin/jobs/[id] — { status: "open" | "closed" }
export async function PATCH(req: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "").trim();

  if (!["open", "closed"].includes(status)) {
    return NextResponse.json({ error: "status نامعتبر است" }, { status: 400 });
  }

  const job = await db.jobPost.findUnique({ where: { id } });
  if (!job) {
    return NextResponse.json({ error: "نیازمندی یافت نشد" }, { status: 404 });
  }

  await db.jobPost.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true, status });
}

// DELETE /api/admin/jobs/[id]
export async function DELETE(_req: Request, ctx: RouteCtx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const job = await db.jobPost.findUnique({ where: { id } });
  if (!job) {
    return NextResponse.json({ error: "نیازمندی یافت نشد" }, { status: 404 });
  }

  await db.jobPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
