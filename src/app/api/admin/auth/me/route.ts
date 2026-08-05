import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ admin: null });
  return NextResponse.json({
    admin: { id: admin.id, name: admin.name, username: admin.username },
  });
}
