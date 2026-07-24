import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/categories — list all categories with skills
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      skills: { orderBy: { name: "asc" } },
      _count: { select: { posts: true, jobPosts: true, userCats: true } },
    },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      iconUrl: c.iconUrl,
      createdAt: c.createdAt.toISOString(),
      skills: c.skills.map((s) => ({ id: s.id, name: s.name, categoryId: s.categoryId })),
      counts: {
        posts: c._count.posts,
        jobPosts: c._count.jobPosts,
        users: c._count.userCats,
      },
    })),
  });
}

// POST /api/admin/categories — create { name, iconUrl? }
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const iconUrl = body.iconUrl ? String(body.iconUrl) : null;

  if (name.length < 1) {
    return NextResponse.json({ error: "نام دسته‌بندی خالی است" }, { status: 400 });
  }
  if (name.length > 60) {
    return NextResponse.json({ error: "نام دسته‌بندی بیش از حد طولانی است" }, { status: 400 });
  }

  const exists = await db.category.findUnique({ where: { name } });
  if (exists) {
    return NextResponse.json({ error: "دسته‌بندی با این نام وجود دارد" }, { status: 400 });
  }

  const cat = await db.category.create({ data: { name, iconUrl } });
  return NextResponse.json({
    ok: true,
    category: { id: cat.id, name: cat.name, iconUrl: cat.iconUrl, skills: [], createdAt: cat.createdAt.toISOString() },
  });
}
