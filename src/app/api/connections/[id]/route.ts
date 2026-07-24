import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// PATCH /api/connections/[id] — accept or reject a pending request.
// Only the receiver of the connection can act on it.
// Body: { action: "accept" | "reject" }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action === "accept" ? "accept" : body.action === "reject" ? "reject" : null;
  if (!action) {
    return NextResponse.json({ error: "اقدام نامعتبر است" }, { status: 400 });
  }

  const conn = await db.connection.findUnique({ where: { id } });
  if (!conn) {
    return NextResponse.json({ error: "ارتباط پیدا نشد" }, { status: 404 });
  }
  if (conn.receiverId !== me.id) {
    return NextResponse.json(
      { error: "فقط گیرنده درخواست می‌تواند آن را بپذیرد یا رد کند" },
      { status: 403 }
    );
  }
  if (conn.status !== "pending") {
    return NextResponse.json(
      { error: "این درخواست قبلاً پردازش شده است" },
      { status: 400 }
    );
  }

  if (action === "accept") {
    await db.connection.update({
      where: { id },
      data: { status: "accepted" },
    });
    // Notify the requester
    try {
      await db.notification.create({
        data: {
          userId: conn.requesterId,
          type: "connection_accepted",
          title: "درخواست ارتباط پذیرفته شد",
          body: `${me.name} درخواست ارتباط شما را پذیرفت.`,
          link: `#/profile/${me.id}`,
        },
      });
      // Also upsert a conversation between the two so they can chat immediately
      const [aId, bId] =
        conn.requesterId < me.id
          ? [conn.requesterId, me.id]
          : [me.id, conn.requesterId];
      await db.conversation.upsert({
        where: { userAId_userBId: { userAId: aId, userBId: bId } },
        update: {},
        create: { userAId: aId, userBId: bId },
      });
    } catch {
      // non-critical
    }
    return NextResponse.json({ status: "accepted" });
  }

  // reject: delete the connection (so a fresh request can be made later)
  await db.connection.delete({ where: { id } });
  return NextResponse.json({ status: "rejected" });
}
