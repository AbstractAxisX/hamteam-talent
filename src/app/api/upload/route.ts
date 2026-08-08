import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// POST /api/upload — multipart form with file + type ("avatar" | "banner")
// Saves to /public/uploads and updates the user's profile.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "avatar";

  if (!file) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "فقط تصویر مجاز است" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "حجم فایل باید کمتر از ۵ مگابایت باشد" }, { status: 400 });

  // Ensure user has a profile
  if (!user.profile) {
    await db.profile.create({ data: { userId: user.id } });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${type}-${user.id}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  const url = `/uploads/${filename}`;

  // Update profile
  if (type === "banner") {
    await db.profile.update({ where: { userId: user.id }, data: { bannerUrl: url } });
  } else {
    await db.profile.update({ where: { userId: user.id }, data: { avatarUrl: url } });
  }

  return NextResponse.json({ ok: true, url });
}
