import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* POST /api/banners/[id]/click — ثبت کلیک و برگرداندن مقصد */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const banner = await db.banner.update({
      where: { id },
      data: { clicks: { increment: 1 } },
      select: { linkUrl: true },
    });
    return NextResponse.json({ ok: true, linkUrl: banner.linkUrl });
  } catch {
    return NextResponse.json({ error: "بنر یافت نشد" }, { status: 404 });
  }
}
