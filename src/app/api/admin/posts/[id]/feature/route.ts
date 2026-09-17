import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// POST /api/admin/posts/[id]/feature — toggle ویترین «چهره برتر»
// ادمین مجاز است هر پستی را ویترین کند (تشخیص نهایی با ادمین)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });

  const updated = await db.post.update({ where: { id }, data: { isFeatured: !post.isFeatured } });
  return NextResponse.json({ ok: true, isFeatured: updated.isFeatured });
}
