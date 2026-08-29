import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// POST /api/upload — universal user asset upload (avatar / banner)
// Multipart: file + type ("avatar" | "banner")
// Response: { ok: true, url } — consumed by edit-profile-view avatar/banner uploaders
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = String(formData.get("type") || "avatar");

  if (!file) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
  if (!["avatar", "banner"].includes(type)) {
    return NextResponse.json({ error: "نوع آپلود نامعتبر است" }, { status: 400 });
  }

  // Only images allowed for profile assets
  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "فقط تصویر (JPG / PNG / WebP / GIF) مجاز است" }, { status: 400 });
  }

  // 5MB cap for profile assets
  const MAX = 5 * 1024 * 1024;
  if (file.size > MAX) {
    return NextResponse.json({ error: "حجم تصویر باید کمتر از ۵ مگابایت باشد" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${type}-${me.id}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
