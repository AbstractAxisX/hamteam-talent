import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// Seed: creates talent categories + skills + admin account + demo users.
export async function GET() {
  const log: string[] = [];

  // ── Talent categories (with emoji icons) ──
  const catDefs: { name: string; icon: string; skills: string[] }[] = [
    { name: "موسیقی", icon: "🎵", skills: ["خوانندگی", "نوازندگی گیتار", "نوازندگی پیانو", "نوازندگی ویولن", "نوازندگی سنتور", "نوازندگی تنبک", "ترانه‌سرایی", "تنظیم موسیقی", "آواز سنتی", "آواز پاپ"] },
    { name: "سخنوری و رسانه", icon: "🎙️", skills: ["پادکست", "دوبلاژ", "گویندگی", "ارباب حلقه", "میزبانی", "گزارشگری"] },
    { name: "نویسندگی و محتوا", icon: "✍️", skills: ["نویسندگی داستان", "نویسندگی مقاله", "کپی‌رایتینگ", "سناریونویسی", "تولید محتوای دیجیتال", "وبلاگ‌نویسی"] },
    { name: "آشپزی و شیرینی‌پزی", icon: "🍳", skills: ["آشپزی ایرانی", "آشپزی بین‌المللی", "شیرینی‌پزی", "کافه و باریستا", "شکلات‌سازی", "غذای گیاهی", "کنفکشنری"] },
    { name: "مدلینگ", icon: "📸", skills: ["مدل عکاسی", "مدل کاتالوگ", "مدل لباس", "مدل تبلیغاتی", "فیشن مدل"] },
    { name: "سرگرمی و تفریح", icon: "🎪", skills: ["کمدی و استندآپ", "شعبده‌بازی", "بازیگری", "شیمینوازی", "میم و نمایش"] },
    { name: "فیلم و سینما", icon: "🎬", skills: ["کارگردانی", "تدوین ویدیو", "فیلمبرداری", "عکاسی سینمایی", "جلوه‌های ویژه", "آنیمیشن", "تیزر تبلیغاتی", "دراپلاین"] },
    { name: "برنامه‌نویسی و توسعه", icon: "💻", skills: ["فرانت‌اند", "بک‌اند", "موبایل", "هوش مصنوعی", "دواپس", "وب‌دیزاین"] },
    { name: "بازی‌سازی", icon: "🎮", skills: ["بازی‌سازی یونیتی", "بازی‌سازی آنریل", "گیم‌دیزاین", "توسعه موبایل گیم", "بازی انلاین"] },
    { name: "آموزش و تدریس", icon: "📚", skills: ["تدریس خصوصی", "آموزش آنلاین", "تدریس زبان", "تدریس موسیقی", "تدریس هنر", "تدریس علوم", "کوچینگ تحصیلی"] },
    { name: "بازاریابی و تبلیغات", icon: "📢", skills: ["بازاریابی دیجیتال", "سئو", "تبلیغات شبکه‌های اجتماعی", "برندینگ", "بازاریابی محتوا", "ایمیل مارکتینگ"] },
    { name: "ترجمه و زبان", icon: "🌍", skills: ["ترجمه انگلیسی", "ترجمه عربی", "ترجمه ترکی", "ترجمه آلمانی", "ترجمه فرانسوی", "تدریس مکالمه"] },
    { name: "علم و پژوهش", icon: "🔬", skills: ["پژوهش علمی", "تحلیل داده", "نوشتن مقاله علمی", "آمار", "هوش مصنوعی پژوهشی"] },
    { name: "طراحی گرافیک و UI/UX", icon: "🎨", skills: ["طراحی لوگو", "طراحی پوستر", "UI/UX دیزاین", "موشن گرافیک", "تصویرسازی", "طراحی هویت بصری", "پروتوتایپ"] },
    { name: "کارآفرینی و استارتاپ", icon: "🚀", skills: ["توسعه کسب‌وکار", "مدیریت محصول", "فروش و مذاکره", "پیچ‌دک", "مدیریت تیم", "منتورینگ"] },
    { name: "مد و طراحی لباس", icon: "👗", skills: ["طراحی لباس", "خیاطی", "طراحی کیف و کفش", "استایلیست", "طراحی جواهر"] },
    { name: "فنی و تعمیرات", icon: "🔧", skills: ["تعمیر موبایل", "تعمیر کامپیوتر", "برق و الکترونیک", "تعمیرات خودرو", "لوله‌کشی", "نجاری"] },
    { name: "طراحی صنعتی", icon: "🏭", skills: ["طراحی محصول", "مدل‌سازی سه‌بعدی", "پرینت سه‌بعدی", "طراحی قطعه", "نمونه‌سازی"] },
    { name: "طراحی ساختمان و داخلی", icon: "🏠", skills: ["طراحی داخلی", "معماری", "طراحی نما", "ديزین مبلمان", "نورپردازی", "رندر سه‌بعدی"] },
    { name: "ورزش و مربی‌گری", icon: "⚽", skills: ["فوتبال", "بسکتبال", "شمیرا", "کراس‌فیت", "یوگا", "بوکس", "بدنسازی", "شنا", "مربی‌گری خصوصی", "ایروبیک"] },
  ];

  const catMap = new Map<string, string>();
  for (let i = 0; i < catDefs.length; i++) {
    const def = catDefs[i];
    const cat = await db.category.upsert({
      where: { name: def.name },
      update: { iconUrl: def.icon, order: i },
      create: { name: def.name, iconUrl: def.icon, order: i },
    });
    catMap.set(def.name, cat.id);
    for (const skillName of def.skills) {
      await db.skill.upsert({
        where: { categoryId_name: { categoryId: cat.id, name: skillName } },
        update: {},
        create: { categoryId: cat.id, name: skillName },
      });
    }
  }
  log.push(`${catDefs.length} دسته‌بندی استعداد ایجاد شد`);

  // ── Admin account (username + password) ──
  const adminUsername = "admin";
  const adminPassword = "admin123";
  let admin = await db.adminUser.findUnique({ where: { username: adminUsername } });
  if (!admin) {
    admin = await db.adminUser.create({
      data: {
        username: adminUsername,
        password: hashPassword(adminPassword),
        name: "مدیر همتیم",
      },
    });
    log.push(`اکانت ادمین ایجاد شد (نام کاربری: ${adminUsername} / رمز: ${adminPassword})`);
  }

  // ── Demo talent users ──
  const skillId = async (catName: string, skillName: string) => {
    const cat = await db.category.findUnique({ where: { name: catName } });
    if (!cat) return null;
    const s = await db.skill.findUnique({
      where: { categoryId_name: { categoryId: cat.id, name: skillName } },
    });
    return s?.id ?? null;
  };

  const demoUsers = [
    { name: "نیلوفر رضایی", phone: "09121110001", cat: "موسیقی", skills: ["خوانندگی", "نوازندگی گیتار"], bio: "خواننده و گیتاریست", province: "tehran", city: "تهران", verified: true },
    { name: "آرش محمدی", phone: "09121110002", cat: "برنامه‌نویسی و توسعه", skills: ["فرانت‌اند", "بک‌اند"], bio: "توسعه‌دهنده فول‌استک", province: "tehran", city: "تهران", verified: true },
    { name: "سحر کریمی", phone: "09121110003", cat: "طراحی گرافیک و UI/UX", skills: ["UI/UX دیزاین", "طراحی لوگو"], bio: "طراح محصول و گرافیک", province: "esfahan", city: "اصفهان", verified: false },
    { name: "بهراد تبریزی", phone: "09121110004", cat: "فیلم و سینما", skills: ["فیلمبرداری", "تدوین ویدیو"], bio: "فیلمبردار و تدوین‌گر", province: "azarbaijan-sharghi", city: "تبریز", verified: false },
    { name: "مرجان احمدی", phone: "09121110005", cat: "نویسندگی و محتوا", skills: ["کپی‌رایتینگ", "تولید محتوای دیجیتال"], bio: "تولیدکننده محتوا", province: "fars", city: "شیراز", verified: true },
    { name: "کیان جعفری", phone: "09121110006", cat: "ورزش و مربی‌گری", skills: ["کراس‌فیت", "بدنسازی"], bio: "مربی بدنسازی و کراس‌فیت", province: "mazandaran", city: "ساری", verified: false },
    { name: "دنیا صادقی", phone: "09121110007", cat: "موسیقی", skills: ["نوازندگی پیانو", "خوانندگی"], bio: "پیانیست کلاسیک", province: "tehran", city: "تهران", verified: false },
    { name: "سینا نوری", phone: "09121110008", cat: "بازی‌سازی", skills: ["بازی‌سازی یونیتی", "گیم‌دیزاین"], bio: "توسعه‌دهنده بازی موبایل", province: "khorasan-razavi", city: "مشهد", verified: true },
    { name: "الهام قاسمی", phone: "09121110009", cat: "ترجمه و زبان", skills: ["ترجمه انگلیسی", "تدریس مکالمه"], bio: "مدرس و مترجم زبان انگلیسی", province: "gilan", city: "رشت", verified: false },
    { name: "پارسا شریفی", phone: "09121110010", cat: "آشپزی و شیرینی‌پزی", skills: ["آشپزی ایرانی", "شیرینی‌پزی"], bio: "سرآشپز و شیرینی‌پز", province: "alborz", city: "کرج", verified: false },
    { name: "تینا مرادی", phone: "09121110011", cat: "مد و طراحی لباس", skills: ["طراحی لباس", "خیاطی"], bio: "طراح مد و لباس", province: "tehran", city: "تهران", verified: true },
    { name: "حسین رستمی", phone: "09121110012", cat: "سخنوری و رسانه", skills: ["پادکست", "گویندگی"], bio: "پادکستر و گوینده", province: "tehran", city: "تهران", verified: false },
  ];

  const createdUsers: { id: string; name: string }[] = [];
  for (const d of demoUsers) {
    let u = await db.user.findUnique({ where: { phone: d.phone } });
    if (!u) {
      const catId = catMap.get(d.cat)!;
      const skillIds: string[] = [];
      for (const sk of d.skills) {
        const sid = await skillId(d.cat, sk);
        if (sid) skillIds.push(sid);
      }
      u = await db.user.create({
        data: {
          name: d.name,
          phone: d.phone,
          isVerifiedBadge: d.verified,
          profile: {
            create: {
              bioShort: d.bio,
              bioLong: `${d.bio} — فعال در حوزه‌ی ${d.cat}. علاقه‌مند به همکاری در پروژه‌های خلاقانه و نمایش استعداد.`,
              province: d.province,
              city: d.city,
              resume: {
                create: {
                  experiences: {
                    create: [
                      {
                        jobTitle: d.bio,
                        organization: "استودیو خلاقیت نوین",
                        startDate: "۱۴۰۰",
                        endDate: "۱۴۰۳",
                        description: "همکاری تخصصی در پروژه‌های مرتبط.",
                        categoryId: catId,
                        skillId: skillIds[0] ?? null,
                      },
                    ],
                  },
                  educations: {
                    create: [
                      { degree: "کارشناسی ارشد", institution: "دانشگاه تهران", year: "۱۴۰۰", description: "" },
                    ],
                  },
                },
              },
            },
          },
          userCategories: { create: { categoryId: catId } },
          userSkills: { create: skillIds.map((sid) => ({ skillId: sid })) },
        },
      });
    }
    createdUsers.push({ id: u.id, name: d.name });
  }
  log.push(`${createdUsers.length} کاربر استعداد نمونه ایجاد شد`);

  // ── Demo posts (talent showcases) ──
  const postContents = [
    "یک قطعه‌ی جدید موسیقی ضبط کردم 🎸 نظرتون چیه؟ به دنبال همکار برای پروژه‌ی آلبوم هستم.",
    "پروژه‌ی جدید طراحی UI رو تموم کردم 🎨 تجربه‌ی کاربری خیلی ناز شده.",
    "عکاسی از طبیعت پاییزی شمال 🍂 رنگ‌ها فوق‌العاده بودن.",
    "تدوین یک تیزر تبلیغاتی برای برند کافه محلی. نظراتتون؟",
    "پادکست جدیدم منتشر شد 🎙️ موضوع: استعدادهای پنهان جامعه‌ی فارسی.",
    "تمرینات کراس‌فیت امروز واقعاً سنگین بود 😅 اما عالی.",
    "آموزش نوازندگی پیانو برای مبتدی‌ها — ویدیوی جدید روی کانالم.",
    "مدل سه‌بعدی یک شخصیت برای بازی جدیدم 🎮",
    "دسر جدید برای منوی کافه طراحی کردم 🍰 اسمش رو چی بذارم؟",
    "طراحی لباس مجموعه‌ی پاییزم امسال 👗",
    "ویدیوی جدید استندآپ کمدی من منتشر شد 😂",
    "ترجمه‌ی یک مقاله‌ی علمی درباره‌ی هوش مصنوعی تمام شد 🤖",
  ];

  const existingPosts = await db.post.count();
  if (existingPosts < 5) {
    for (let i = 0; i < createdUsers.length; i++) {
      const u = createdUsers[i];
      const content = postContents[i % postContents.length];
      const user = await db.user.findUnique({
        where: { id: u.id },
        include: { userSkills: { include: { skill: true } } },
      });
      if (!user || user.userSkills.length === 0) continue;
      const firstSkill = user.userSkills[0].skill;
      await db.post.create({
        data: {
          userId: user.id,
          content,
          categoryId: firstSkill.categoryId,
          skillId: firstSkill.id,
        },
      });
    }
    log.push("پست‌های نمونه (نمایش استعداد) ایجاد شد");
  }

  // ── Demo likes ──
  if ((await db.postLike.count()) < 3) {
    const posts = await db.post.findMany({ take: 8 });
    for (const p of posts) {
      const others = createdUsers.filter((u) => u.id !== p.userId).slice(0, 4);
      for (const ou of others) {
        try {
          await db.postLike.create({ data: { postId: p.id, userId: ou.id } });
        } catch { /* ignore dup */ }
      }
    }
    log.push("لایک‌های نمونه ایجاد شد");
  }

  // ── Demo connections ──
  if ((await db.connection.count()) < 2) {
    await db.connection.create({ data: { requesterId: createdUsers[0].id, receiverId: createdUsers[1].id, status: "accepted" } });
    await db.connection.create({ data: { requesterId: createdUsers[2].id, receiverId: createdUsers[0].id, status: "accepted" } });
    await db.connection.create({ data: { requesterId: createdUsers[3].id, receiverId: createdUsers[0].id, status: "pending" } });
    log.push("ارتباطات نمونه ایجاد شد");
  }

  return NextResponse.json({ ok: true, log });
}
