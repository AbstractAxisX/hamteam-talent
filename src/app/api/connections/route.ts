import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/connections — current user's connections in three lists:
//   pending (received requests), sent (sent requests), accepted (mutual).
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const [received, sent, acceptedAsReceiver, acceptedAsRequester] = await Promise.all([
    db.connection.findMany({
      where: { receiverId: me.id, status: "pending" },
      orderBy: { createdAt: "desc" },
      include: { requester: { include: { profile: true } } },
    }),
    db.connection.findMany({
      where: { requesterId: me.id, status: "pending" },
      orderBy: { createdAt: "desc" },
      include: { receiver: { include: { profile: true } } },
    }),
    db.connection.findMany({
      where: { receiverId: me.id, status: "accepted" },
      orderBy: { updatedAt: "desc" },
      include: { requester: { include: { profile: true } } },
    }),
    db.connection.findMany({
      where: { requesterId: me.id, status: "accepted" },
      orderBy: { updatedAt: "desc" },
      include: { receiver: { include: { profile: true } } },
    }),
  ]);

  type OtherUser = {
    id: string;
    name: string;
    isVerifiedBadge: boolean;
    avatarUrl: string | null;
    bioShort: string;
  };
  type ConnItem = {
    id: string;
    otherUser: OtherUser;
    status: string;
    createdAt: string;
  };

  const mapItem = (
    c:
      | (typeof received)[number]
      | (typeof sent)[number]
      | (typeof acceptedAsReceiver)[number]
      | (typeof acceptedAsRequester)[number],
    other:
      | (typeof received)[number]["requester"]
      | (typeof sent)[number]["receiver"]
      | (typeof acceptedAsReceiver)[number]["requester"]
      | (typeof acceptedAsRequester)[number]["receiver"]
  ): ConnItem => ({
    id: c.id,
    otherUser: {
      id: other.id,
      name: other.name,
      isVerifiedBadge: other.isVerifiedBadge,
      avatarUrl: other.profile?.avatarUrl ?? null,
      bioShort: other.profile?.bioShort ?? "",
    },
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  });

  const pending: ConnItem[] = received.map((c) => mapItem(c, c.requester));
  const sentList: ConnItem[] = sent.map((c) => mapItem(c, c.receiver));
  const accepted: ConnItem[] = [
    ...acceptedAsReceiver.map((c) => mapItem(c, c.requester)),
    ...acceptedAsRequester.map((c) => mapItem(c, c.receiver)),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json({
    pending,
    sent: sentList,
    accepted,
    counts: {
      pending: pending.length,
      sent: sentList.length,
      accepted: accepted.length,
    },
  });
}

// POST /api/connections — request connection or accept an incoming pending request.
// Body: { receiverId }
// Behavior:
//   - If a connection exists (any direction), respond with current status.
//   - If there's a pending-received request from `receiverId`, accept it.
//   - Otherwise, create a new pending request.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const receiverId = String(body.receiverId || "");

  if (!receiverId) {
    return NextResponse.json({ error: "شناسه گیرنده الزامی است" }, { status: 400 });
  }
  if (receiverId === me.id) {
    return NextResponse.json({ error: "نمی‌توانید به خودتان درخواست بدهید" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: receiverId } });
  if (!target) {
    return NextResponse.json({ error: "کاربر پیدا نشد" }, { status: 404 });
  }

  // Existing outgoing (me -> receiver)
  const outgoing = await db.connection.findUnique({
    where: { requesterId_receiverId: { requesterId: me.id, receiverId } },
  });
  if (outgoing) {
    if (outgoing.status === "rejected") {
      // Reset to pending — give it another shot.
      await db.connection.update({
        where: { id: outgoing.id },
        data: { status: "pending" },
      });
      return NextResponse.json({ status: "pending-sent" });
    }
    return NextResponse.json({
      status: outgoing.status === "accepted" ? "accepted" : "pending-sent",
    });
  }

  // Existing incoming (receiver -> me) — accept if pending.
  const incoming = await db.connection.findUnique({
    where: { requesterId_receiverId: { requesterId: receiverId, receiverId: me.id } },
  });
  if (incoming) {
    if (incoming.status === "accepted") {
      return NextResponse.json({ status: "accepted" });
    }
    if (incoming.status === "pending") {
      await db.connection.update({
        where: { id: incoming.id },
        data: { status: "accepted" },
      });
      // Notify the original requester that their request was accepted.
      await db.notification.create({
        data: {
          userId: receiverId,
          type: "connection_accepted",
          title: "درخواست ارتباط پذیرفته شد",
          body: `${me.name} درخواست ارتباط شما را پذیرفت.`,
          link: `#/profile/${me.id}`,
        },
      });
      return NextResponse.json({ status: "accepted" });
    }
    // rejected — treat as no connection from my side; create new request.
  }

  // Create new pending request
  await db.connection.create({
    data: { requesterId: me.id, receiverId, status: "pending" },
  });
  await db.notification.create({
    data: {
      userId: receiverId,
      type: "connection_request",
      title: "درخواست ارتباط جدید",
      body: `${me.name} می‌خواهد به شما متصل شود.`,
      link: `#/profile/${me.id}`,
    },
  });

  return NextResponse.json({ status: "pending-sent" });
}
