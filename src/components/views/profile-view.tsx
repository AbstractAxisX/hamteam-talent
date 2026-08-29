"use client";

/* ═══════════════════════════════════════════════════════════
   ProfileView v2 — بازطراحی کامل بر اساس بنچمارک پروفایل‌های
   اجتماعی مدرن (الگوی Z: هویت → آمار → تب‌ها)
   · کاور aurora مشبک با ته‌رنگ دسته‌بندی + بافت نقطه‌ای
   · آواتار با رینگ دوتایی + نشان‌ها در سطر نام
   · نوار آمار شیشه‌ای تک‌تکه (الگوی X/اینستاگرام)
   · رفع ریشه باگ Empty State با پرچم postsLoaded
   · دسترسی آسان «پست جدید» (شیت کامپوزر همین‌جا باز می‌شود)
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { ProfileDetail, ProfileMeta, PostWithRelations, CategoryWithSkills } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { Icon } from "@/components/shared/icon";
import { ComposerSheet } from "@/components/composer";
import { PortfolioTab } from "@/components/portfolio/portfolio-tab";
import { AboutTab, ResumeTab, shadeColor } from "@/components/views/profile-tabs";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount, formatFaDate } from "@/lib/format";
import { getProvinceName } from "@/lib/geo";
import { cn } from "@/lib/utils";

type Tab = "about" | "resume" | "posts" | "portfolio";

export function ProfileView({ id }: { id: string }) {
  const { user: me } = useUser();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [meta, setMeta] = useState<ProfileMeta | null>(null);
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false); // ← ریشه‌یاب باگ: «لودشدهٔ خالی» ≠ «لودنشده»
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("about");
  const [connBusy, setConnBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  /* ── دریافت پروفایل + متا + دسته‌ها ── */
  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setPosts([]);
    setPostsLoaded(false);
    setTab("about");
    try {
      const [p, m, c] = await Promise.all([
        api<ProfileDetail>(`/api/profile/${id}`).catch(() => null),
        api<ProfileMeta>(`/api/profile/${id}/meta`).catch(() => null),
        api<{ categories: CategoryWithSkills[] }>(`/api/categories`).catch(() => ({ categories: [] })),
      ]);
      if (!p) {
        setNotFound(true);
        return;
      }
      setProfile(p);
      setMeta(m);
      setCats(c.categories || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* ── پست‌ها: فقط یک‌بار per پروفایل، با حل صریح ── */
  useEffect(() => {
    if (tab !== "posts" || !profile || postsLoaded || postsLoading) return;
    setPostsLoading(true);
    api<{ posts: PostWithRelations[] }>(`/api/posts?userId=${profile.userId}`)
      .then((d) => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => {
        setPostsLoading(false);
        setPostsLoaded(true); // حتی روی خطا هم حل می‌شود — بدون حلقهٔ بی‌نهایت
      });
  }, [tab, profile, postsLoaded, postsLoading]);

  const catColorMap = useMemo(() => {
    const m = new Map<string, string>();
    cats.forEach((c) => m.set(c.id, c.color || ""));
    return m;
  }, [cats]);

  const ringColor = useMemo(() => {
    if (!profile) return null;
    const mainCatId = profile.mainCategoryId ?? meta?.mainCategoryId ?? null;
    if (mainCatId) return catColorMap.get(mainCatId) ?? null;
    const firstCat = profile.categories?.[0];
    return firstCat ? catColorMap.get(firstCat.id) ?? null : null;
  }, [profile, meta, catColorMap]);

  const isSelf = me?.id === profile?.userId;
  const isTopTalent = profile?.isTopTalent ?? meta?.isTopTalent ?? false;

  async function handleConnection() {
    if (!profile || !me) return;
    setConnBusy(true);
    try {
      const res = await apiPost<{ status: string }>(`/api/connections`, { receiverId: profile.userId });
      const s = res.status;
      let msg = "درخواست ارتباط ارسال شد";
      if (s === "accepted") msg = "ارتباط برقرار شد ✅";
      else if (s === "pending-sent") msg = "درخواست ارسال شد";
      toast({ title: msg });
      await load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setConnBusy(false);
    }
  }

  async function handleStartChat() {
    if (!profile || !me) return;
    setChatBusy(true);
    try {
      const res = await apiPost<{ conversationId: string }>(`/api/chat/start`, { userId: profile.userId });
      if (res.conversationId) navigate({ view: "chat", conversationId: res.conversationId });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setChatBusy(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  if (notFound || !profile) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6">
        <EmptyState
          kind="people"
          title="کاربر پیدا نشد"
          description="ممکن است این حساب حذف شده یا شناسه اشتباه باشد."
          action={
            <button
              onClick={() => navigate({ view: "explore" })}
              className="h-11 px-5 rounded-2xl grad-brand text-white font-extrabold text-sm shadow-grad"
            >
              کشف استعدادها
            </button>
          }
        />
      </div>
    );
  }

  const connCount = (profile.followersCount || 0) + (profile.followingCount || 0);
  const province = getProvinceName(profile.province);
  const conn = profile.connectionStatus;
  const heroTint = ringColor || "#10b981";

  /* ── دکمهٔ اصلی بر اساس وضعیت ارتباط ── */
  const primaryAction = (() => {
    if (isSelf) {
      return (
        <button
          onClick={() => navigate({ view: "edit-profile" })}
          className="flex-1 h-12 rounded-2xl glass-strong border border-border/70 text-foreground font-extrabold text-[13px]
                     inline-flex items-center justify-center gap-2 hover:bg-muted transition-colors outline-none"
        >
          <Icon name="pencil" size={17} className="text-primary" />
          ویرایش پروفایل
        </button>
      );
    }
    if (conn === "accepted") {
      return (
        <button
          onClick={handleStartChat}
          disabled={chatBusy}
          className="flex-1 h-12 rounded-2xl grad-brand text-white font-extrabold text-[13px] shadow-grad
                     inline-flex items-center justify-center gap-2 hover:brightness-105 transition-[filter] outline-none
                     disabled:opacity-60"
        >
          <Icon name={chatBusy ? "loader" : "chat"} size={17} className={chatBusy ? "animate-spin" : ""} />
          ارسال پیام
        </button>
      );
    }
    if (conn === "pending-sent") {
      return (
        <button
          disabled
          className="flex-1 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300
                     font-extrabold text-[13px] inline-flex items-center justify-center gap-2 outline-none"
        >
          <Icon name="clock" size={16} />
          درخواست ارسال شد
        </button>
      );
    }
    if (conn === "pending-received") {
      return (
        <button
          onClick={handleConnection}
          disabled={connBusy}
          className="flex-1 h-12 rounded-2xl grad-gold text-white font-extrabold text-[13px] shadow-glow-gold
                     inline-flex items-center justify-center gap-2 outline-none disabled:opacity-60"
        >
          <Icon name={connBusy ? "loader" : "check"} size={17} className={connBusy ? "animate-spin" : ""} />
          تأیید درخواست ارتباط
        </button>
      );
    }
    return (
      <button
        onClick={handleConnection}
        disabled={connBusy}
        className="flex-1 h-12 rounded-2xl grad-brand text-white font-extrabold text-[13px] shadow-grad
                   inline-flex items-center justify-center gap-2 hover:brightness-105 transition-[filter] outline-none
                   disabled:opacity-60"
      >
        <Icon name={connBusy ? "loader" : "userPlus"} size={17} className={connBusy ? "animate-spin" : ""} />
        برقراری ارتباط
      </button>
    );
  })();

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "about", label: "درباره" },
    { key: "portfolio", label: "نمونه کارها" },
    { key: "resume", label: "رزومه", count: (profile.experiences?.length || 0) + (profile.educations?.length || 0) },
    { key: "posts", label: "پست‌ها", count: profile.postCount },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* ═══════ کاور aurora مشبک — هویت بصری جدید ═══════ */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-48 sm:h-56 overflow-hidden rounded-b-[36px]"
          style={{
            background: `radial-gradient(120% 140% at 85% -10%, ${shadeColor(heroTint, 0.72, 160)} 0%, transparent 55%),
                         radial-gradient(110% 130% at 10% 110%, #052e22 0%, transparent 60%),
                         linear-gradient(160deg, #065f46 0%, #064e3b 45%, #052e22 100%)`,
          }}
        >
          {/* بافت نقطه‌ای */}
          <div
            className="absolute inset-0 opacity-[0.13] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          {/* هاله‌های نور */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-14 -left-10 w-52 h-52 rounded-full blur-3xl pointer-events-none"
            style={{ background: heroTint }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute -bottom-16 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: "#fbbf24" }}
          />

          {/* اکشن‌های شناور بالای کاور */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              aria-label="بازگشت"
              className="grid place-items-center size-11 rounded-full bg-black/25 backdrop-blur-md text-white
                         hover:bg-black/40 transition-colors outline-none"
            >
              <Icon name="chevronRight" size={20} />
            </button>
            <div className="flex items-center gap-2">
              {isSelf && (
                <button
                  onClick={() => setComposerOpen(true)}
                  aria-label="پست جدید"
                  className="h-11 px-4 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white
                             text-[12px] font-extrabold inline-flex items-center gap-1.5 hover:bg-white/25
                             transition-colors outline-none"
                >
                  <Icon name="plus" size={16} />
                  پست جدید
                </button>
              )}
              <button
                onClick={() => navigate(isSelf ? { view: "edit-profile" } : { view: "chat" })}
                aria-label={isSelf ? "ویرایش" : "گفتگو"}
                className="grid place-items-center size-11 rounded-full bg-black/25 backdrop-blur-md text-white
                           hover:bg-black/40 transition-colors outline-none"
              >
                <Icon name={isSelf ? "pencil" : "chat"} size={19} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ═══════ سطر هویت — آواتار با رینگ دوتایی ═══════ */}
        <div className="relative px-4 -mt-12 z-10">
          <div className="flex items-end gap-3.5">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.08 }}
              className="shrink-0 rounded-full p-[3px] shadow-[0_10px_36px_rgba(6,95,70,0.5)]"
              style={{ background: `conic-gradient(from 210deg, ${heroTint}, #0d9488, #10b981, ${heroTint})` }}
            >
              <div className="rounded-full p-[3px] bg-background">
                <UserAvatar
                  name={profile.name}
                  avatarUrl={profile.avatarUrl}
                  verified={profile.isVerifiedBadge}
                  gender={profile.gender}
                  size="2xl"
                  ringColor="transparent"
                />
              </div>
            </motion.div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-[21px] font-black tracking-tight text-foreground leading-tight">
                  {profile.name}
                </h1>
                {isTopTalent && (
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.25 }}
                    title="استعداد برتر"
                    className="grid place-items-center size-6 rounded-full grad-gold shadow-glow-gold"
                  >
                    <Icon name="crown" size={13} className="text-white" />
                  </motion.span>
                )}
              </div>
              {profile.username && (
                <p className="text-[12.5px] font-bold text-primary mt-0.5" dir="ltr">
                  @{profile.username}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-muted-foreground">
                {province && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                    <Icon name="mapPin" size={12} className="text-primary" />
                    {province}
                    {profile.city ? ` · ${profile.city}` : ""}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                  <Icon name="calendar" size={12} className="text-primary" />
                  عضو از {formatFaDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ بدنه ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="px-4 pt-4"
      >
        {/* بایو */}
        {profile.bioShort && (
          <p className="text-[14px] leading-7 text-foreground/90 px-1 text-center">{profile.bioShort}</p>
        )}

        {/* نوار آمار شیشه‌ای تک‌تکه — الگوی مدرن */}
        <div className="mt-4 glass rounded-[22px] shadow-card grid grid-cols-3 divide-x divide-border/70 rtl:divide-x-reverse">
          <StatSeg value={formatCount(connCount)} label="ارتباطات" icon="users" />
          <StatSeg value={toFa(profile.postCount)} label="پست‌ها" icon="image" />
          <StatSeg value={toFa(profile.categories?.length || 0)} label="تخصص‌ها" icon="award" />
        </div>

        {/* اکشن اصلی + PDF */}
        <div className="mt-4 flex items-center gap-2.5">
          {primaryAction}
          <button
            onClick={() => window.open(`/api/resume/${profile.userId}`, "_blank")}
            aria-label="دانلود رزومه PDF"
            className="size-12 shrink-0 rounded-2xl glass-strong border border-border/70 text-foreground
                       grid place-items-center hover:bg-muted transition-colors outline-none"
          >
            <Icon name="briefcase" size={19} className="text-primary" />
          </button>
        </div>

        {/* تب‌های قرصی */}
        <div className="relative mt-5 p-1 glass rounded-2xl flex gap-1 shadow-card">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative z-10 flex-1 h-11 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 outline-none"
            >
              {tab === t.key && (
                <motion.div
                  layoutId="profile-tab-pill"
                  className="absolute inset-0 rounded-xl grad-brand shadow-glow"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={cn("relative z-10", tab !== t.key && "text-muted-foreground")}>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    "relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold nums-fa",
                    tab === t.key ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {toFa(t.count)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* محتوای تب */}
        <div className="mt-5 min-h-[200px]">
          <AnimatePresence mode="wait">
            {tab === "about" && (
              <TabPane key="about"><AboutTab profile={profile} catColorMap={catColorMap} /></TabPane>
            )}
            {tab === "portfolio" && (
              <TabPane key="portfolio">
                <PortfolioTab userId={profile.userId} isSelf={isSelf} />
              </TabPane>
            )}
            {tab === "resume" && (
              <TabPane key="resume"><ResumeTab profile={profile} isSelf={isSelf} userId={profile.userId} /></TabPane>
            )}
            {tab === "posts" && (
              <TabPane key="posts" className="space-y-4">
                {/* دسترسی آسان پست جدید — فرایند ساده‌شده */}
                {isSelf && posts.length > 0 && (
                  <button
                    onClick={() => setComposerOpen(true)}
                    className="w-full h-14 rounded-[20px] border-[1.5px] border-dashed border-primary/40
                               text-primary font-extrabold text-[13px] inline-flex items-center justify-center gap-2
                               hover:bg-primary/5 transition-colors outline-none"
                  >
                    <Icon name="plus" size={18} />
                    پست جدید بگذار
                  </button>
                )}
                {postsLoading ? (
                  <PostsSkeleton />
                ) : posts.length === 0 ? (
                  <EmptyState
                    kind="posts"
                    title={isSelf ? "پستی ندارید، پست جدید ارسال کنید" : "این کاربر هنوز پستی ندارد"}
                    description={isSelf ? "استعدادت را با جامعه همتیم به اشتراک بگذار — همین حالا شروع کن!" : ""}
                    action={
                      isSelf ? (
                        <button
                          onClick={() => setComposerOpen(true)}
                          className="h-12 px-6 rounded-2xl grad-brand text-white font-extrabold text-sm shadow-grad
                                     inline-flex items-center gap-2 hover:brightness-105 transition-[filter] outline-none"
                        >
                          <Icon name="plus" size={18} />
                          ارسال پست جدید
                        </button>
                      ) : undefined
                    }
                  />
                ) : (
                  posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)
                )}
              </TabPane>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* شیت کامپوزر — ساخت پست از دل پروفایل */}
      <ComposerSheet
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={() => {
          setPostsLoaded(false); // رفرش پست‌ها پس از انتشار
        }}
      />
    </div>
  );
}

/* ─────────── اجزای کوچک ─────────── */

function TabPane({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatSeg({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="py-3.5 flex flex-col items-center gap-1">
      <div className="grad-brand size-7 rounded-xl grid place-items-center text-white">
        <Icon name={icon} size={14} />
      </div>
      <span className="font-black text-[17px] leading-none nums-fa">{value}</span>
      <span className="text-[10.5px] text-muted-foreground font-bold">{label}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <Skeleton className="h-48 sm:h-56 rounded-b-[36px] rounded-t-none" />
      <div className="px-4 -mt-10 relative z-10">
        <div className="flex items-end gap-3.5">
          <Skeleton className="size-24 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pb-1">
            <Skeleton className="h-6 w-36 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-16 rounded-[22px] mt-4" />
        <Skeleton className="h-12 rounded-2xl mt-4" />
        <Skeleton className="h-11 rounded-2xl mt-5" />
        <Skeleton className="h-32 rounded-2xl mt-5" />
      </div>
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-2xl" />
      ))}
    </div>
  );
}
