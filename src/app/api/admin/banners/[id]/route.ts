import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  subtitle: z.string().trim().max(140).optional(),
  imageUrl: z.string().trim().min(1).optional(),
  linkUrl: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\//.test(v) || v.startsWith("#/"), {
      message: "لینک باید با http، https یا #/ شروع شود",
    })
    .nullable()
    .optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/* PUT /api/admin/banners/[id] — ویرایش بنر (فعال/غیرفعال، ترتیب، متن‌ها) */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "داده نامعتبر" },
        { status: 400 }
      );
    }
    const data: Record<string, unknown> = {};
    const d = parsed.data;
    if (d.title !== undefined) data.title = d.title;
    if (d.subtitle !== undefined) data.subtitle = d.subtitle;
    if (d.imageUrl !== undefined) data.imageUrl = d.imageUrl;
    if (d.linkUrl !== undefined) data.linkUrl = d.linkUrl || null;
    if (d.order !== undefined) data.order = d.order;
    if (d.isActive !== undefined) data.isActive = d.isActive;
    await db.banner.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "بنر یافت نشد یا خطای سرور" }, { status: 404 });
  }
}

/* DELETE /api/admin/banners/[id] — حذف بنر */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  try {
    const { id } = await params;
    await db.banner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "بنر یافت نشد" }, { status: 404 });
  }
}
