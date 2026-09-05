import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/* GET /uploads/[...path] — سرو فایل‌های آپلودشده
   🔧 تاب‌پذیری استقرار: در حالت standalone ممکن است CWD با ریشهٔ public یکی نباشد؛
   این مسیر فایل را از چند مسیر کاندید می‌خواند تا رسانه‌ها همیشه در دسترس بمانند.
   (فایل‌های موجود در public/ توسط هندلر استاتیک خود Next زودتر سرو می‌شوند) */

type Ctx = { params: Promise<{ path: string[] }> };

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(_req: Request, ctx: Ctx) {
  const { path: parts } = await ctx.params;
  if (!parts || parts.length === 0) return new NextResponse("Not found", { status: 404 });

  // پاک‌سازی مسیر — بدون .. و بدون فایل مخفی
  const safe = parts.filter((p) => p && !p.includes("..") && !p.startsWith("."));
  if (safe.length === 0) return new NextResponse("Not found", { status: 404 });

  const candidates = [
    path.join(process.cwd(), "public", "uploads", ...safe),
    path.join(process.cwd(), "uploads", ...safe),
    path.join(process.cwd(), "..", "public", "uploads", ...safe),
  ];

  for (const p of candidates) {
    try {
      const file = await fs.readFile(p);
      const ext = path.extname(p).toLowerCase();
      return new NextResponse(new Uint8Array(file), {
        headers: {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      /* مسیر بعدی */
    }
  }

  return new NextResponse("Not found", { status: 404 });
}
