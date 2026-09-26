import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth";
import { uploadDir } from "@/lib/upload-path";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

/* POST /api/upload — آپلود یکتای تصاویر سیستمی
   · type=avatar       → عکس پروفایل      (auth: کاربر)
   · type=banner       → بنر پروفایل      (auth: کاربر)
   · type=scout-card   → تصویر کارت ملی   (auth: کاربر)
   · type=admin-banner → بنر تبلیغاتی ادمین (auth: ادمین)
   پاسخ: { ok: true, url } — فایل در public/uploads ذخیره و از /uploads سرو می‌شود */

const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const TYPE_CONFIG: Record<string, { maxMB: number; prefix: string; adminOnly: boolean }> = {
  avatar: { maxMB: 8, prefix: "avatar", adminOnly: false },
  banner: { maxMB: 8, prefix: "banner", adminOnly: false },
  "scout-card": { maxMB: 8, prefix: "scout-card", adminOnly: false },
  "admin-banner": { maxMB: 10, prefix: "admin-banner", adminOnly: true },
};

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  }
  const file = formData.get("file");
  const type = String(formData.get("type") || "avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
  }

  const config = TYPE_CONFIG[type];
  if (!config) return NextResponse.json({ error: "نوع آپلود نامعتبر است" }, { status: 400 });

  // احراز هویت: admin-banner فقط ادمین، بقیه فقط کاربر
  if (config.adminOnly) {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "دسترسی ادمین لازم است" }, { status: 401 });
  } else {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  // اعتبارسنجی MIME — فقط تصویر
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: `فرمت تصویر (${file.type || "نامشخص"}) مجاز نیست — JPG، PNG، WebP یا GIF` },
      { status: 400 }
    );
  }

  // حجم
  if (file.size > config.maxMB * 1024 * 1024) {
    return NextResponse.json(
      { error: `حجم فایل باید کمتر از ${config.maxMB} مگابایت باشد` },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ALLOWED_IMAGE_MIME.some((m) => m.endsWith(ext)) ? ext : "jpg";
  const filename = `${config.prefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${safeExt}`;
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/${filename}`;
  return NextResponse.json({ ok: true, url });
}
