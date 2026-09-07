// داده‌های اجتماعی: اتصال‌ها، درخواست‌ها و گفتگوها برای کاربر دمو (امیرحسین)
import { db } from "../src/lib/db";

async function byPhone(phone: string) {
  return (await db.user.findUnique({ where: { phone }, select: { id: true, username: true } }))!;
}

async function ensureConnection(a: string, b: string, status: "accepted" | "pending") {
  const [ua, ub] = [await byPhone(a), await byPhone(b)];
  const existing = await db.connection.findFirst({ where: { OR: [{ requesterId: ua.id, receiverId: ub.id }, { requesterId: ub.id, receiverId: ua.id }] } });
  if (existing) { if (existing.status !== status) await db.connection.update({ where: { id: existing.id }, data: { status } }); return; }
  await db.connection.create({ data: { requesterId: ua.id, receiverId: ub.id, status } });
}

async function ensureConversation(a: string, b: string, msgs: { from: string; text: string }[], pending = false) {
  const [ua, ub] = [await byPhone(a), await byPhone(b)];
  const [userAId, userBId] = [ua.id < ub.id ? ua.id : ub.id, ua.id < ub.id ? ub.id : ua.id];
  let conv = await db.conversation.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
  if (!conv) {
    conv = await db.conversation.create({ data: { userAId, userBId, status: pending ? "pending_request" : "active", initiatorId: (pending ? ua : ub).id } });
  }
  const count = await db.message.count({ where: { conversationId: conv.id } });
  if (count === 0) {
    for (const m of msgs) {
      const sender = m.from === a ? ua : ub;
      await db.message.create({ data: { conversationId: conv.id, senderId: sender.id, content: m.text } });
    }
  }
}

async function main() {
  const demo = "09121110001";
  // اتصال‌های پذیرفته‌شده → پست‌هایشان در فید خانه دیده می‌شود
  await ensureConnection(demo, "09121110002", "accepted"); // مهدی
  await ensureConnection(demo, "09121110005", "accepted"); // پرهام
  await ensureConnection(demo, "09121110003", "accepted"); // نگین
  await ensureConnection(demo, "09121110009", "accepted"); // رویا
  // درخواست‌های دریافتی/ارسالی
  await ensureConnection("09121110004", demo, "pending"); // رضا → امیرحسین
  await ensureConnection("09121110008", demo, "pending"); // کیان → امیرحسین
  await ensureConnection(demo, "09121110010", "pending"); // امیرحسین → مهتاب
  // گفتگوی فعال
  await ensureConversation(demo, "09121110002", [
    { from: demo, text: "سلام مهدی! کیک‌هات عالی‌ان 🎂" },
    { from: "09121110002", text: "سلام امیرحسین جان، ممنون! وقتی خواستی سفارش بده." },
    { from: demo, text: "حتماً، برای تولد یکی از اعضای تیم می‌خوام." },
  ]);
  // درخواست پیام (pending_request)
  await ensureConversation(demo, "09121110007", [
    { from: demo, text: "سلام، پروفایلتون رو دیدم؛ درباره‌ی همکاری روی موزیک‌ویدیو صحبت کنیم؟" },
  ], true);
  const [conns, convs, msgs] = await Promise.all([db.connection.count(), db.conversation.count(), db.message.count()]);
  console.log(`✓ Connections: ${conns} · Conversations: ${convs} · Messages: ${msgs}`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
