import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

/* POST /api/upload — آپلود تصاویر عمومی (آواتار، بنر پروفایل، بنر تبلیغاتی، ...)
   · جلسه: کاربر عادی یا ادمین (برای ساخت بنر تبلیغاتی)
   · خروجی: { ok: true, url } */
export async function POST(req: Request) {
  // جلسهٔ کاربر یا ادمین
  let me = await getCurrentUser();
  let isAdmin = false;
  if (!me) {
    const admin = await getCurrentAdmin();
    if (admin) {
      isAdmin = true;
      me = { id: `admin-${admin.id}` } as any;
    }
  }
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "image";

  if (!file) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });

  // فقط تصویر (آواتار/بنر/تصاویر عمومی)
  const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const byMime = file.type.startsWith("image/") && allowedMime.includes(file.type);
  const byName = /\.(jpe?g|png|webp|gif)$/i.test(file.name || "");
  if (!byMime && !byName) {
    return NextResponse.json({ error: `فرمت فایل (${file.type || "نامشخص"}) مجاز نیست — فقط تصویر` }, { status: 400 });
  }

  const maxSize = type === "banner" ? 12 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `حجم فایل باید کمتر از ${Math.floor(maxSize / 1024 / 1024)}MB باشد` },
      { status: 400 }
    );
  }

  const kind = ["avatar", "banner", "ad", "image"].includes(type) ? type : "image";
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const filename = `${kind}-${me.id}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}`, type: "image", fileName: file.name, fileSize: file.size, isAdmin });
}
