import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

/* GET /api/chat/socket-token — توکن کوتاه‌عمر برای اتصال سوکت چت
   🔒 رفع جعل هویت: سرویس چت دیگر userId سمت کلاینت را اعتماد نمی‌کند؛
   در عوض این توکنِ امضاشده (HMAC با SESSION_SECRET) را می‌سنجد.
   توکن ۱۰ دقیقه اعتبار دارد و فقط برای کاربرِ لاگین‌شده صادر می‌شود. */

const TOKEN_TTL_MS = 10 * 60 * 1000;

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET || "dev-secret-change-in-production-please";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `u:${me.id}:${exp}`;
  const token = `${payload}.${sign(payload)}`;

  return NextResponse.json({ token, expiresIn: TOKEN_TTL_MS });
}
