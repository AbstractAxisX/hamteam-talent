import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────
// POST /api/needs/upload — multipart form with `file`
//   Saves to /public/uploads and returns { ok, url, fileName, fileSize }.
//   Does NOT update user profile (used for need attachments).
//   Max 5MB. Allows common document/image types.
// ─────────────────────────────────────────────────────────────
const ALLOWED_PREFIXES = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "text/plain",
  "application/x-zip-compressed",
];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "فایلی ارسال نشده" },
      { status: 400 }
    );
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "حجم فایل باید کمتر از ۵ مگابایت باشد" },
      { status: 400 }
    );
  }
  const isAllowed = ALLOWED_PREFIXES.some((p) => file.type.startsWith(p));
  if (!isAllowed) {
    return NextResponse.json(
      { error: "نوع فایل مجاز نیست" },
      { status: 400 }
    );
  }

  // Sanitize filename
  const safeName = (file.name || "file").replace(/[^\w.\-پچگکیوفژئ-]/g, "_");
  const ext = safeName.split(".").pop()?.toLowerCase() || "bin";
  const filename = `need-att-${user.id}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  return NextResponse.json({
    ok: true,
    url: `/uploads/${filename}`,
    fileName: safeName,
    fileSize: file.size,
  });
}
