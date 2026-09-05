import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

/* GET /api/admin/banners — همهٔ بنرها (ادمین) */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  try {
    const banners = await db.banner.findMany({
      orderBy: [{ placement: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ banners });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const createSchema = z.object({
  title: z.string().trim().min(1, "عنوان الزامی است").max(80),
  subtitle: z.string().trim().max(140).optional().default(""),
  imageUrl: z.string().trim().min(1, "تصویر بنر الزامی است"),
  linkUrl: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\//.test(v) || v.startsWith("#/"), {
      message: "لینک باید با http، https یا #/ شروع شود",
    })
    .optional()
    .default(""),
  placement: z.enum(["hero"]).optional().default("hero"),
  order: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

/* POST /api/admin/banners — ساخت بنر جدید */
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "داده نامعتبر" },
        { status: 400 }
      );
    }
    const { title, subtitle, imageUrl, linkUrl, placement, order, isActive } = parsed.data;
    const banner = await db.banner.create({
      data: {
        title,
        subtitle,
        imageUrl,
        linkUrl: linkUrl || null,
        placement,
        order,
        isActive,
      },
    });
    return NextResponse.json({ ok: true, id: banner.id });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
