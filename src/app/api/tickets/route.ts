import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/tickets — current user's tickets
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const tickets = await db.ticket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { replies: true } },
    },
  });

  const result = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    replyCount: t._count.replies,
  }));

  return NextResponse.json({ tickets: result });
}

// POST /api/tickets — create ticket { subject, body }
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const subject = String(body.subject || "").trim();
  const text = String(body.body || "").trim();

  if (subject.length < 3) {
    return NextResponse.json({ error: "موضوع حداقل ۳ نویسه باشد" }, { status: 400 });
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: "موضوع بیش از حد طولانی است" }, { status: 400 });
  }
  if (text.length < 5) {
    return NextResponse.json({ error: "متن تیکت حداقل ۵ نویسه باشد" }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "متن تیکت بیش از حد طولانی است" }, { status: 400 });
  }

  const ticket = await db.ticket.create({
    data: {
      userId: user.id,
      subject,
      body: text,
    },
  });

  return NextResponse.json({ ok: true, id: ticket.id });
}
