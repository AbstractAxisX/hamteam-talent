// پاک‌سازی اثر تست‌های API — بدون حذف پست دموی رسانه
import { db } from "../src/lib/db";
async function main() {
  // ۱) پست تستی بدون رسانه (فلوی اشتباه اول)
  await db.post.deleteMany({ where: { content: { contains: "تست موزیک در پست" } } });
  // ۲) تایپ اشتباه PDF → doc
  await db.postMedia.updateMany({ where: { fileName: "test-doc.pdf", type: "image" }, data: { type: "doc" } });
  // ۳) بازگردانی آواتار/بنر خالی کاربر دمو (حالت seed)
  const me = await db.user.findUnique({ where: { phone: "09121110001" } });
  if (me) await db.profile.update({ where: { userId: me.id }, data: { avatarUrl: "", bannerUrl: "" } });
  // ۴) تایید نهایی
  const posts = await db.post.findMany({ where: { content: { contains: "تست کامل" } }, include: { media: true } });
  for (const p of posts) console.log("kept post:", p.content.slice(0, 30), "→", p.media.map(m => `${m.type}:${m.fileName}`).join(", "));
  console.log("✅ cleanup done");
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
