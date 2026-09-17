// Seed پست‌های متنوع فید (رسانه‌دار: ویدیو/صوت/PDF) + امتیاز ستاره و کامنت
// اجرا: bun scripts/seed-featured.ts
import { db } from "../src/lib/db";

async function run() {
  // پست‌ها از کاربران متنوع دمو — بر اساس شماره تلفن (نه فلگ حذف‌شده isTopTalent)
  const phones = [
    "09121110001", // امیرحسین — موسیقی
    "09121110002", // سارا — برنامه‌نویسی
    "09121110006", // پرهام — بازی‌سازی
  ];
  const authors: string[] = [];
  for (const ph of phones) {
    const u = await db.user.findUnique({ where: { phone: ph }, select: { id: true } });
    if (u) authors.push(u.id);
  }
  console.log(`Found ${authors.length} authors`);

  const categories = await db.category.findMany({ include: { skills: true } });

  const postsData: { userId?: string; content: string; catName: string; skillName: string }[] = [
    {
      userId: authors[0],
      content: "ویدیو اجرای زنده‌ی هفته‌ی گذشته در استودیو 🎵 این قطعه ترکیبی از موسیقی سنتی و پاپ بود. نظراتتون برام خیلی مهمه!",
      catName: "موسیقی",
      skillName: "خوانندگی",
    },
    {
      userId: authors[0],
      content: "آموزش نت‌خوانی برای مبتدی‌ها — قسمت اول 📚 تو این ویدیو پایه‌های نت‌خوانی رو توضیح میدم. سوالاتتون رو تو کامنت‌ها بپرسید.",
      catName: "موسیقی",
      skillName: "تدریس موسیقی",
    },
    {
      userId: authors[1],
      content: "پروژه‌ی اوپن‌سورس جدیدم رو منتشر کردم 🚀 یک کتابخانه‌ی ری‌اکت برای انیمیشن‌های نرم. لینک گیت‌هاب تو بیو هست. استار فراموش نشه!",
      catName: "برنامه‌نویسی و توسعه",
      skillName: "فرانت‌اند",
    },
    {
      userId: authors[1],
      content: "سند معماری پروژه‌ی جدید — اینجا ساختار دیتابیس و API رو طراحی کردم. PDF کامل رو دانلود کنید و نظر بدید.",
      catName: "برنامه‌نویسی و توسعه",
      skillName: "بک‌اند",
    },
    {
      userId: authors[2],
      content: "گیم‌پلی از بازی جدیدم که دارم روش کار می‌کنم 🎮 یک بازی موبایل با سبک پازل-اکشن. هنوز در مرحله‌ی آلفاست.",
      catName: "بازی‌سازی",
      skillName: "بازی‌سازی یونیتی",
    },
    {
      userId: authors[2],
      content: "فایل صوتی پادکستم — قسمت «چطور بازی‌سازی رو شروع کنیم؟» تو این قسمت تجربیاتم رو از روز اول تا الان تعریف می‌کنم.",
      catName: "سخنوری و رسانه",
      skillName: "پادکست",
    },
  ];

  for (const pd of postsData) {
    if (!pd.userId) continue;
    const cat = categories.find((c) => c.name === pd.catName);
    const skill = cat?.skills.find((s) => s.name === pd.skillName);

    const existing = await db.post.findFirst({ where: { content: pd.content } });
    if (existing) continue;

    await db.post.create({
      data: {
        userId: pd.userId,
        content: pd.content,
        categoryId: cat?.id,
        skillId: skill?.id,
      },
    });
    console.log(`Created: ${pd.content.slice(0, 40)}...`);
  }

  // امتیاز ستاره + کامنت روی پست‌های جدیدِ این اسکریپت
  const allUsers = await db.user.findMany({ where: { isBanned: false }, select: { id: true } });
  for (const pd of postsData) {
    if (!pd.userId) continue;
    const post = await db.post.findFirst({ where: { content: pd.content } });
    if (!post) continue;

    const numRatings = 3 + Math.floor(Math.random() * 6);
    const shuffled = [...allUsers].sort(() => Math.random() - 0.5).slice(0, numRatings);
    for (const u of shuffled) {
      if (u.id !== post.userId) {
        const score = 6 + Math.floor(Math.random() * 5); // 6..10
        try { await db.postRating.create({ data: { postId: post.id, userId: u.id, score } }); } catch { }
      }
    }

    const commentTexts = [
      "عالی بود! ادامه بده 🔥", "ممنون از اشتراک‌گذاری، خیلی مفید بود", "وای چقدر زیبا! 🎉",
      "سوالم اینه که چطور شروع کردی؟", "خیلی حرفه‌ای انجام دادید 👏", "دنبال‌ت می‌کنم",
      "این دقیقاً چیزی بود که نیاز داشتم", "خسته نباشی، واقعاً استعدادی 🌟",
    ];
    const numComments = 1 + Math.floor(Math.random() * 3);
    const commenters = [...allUsers].sort(() => Math.random() - 0.5).slice(0, numComments);

    for (const commenter of commenters) {
      if (commenter.id === post.userId) continue;
      const text = commentTexts[Math.floor(Math.random() * commentTexts.length)];
      const comment = await db.comment.create({ data: { postId: post.id, userId: commenter.id, content: text } });

      if (Math.random() > 0.5) {
        const replyTexts = ["ممنون از نظرت! 🙏", "مرسی! ❤️", "خوشحالم خوشت اومده", "به زودی ویدیو می‌سازم براش"];
        await db.comment.create({
          data: { postId: post.id, userId: post.userId, content: replyTexts[Math.floor(Math.random() * replyTexts.length)], parentId: comment.id },
        });
      }
    }
  }

  const finalPosts = await db.post.count();
  const ratingCount = await db.postRating.count();
  const commentCount = await db.comment.count();
  console.log(`\nFinal: ${finalPosts} posts, ${ratingCount} star ratings, ${commentCount} comments`);
  await db.$disconnect();
}

run().catch(console.error);
