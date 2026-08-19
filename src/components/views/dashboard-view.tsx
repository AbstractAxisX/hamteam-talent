"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/shared/icon";
import { toFa, formatCount, formatFaDate, timeAgoFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { PostWithRelations, TalentListItem } from "@/lib/types";

type HomeData = {
  followedPosts: PostWithRelations[];
  relevantTalents: TalentListItem[];
  sameSkillPeople: TalentListItem[];
  followingCount: number;
};

export function DashboardView() {
  const { user } = useUser();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<HomeData>("/api/feed/home")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-16 rounded-full" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "شب بخیر" :
    hour < 12 ? "صبح بخیر" :
    hour < 17 ? "ظهر بخیر" :
    hour < 20 ? "عصر بخیر" : "شب بخیر";

  // Quick action chips
  const quickActions = [
    { label: "ثبت نیازمندی", icon: "plus" as const, route: { view: "create-need" as const }, tone: "primary" as const },
    { label: "کشف", icon: "search" as const, route: { view: "discover" as const }, tone: "default" as const },
    { label: "اکسپلور", icon: "sparkles" as const, route: { view: "explore" as const }, tone: "default" as const },
    { label: "ارتباطات", icon: "userPlus" as const, route: { view: "connections" as const }, tone: "default" as const },
    { label: "تیکت‌ها", icon: "ticket" as const, route: { view: "tickets" as const }, tone: "default" as const },
    { label: "تنظیمات", icon: "settings" as const, route: { view: "settings" as const }, tone: "default" as const },
  ];

  // Activity timeline: combine followed posts into a vertical timeline
  const timelineItems = (data?.followedPosts || []).slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto space-y-7 pb-4">
      {/* ══════ FULL-WIDTH HERO GREETING ══════ */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass border border-border/60 p-6 md:p-8"
      >
        {/* Ambient blobs */}
        <div
          className="absolute -top-16 -left-12 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.6 0.15 160 / 0.5)" }}
        />
        <div
          className="absolute -bottom-20 -right-12 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.75 0.15 80 / 0.5)" }}
        />
        <div className="relative flex items-center gap-4 md:gap-5">
          <button
            onClick={() => navigate({ view: "my-profile" })}
            className="shrink-0 hover:opacity-90 transition-opacity"
            aria-label="پروفایل من"
          >
            <UserAvatar
              name={user?.name || ""}
              avatarUrl={user?.profile?.avatarUrl || null}
              verified={user?.isVerifiedBadge}
              gender={user?.profile?.gender}
              size="xl"
              ringColor="var(--primary)"
            />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm text-primary font-bold tracking-widest mb-1">
              {greeting} ✦ {formatFaDate(new Date())}
            </p>
            <h1 className="text-2xl md:text-4xl font-black truncate leading-tight">
              {user?.name}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1.5 leading-6">
              خوش اومدی به داشبوردت — فعالیت‌های امروز رو دنبال کن.
            </p>
          </div>
        </div>

        {/* Stats row inside hero */}
        <div className="relative mt-6 md:mt-7 grid grid-cols-3 gap-2 md:gap-3">
          <HeroStat
            value={data ? formatCount(data.followingCount) : "۰"}
            label="دنبال‌شده"
            icon="userCheck"
          />
          <HeroStat
            value={data ? formatCount(data.relevantTalents.length) : "۰"}
            label="مرتبط"
            icon="sparkles"
          />
          <HeroStat
            value={data ? formatCount(data.sameSkillPeople.length) : "۰"}
            label="هم‌مهارت"
            icon="users"
          />
        </div>
      </motion.section>

      {/* ══════ QUICK ACTIONS — pill chips, horizontal scroll ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
      >
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 + i * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.route)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full font-bold text-sm transition-colors",
                action.tone === "primary"
                  ? "bg-primary text-primary-foreground"
                  : "glass border border-border/60 text-foreground hover:bg-muted/60"
              )}
            >
              <Icon name={action.icon} size={16} strokeWidth={2.4} />
              <span className="whitespace-nowrap">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ══════ ACTIVITY TIMELINE — followed posts as a vertical timeline ══════ */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-primary tracking-widest mb-1">خط زمانی فعالیت</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">از کسانی که دنبال می‌کنی</h2>
          </div>
          <button
            onClick={() => navigate({ view: "following" })}
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:gap-1.5 transition-all"
          >
            همه
            <Icon name="arrowLeft" size={14} strokeWidth={2.6} className="text-primary" />
          </button>
        </div>

        {timelineItems.length === 0 ? (
          <EmptyState
            kind="posts"
            title="هنوز پستی نیست"
            description="برای دیدن پست‌های دنبال‌شوندگان، ابتدا کسی را دنبال کنید."
            action={
              <button
                onClick={() => navigate({ view: "discover" })}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
              >
                <Icon name="search" size={16} />
                کشف استعدادها
              </button>
            }
            className="py-8"
          />
        ) : (
          <div className="relative">
            {/* Vertical line (RTL: right side) */}
            <div className="absolute top-3 bottom-3 right-[27px] w-px bg-border/60" aria-hidden />
            <div className="space-y-3">
              {timelineItems.map((post, i) => (
                <TimelinePost key={post.id} post={post} index={i} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══════ RELEVANT TALENTS — horizontal tall cards ══════ */}
      {data && data.relevantTalents.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-primary tracking-widest mb-1">شاید بشناسی</p>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">استعدادهای مرتبط</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {data.relevantTalents.slice(0, 8).map((t, i) => (
              <TalentTallCard key={t.id} talent={t} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ══════ SAME SKILL PEOPLE — horizontal avatar rail ══════ */}
      {data && data.sameSkillPeople.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-primary tracking-widest mb-1">هم‌مسیرها</p>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">افراد هم‌مهارت</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
            {data.sameSkillPeople.slice(0, 6).map((t, i) => (
              <SameSkillCard key={t.id} talent={t} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ══════ FOOTER SPACER ══════ */}
      <div className="h-4" aria-hidden />
    </div>
  );
}

// ───────────────────────────── Hero Stat ─────────────────────────────
function HeroStat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/30 border border-border/40 px-3 py-3 md:py-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="grid place-items-center w-6 h-6 rounded-lg bg-primary/10 text-primary">
          <Icon name={icon} size={13} strokeWidth={2.4} />
        </span>
        <span className="text-[10px] md:text-xs text-muted-foreground font-bold truncate">{label}</span>
      </div>
      <p className="text-xl md:text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

// ───────────────────────────── Timeline Post ─────────────────────────────
function TimelinePost({ post, index }: { post: PostWithRelations; index: number }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liking, setLiking] = useState(false);

  async function toggleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    setLiking(true);
    try {
      await apiPost(`/api/posts/${post.id}/like`);
    } catch (e) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLiking(false);
    }
  }

  // First media preview (if any)
  const firstMedia = post.media?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3"
    >
      {/* Timeline dot — avatar */}
      <button
        onClick={() => navigate({ view: "profile", id: post.user.id })}
        className="shrink-0 relative z-10"
        aria-label={post.user.name}
      >
        <UserAvatar
          name={post.user.name}
          avatarUrl={post.user.avatarUrl}
          verified={post.user.isVerifiedBadge}
          size="md"
          ringColor="var(--background)"
        />
      </button>
      {/* Card */}
      <motion.button
        onClick={() => navigate({ view: "post", id: post.id })}
        whileHover={{ y: -1 }}
        className="flex-1 min-w-0 text-start rounded-2xl glass border border-border/60 p-3.5 overflow-hidden"
      >
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1.5">
          <p className="font-bold text-sm truncate">{post.user.name}</p>
          {post.user.isVerifiedBadge && (
            <Icon name="badgeCheck" size={14} className="text-gold shrink-0" strokeWidth={2.2} />
          )}
          <span className="text-[11px] text-muted-foreground shrink-0">·</span>
          <span className="text-[11px] text-muted-foreground shrink-0">{timeAgoFa(post.createdAt)}</span>
        </div>

        {/* Content */}
        <p className={cn(
          "text-sm text-foreground/90 leading-6 mb-2",
          firstMedia ? "line-clamp-2" : "line-clamp-3"
        )}>
          {post.content}
        </p>

        {/* Media preview (small) */}
        {firstMedia && (
          <div className="rounded-xl overflow-hidden mb-2 bg-muted/40">
            <img
              src={firstMedia.url}
              alt=""
              className="w-full max-h-44 object-cover"
            />
          </div>
        )}

        {/* Footer row — likes + comment */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); toggleLike(); }}
            disabled={liking}
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-rose transition-colors"
          >
            <Icon
              name="heart"
              size={14}
              strokeWidth={liked ? 2.6 : 2.2}
              className={liked ? "text-rose fill-rose" : "text-muted-foreground"}
            />
            <span className={liked ? "text-rose" : ""}>{formatCount(likeCount)}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate({ view: "post", id: post.id }); }}
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon name="comment" size={14} strokeWidth={2.2} />
            <span>دیدن</span>
          </button>
          {post.categoryName && (
            <span className="ms-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              {post.categoryName}
            </span>
          )}
        </div>
      </motion.button>
    </motion.div>
  );
}

// ───────────────────────────── Talent Tall Card (horizontal scroll) ─────────────────────────────
function TalentTallCard({
  talent,
  index,
}: {
  talent: TalentListItem;
  index: number;
}) {
  return (
    <motion.button
      onClick={() => navigate({ view: "profile", id: talent.id })}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      whileTap={{ scale: 0.97 }}
      className="shrink-0 w-40 md:w-44 p-3 rounded-3xl glass border border-border/60 text-right"
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <UserAvatar
          name={talent.name}
          avatarUrl={talent.avatarUrl}
          verified={talent.isVerifiedBadge}
          gender={talent.gender}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm truncate leading-tight">{talent.name}</p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {toFa(formatCount(talent.followersCount))} دنبال‌کننده
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-5 min-h-[2.5rem]">
        {talent.bioShort}
      </p>
      {talent.city && (
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <Icon name="mapPin" size={11} strokeWidth={2.2} className="text-muted-foreground" />
          {talent.city}
        </p>
      )}
    </motion.button>
  );
}

// ───────────────────────────── Same Skill Card ─────────────────────────────
function SameSkillCard({
  talent,
  index,
}: {
  talent: TalentListItem;
  index: number;
}) {
  return (
    <motion.button
      onClick={() => navigate({ view: "profile", id: talent.id })}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-3 p-3.5 rounded-2xl glass border border-border/60 text-right"
    >
      <UserAvatar
        name={talent.name}
        avatarUrl={talent.avatarUrl}
        verified={talent.isVerifiedBadge}
        gender={talent.gender}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{talent.name}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5 line-clamp-1">
          {talent.bioShort}
        </p>
      </div>
      <Icon name="chevronLeft" size={16} className="text-muted-foreground shrink-0" />
    </motion.button>
  );
}
