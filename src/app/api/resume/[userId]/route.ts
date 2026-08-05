import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProvinceName } from "@/lib/geo";

// GET /api/resume/[userId] — returns a print-friendly HTML resume page.
// The frontend opens it in a new tab; the page auto-triggers print (save as PDF).
export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          resume: { include: { experiences: true, educations: true } },
        },
      },
      userSkills: { include: { skill: { include: { category: true } } } },
    },
  });

  if (!user || !user.profile) {
    return new NextResponse("پروفایل پیدا نشد", { status: 404 });
  }

  const province = getProvinceName(user.profile.province);
  const skillsByCat = new Map<string, string[]>();
  for (const us of user.userSkills) {
    const catName = us.skill.category.name;
    if (!skillsByCat.has(catName)) skillsByCat.set(catName, []);
    skillsByCat.get(catName)!.push(us.skill.name);
  }

  const expHtml = (user.profile.resume?.experiences || [])
    .map((e) => `
      <div class="item">
        <div class="item-head">
          <strong>${escapeHtml(e.jobTitle)}</strong>
          <span class="muted">${escapeHtml(e.organization)}${e.startDate || e.endDate ? ` · ${escapeHtml(e.startDate || "")}${e.endDate ? ` - ${escapeHtml(e.endDate)}` : " - تاکنون"}` : ""}</span>
        </div>
        ${e.description ? `<p class="muted small">${escapeHtml(e.description)}</p>` : ""}
      </div>`)
    .join("") || '<p class="muted">سابقه‌ای ثبت نشده.</p>';

  const eduHtml = (user.profile.resume?.educations || [])
    .map((e) => `
      <div class="item">
        <div class="item-head">
          <strong>${escapeHtml(e.degree)}</strong>
          <span class="muted">${escapeHtml(e.institution)}${e.year ? ` · ${escapeHtml(e.year)}` : ""}</span>
        </div>
        ${e.description ? `<p class="muted small">${escapeHtml(e.description)}</p>` : ""}
      </div>`)
    .join("") || '<p class="muted">تحصیالی ثبت نشده.</p>';

  const skillsHtml = Array.from(skillsByCat.entries())
    .map(([cat, skills]) => `<div class="cat-row"><span class="cat">${escapeHtml(cat)}:</span> ${skills.map((s) => `<span class="badge">${escapeHtml(s)}</span>`).join(" ")}</div>`)
    .join("") || '<p class="muted">مهارتی ثبت نشده.</p>';

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<title>رزومه — ${escapeHtml(user.name)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Vazirmatn', sans-serif; color: #1a2a3a; background: #f5f7f9; line-height: 1.8; padding: 20px; }
  .page { max-width: 800px; margin: 0 auto; background: #fff; padding: 48px 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border-radius: 8px; }
  header { text-align: center; border-bottom: 3px solid #2a5f7d; padding-bottom: 24px; margin-bottom: 28px; }
  h1 { font-size: 32px; font-weight: 900; color: #1a3a4a; margin-bottom: 6px; }
  .subtitle { color: #5a7080; font-size: 15px; }
  .meta { color: #7a8a98; font-size: 13px; margin-top: 8px; }
  section { margin-bottom: 26px; }
  h2 { font-size: 18px; font-weight: 800; color: #2a5f7d; border-right: 4px solid #2a5f7d; padding-right: 10px; margin-bottom: 14px; }
  .about { color: #3a4a5a; font-size: 14px; line-height: 2; }
  .item { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px dashed #e0e6ea; }
  .item:last-child { border-bottom: none; }
  .item-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
  .muted { color: #7a8a98; font-size: 13px; }
  .small { font-size: 13px; }
  .cat-row { margin-bottom: 8px; font-size: 14px; }
  .cat { font-weight: 700; color: #2a5f7d; }
  .badge { display: inline-block; background: #eaf4f8; color: #2a5f7d; padding: 2px 10px; border-radius: 12px; font-size: 12px; margin: 2px 0; }
  footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e6ea; text-align: center; color: #9aa8b4; font-size: 11px; }
  @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; padding: 20px; border-radius: 0; } }
</style>
</head>
<body>
  <div class="page">
    <header>
      <h1>${escapeHtml(user.name)}</h1>
      <div class="subtitle">${escapeHtml(user.profile.bioShort || "حرفه‌ای")}</div>
      <div class="meta">
        ${user.profile.city ? escapeHtml(user.profile.city) : ""}
        ${user.profile.city && province ? " · " : ""}
        ${province ? escapeHtml(province) : ""}
        ${user.isVerifiedBadge ? ' · <span style="color:#c08a00;">✓ تأیید شده</span>' : ""}
      </div>
    </header>

    ${user.profile.bioLong ? `<section><h2>درباره‌ی من</h2><p class="about">${escapeHtml(user.profile.bioLong)}</p></section>` : ""}

    <section>
      <h2>دسته‌بندی و مهارت‌ها</h2>
      ${skillsHtml}
    </section>

    <section>
      <h2>سوابق کاری</h2>
      ${expHtml}
    </section>

    <section>
      <h2>تحصیلات</h2>
      ${eduHtml}
    </section>

    <footer>رزومه‌ی Generated توسط همتیم · ${new Date().toLocaleDateString("fa-IR")}</footer>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 400); };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
