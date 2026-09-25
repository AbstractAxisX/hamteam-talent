// ویترین چهره برتر — featuredAt واقعی برای پست‌های برتر (await شده)
import { db } from '../src/lib/db';

async function main() {
  const amir = await db.user.findUnique({ where: { phone: "09121110001" }, select: { id: true } });
  const mahtab = await db.user.findUnique({ where: { phone: "09121110007" }, select: { id: true } });
  if (!amir || !mahtab) { console.error("users not found"); process.exit(1); }

  const amirPosts = await db.post.findMany({ where: { userId: amir.id }, orderBy: { createdAt: "desc" }, select: { id: true } });
  const mahtabPosts = await db.post.findMany({ where: { userId: mahtab.id }, orderBy: { createdAt: "desc" }, select: { id: true } });

  const day = 24 * 60 * 60 * 1000;
  const plan: [string, number][] = [];
  const amirIds = [amirPosts[0], amirPosts[3], amirPosts[7]].filter(Boolean).map(p => p.id);
  const mahtabIds = [mahtabPosts[0], mahtabPosts[5], mahtabPosts[7], mahtabPosts[14]].filter(Boolean).map(p => p.id);
  const offsets = [12, 5, 0, 9, 2, 16, 0];
  [...amirIds, ...mahtabIds].forEach((pid, i) => plan.push([pid, offsets[i] ?? 3]));

  for (const [pid, off] of plan) {
    await db.post.update({ where: { id: pid }, data: { isFeatured: true, featuredAt: new Date(Date.now() - off * day) } });
  }
  const count = await db.post.count({ where: { isFeatured: true } });
  console.log(`✓ ویترین: ${count} پست (امیرحسین ${amirIds.length} + مهتاب ${mahtabIds.length})`);
  await db.$disconnect();
}
main();
