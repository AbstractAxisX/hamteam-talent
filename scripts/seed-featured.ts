// Seed featured posts with media
import { db } from "../src/lib/db";

async function run() {
  const topTalents = await db.user.findMany({
    where: { isTopTalent: true },
    include: { profile: true, userCategories: { include: { category: true } }, userSkills: { include: { skill: true } } },
  });
  console.log(`Found ${topTalents.length} top talents`);

  const categories = await db.category.findMany({ include: { skills: true } });

  const postsData = [
    {
      userId: topTalents[0]?.id,
      content: "ویدیو اجرای زنده‌ی هفته‌ی گذشته در استودیو 🎵 این قطعه ترکیبی از موسیقی سنتی و پاپ بود. نظراتتون برام خیلی مهمه!",
      catName: "موسیقی",
      skillName: "خوانندگی",
    },
    {
      userId: topTalents[0]?.id,
      content: "آموزش نت‌خوانی برای مبتدی‌ها — قسمت اول 📚 تو این ویدیو پایه‌های نت‌خوانی رو توضیح میدم. سوالاتتون رو تو کامنت‌ها بپرسید.",
      catName: "موسیقی",
      skillName: "تدریس موسیقی",
    },
    {
      userId: topTalents[1]?.id,
      content: "پروژه‌ی اوپن‌سورس جدیدم رو منتشر کردم 🚀 یک کتابخانه‌ی ری‌اکت برای انیمیشن‌های نرم. لینک گیت‌هاب تو بیو هست. استار فراموش نشه!",
      catName: "برنامه‌نویسی و توسعه",
      skillName: "فرانت‌اند",
    },
    {
      userId: topTalents[1]?.id,
      content: "سند معماری پروژه‌ی جدید — اینجا ساختار دیتابیس و API رو طراحی کردم. PDF کامل رو دانلود کنید و نظر بدید.",
      catName: "برنامه‌نویسی و توسعه",
      skillName: "بک‌اند",
    },
    {
      userId: topTalents[2]?.id,
      content: "گیم‌پلی از بازی جدیدم که دارم روش کار می‌کنم 🎮 یک بازی موبایل با سبک پازل-اکشن. هنوز در مرحله‌ی آلفاست.",
      catName: "بازی‌سازی",
      skillName: "بازی‌سازی یونیتی",
    },
    {
      userId: topTalents[2]?.id,
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
    if (existing) {
      if (!existing.isFeatured) {
        await db.post.update({ where: { id: existing.id }, data: { isFeatured: true } });
        console.log(`Re-featured: ${pd.content.slice(0, 40)}...`);
      }
      continue;
    }

    const post = await db.post.create({
      data: {
        userId: pd.userId,
        content: pd.content,
        categoryId: cat?.id,
        skillId: skill?.id,
        isFeatured: true,
      },
    });
    console.log(`Created+featured: ${pd.content.slice(0, 40)}...`);
  }

  // Add likes and comments
  const featuredPosts = await db.post.findMany({ where: { isFeatured: true } });
  const allUsers = await db.user.findMany({ where: { isBanned: false }, select: { id: true } });

  for (const post of featuredPosts) {
    const numLikes = 3 + Math.floor(Math.random() * 6);
    const shuffled = [...allUsers].sort(() => Math.random() - 0.5).slice(0, numLikes);
    for (const u of shuffled) {
      if (u.id !== post.userId) {
        try { await db.postLike.create({ data: { postId: post.id, userId: u.id } }); } catch { }
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

  console.log(`Added likes and comments to ${featuredPosts.length} posts`);
  const finalCount = await db.post.count({ where: { isFeatured: true } });
  const likeCount = await db.postLike.count();
  const commentCount = await db.comment.count();
  console.log(`\nFinal: ${finalCount} featured posts, ${likeCount} likes, ${commentCount} comments`);
  await db.$disconnect();
}

run().catch(console.error);
