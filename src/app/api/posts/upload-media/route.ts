import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// POST /api/posts/upload-media — upload media for a post (image, video, audio, doc)
// Multipart: file + postId (optional, to attach) + type
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const postId = formData.get("postId") as string | null;
  const type = (formData.get("type") as string) || "image";

  if (!file) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });

  // Validate file type
  const allowedTypes: Record<string, string[]> = {
    image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    video: ["video/mp4", "video/webm", "video/quicktime"],
    audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/m4a"],
    doc: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain", "text/csv"],
  };

  // نوع نهایی ممکن است از MIME فایل استنباط شود
  let finalType = type in allowedTypes ? type : "doc";
  const validType = allowedTypes[finalType]?.some((t) => file.type === t) || allowedTypes.doc.includes(file.type);
  if (!validType) {
    // استنباط نوع از MIME فایل
    if (file.type.startsWith("image/")) finalType = "image";
    else if (file.type.startsWith("video/")) finalType = "video";
    else if (file.type.startsWith("audio/")) finalType = "audio";
    else if (file.type.startsWith("text/") || file.type.includes("pdf") || file.type.includes("document") || file.type.includes("sheet") || file.type.includes("presentation"))
      finalType = "doc";
    else return NextResponse.json({ error: `فرمت فایل (${file.type || "نامشخص"}) مجاز نیست` }, { status: 400 });
  }

  // Size limits
  const maxSizes: Record<string, number> = {
    image: 10 * 1024 * 1024,   // 10MB
    video: 100 * 1024 * 1024,  // 100MB
    audio: 30 * 1024 * 1024,   // 30MB
    doc: 20 * 1024 * 1024,     // 20MB
  };
  const actualType = file.type.startsWith("image/") ? "image" :
                     file.type.startsWith("video/") ? "video" :
                     file.type.startsWith("audio/") ? "audio" : finalType;
  if (file.size > maxSizes[actualType]) {
    return NextResponse.json({ error: `حجم فایل باید کمتر از ${maxSizes[actualType] / 1024 / 1024}MB باشد` }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filename = `post-media-${me.id}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  const url = `/uploads/${filename}`;

  // If postId provided, attach to post
  if (postId) {
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post || post.userId !== me.id) {
      return NextResponse.json({ error: "پست پیدا نشد" }, { status: 404 });
    }
    const media = await db.postMedia.create({
      data: { postId, url, type: actualType, fileName: file.name, fileSize: file.size },
    });
    return NextResponse.json({ ok: true, media: { id: media.id, url, type: actualType, fileName: file.name, fileSize: file.size } });
  }

  return NextResponse.json({ ok: true, url, type: actualType, fileName: file.name, fileSize: file.size });
}
