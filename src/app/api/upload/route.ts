import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// POST /api/upload — universal asset upload (avatar / banner / admin banners)
// Multipart: file + type ("avatar" | "banner" | "admin-banner")
// Response: { ok: true, url } — user OR admin session accepted
export async function POST(req: Request) {
  // هر دو سشن جداگانه چک می‌شوند — مرورگر ادمین ممکن است همزمان سشن کاربر داشته باشد
  const me = await getCurrentUser();
  const admin = await getCurrentAdmin();
  if (!me && !admin) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = String(formData.get("type") || "avatar");

  if (!file) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
  if (!["avatar", "banner", "admin-banner"].includes(type)) {
    return NextResponse.json({ error: "نوع آپلود نامعتبر است" }, { status: 400 });
  }
  // admin-banner فقط برای ادمین؛ avatar/banner برای کاربر
  if (type === "admin-banner" && !admin) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  if (type !== "admin-banner" && !me) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 403 });
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
  const owner = me ? me.id : `admin-${admin!.id}`;
  const filename = `${type === "admin-banner" ? "banner" : type}-${owner}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
