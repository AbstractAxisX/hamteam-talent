import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// POST /api/portfolio/upload-media — آپلود رسانه نمونه کار
// Multipart: file + itemId + type
const ALLOWED: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/m4a"],
  doc: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ],
};

const MAX_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 30 * 1024 * 1024,
  doc: 20 * 1024 * 1024,
};

function inferType(mime: string): string | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime.startsWith("text/") ||
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.includes("sheet") ||
    mime.includes("presentation") ||
    mime.includes("msword") ||
    mime.includes("ms-excel") ||
    mime.includes("ms-powerpoint")
  )
    return "doc";
  return null;
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const itemId = formData.get("itemId") as string | null;
  if (!file) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
  if (!itemId) return NextResponse.json({ error: "شناسه نمونه کار لازم است" }, { status: 400 });

  const item = await db.portfolioItem.findUnique({ where: { id: itemId }, select: { userId: true } });
  if (!item || item.userId !== me.id) {
    return NextResponse.json({ error: "نمونه کار پیدا نشد" }, { status: 404 });
  }

  const type = inferType(file.type);
  if (!type) {
    return NextResponse.json({ error: `فرمت فایل (${file.type || "نامشخص"}) مجاز نیست` }, { status: 400 });
  }
  if (file.size > MAX_SIZES[type]) {
    return NextResponse.json({ error: `حجم فایل باید کمتر از ${MAX_SIZES[type] / 1024 / 1024} مگابایت باشد` }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filename = `portfolio-${me.id}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/${filename}`;
  const count = await db.portfolioMedia.count({ where: { itemId } });
  const media = await db.portfolioMedia.create({
    data: { itemId, url, type, fileName: file.name, fileSize: file.size, order: count },
  });

  return NextResponse.json({ ok: true, url, type, id: media.id, fileName: file.name, fileSize: file.size });
}
