import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });

  const [users, posts, categories, tickets, connections, notifications] = await Promise.all([
    db.user.count(),
    db.post.count(),
    db.category.count(),
    db.ticket.count(),
    db.connection.count({ where: { status: "accepted" } }),
    db.notification.count(),
  ]);

  return NextResponse.json({
    stats: { users, posts, categories, tickets, connections, notifications },
  });
}
