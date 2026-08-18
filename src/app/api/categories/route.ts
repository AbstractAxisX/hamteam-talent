import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { order: "asc" },
    include: { skills: { orderBy: { name: "asc" } } },
  });
  return NextResponse.json({ categories });
}
