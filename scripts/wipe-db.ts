// پاک‌سازی کامل دیتابیس برای seed تازه
import { db } from "../src/lib/db";

async function main() {
  // ترتیب: فرزندها قبل از والدها
  await db.notification.deleteMany();
  await db.message.deleteMany();
  await db.conversation.deleteMany();
  await db.connection.deleteMany();
  await db.commentLike.deleteMany();
  await db.comment.deleteMany();
  await db.postLike.deleteMany();
  await db.postRating.deleteMany();
  await db.postReport.deleteMany();
  await db.postMedia.deleteMany();
  await db.post.deleteMany();
  await db.portfolioLike.deleteMany();
  await db.portfolioMedia.deleteMany();
  await db.portfolioItem.deleteMany();
  await db.jobApplication.deleteMany();
  await db.jobPostAttachment.deleteMany();
  await db.jobPostSkill.deleteMany();
  await db.jobPost.deleteMany();
  await db.topTalentRequest.deleteMany();
  await db.banner.deleteMany();
  await db.ticketReply.deleteMany();
  await db.ticket.deleteMany();
  await db.userSkill.deleteMany();
  await db.userCategory.deleteMany();
  await db.resumeEducation.deleteMany();
  await db.resumeExperience.deleteMany();
  await db.resume.deleteMany();
  await db.profile.deleteMany();
  await db.user.deleteMany();
  await db.adminUser.deleteMany();
  await db.skill.deleteMany();
  await db.category.deleteMany();
  console.log("✅ DB wiped clean");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
