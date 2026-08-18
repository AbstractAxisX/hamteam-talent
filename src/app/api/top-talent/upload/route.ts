import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db"; // placeholder
import { db } from "@/lib/db";
import { getCurrentUser as getMe } from "@/lib/auth";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// POST /api/top-talent/upload — upload national ID photo (max 1MB)
export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "فقط تصویر مجاز است" }, { status: 400 });
  if (file.size > 1 * 1024 * 1024) return NextResponse.json({ error: "حجم فایل باید کمتر از ۱ مگابایت باشد" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  // Validate extension to prevent executable uploads
  const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
  if (!allowedExts.includes(ext)) return NextResponse.json({ error: "فرمت فایل مجاز نیست" }, { status: 400 });

  const filename = `talent-id-${me.id}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "private", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  // Store as a private URL (not publicly accessible) — admin can view via API
  const url = `/api/top-talent/file/${filename}`;
  return NextResponse.json({ ok: true, url });
}
