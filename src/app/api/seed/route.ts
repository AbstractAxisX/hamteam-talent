import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Seed endpoint — creates categories, skills, admin, and demo content.
// Call GET /api/seed to (re)initialize demo data. Idempotent-ish.
export async function GET() {
  const log: string[] = [];

  // Categories & skills
  const catDefs: { name: string; icon: string; skills: string[] }[] = [
    { name: "موسیقی", icon: "🎵", skills: ["گیتار", "ویولن", "پیانو", "آواز", "تنبک", "سنتور", "کمانچه"] },
    { name: "برنامه‌نویسی", icon: "💻", skills: ["فرانت‌اند", "بک‌اند", "موبایل", "هوش مصنوعی", "دواپس", "بازی‌سازی"] },
    { name: "طراحی", icon: "🎨", skills: ["گرافیک", "UI/UX", "موشن گرافیک", "طراحی لوگو", "تصویرسازی"] },
    { name: "ورزش", icon: "⚽", skills: ["فوتبال", "بسکتبال", "شمیرا", "کراس‌فیت", "یوگا", "بوکس"] },
    { name: "عکاسی و فیلم", icon: "📷", skills: ["عکاسی پرتره", "عکاسی محصول", "ادیت ویدیو", "تیزر تبلیغاتی", "دراپلاین"] },
    { name: "زبان", icon: "🗣️", skills: ["انگلیسی", "عربی", "ترکی", "آلمانی", "فرانسوی"] },
    { name: "آشپزی", icon: "🍳", skills: ["آشپزی ایرانی", "شیرینی‌پزی", "کافه و بارتندینگ", "گیاهی"] },
    { name: "نوشتن و محتوا", icon: "✍️", skills: ["تولید محتوا", "کپی‌رایتینگ", "ترجمه", "سناریونویسی"] },
  ];

  const catMap = new Map<string, string>();
  for (const def of catDefs) {
    const cat = await db.category.upsert({
      where: { name: def.name },
      update: { iconUrl: def.icon },
      create: { name: def.name, iconUrl: def.icon },
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
  log.push(`${catDefs.length} دسته‌بندی و مهارت‌ها ایجاد شدند`);

  // Helper to get skill id
  const skillId = async (catName: string, skillName: string) => {
    const cat = await db.category.findUnique({ where: { name: catName } });
    if (!cat) return null;
    const s = await db.skill.findUnique({
      where: { categoryId_name: { categoryId: cat.id, name: skillName } },
    });
    return s?.id ?? null;
  };

  // Admin user (seeded directly, bypassing validation)
  const adminPhone = "09120000000";
  let admin = await db.user.findUnique({ where: { phone: adminPhone } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        name: "مدیر سیستم",
        phone: adminPhone,
        nationalId: "1111111111",
        role: "admin",
        isVerifiedBadge: true,
        profile: {
          create: {
            bioShort: "مدیر پلتفرم همتیم",
            bioLong: "مدیریت و توسعه پلتفرم شبکه‌سازی حرفه‌ای همتیم.",
            province: "tehran",
            city: "تهران",
            resume: { create: {} },
          },
        },
      },
    });
    log.push("کاربر ادمین ایجاد شد (۰۹۱۲۰۰۰۰۰۰۰۰ / کد ملی ۱۱۱۱۱۱۱۱۱۱)");
  } else if (admin.role !== "admin") {
    admin = await db.user.update({ where: { id: admin.id }, data: { role: "admin", isVerifiedBadge: true } });
  }

  // Demo users
  const demoUsers = [
    { name: "نیلوفر رضایی", phone: "09121110001", nationalId: "1234567891", cat: "موسیقی", skills: ["گیتار", "آواز"], bio: "خواننده و گیتاریست", province: "tehran", city: "تهران", verified: true },
    { name: "آرش محمدی", phone: "09121110002", nationalId: "1234567892", cat: "برنامه‌نویسی", skills: ["فرانت‌اند", "بک‌اند"], bio: "توسعه‌دهنده فول‌استک", province: "tehran", city: "تهران", verified: true },
    { name: "سحر کریمی", phone: "09121110003", nationalId: "1234567893", cat: "طراحی", skills: ["UI/UX", "گرافیک"], bio: "طراح محصول و گرافیک", province: "esfahan", city: "اصفهان", verified: false },
    { name: "بهراد تبریزی", phone: "09121110004", nationalId: "1234567894", cat: "عکاسی و فیلم", skills: ["عکاسی پرتره", "ادیت ویدیو"], bio: "عکاس و تدوین‌گر", province: "azarbaijan-sharghi", city: "تبریز", verified: false },
    { name: "مرجان احمدی", phone: "09121110005", nationalId: "1234567895", cat: "نوشتن و محتوا", skills: ["تولید محتوا", "کپی‌رایتینگ"], bio: "تولیدکننده محتوای دیجیتال", province: "fars", city: "شیراز", verified: true },
    { name: "کیان جعفری", phone: "09121110006", nationalId: "1234567896", cat: "ورزش", skills: ["کراس‌فیت", "بوکس"], bio: "مربی بدنسازی و کراس‌فیت", province: "mazandaran", city: "ساری", verified: false },
    { name: "دنیا صادقی", phone: "09121110007", nationalId: "1234567897", cat: "موسیقی", skills: ["پیانو", "آواز"], bio: "پیانیست کلاسیک", province: "tehran", city: "تهران", verified: false },
    { name: "سینا نوری", phone: "09121110008", nationalId: "1234567898", cat: "برنامه‌نویسی", skills: ["موبایل", "هوش مصنوعی"], bio: "توسعه‌دهنده موبایل و AI", province: "khorasan-razavi", city: "مشهد", verified: true },
    { name: "الهام قاسمی", phone: "09121110009", nationalId: "1234567899", cat: "زبان", skills: ["انگلیسی", "ترکی"], bio: "مدرس زبان انگلیسی", province: "gilan", city: "رشت", verified: false },
    { name: "پارسا شریفی", phone: "09121110010", nationalId: "2234567891", cat: "آشپزی", skills: ["آشپزی ایرانی", "شیرینی‌پزی"], bio: "سرآشپز و شیرینی‌پز", province: "alborz", city: "کرج", verified: false },
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
          nationalId: d.nationalId,
          isVerifiedBadge: d.verified,
          profile: {
            create: {
              bioShort: d.bio,
              bioLong: `${d.bio} — فعال در حوزه‌ی ${d.cat}. علاقه‌مند به همکاری در پروژه‌های خلاقانه.`,
              province: d.province,
              city: d.city,
              resume: {
                create: {
                  experiences: {
                    create: [
                      {
                        jobTitle: d.bio,
                        organization: "آژانس خلاقیت نوین",
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
  log.push(`${createdUsers.length} کاربر نمونه ایجاد شدند`);

  // Demo posts
  const postContents = [
    "پروژه‌ی جدید موسیقی رو شروع کردم 🎸 به دنبال یک نوازنده‌ی ویولن برای همکاری می‌گردم. کسی علاقه داره؟",
    "یک کتابخانه‌ی جدید ری‌اکت اوپن‌سورس کردم 🚀 ممنون می‌شم تست کنید و بازخورد بدید.",
    "طراحی لوگوی جدید برای یک برند کافه محلی. نظراتتون چیه؟",
    "عکاسی از طبیعت شمال در پاییز 🍂 رنگ‌ها فوق‌العاده بودن.",
    "دوره‌ی جدید تولید محتوای متنی رو منتشر کردم. مناسب بازاریاب‌ها و سازندگان محتوا.",
    "تمرینات کراس‌فیت امروز واقعاً سنگین بود اما حال‌خوب 😅",
    "ضبط پیانو برای آلبوم جدید دارم انجام می‌دم. روزهای طولانی و پر از الهام.",
    "مدل جدید زبان فارسی رو آموزش دادم. نتایج جالبیه!",
    "کلاس آنلاین مکالمه انگلیسی از هفته‌ی آینده شروع می‌شه. ظرفیت محدود.",
    "دسر جدید برای منوی کافه طراحی کردم 🍰 بگو باشید اسمش چی باشه؟",
  ];

  const existingPosts = await db.post.count();
  if (existingPosts < 5) {
    for (let i = 0; i < createdUsers.length; i++) {
      const u = createdUsers[i];
      const content = postContents[i % postContents.length];
      const user = await db.user.findUnique({
        where: { id: u.id },
        include: { profile: true, userSkills: { include: { skill: true } }, userCategories: true },
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
    log.push("پست‌های نمونه ایجاد شدند");
  }

  // Demo likes (a few)
  if ((await db.postLike.count()) < 3) {
    const posts = await db.post.findMany({ take: 6 });
    for (const p of posts) {
      const otherUsers = createdUsers.filter((u) => u.id !== p.userId).slice(0, 3);
      for (const ou of otherUsers) {
        try {
          await db.postLike.create({ data: { postId: p.id, userId: ou.id } });
        } catch {
          /* ignore dup */
        }
      }
    }
    log.push("لایک‌های نمونه ایجاد شدند");
  }

  // Demo job posts
  const jobDefs = [
    { userIdx: 1, title: "نیاز به نوازنده گیتار برای کنسرت", desc: "برای یک کنسرت خصوصی به یک نوازنده گیتار حرفه‌ای نیاز دارم. دو ساعت تمرین و یک شب اجرا.", cat: "موسیقی", skills: ["گیتار"], city: "تهران", province: "tehran" },
    { userIdx: 2, title: "تیم‌سازی استارتاپ فین‌تک", desc: "استارتاپ ما به یک توسعه‌دهنده بک‌اند با تجربه نیاز دارد. مدل فول‌تایم ریموت.", cat: "برنامه‌نویسی", skills: ["بک‌اند", "دواپس"], city: "تهران", province: "tehran" },
    { userIdx: 4, title: "عکاس محصول برای فروشگاه آنلاین", desc: "برای کاتالوگ محصولات به عکاس محصول نیاز داریم. ۵۰ محصول.", cat: "عکاسی و فیلم", skills: ["عکاسی محصول"], city: "تبریز", province: "azarbaijan-sharghi" },
    { userIdx: 6, title: "مربی کراس‌فیت برای باشگاه جدید", desc: "باشگاه ورزشی جدید به دو مربی کراس‌فیت نیاز دارد. صبح‌ها.", cat: "ورزش", skills: ["کراس‌فیت"], city: "ساری", province: "mazandaran" },
    { userIdx: 5, title: "کپی‌رایتر برای کمپین تبلیغاتی", desc: "برای کمپین تبلیغاتی یک برند پوشاک به کپی‌رایتر خلاق نیاز داریم.", cat: "نوشتن و محتوا", skills: ["کپی‌رایتینگ", "تولید محتوا"], city: "شیراز", province: "fars" },
    { userIdx: 8, title: "توسعه‌دهنده اپلیکیشن موبایل", desc: "پروژه اپلیکیشن آموزشی به یک توسعه‌دهنده موبایل نیازمند است.", cat: "برنامه‌نویسی", skills: ["موبایل"], city: "مشهد", province: "khorasan-razavi" },
  ];

  if ((await db.jobPost.count()) < 3) {
    for (const j of jobDefs) {
      const u = createdUsers[j.userIdx];
      const catId = catMap.get(j.cat);
      if (!catId || !u) continue;
      const skillIds: string[] = [];
      for (const sk of j.skills) {
        const sid = await skillId(j.cat, sk);
        if (sid) skillIds.push(sid);
      }
      await db.jobPost.create({
        data: {
          userId: u.id,
          title: j.title,
          description: j.desc,
          categoryId: catId,
          city: j.city,
          province: j.province,
          status: "open",
          skills: { create: skillIds.map((sid) => ({ skillId: sid })) },
        },
      });
    }
    log.push("آگهی‌های نیازمندی نمونه ایجاد شدند");
  }

  // Connections: admin follows a couple
  if ((await db.connection.count()) < 2) {
    await db.connection.create({ data: { requesterId: admin.id, receiverId: createdUsers[0].id, status: "accepted" } });
    await db.connection.create({ data: { requesterId: admin.id, receiverId: createdUsers[1].id, status: "accepted" } });
    await db.connection.create({ data: { requesterId: createdUsers[2].id, receiverId: admin.id, status: "pending" } });
    log.push("ارتباطات نمونه ایجاد شدند");
  }

  return NextResponse.json({ ok: true, log });
}
