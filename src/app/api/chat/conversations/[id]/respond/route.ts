import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/chat/conversations/[id]/respond — accept or reject a message request.
// Body: { action: "accept" | "reject" }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "accept" | "reject";
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "اکشن نامعتبر" }, { status: 400 });
  }

  const conv = await db.conversation.findUnique({ where: { id } });
  if (!conv) return NextResponse.json({ error: "گفتگو پیدا نشد" }, { status: 404 });

  // Verify current user is a participant
  if (conv.userAId !== me.id && conv.userBId !== me.id) {
    return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });
  }

  if (action === "accept") {
    await db.conversation.update({
      where: { id },
      data: { status: "active", initiatorId: null },
    });
    return NextResponse.json({ ok: true, status: "active" });
  } else {
    // Reject → delete conversation + messages
    await db.conversation.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  }
}
