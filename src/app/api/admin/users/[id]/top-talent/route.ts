import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// POST /api/admin/users/[id]/top-talent — toggle top talent badge
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "کاربر پیدا نشد" }, { status: 404 });

  const updated = await db.user.update({ where: { id }, data: { isTopTalent: !user.isTopTalent } });
  return NextResponse.json({ ok: true, isTopTalent: updated.isTopTalent });
}
