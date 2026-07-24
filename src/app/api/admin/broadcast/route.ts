import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/admin/broadcast — { title, body } → broadcast notification to ALL users
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const text = String(body.body || "").trim();

  if (title.length < 3) {
    return NextResponse.json({ error: "عنوان حداقل ۳ نویسه باشد" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "عنوان بیش از حد طولانی است" }, { status: 400 });
  }
  if (text.length < 1) {
    return NextResponse.json({ error: "متن پیام خالی است" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "متن پیام بیش از حد طولانی است" }, { status: 400 });
  }

  // Get all non-banned users
  const users = await db.user.findMany({
    where: { isBanned: false },
    select: { id: true },
  });

  if (users.length === 0) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "broadcast",
      title,
      body: text,
      link: null,
    })),
  });

  return NextResponse.json({ ok: true, count: users.length });
}
