import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const text = String(body.body || "").trim();

  if (!title || !text) return NextResponse.json({ error: "عنوان و متن را پر کنید" }, { status: 400 });

  const users = await db.user.findMany({ where: { isBanned: false }, select: { id: true } });
  if (users.length === 0) return NextResponse.json({ count: 0 });

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "broadcast",
      title,
      body: text,
    })),
  });

  return NextResponse.json({ count: users.length });
}
