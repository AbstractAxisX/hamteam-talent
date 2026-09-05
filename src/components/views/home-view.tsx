"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/use-user";
import { api, apiPost } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/shared/icon";
import { PostCard } from "@/components/shared/post-card";
import { ComposerTrigger, ComposerSheet } from "@/components/composer";
import { toFa, formatCount, formatFaDate } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PostWithRelations, TalentListItem } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════
   HomeView — صفحهٔ خانهٔ شخصی (الهام از لینکدین — فقط کاربران لاگین‌شده)
   · ترکیب داشبورد: آمار شخصی + اقدامات سریع
   · کامپوزر پست (شیت مشترک)
   · فید: پست‌های خودم + همتیمی‌های متصل (ارتباط دوطرفه)
   · ریل «شاید بشناسید» با دکمهٔ برقراری ارتباط
   ═══════════════════════════════════════════════════════════ */

type HomeData = {
  posts: PostWithRelations[];
  suggestions: TalentListItem[];
  stats: { connectionsCount: number; postsCount: number; followersCount: number };
};

export function HomeView() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    api<HomeData>("/api/feed/home")
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "شب بخیر" :
    hour < 12 ? "صبح بخیر" :
    hour < 17 ? "ظهر بخیر" :
    hour < 20 ? "عصر بخیر" : "شب بخیر";

  async function handleConnect(talent: TalentListItem) {
    setConnectingIds((s) => new Set(s).add(talent.id));
    try {
      const res = await apiPost<{ status: string }>("/api/connections", { receiverId: talent.id });
      toast({
        title: res.status === "accepted" ? `با ${talent.name} متصل شدید ✅` : "درخواست ارتباط ارسال شد",
      });
      setData((d) => (d ? { ...d, suggestions: d.suggestions.filter((s) => s.id !== talent.id) } : d));
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setConnectingIds((s) => {
        const n = new Set(s);
        n.delete(talent.id);
        return n;
      });
    }
  }

  if (userLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-4">
      {/* ═══ نوار خوش‌آمد — جمع‌وجور (ترکیب داشبورد) ═══ */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[26px] glass border border-border/60 p-5 md:p-6"
      >
        <div
          aria-hidden
          className="absolute -top-20 -left-14 w-56 h-56 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.6 0.15 160 / 0.5)" }}
        />
        <div className="relative flex items-center gap-4">
          <button
            onClick={() => navigate({ view: "my-profile" })}
            className="shrink-0 hover:opacity-90 transition-opacity"
            aria-label="پروفایل من"
          >
            <UserAvatar
              name={user.name}
              avatarUrl={user.profile?.avatarUrl || null}
              verified={user.isVerifiedBadge}
              topTalent={user.isTopTalent}
              gender={user.profile?.gender}
              size="xl"
            />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] md:text-xs text-primary font-bold tracking-wide">
              {greeting} ✦ {formatFaDate(new Date())}
            </p>
            <h1 className="text-xl md:text-2xl font-black truncate leading-tight mt-0.5">{user.name}</h1>
            {user.username && (
              <p className="text-[11px] font-bold text-primary mt-0.5" dir="ltr">@{user.username}</p>
            )}
          </div>
          {/* آمار داشبورد — ادغام‌شده */}
          <div className="shrink-0 grid grid-cols-3 gap-2 md:gap-3">
            <MiniStat
              value={data ? formatCount(data.stats.connectionsCount) : "—"}
              label="ارتباط"
              icon="users"
            />
            <MiniStat
              value={data ? formatCount(data.stats.postsCount) : "—"}
              label="پست"
              icon="image"
            />
            <MiniStat
              value={data ? formatCount(data.stats.followersCount) : "—"}
              label="دنبال‌کننده"
              icon="userCheck"
            />
          </div>
        </div>
      </motion.section>

      {/* ═══ کامپوزر — «پستی بنویس» (سبک لینکدین) ═══ */}
      <ComposerTrigger onOpen={() => setComposerOpen(true)} onOpenTab={() => setComposerOpen(true)} />

      {/* ═══ ریل «شاید بشناسید» — پیشنهاد افراد ═══ */}
      {!loading && data && data.suggestions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[11px] font-bold text-primary tracking-widest">پیشنهاد همتیم</p>
              <h2 className="text-lg md:text-xl font-black tracking-tight">شاید بشناسید</h2>
            </div>
            <button
              onClick={() => navigate({ view: "discover" })}
              className="inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:gap-1.5 transition-all"
            >
              کشف بیشتر
              <Icon name="arrowLeft" size={14} strokeWidth={2.6} className="text-primary" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1.5">
            {data.suggestions.slice(0, 8).map((t, i) => (
              <SuggestionCard
                key={t.id}
                talent={t}
                index={i}
                busy={connectingIds.has(t.id)}
                onConnect={() => handleConnect(t)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ═══ فید پست‌ها — من + همتیمی‌هایم ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold text-primary tracking-widest">خط زمانی</p>
            <h2 className="text-lg md:text-xl font-black tracking-tight">از همتیمی‌های شما</h2>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground nums-fa">
            {data ? `${toFa(data.posts.length)} پست` : "…"}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-[24px]" />
            <Skeleton className="h-64 rounded-[24px]" />
            <Skeleton className="h-40 rounded-[24px]" />
          </div>
        ) : !data || data.posts.length === 0 ? (
          <EmptyState
            kind="people"
            title="هنوز پستی در خانه نیست"
            description="پست‌های خودت و همتیمی‌هایی که با آن‌ها ارتباط برقرار می‌کنی اینجا دیده می‌شود."
            action={
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setComposerOpen(true)}
                  className="h-10 px-4 rounded-xl grad-brand text-white font-extrabold text-[13px] shadow-grad"
                >
                  اولین پست را بساز
                </button>
                <button
                  onClick={() => navigate({ view: "discover" })}
                  className="h-10 px-4 rounded-xl glass border border-border/60 font-bold text-[13px] text-foreground"
                >
                  کشف استعدادها
                </button>
              </div>
            }
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {data.posts.map((p, i) => (
                <PostCard key={p.id} post={p} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.section>

      {/* شیت کامپوزر مشترک — پس از انتشار فید تازه می‌شود */}
      <ComposerSheet
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={() => {
          setLoading(true);
          load();
        }}
      />
    </div>
  );
}

/* ── آمار کوچک ── */
function MiniStat({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="grid place-items-center gap-0.5 min-w-[54px]">
      <Icon name={icon as any} size={14} className="text-primary" />
      <span className="text-[15px] font-black nums-fa leading-none">{value}</span>
      <span className="text-[9.5px] font-bold text-muted-foreground leading-none">{label}</span>
    </div>
  );
}

/* ── کارت پیشنهاد فرد ── */
function SuggestionCard({
  talent,
  index,
  busy,
  onConnect,
}: {
  talent: TalentListItem;
  index: number;
  busy: boolean;
  onConnect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
      className="shrink-0 w-[180px] p-4 rounded-[22px] glass border border-border/60 flex flex-col items-center text-center gap-2"
    >
      <button onClick={() => navigate({ view: "profile", id: talent.id })} aria-label={talent.name}>
        <UserAvatar
          name={talent.name}
          avatarUrl={talent.avatarUrl}
          verified={talent.isVerifiedBadge}
          gender={talent.gender}
          size="xl"
          topTalent={talent.isTopTalent}
          ringColor={talent.isTopTalent ? null : talent.mainCategoryColor || "var(--primary)"}
        />
      </button>
      <div className="min-w-0 w-full">
        <button
          onClick={() => navigate({ view: "profile", id: talent.id })}
          className="font-extrabold text-[13.5px] truncate block w-full hover:text-primary transition-colors"
        >
          {talent.name}
        </button>
        {talent.categories?.[0] && (
          <p className="text-[10.5px] text-muted-foreground font-bold truncate mt-0.5">
            {talent.categories[0].iconUrl} {talent.categories[0].name}
          </p>
        )}
        {talent.bioShort && (
          <p className="text-[10px] text-muted-foreground/80 line-clamp-2 mt-1 leading-4">{talent.bioShort}</p>
        )}
      </div>
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={onConnect}
        disabled={busy}
        className={cn(
          "w-full h-9 rounded-xl text-[11.5px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60",
          "grad-brand text-white shadow-grad"
        )}
      >
        <Icon name={busy ? "loader" : "userPlus"} size={13} className={busy ? "animate-spin" : ""} />
        {busy ? "در حال ارسال" : "برقراری ارتباط"}
      </motion.button>
    </motion.div>
  );
}
