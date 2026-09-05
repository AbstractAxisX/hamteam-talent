import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

/* POST /api/top-talent/upload — آپلود عکس کارت ملی (فقط تصویر ≤ 2MB)
   نتیجه: { ok, url } — url در فرم درخواست استعداد برتر استفاده می‌شود. */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });

  // فقط تصویر — کارت ملی عکس است
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!allowed.includes(file.type) && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "فقط فایل تصویری (JPG/PNG/WebP) مجاز است" }, { status: 400 });
  }

  const MAX = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX) {
    return NextResponse.json({ error: "حجم فایل باید کمتر از ۲ مگابایت باشد" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop()?.toLowerCase() || "jpg").replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `national-id-${me.id}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
