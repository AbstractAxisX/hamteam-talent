import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/profile/me/education — create a resume education entry.
// Body: { degree, institution, year?, description? }
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const degree = String(body.degree || "").trim();
  const institution = String(body.institution || "").trim();
  if (!degree) return NextResponse.json({ error: "مدرک تحصیلی الزامی است" }, { status: 400 });
  if (!institution) return NextResponse.json({ error: "نام موسسه الزامی است" }, { status: 400 });

  const year = body.year ? String(body.year).slice(0, 20) : null;
  const description = String(body.description || "").slice(0, 4000);

  // Ensure profile + resume exist
  const profile = await db.profile.upsert({
    where: { userId: me.id },
    update: {},
    create: { userId: me.id },
  });
  const resume = await db.resume.upsert({
    where: { profileId: profile.id },
    update: {},
    create: { profileId: profile.id },
  });

  const edu = await db.resumeEducation.create({
    data: { resumeId: resume.id, degree, institution, year, description },
  });

  return NextResponse.json({ ok: true, id: edu.id });
}
