// Seed کامل دموی همتیم — دسته‌بندی‌ها، کاربران، پست‌های برتر با رسانه، لایک و کامنت
// اجرا: bun scripts/seed-full.ts
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

const CATS: { name: string; icon: string; color: string; skills: string[] }[] = [
  { name: "موسیقی", icon: "🎵", color: "#059669", skills: ["خوانندگی", "سازی", "تدریس موسیقی", "آهنگسازی", "میکس و مستر"] },
  { name: "سخنوری و رسانه", icon: "🎙️", color: "#0d9488", skills: ["پادکست", "اجرای زنده", "گزارشگری", "دوبله"] },
  { name: "نویسندگی و محتوا", icon: "✍️", color: "#65a30d", skills: ["داستان‌نویسی", "کپیرایتینگ", "ترجمه", "سناریو"] },
  { name: "آشپزی و شیرینی‌پزی", icon: "🍳", color: "#d97706", skills: ["شیرینی‌پزی", "غذای ایرانی", "فوداستایل", "کیک‌دکور"] },
  { name: "هنرهای تجسمی", icon: "🎨", color: "#0891b2", skills: ["نقاشی دیجیتال", "طراحی گرافیک", "خوشنویسی", "مجسمه‌سازی"] },
  { name: "عکاسی و فیلم", icon: "📸", color: "#7c3aed", skills: ["عکاسی پرتره", "ادیت ویدیو", "موشن‌گرافیک"] },
  { name: "برنامه‌نویسی و توسعه", icon: "💻", color: "#2563eb", skills: ["فرانت‌اند", "بک‌اند", "موبایل", "دواپس"] },
  { name: "بازی‌سازی", icon: "🎮", color: "#db2777", skills: ["بازی‌سازی یونیتی", "طراحی گیم‌پلی", "پیکسل‌آرت"] },
  { name: "ورزش و تناسب", icon: "🏃", color: "#ea580c", skills: ["مربیگری", "یوگا", "کراس‌فیت", "کوهنوردی"] },
  { name: "آموزش و تدریس", icon: "📚", color: "#16a34a", skills: ["تدریس خصوصی", "ساخت دوره", "مشاوره تحصیلی"] },
  { name: "بازاریابی و تبلیغات", icon: "📢", color: "#ca8a04", skills: ["سئو", "شبکه‌های اجتماعی", "تبلیغات محتوایی"] },
  { name: "سرگرمی و تفریح", icon: "🎪", color: "#9333ea", skills: ["استندآپ", "شعبده‌بازی", "میم‌سازی"] },
];

const USERS: {
  phone: string; username: string; name: string; gender: "male" | "female";
  top?: boolean; verified?: boolean; province: string; city: string;
  bioShort: string; bioLong?: string; cat: string; skills: string[]; extraCats?: string[];
}[] = [
  {
    phone: "09121110001", username: "amilusi", name: "امیرحسین رستمی", gender: "male",
    top: true, verified: true, province: "تهران", city: "تهران",
    bioShort: "خواننده و آهنگساز — ترکیب موسیقی سنتی با پاپ مدرن 🎵",
    bioLong: "از بچگی با تار شروع کردم و حالا سه ساله که پروژه‌های شخصی‌ام رو منتشر می‌کنم. هدفم ساختن آلبومی هست که هویت موسیقی ایرانی رو با صدای امروز قاطی کنه.",
    cat: "موسیقی", skills: ["خوانندگی", "آهنگسازی", "میکس و مستر"],
  },
  {
    phone: "09121110002", username: "sara_dev", name: "سارا محمدی", gender: "female",
    top: true, verified: true, province: "تهران", city: "تهران",
    bioShort: "توسعه‌دهنده فول‌استک — عاشق اپن‌سورس و کد تمیز 💻",
    bioLong: "پنج ساله که با جاوااسکریپت و تایپ‌اسکریپت کار می‌کنم. چند تا کتابخانه اوپن‌سورس دارم و تو وقت آزادم مدرس برنامه‌نویسی هم هستم.",
    cat: "برنامه‌نویسی و توسعه", skills: ["فرانت‌اند", "بک‌اند"],
  },
  {
    phone: "09121110003", username: "mahdi_cake", name: "مهدی کریمی", gender: "male",
    top: true, province: "اصفهان", city: "اصفهان",
    bioShort: "شیرینی‌پز حرفه‌ای — کیک و شیرینی‌های ترتیف، سفارش آنلاین 🍰",
    bioLong: "با یه کوره خانگی شروع کردم و الان ورک‌شاپ خودمو دارم. تخصصم کیک‌های مناسبت و شیرینی‌های سنتی با پکیج مدرنه.",
    cat: "آشپزی و شیرینی‌پزی", skills: ["شیرینی‌پزی", "کیک‌دکور", "فوداستایل"],
  },
  {
    phone: "09121110004", username: "negin_art", name: "نگین احمدی", gender: "female",
    top: true, verified: true, province: "تهران", city: "کرج",
    bioShort: "تصویرگر دیجیتال — دنیای فانتزی رو با تبلت می‌سازم 🎨",
    bioLong: "تصویرسازی کتاب کودک کار می‌کنم و پروژه‌های شخصی‌ام بیشتر تو ژانر فانتزی و سای‌فایه. نقاشی دیجیتال رو خودم یاد گرفتم.",
    cat: "هنرهای تجسمی", skills: ["نقاشی دیجیتال", "طراحی گرافیک"],
  },
  {
    phone: "09121110005", username: "reza_fit", name: "رضا نوری", gender: "male",
    province: "تهران", city: "تهران",
    bioShort: "مربی کراس‌فیت و ایروبیک — برنامه آنلاین و حضوری 💪",
    cat: "ورزش و تناسب", skills: ["مربیگری", "کراس‌فیت"],
  },
  {
    phone: "09121110006", username: "parham_game", name: "پرهام صادقی", gender: "male",
    top: true, province: "گیلان", city: "رشت",
    bioShort: "بازی‌ساز ایندی — دارم یه پازل-اکشن موبایلی می‌سازم 🎮",
    bioLong: "با یونیتی کار می‌کنم و هنوز تو مرحله آلفای بازی اولم هستم. همه‌چیزش رو خودم می‌سازم از کد تا آرت.",
    cat: "بازی‌سازی", skills: ["بازی‌سازی یونیتی", "طراحی گیم‌پلی", "پیکسل‌آرت"],
  },
  {
    phone: "09121110007", username: "mahtab_voice", name: "مهتاب رضایی", gender: "female",
    verified: true, province: "تهران", city: "تهران",
    bioShort: "گوینده و دوبلور — صدای گرم برای برند شما 🎙️",
    cat: "سخنوری و رسانه", skills: ["دوبله", "اجرای زنده"],
  },
  {
    phone: "09121110008", username: "ali_pen", name: "علی شریفی", gender: "male",
    province: "خراسان رضوی", city: "مشهد",
    bioShort: "نویسنده و کپی‌رایتر — قصه‌های کوتاه و محتوای برند ✍️",
    cat: "نویسندگی و محتوا", skills: ["داستان‌نویسی", "کپیرایتینگ"],
  },
  {
    phone: "09121110009", username: "roya_lens", name: "رویا عباسی", gender: "female",
    top: true, province: "تهران", city: "تهران",
    bioShort: "عکاس پرتره و ادیتور — نور، احساس، قاب 📸",
    cat: "عکاسی و فیلم", skills: ["عکاسی پرتره", "ادیت ویدیو"],
  },
  {
    phone: "09121110010", username: "kian_teacher", name: "کیان زارع", gender: "male",
    province: "فارس", city: "شیراز",
    bioShort: "مدرس ریاضی — کنکور رو آسون می‌کنیم 📚",
    cat: "آموزش و تدریس", skills: ["تدریس خصوصی", "ساخت دوره"],
  },
];

const POSTS: {
  phone: string; content: string; cat: string; skill: string;
  media?: { url: string; type: "image"; fileName: string }[]; minutesAgo: number;
}[] = [
  {
    phone: "09121110001",
    content: "اجرای زنده‌ی هفته‌ی پیش در استودیو 🎵 این قطعه ترکیبیه از موسیقی سنتی و پاپ. نظراتتون برام خیلی مهمه!",
    cat: "موسیقی", skill: "خوانندگی",
    media: [{ url: "/seed/seed-music.png", type: "image", fileName: "live-session.png" }],
    minutesAgo: 180,
  },
  {
    phone: "09121110002",
    content: "کتابخانه‌ی جدیدم منتشر شد 🚀 یه ابزار ری‌اکت برای انیمیشن‌های نرم با فریم‌ورک مستقل. چند ماه روش کار کردم، حالا نوبت شماست که تست کنید و استار بدید!",
    cat: "برنامه‌نویسی و توسعه", skill: "فرانت‌اند",
    media: [{ url: "/seed/seed-code.png", type: "image", fileName: "workspace.png" }],
    minutesAgo: 320,
  },
  {
    phone: "09121110003",
    content: "سفارش جدید امروز: کیک سه طبقه‌ی تولد با کرم فندقی و تزیین مینیمال 🍰 صبح از ساعت ۵ درگیرش بودم. نظرتون درباره‌ی رنگ‌بندیش چیه؟",
    cat: "آشپزی و شیرینی‌پزی", skill: "کیک‌دکور",
    media: [{ url: "/seed/seed-cooking.png", type: "image", fileName: "cake-decor.png" }],
    minutesAgo: 90,
  },
  {
    phone: "09121110004",
    content: "آخرین کار شخصی‌ام: منظره‌ی فانتزی با پالت سبز-طلایی 🌿✨ حدود ۱۸ ساعت طول کشید. نسخه‌ی پرینت‌شده هم آماده دارم برای علاقه‌مندا.",
    cat: "هنرهای تجسمی", skill: "نقاشی دیجیتال",
    media: [{ url: "/seed/seed-art.png", type: "image", fileName: "fantasy-art.png" }],
    minutesAgo: 540,
  },
  {
    phone: "09121110006",
    content: "گیم‌پلی از بازی جدیدم که دارم روش کار می‌کنم 🎮 یه بازی موبایل با سبک پازل-اکشن. هنوز در مرحله‌ی آلفاست ولی حس خوبی داره. کسی هست بتست کنه؟",
    cat: "بازی‌سازی", skill: "بازی‌سازی یونیتی",
    media: [{ url: "/seed/seed-game.png", type: "image", fileName: "gameplay.png" }],
    minutesAgo: 720,
  },
  {
    phone: "09121110005",
    content: "برنامه‌ی تمرین این هفته آماده شد 💪 چهار روز در هفته، هر جلسه ۴۵ دقیقه، مناسب همه‌ی سطوح. تو دایرکت پیام بدید تا براتون بفرستم.",
    cat: "ورزش و تناسب", skill: "مربیگری",
    minutesAgo: 60,
  },
  {
    phone: "09121110009",
    content: "قاب امروز از پروژه‌ی پرتره در استودیو 📸 نور طبیعی + یه رفلکتور ساده. مدل: دوستم مهتاب. بدون ادیت سنگین، همون خام بهتره.",
    cat: "عکاسی و فیلم", skill: "عکاسی پرتره",
    media: [{ url: "/seed/seed-sport.png", type: "image", fileName: "portrait-light.png" }],
    minutesAgo: 1200,
  },
];

const COMMENTS = [
  "عالی بود! ادامه بده 🔥",
  "ممنون از اشتراک‌گذاری، خیلی مفید بود",
  "وای چقدر زیبا! 🎉",
  "سوالم اینه که چطور شروع کردی؟",
  "خیلی حرفه‌ای انجام دادید 👏",
  "این دقیقاً چیزی بود که نیاز داشتم",
  "خسته نباشی، واقعاً استعدادی 🌟",
  "چند وقته روش کار می‌کردی؟",
];
const REPLIES = ["ممنون از نظرت! 🙏", "مرسی! ❤️", "خوشحالم خوشت اومده", "به زودی قسمت دومش میاد"];


/* ── بنرهای دمو (اسلایدر صفحه اصلی) — idempotent روی عنوان ── */
async function seedBanners() {
  const count = await db.banner.count();
  if (count > 0) {
    console.log(`✓ Banners: ${count} existing (skip)`);
    return;
  }
  const BANNERS = [
    {
      title: "مسابقه استعدادیابی همتیم",
      subtitle: "فصل اول · ثبت‌نام باز است",
      imageUrl: "/seed/seed-music.png",
      linkUrl: "#/top-talent",
      order: 0,
    },
    {
      title: "استعدادهای برتر را کشف کن",
      subtitle: "برگزیده‌های جامعه همتیم",
      imageUrl: "/seed/seed-art.png",
      linkUrl: "#/explore",
      order: 1,
    },
    {
      title: "جامعه هنرمندان دیجیتال",
      subtitle: "عضویت رایگان برای همیشه",
      imageUrl: "/seed/seed-code.png",
      linkUrl: "#/discover",
      order: 2,
    },
  ];
  for (const b of BANNERS) {
    await db.banner.create({ data: b });
  }
  console.log(`✓ Banners: ${BANNERS.length} created`);
}

async function run() {
  const catCount = await db.category.count();
  const userCount = await db.user.count();

  // ترمیم پرچم‌ها/نام‌کاربری کاربران دمو حتی وقتی seed کامل skip شود
  for (const u of USERS) {
    await db.user.update({
      where: { phone: u.phone },
      data: { username: u.username, name: u.name, isVerifiedBadge: !!u.verified, isTopTalent: !!u.top },
    }).catch(() => {});
  }

  if (catCount > 0 && userCount > 1) {
    console.log(`DB already seeded (${catCount} cats, ${userCount} users) — skipping.`);
    await seedNeeds();
    await db.$disconnect();
    return;
  }

  // 1) Categories + skills
  const catMap = new Map<string, { id: string; skillIds: Map<string, string> }>();
  for (let i = 0; i < CATS.length; i++) {
    const c = CATS[i];
    const cat = await db.category.upsert({
      where: { name: c.name },
      create: { name: c.name, iconUrl: c.icon, color: c.color, order: i },
      update: { iconUrl: c.icon, color: c.color, order: i },
    });
    const skillIds = new Map<string, string>();
    for (const s of c.skills) {
      const skill = await db.skill.upsert({
        where: { categoryId_name: { categoryId: cat.id, name: s } },
        create: { categoryId: cat.id, name: s },
        update: {},
      });
      skillIds.set(s, skill.id);
    }
    catMap.set(c.name, { id: cat.id, skillIds });
    console.log(`✓ Category: ${c.name} (${c.skills.length} skills)`);
  }

  // 2) Users + profiles + categories/skills
  const userMap = new Map<string, string>();
  for (const u of USERS) {
    const cat = catMap.get(u.cat)!;
    const user = await db.user.upsert({
      where: { phone: u.phone },
      create: {
        phone: u.phone,
        username: u.username,
        name: u.name,
        isVerifiedBadge: !!u.verified,
        isTopTalent: !!u.top,
      },
      update: {
        username: u.username,
        name: u.name,
        isVerifiedBadge: !!u.verified,
        isTopTalent: !!u.top,
      },
    });
    await db.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bioShort: u.bioShort,
        bioLong: u.bioLong || "",
        gender: u.gender,
        province: u.province,
        city: u.city,
        mainCategoryId: cat.id,
      },
      update: {},
    });
    await db.userCategory.upsert({
      where: { userId_categoryId: { userId: user.id, categoryId: cat.id } },
      create: { userId: user.id, categoryId: cat.id },
      update: {},
    });
    for (const s of u.skills) {
      const sid = cat.skillIds.get(s);
      if (sid) {
        await db.userSkill.upsert({
          where: { userId_skillId: { userId: user.id, skillId: sid } },
          create: { userId: user.id, skillId: sid },
          update: {},
        });
      }
    }
    userMap.set(u.phone, user.id);
    console.log(`✓ User: ${u.name} (${u.username}${u.top ? " ★top" : ""})`);
  }

  // 3) Admin
  const adminCount = await db.adminUser.count();
  if (adminCount === 0) {
    await db.adminUser.create({
      data: { username: "admin", password: hashPassword("admin123"), name: "مدیر همتیم" },
    });
    console.log("✓ Admin: admin / admin123");
  }

  // 4) Posts + media
  const allUserIds = [...userMap.values()];
  for (const p of POSTS) {
    const uid = userMap.get(p.phone)!;
    const cat = catMap.get(p.cat)!;
    const skillId = cat.skillIds.get(p.skill)!;
    const existing = await db.post.findFirst({ where: { content: p.content } });
    if (existing) {
      if (!existing.isFeatured) {
        await db.post.update({ where: { id: existing.id }, data: { isFeatured: true } });
      }
      continue;
    }
    const post = await db.post.create({
      data: {
        userId: uid,
        content: p.content,
        categoryId: cat.id,
        skillId,
        isFeatured: true,
        createdAt: new Date(Date.now() - p.minutesAgo * 60 * 1000),
      },
    });
    for (let i = 0; i < (p.media || []).length; i++) {
      const m = p.media![i];
      await db.postMedia.create({
        data: { postId: post.id, url: m.url, type: m.type, fileName: m.fileName, order: i, fileSize: 0 },
      });
    }

    // Likes (3-8)
    const numLikes = 3 + Math.floor(Math.random() * 6);
    const shuffled = [...allUserIds].sort(() => Math.random() - 0.5).slice(0, numLikes);
    for (const liker of shuffled) {
      if (liker !== uid) {
        try { await db.postLike.create({ data: { postId: post.id, userId: liker } }); } catch { }
      }
    }

    // Comments (1-3, some with replies)
    const numComments = 1 + Math.floor(Math.random() * 3);
    const commenters = [...allUserIds].sort(() => Math.random() - 0.5).slice(0, numComments);
    for (const commenter of commenters) {
      if (commenter === uid) continue;
      const text = COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
      const comment = await db.comment.create({
        data: { postId: post.id, userId: commenter, content: text },
      });
      if (Math.random() > 0.45) {
        await db.comment.create({
          data: { postId: post.id, userId: uid, content: REPLIES[Math.floor(Math.random() * REPLIES.length)], parentId: comment.id },
        });
      }
    }
    console.log(`✓ Post: ${p.content.slice(0, 42)}…`);
  }

  const finalPosts = await db.post.count({ where: { isFeatured: true } });
  const finalLikes = await db.postLike.count();
  const finalComments = await db.comment.count();
  console.log(`\nDone: ${finalPosts} featured posts · ${finalLikes} likes · ${finalComments} comments`);
  await seedNeeds();
  await seedBanners();
  await db.$disconnect();
}

// ── نیازمندی‌های دمو (JobPost) — با idempotency روی عنوان ──
const NEEDS: {
  phone: string; title: string; description: string; cat: string;
  skills: string[]; province: string; city: string; minutesAgo: number;
}[] = [
  {
    phone: "09121110001", title: "همخوان برای پروژه آلبوم سنتی-پاپ",
    description: "برای ضبط دو قطعه از آلبوم جدیدم یه همخوان خانم با صدای بم دنبالم. تمرین‌ها تو استودیوی مرکزی و ضبط پایان ماه. حضور در جلسه تنظیم هم لازمه.",
    cat: "موسیقی", skills: ["خوانندگی"], province: "tehran", city: "تهران", minutesAgo: 90,
  },
  {
    phone: "09121110002", title: "کمک برای توسعه اپلیکیشن همتیم (پارت‌تایم)",
    description: "دنبال یه فرانت‌اند کار مسلط به React و Tailwind هستم که ۲۰ ساعت در هفته با تیم ما کار کنه. پروژه اوپن‌سورس و ریموت کامله، آشنایی با TypeScript الزامیه.",
    cat: "برنامه‌نویسی و توسعه", skills: ["فرانت‌اند"], province: "tehran", city: "تهران", minutesAgo: 260,
  },
  {
    phone: "09121110003", title: "شیرینی‌پز برای ورک‌شاپ سفارشی عید",
    description: "برای فصل عید به یه شیرینی‌پز حرفه‌ای برای خط تولید کیک فوت‌لر نیاز دارم. محیط کاری شاد و حقوق توافقی، سابقه دکور کیک حتماً با نمونه کار بررسی میشه.",
    cat: "آشپزی و شیرینی‌پزی", skills: ["شیرینی‌پزی", "کیک‌دکور"], province: "esfahan", city: "اصفهان", minutesAgo: 700,
  },
  {
    phone: "09121110005", title: "مربی یوگا صبحگاهی — سانس ۷",
    description: "باشگاه ما تو غرب تهران برای سانس صبح به یه مربی یوگا خانم نیاز داره. دو جلسه در هفته با امکان افزایش، مدرک مربیگری معتبر لازمه.",
    cat: "ورزش و تناسب", skills: ["یوگا"], province: "tehran", city: "تهران", minutesAgo: 1500,
  },
  {
    phone: "09121110006", title: "پیکسل‌آرتیست برای بازی ایندی",
    description: "برای بازی پازل-اکشن موبایلی‌مون یه پیکسل‌آرتیست خلاق می‌خوایم که استایل ۱۶-بیت رو خوب بفهمه. همکاری درصدی از فروش یا پروژه‌ای، تو رشت ریموت.",
    cat: "بازی‌سازی", skills: ["پیکسل‌آرت", "طراحی گیم‌پلی"], province: "gilan", city: "رشت", minutesAgo: 2200,
  },
  {
    phone: "09121110008", title: "کپی‌رایتر برای کمپین تبلیغاتی رستوران",
    description: "برای کمپین افتتاح شعبه دوم رستوران، محتوای تبلیغاتی فارسی روان و خلاقانه لازم داریم. سه متن کوتاه برای بنر و یه متن بلند برای شبکه‌های اجتماعی.",
    cat: "نویسندگی و محتوا", skills: ["کپیرایتینگ"], province: "khorasan-razavi", city: "مشهد", minutesAgo: 3200,
  },
];

async function seedNeeds() {
  const needCount = await db.jobPost.count();
  if (needCount > 0) {
    console.log(`Needs already seeded (${needCount}) — skipping.`);
    return;
  }
  for (const n of NEEDS) {
    const user = await db.user.findUnique({ where: { phone: n.phone } });
    if (!user) continue;
    const cat = await db.category.findUnique({ where: { name: n.cat } });
    const need = await db.jobPost.create({
      data: {
        userId: user.id,
        title: n.title,
        description: n.description,
        categoryId: cat?.id || null,
        province: n.province,
        city: n.city,
        status: "open",
        createdAt: new Date(Date.now() - n.minutesAgo * 60 * 1000),
      },
    });
    for (const s of n.skills) {
      const skill = await db.skill.findFirst({ where: { name: s } });
      if (skill) {
        await db.jobPostSkill.create({ data: { jobPostId: need.id, skillId: skill.id } }).catch(() => {});
      }
    }
    console.log(`✓ Need: ${n.title.slice(0, 40)}…`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
