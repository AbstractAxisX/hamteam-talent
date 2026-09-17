import { db } from '../src/lib/db'
async function main() {
  const [users, posts, categories, skills, banners, profiles, connections, portfolio] = await Promise.all([
    db.user.count(), db.post.count(), db.category.count(), db.skill.count(),
    db.banner.count(), db.profile.count(), db.connection.count(), db.portfolioItem.count()
  ])
  console.log(JSON.stringify({ users, posts, categories, skills, banners, profiles, connections, portfolio }))
  process.exit(0)
}
main().catch(e => { console.error(e.message); process.exit(1) })
