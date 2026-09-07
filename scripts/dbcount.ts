import { db } from "../src/lib/db";
async function main() {
  const [users, profiles, cats, skills, posts, banners, conns, ucats, portfolios, needs, comments, likes, media] = await Promise.all([
    db.user.count(), db.profile.count(), db.category.count(), db.skill.count(),
    db.post.count(), db.banner.count(), db.connection.count(), db.userCategory.count(),
    db.portfolioItem.count(), db.jobPost.count(), db.comment.count(), db.postLike.count(), db.postMedia.count()
  ]);
  console.log(JSON.stringify({ users, profiles, cats, skills, posts, banners, conns, ucats, portfolios, needs, comments, likes, media }, null, 2));
}
main().catch(e => console.error(e.message)).finally(() => db.$disconnect());
