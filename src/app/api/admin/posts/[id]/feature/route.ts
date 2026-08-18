import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

// POST /api/admin/posts/[id]/feature — toggle featured status (for Top Talents explore)
// Only works if the post owner has isTopTalent = true
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const { id } = await params;
  const post = await db.post.findUnique({ where: { id }, include: { user: true } });
  if (!post) return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });

  // Check if user has top talent badge
  if (!post.user.isTopTalent && !post.isFeatured) {
    return NextResponse.json({ error: "این کاربر استعداد برتر نیست. ابتدا استعداد برتر را فعال کنید." }, { status: 400 });
  }

  const updated = await db.post.update({ where: { id }, data: { isFeatured: !post.isFeatured } });
  return NextResponse.json({ ok: true, isFeatured: updated.isFeatured });
}
