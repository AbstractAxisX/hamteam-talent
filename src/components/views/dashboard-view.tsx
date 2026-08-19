"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PostCard } from "@/components/shared/post-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/shared/icon";
import { toFa, formatCount, formatFaDate } from "@/lib/format";
import { cn } from "@/lib/utils";
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
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "شب بخیر" :
    hour < 12 ? "صبح بخیر" :
    hour < 17 ? "ظهر بخیر" :
    hour < 20 ? "عصر بخیر" : "شب بخیر";

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-2">
      {/* ═══ Hero Greeting ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-card p-5 sm:p-6 shadow-[0_8px_30px_-12px_oklch(0.5_0.22_275/0.25)]"
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-16 -left-12 w-56 h-56 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.5 0.22 275)" }}
        />
        <div
          className="absolute -bottom-20 -right-12 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.72 0.16 75)" }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
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
                size="lg"
                ringColor="var(--primary)"
              />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground font-medium">
                {greeting} 👋
              </p>
              <h1 className="text-xl sm:text-2xl font-black truncate mt-0.5 leading-tight">
                {user?.name}
              </h1>
              <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                {formatFaDate(new Date())}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate({ view: "create-need" })}
            className="shrink-0 inline-flex items-center gap-1.5 h-10 sm:h-11 px-3.5 sm:px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors active:scale-95"
          >
            <Icon name="plus" size={16} />
            <span className="hidden sm:inline">ثبت نیازمندی</span>
            <span className="sm:hidden">نیازمندی</span>
          </button>
        </div>
      </motion.div>

      {/* ═══ Quick actions grid ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-4 gap-2 sm:gap-3"
      >
        <QuickAction
          name="search"
          label="کشف"
          onClick={() => navigate({ view: "discover" })}
        />
        <QuickAction
          name="sparkles"
          label="استعدادها"
          onClick={() => navigate({ view: "explore" })}
        />
        <QuickAction
          name="briefcase"
          label="نیازمندی"
          onClick={() => navigate({ view: "needs" })}
        />
        <QuickAction
          name="userCheck"
          label="دنبال‌شده"
          onClick={() => navigate({ view: "following" })}
        />
      </motion.div>

      {/* ═══ Stats row ═══ */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-3 gap-2 sm:gap-3"
        >
          <StatCard
            name="userCheck"
            label="دنبال‌شده"
            value={data.followingCount}
            delay={0.14}
          />
          <StatCard
            name="trendingUp"
            label="استعداد مرتبط"
            value={data.relevantTalents.length}
            delay={0.18}
          />
          <StatCard
            name="users"
            label="هم‌مهارت"
            value={data.sameSkillPeople.length}
            delay={0.22}
          />
        </motion.div>
      )}

      {/* ═══ Followed posts ═══ */}
      <Section
        title="پست‌های دنبال‌شوندگان"
        onMore={() => navigate({ view: "following" })}
        delay={0.26}
      >
        {data && data.followedPosts.length > 0 ? (
          <div className="space-y-3">
            {data.followedPosts.slice(0, 3).map((p, i) => (
              <PostCard key={p.id} post={p} index={i} />
            ))}
          </div>
        ) : (
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
            className="py-6"
          />
        )}
      </Section>

      {/* ═══ Relevant talents ═══ */}
      {data && data.relevantTalents.length > 0 && (
        <Section title="استعدادهای مرتبط" delay={0.32}>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {data.relevantTalents.map((t, i) => (
              <TalentMiniCard key={t.id} talent={t} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ═══ Same-skill people ═══ */}
      {data && data.sameSkillPeople.length > 0 && (
        <Section title="افراد هم‌مهارت" delay={0.38}>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {data.sameSkillPeople.slice(0, 4).map((t, i) => (
              <TalentGridCard key={t.id} talent={t} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ═══ More actions ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="font-bold text-base mb-2.5">بیشتر</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <MoreCard
            name="chat"
            label="چت‌ها"
            onClick={() => navigate({ view: "chat" })}
          />
          <MoreCard
            name="bell"
            label="اعلان‌ها"
            onClick={() => navigate({ view: "notifications" })}
          />
          <MoreCard
            name="briefcase"
            label="نیازمندی‌های من"
            onClick={() => navigate({ view: "my-needs" })}
          />
          <MoreCard
            name="ticket"
            label="تیکت‌ها"
            onClick={() => navigate({ view: "tickets" })}
          />
          <MoreCard
            name="pencil"
            label="ویرایش پروفایل"
            onClick={() => navigate({ view: "edit-profile" })}
          />
          <MoreCard
            name="settings"
            label="تنظیمات"
            onClick={() => navigate({ view: "settings" })}
          />
        </div>
      </motion.div>
    </div>
  );
}

// ───────────────────────────── Quick Action ─────────────────────────────

function QuickAction({
  name,
  label,
  onClick,
}: {
  name: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow"
    >
      <span className="grid place-items-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 text-primary">
        <Icon name={name} size={22} />
      </span>
      <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">
        {label}
      </span>
    </motion.button>
  );
}

// ───────────────────────────── Stat Card ─────────────────────────────

function StatCard({
  name,
  label,
  value,
  delay,
}: {
  name: string;
  label: string;
  value: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden p-3 sm:p-4 rounded-2xl bg-card shadow-sm"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="grid place-items-center w-6 h-6 rounded-lg bg-primary/10 text-primary">
          <Icon name={name} size={13} />
        </span>
        <span className="text-[10px] text-muted-foreground font-bold truncate">
          {label}
        </span>
      </div>
      <p className="text-xl sm:text-2xl font-black nums-fa tabular-nums">
        {formatCount(value)}
      </p>
    </motion.div>
  );
}

// ───────────────────────────── Section ─────────────────────────────

function Section({
  title,
  onMore,
  delay,
  children,
}: {
  title: string;
  onMore?: () => void;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-bold text-base sm:text-lg">{title}</h2>
        {onMore && (
          <button
            onClick={onMore}
            className="flex items-center gap-0.5 text-xs text-primary font-bold hover:text-primary/80 transition-colors"
          >
            همه
            <Icon name="chevronLeft" size={14} />
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );
}

// ───────────────────────────── Talent Mini Card (horizontal scroll) ─────────────────────────────

function TalentMiniCard({
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
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      whileTap={{ scale: 0.97 }}
      className="shrink-0 w-36 sm:w-40 p-3 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow text-right"
    >
      <UserAvatar
        name={talent.name}
        avatarUrl={talent.avatarUrl}
        verified={talent.isVerifiedBadge}
        gender={talent.gender}
        size="md"
      />
      <p className="font-bold text-sm mt-2 truncate">{talent.name}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5 line-clamp-1">
        {talent.bioShort}
      </p>
      {talent.city && (
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
          <Icon name="mapPin" size={10} />
          {talent.city}
        </p>
      )}
    </motion.button>
  );
}

// ───────────────────────────── Talent Grid Card (2-col) ─────────────────────────────

function TalentGridCard({
  talent,
  index,
}: {
  talent: TalentListItem;
  index: number;
}) {
  return (
    <motion.button
      onClick={() => navigate({ view: "profile", id: talent.id })}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={{ scale: 0.97 }}
      className="p-3 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow text-right"
    >
      <div className="flex items-center gap-2.5">
        <UserAvatar
          name={talent.name}
          avatarUrl={talent.avatarUrl}
          verified={talent.isVerifiedBadge}
          gender={talent.gender}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs truncate">{talent.name}</p>
          <p className="text-[10px] text-muted-foreground truncate line-clamp-1">
            {talent.bioShort}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ───────────────────────────── More Card ─────────────────────────────

function MoreCard({
  name,
  label,
  onClick,
}: {
  name: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      whileHover={{ x: -2 }}
      className={cn(
        "flex items-center gap-2.5 p-3.5 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow"
      )}
    >
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-muted text-muted-foreground">
        <Icon name={name} size={18} />
      </span>
      <span className="font-bold text-sm flex-1 text-right">{label}</span>
      <Icon name="chevronLeft" size={16} className="text-muted-foreground" />
    </motion.button>
  );
}
