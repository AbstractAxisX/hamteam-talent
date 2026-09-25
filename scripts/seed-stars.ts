// Seed «چهره برتر» — ستاره‌دهی سنگین + ویترین
// اجرا: bun scripts/seed-stars.ts
//
// منطق جدید چهره برتر (بر پایه ستاره):
//   ≥ 5000  ستاره → قاب طلایی   + اجازهٔ ویترین کردن پست‌های خود در صفحهٔ چهره برتر
//   ≥ 10000 ستاره → قاب رزگلد (خیلی خاص)
//
// این اسکریپت:
//   1) ۶۰ کاربر پشتیبان (rater) با پروفایل واقعی می‌سازد
//   2) برای امیرحسین (09121110001) پست‌های کافی + رأی همه → ~۵٬۳۰۰ ستاره (طلایی)
//   3) برای مهتاب (09121110007) پست‌های کافی + رأی همه → ~۱۰٬۴۰۰ ستاره (رزگلد)
//   4) چند پست برترشان را ویترین می‌کند
import { db } from "../src/lib/db";
import { userStarInfo, SILVER_THRESHOLD, GOLD_THRESHOLD } from "../src/lib/stars";

const FIRST_F = ["زهرا", "مریم", "نرگس", "پریسا", "شیرین", "لیلا", "آیدا", "نیلوفر", "سمانه", "روا", "مهسا", "الهام", "نازنین", "شیوا", "غزاله", "ترانه", "بهاره", "مینا", "سارینا", "هستی", "آوا", "دنیا", "رها", "یاسمین", "ملیکا", "ستایش", "نگار", "فرزانه", "شقایق", "بنفشه"];
const FIRST_M = ["محمد", "حسین", "رضا", "مهدی", "امیر", "سینا", "آرش", "بهراد", "فرزاد", "هومن", "بابک", "رامین", "سامان", "سیاوش", "مانی", "کاوه", "ایمان", "جمشید", "سهیل", "بردیا", "پویا", "میلاد", "احسان", "وحید", "بهنام", "سعید", "مسعود", "مصطفی", "حامد", "کارن"];
const LASTS = ["محمدی", "احمدی", "رضایی", "کریمی", "حسینی", "صادقی", "موسوی", "جعفری", "نوری", "تبریزی", "شیرازی", "اصفهانی", "رستمی", "قاسمی", "رحیمی", "کاظمی", "مرادی", "هاشمی", "امینی", "فراهانی", "زارع", "عباسی", "شریفی", "نوروزی", "بهرامی", "الهایی", "سلطانی", "یزدانی", "پارسا", "کیانی"];

const CITY_POOL: [string, string][] = [
  ["تهران", "تهران"], ["تهران", "کرج"], ["اصفهان", "اصفهان"], ["فارس", "شیراز"], ["خراسان رضوی", "مشهد"],
  ["آذربایجان شرقی", "تبریز"], ["گیلان", "رشت"], ["مازندران", "ساری"], ["خوزستان", "اهواز"], ["قم", "قم"],
  ["کرمان", "کرمان"], ["یزد", "یزد"], ["کرمانشاه", "کرمانشاه"], ["هرمزگان", "بندرعباس"], ["اردبیل", "اردبیل"],
];

// پست‌های اضافی امیرحسین — ۸ پست کوتاه واقعی
const AMIR_POSTS = [
  "دموی قطعهٔ جدید — هنوز میکس نهایی نشده ولی حسش رو دوست دارم 🎧",
  "پشت صحنهٔ ضبط دیروز؛ کلایر سخت‌گیر بود ولی نتیجه خوب شد 🎙️",
  "ملودی امروز که تو تاکسی اومد تو ذهنم! سریع ضبطش کردم 🎼",
  "یه رِیف جدید با تار — ترکیب کوک سنتی با ریتم مدرن 🎸",
  "جلسهٔ میکس با دوستم؛ سه ساعت فقط روی سنبادهٔ وکال کار کردیم 🎚️",
  "قسمت دوم آموزش هارمونی — امشب آپلود می‌کنم 📚",
  "ریتم جدید برای ترک بعدی، با تنبک و کیبورد الکترونیک 🥁",
  "نقدی که امروز از یه استاد بزرگ گرفتم: «صدات پخته‌تر شده» — روز خوبی بود ✨",
];

// پست‌های مهتاب — ۱۵ پست کوتاه واقعی (گوینده/دوبلور)
const MAHTAB_POSTS = [
  "دموی دوبلهٔ امروز — نقش یه شخصیت کارتونی با صدای بچه‌گانه 🎬",
  "بخشی از گویندگی تیزر تبلیغاتی جدید برند لباس 🎙️",
  "ورزش صوتی امروز: سه دقیقه «تریل و اسکِیل» — که زنگ نزنیم روی میکروفن 😄",
  "دموی صدای مستند — لحن روایتگری جدی و آرام 📽️",
  "یادگاری امروز: اولین کار دوبله‌ام هشت سال پیش! چقدر صدام عوض شده 🎧",
  "تیزر رادیویی برای کمپین فرهنگی — با افکت رادیو قدیمی 📻",
  "پادکست صوتی کوتاه: «چطور صدات رو حفظ کنی؟» سه ترفند ساده 🗣️",
  "دموی شخصیت شرور سریال انیمیشن — صدای خشن با اکو تاریک 😈",
  "امروز تو استودیو سه ساعت نریشن کتاب صوتی ضبط کردم — فشار بر vocal کم، آب زیاد 💧",
  "قطعهٔ گویندگی خبر — تمرین لحن رسمی و سریع 📰",
  "بک‌استیج ضبط تیزر؛ میکروفن سینه‌ای و اتاق خفه‌صدا 🎤",
  "دموی صدای راهنمای هوش مصنوعی — لحن صمیمی و روشن 🤖",
  "بخشی از اجرای زندهٔ دوبله روی تصویر — سخت‌ترین و شیرین‌ترین کار دنیا 🎞️",
  "صدای من توی اپلیکیشن آموزش زبانِ جدید — باینری‌ها با صدای من زنده شدن 🗺️",
  "مریخ! امروز نقش یه ربات گفتگوگر رو دوبله کردم 🚀 صدای متالیک با فیلتر 🤖",
  "دموی صدای نقش اول انیمیشن کوتاه — یک پرنسس شجاع با لحن گرم و باانرژی 👑",
];

const CAT_BY_PHONE: Record<string, { cat: string; skills: string[] }> = {
  "09121110001": { cat: "موسیقی", skills: ["خوانندگی", "آهنگسازی"] },
  "09121110007": { cat: "سخنوری و رسانه", skills: ["دوبله", "اجرای زنده"] },
};

async function ensureUser(phone: string) {
  return db.user.findUnique({ where: { phone }, select: { id: true, name: true } });
}

async function run() {
  const amir = await ensureUser("09121110001");
  const mahtab = await ensureUser("09121110007");
  if (!amir || !mahtab) {
    console.error("✗ کاربران اصلی seed-full پیدا نشدند — اول seed-full.ts را اجرا کنید");
    process.exit(1);
  }

  const categories = await db.category.findMany({ include: { skills: true } });
  const catFor = (name: string) => categories.find((c) => c.name === name);

  // ── 1) کاربران پشتیبان (۶۰ نفر) — رأی‌دهنده‌ها و اعضای واقعی جامعه ──
  const existingCount = await db.user.count();
  let raters: string[] = [];
  if (existingCount < 30) {
    let created = 0;
    let fi = 0, mi = 0;
    for (let i = 0; i < 60; i++) {
      const phone = `0912112${String(i + 100).padStart(4, "0")}`;
      if (await db.user.findUnique({ where: { phone }, select: { id: true } })) continue;
      const female = i % 2 === 0;
      const first = female ? FIRST_F[fi++ % FIRST_F.length] : FIRST_M[mi++ % FIRST_M.length];
      const last = LASTS[i % LASTS.length];
      const [province, city] = CITY_POOL[i % CITY_POOL.length];
      const cat = categories[(i * 7) % categories.length];
      const skills = cat.skills.slice(0, 2).map((s) => s.id);
      const u = await db.user.create({
        data: {
          phone,
          name: `${first} ${last}`,
          profile: {
            create: {
              bioShort: `عضو فرصتینو — علاقه‌مند به ${cat.name} ${cat.iconUrl ?? ""}`,
              gender: female ? "female" : "male",
              province,
              city,
              mainCategoryId: cat.id,
            },
          },
        },
      });
      await db.userCategory.create({ data: { userId: u.id, categoryId: cat.id } });
      for (const sid of skills) {
        await db.userSkill.create({ data: { userId: u.id, skillId: sid } }).catch(() => { });
      }
      raters.push(u.id);
      created++;
    }
    console.log(`✓ ${created} supporter users created`);
  } else {
    console.log(`✓ users exist (${existingCount}) — skipping supporters`);
  }
  const allUsers = await db.user.findMany({ select: { id: true } });
  raters = allUsers.map((u) => u.id);

  // ── 2) پست‌های امیرحسین + رأی همه ──
  const amirCat = catFor(CAT_BY_PHONE["09121110001"].cat)!;
  const amirSkill = amirCat.skills.find((s) => CAT_BY_PHONE["09121110001"].skills.includes(s.name))?.id;
  const amirPosts: string[] = [];
  for (let i = 0; i < AMIR_POSTS.length; i++) {
    const content = AMIR_POSTS[i];
    let post = await db.post.findFirst({ where: { content } });
    if (!post) {
      post = await db.post.create({
        data: {
          userId: amir.id,
          content,
          categoryId: amirCat.id,
          skillId: amirSkill,
          createdAt: new Date(Date.now() - (60 + i * 137) * 60 * 1000),
        },
      });
    }
    amirPosts.push(post.id);
  }
  console.log(`✓ امیرحسین: ${amirPosts.length} posts`);

  // ── 3) پست‌های مهتاب + رأی همه ──
  const mahtabCat = catFor(CAT_BY_PHONE["09121110007"].cat)!;
  const mahtabSkill = mahtabCat.skills.find((s) => CAT_BY_PHONE["09121110007"].skills.includes(s.name))?.id;
  const mahtabPosts: string[] = [];
  for (let i = 0; i < MAHTAB_POSTS.length; i++) {
    const content = MAHTAB_POSTS[i];
    let post = await db.post.findFirst({ where: { content } });
    if (!post) {
      post = await db.post.create({
        data: {
          userId: mahtab.id,
          content,
          categoryId: mahtabCat.id,
          skillId: mahtabSkill,
          createdAt: new Date(Date.now() - (30 + i * 97) * 60 * 1000),
        },
      });
    }
    mahtabPosts.push(post.id);
  }
  console.log(`✓ مهتاب: ${mahtabPosts.length} posts`);

  // ── 4) رأی‌دهی همه به پست‌های این دو ──
  const rateAll = async (postIds: string[], authorId: string, score: number) => {
    let given = 0;
    for (const pid of postIds) {
      for (const uid of raters) {
        if (uid === authorId) continue;
        try {
          await db.postRating.create({ data: { postId: pid, userId: uid, score } });
          given++;
        } catch { /* existing */ }
      }
    }
    return given;
  };

  // امیرحسین: همه با ۱۰ ستاره → باید ≥5000 شود
  const amirVotes = await rateAll(amirPosts, amir.id, 10);
  // مهتاب: همه با ۱۰ ستاره → باید ≥10000 شود
  const mahtabVotes = await rateAll(mahtabPosts, mahtab.id, 10);
  console.log(`✓ ratings: امیرحسین +${amirVotes} × 10 · مهتاب +${mahtabVotes} × 10`);

  // ── 5) ویترین چهره برتر — با featuredAt واقعی (سقف هفتگی ۱ پست) ──
  // هر چهره برتر هفته‌ای ۱ پست: آخرین ارسال هر نفر = امروز، بقیه پخش در هفته‌های گذشته
  const featureIds = [amirPosts[0], amirPosts[3], amirPosts[7], mahtabPosts[0], mahtabPosts[5], mahtabPosts[7], mahtabPosts[14]];
  const day = 24 * 60 * 60 * 1000;
  for (let i = 0; i < featureIds.length; i++) {
    const pid = featureIds[i];
    if (!pid) continue;
    const offsets = [12, 5, 0, 9, 2, 16, 0];
    const at = new Date(Date.now() - (offsets[i] ?? 3) * day);
    await db.post.update({ where: { id: pid }, data: { isFeatured: true, featuredAt: at } });
  }
  console.log(`✓ ویترین چهره برتر: ${featureIds.length} پست`);

  // ── 6) گزارش نهایی ──
  for (const [name, id] of [["امیرحسین", amir.id], ["مهتاب", mahtab.id]] as [string, string][]) {
    const si = await userStarInfo(id);
    const level = si.frame === "gold" ? "طلایی 🥇" : si.frame === "silver" ? "نقره‌ای 🥈" : "بدون قاب";
    console.log(`★ ${name}: ${si.totalStars} ستاره → ${level} (نقره‌ای ${SILVER_THRESHOLD} / طلایی ${GOLD_THRESHOLD})`);
    if (!si.isTopTalent) {
      console.error(`  ⚠ ${name} هنوز به آستانه نرسیده!`);
    }
  }

  await db.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
