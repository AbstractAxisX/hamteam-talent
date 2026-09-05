import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

// Seed: creates talent categories + skills + admin account + demo users.
// ⚠️ فقط برای توسعه — در تولید غیرفعال است (ایجاد ادمین/دیتای دمو عمومی نباشد)
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "غیرفعال در محیط تولید" }, { status: 403 });
  }
  const log: string[] = [];

  // ── Talent categories (with emoji icons) ──
  const catDefs: { name: string; icon: string; color: string; skills: string[] }[] = [
    { name: "موسیقی", icon: "🎵", color: "#9333ea", skills: ["خوانندگی", "نوازندگی گیتار", "نوازندگی پیانو", "نوازندگی ویولن", "نوازندگی سنتور", "نوازندگی تنبک", "ترانه‌سرایی", "تنظیم موسیقی", "آواز سنتی", "آواز پاپ"] },
    { name: "سخنوری و رسانه", icon: "🎙️", color: "#dc2626", skills: ["پادکست", "دوبلاژ", "گویندگی", "ارباب حلقه", "میزبانی", "گزارشگری"] },
    { name: "نویسندگی و محتوا", icon: "✍️", color: "#475569", skills: ["نویسندگی داستان", "نویسندگی مقاله", "کپی‌رایتینگ", "سناریونویسی", "تولید محتوای دیجیتال", "وبلاگ‌نویسی"] },
    { name: "آشپزی و شیرینی‌پزی", icon: "🍳", color: "#ea580c", skills: ["آشپزی ایرانی", "آشپزی بین‌المللی", "شیرینی‌پزی", "کافه و باریستا", "شکلات‌سازی", "غذای گیاهی", "کنفکشنری"] },
    { name: "مدلینگ", icon: "📸", color: "#db2777", skills: ["مدل عکاسی", "مدل کاتالوگ", "مدل لباس", "مدل تبلیغاتی", "فیشن مدل"] },
    { name: "سرگرمی و تفریح", icon: "🎪", color: "#f97316", skills: ["کمدی و استندآپ", "شعبده‌بازی", "بازیگری", "شیمینوازی", "میم و نمایش"] },
    { name: "فیلم و سینما", icon: "🎬", color: "#b91c1c", skills: ["کارگردانی", "تدوین ویدیو", "فیلمبرداری", "عکاسی سینمایی", "جلوه‌های ویژه", "آنیمیشن", "تیزر تبلیغاتی", "دراپلاین"] },
    { name: "برنامه‌نویسی و توسعه", icon: "💻", color: "#0284c7", skills: ["فرانت‌اند", "بک‌اند", "موبایل", "هوش مصنوعی", "دواپس", "وب‌دیزاین"] },
    { name: "بازی‌سازی", icon: "🎮", color: "#65a30d", skills: ["بازی‌سازی یونیتی", "بازی‌سازی آنریل", "گیم‌دیزاین", "توسعه موبایل گیم", "بازی انلاین"] },
    { name: "آموزش و تدریس", icon: "📚", color: "#16a34a", skills: ["تدریس خصوصی", "آموزش آنلاین", "تدریس زبان", "تدریس موسیقی", "تدریس هنر", "تدریس علوم", "کوچینگ تحصیلی"] },
    { name: "بازاریابی و تبلیغات", icon: "📢", color: "#ca8a04", skills: ["بازاریابی دیجیتال", "سئو", "تبلیغات شبکه‌های اجتماعی", "برندینگ", "بازاریابی محتوا", "ایمیل مارکتینگ"] },
    { name: "ترجمه و زبان", icon: "🌍", color: "#0891b2", skills: ["ترجمه انگلیسی", "ترجمه عربی", "ترجمه ترکی", "ترجمه آلمانی", "ترجمه فرانسوی", "تدریس مکالمه"] },
    { name: "علم و پژوهش", icon: "🔬", color: "#6366f1", skills: ["پژوهش علمی", "تحلیل داده", "نوشتن مقاله علمی", "آمار", "هوش مصنوعی پژوهشی"] },
    { name: "طراحی گرافیک و UI/UX", icon: "🎨", color: "#e11d48", skills: ["طراحی لوگو", "طراحی پوستر", "UI/UX دیزاین", "موشن گرافیک", "تصویرسازی", "طراحی هویت بصری", "پروتوتایپ"] },
    { name: "کارآفرینی و استارتاپ", icon: "🚀", color: "#7c3aed", skills: ["توسعه کسب‌وکار", "مدیریت محصول", "فروش و مذاکره", "پیچ‌دک", "مدیریت تیم", "منتورینگ"] },
    { name: "مد و طراحی لباس", icon: "👗", color: "#be123c", skills: ["طراحی لباس", "خیاطی", "طراحی کیف و کفش", "استایلیست", "طراحی جواهر"] },
    { name: "فنی و تعمیرات", icon: "🔧", color: "#78716c", skills: ["تعمیر موبایل", "تعمیر کامپیوتر", "برق و الکترونیک", "تعمیرات خودرو", "لوله‌کشی", "نجاری"] },
    { name: "طراحی صنعتی", icon: "🏭", color: "#475569", skills: ["طراحی محصول", "مدل‌سازی سه‌بعدی", "پرینت سه‌بعدی", "طراحی قطعه", "نمونه‌سازی"] },
    { name: "طراحی ساختمان و داخلی", icon: "🏠", color: "#0e7490", skills: ["طراحی داخلی", "معماری", "طراحی نما", "ديزین مبلمان", "نورپردازی", "رندر سه‌بعدی"] },
    { name: "ورزش و مربی‌گری", icon: "⚽", color: "#15803d", skills: ["فوتبال", "بسکتبال", "شمیرا", "کراس‌فیت", "یوگا", "بوکس", "بدنسازی", "شنا", "مربی‌گری خصوصی", "ایروبیک"] },
  ];

  const catMap = new Map<string, string>();
  for (let i = 0; i < catDefs.length; i++) {
    const def = catDefs[i];
    const cat = await db.category.upsert({
      where: { name: def.name },
      update: { iconUrl: def.icon, color: def.color, order: i },
      create: { name: def.name, iconUrl: def.icon, color: def.color, order: i },
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
    { name: "نیلوفر رضایی", username: "niloofar_r", phone: "09121110001", cat: "موسیقی", skills: ["خوانندگی", "نوازندگی گیتار"], bio: "خواننده و گیتاریست", province: "tehran", city: "تهران", verified: true, gender: "female" },
    { name: "آرش محمدی", username: "arash_dev", phone: "09121110002", cat: "برنامه‌نویسی و توسعه", skills: ["فرانت‌اند", "بک‌اند"], bio: "توسعه‌دهنده فول‌استک", province: "tehran", city: "تهران", verified: true, gender: "male" },
    { name: "سحر کریمی", username: "sahar_design", phone: "09121110003", cat: "طراحی گرافیک و UI/UX", skills: ["UI/UX دیزاین", "طراحی لوگو"], bio: "طراح محصول و گرافیک", province: "esfahan", city: "اصفهان", verified: false, gender: "female" },
    { name: "بهراد تبریزی", username: "behrad_films", phone: "09121110004", cat: "فیلم و سینما", skills: ["فیلمبرداری", "تدوین ویدیو"], bio: "فیلمبردار و تدوین‌گر", province: "azarbaijan-sharghi", city: "تبریز", verified: false, gender: "male" },
    { name: "مرجان احمدی", username: "marjan_writes", phone: "09121110005", cat: "نویسندگی و محتوا", skills: ["کپی‌رایتینگ", "تولید محتوای دیجیتال"], bio: "تولیدکننده محتوا", province: "fars", city: "شیراز", verified: true, gender: "female" },
    { name: "کیان جعفری", username: "kian_fitness", phone: "09121110006", cat: "ورزش و مربی‌گری", skills: ["کراس‌فیت", "بدنسازی"], bio: "مربی بدنسازی و کراس‌فیت", province: "mazandaran", city: "ساری", verified: false, gender: "male" },
    { name: "دنیا صادقی", username: "donya_piano", phone: "09121110007", cat: "موسیقی", skills: ["نوازندگی پیانو", "خوانندگی"], bio: "پیانیست کلاسیک", province: "tehran", city: "تهران", verified: false, gender: "female" },
    { name: "سینا نوری", username: "sina_games", phone: "09121110008", cat: "بازی‌سازی", skills: ["بازی‌سازی یونیتی", "گیم‌دیزاین"], bio: "توسعه‌دهنده بازی موبایل", province: "khorasan-razavi", city: "مشهد", verified: true, gender: "male" },
    { name: "الهام قاسمی", username: "elaham_translate", phone: "09121110009", cat: "ترجمه و زبان", skills: ["ترجمه انگلیسی", "تدریس مکالمه"], bio: "مدرس و مترجم زبان انگلیسی", province: "gilan", city: "رشت", verified: false, gender: "female" },
    { name: "پارسا شریفی", username: "parsa_chef", phone: "09121110010", cat: "آشپزی و شیرینی‌پزی", skills: ["آشپزی ایرانی", "شیرینی‌پزی"], bio: "سرآشپز و شیرینی‌پز", province: "alborz", city: "کرج", verified: false, gender: "male" },
    { name: "تینا مرادی", username: "tina_fashion", phone: "09121110011", cat: "مد و طراحی لباس", skills: ["طراحی لباس", "خیاطی"], bio: "طراح مد و لباس", province: "tehran", city: "تهران", verified: true, gender: "female" },
    { name: "حسین رستمی", username: "hossein_voice", phone: "09121110012", cat: "سخنوری و رسانه", skills: ["پادکست", "گویندگی"], bio: "پادکستر و گوینده", province: "tehran", city: "تهران", verified: false, gender: "male" },
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
          username: d.username,
          phone: d.phone,
          isVerifiedBadge: d.verified,
          profile: {
            create: {
              bioShort: d.bio,
              bioLong: `${d.bio} — فعال در حوزه‌ی ${d.cat}. علاقه‌مند به همکاری در پروژه‌های خلاقانه و نمایش استعداد.`,
              province: d.province,
              city: d.city,
              gender: d.gender,
              mainCategoryId: catMap.get(d.cat),
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
