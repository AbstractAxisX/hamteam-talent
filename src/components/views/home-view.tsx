"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/use-user";
import { api, apiPost } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/shared/icon";
import { PostCard } from "@/components/shared/post-card";
import { Sheet } from "@/components/shared/sheet";
import { ComposerInline } from "@/components/composer";
import { BannerSlider } from "@/components/shared/banner-slider";
import { EliteCheckMark } from "@/components/ui/elite";
import { toFa, formatCount } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PostWithRelations, TalentListItem, CategoryWithSkills, ProfileDetail, ProfileMeta } from "@/lib/types";
import type { FrameLevel } from "@/lib/stars";

/* ═══════════════════════════════════════════════════════════
   HomeView — صفحهٔ خانهٔ فرصتینو (کلاسیک · موبایل)
   · بنرها + خوش‌آمد (فقط کلمهٔ خوش‌آمد — بدون تاریخ) + آمار
   · چک‌لیست تکمیل پروفایل → آکاردئون با حافظهٔ localStorage
   · فرم معمولی پست روی صفحه (بدون شیت)
   · عضو → پنل رسمی تیرهٔ «چهره برتر شو»:
     ۵۰۰۰ ستاره یا ۵۰۰ رأی → قاب نقره‌ای · ۱۰۰۰۰ ستاره → قاب طلایی
     + ردیف جایگاه‌ها (کل / دسته / مهارت — فقط عدد) + مسیر جایگزین ادمین
   · چهره‌یاب → کارت داشبورد چهره‌یاب (بدون پنل ستاره و چک‌لیست)
   · شاید بشناسید + دسته‌بندی‌ها + فید ارتباط‌ها
   ═══════════════════════════════════════════════════════════ */

/* کلید localStorage وضعیت آکاردئون تکمیل پروفایل — "1" یعنی بسته */
const COMPLETION_COLLAPSED_KEY = "home-completion-collapsed";

type RankRow = { rank: number; total: number };

type HomeData = {
  posts: PostWithRelations[];
  suggestions: TalentListItem[];
  stats: {
    connectionsCount: number;
    postsCount: number;
    followersCount: number;
    totalStars: number;
    votes: number;
    frame: FrameLevel;
    nextAt: number | null;
    nextFrame: "silver" | "gold" | null;
  };
  rank: null | {
    overall: RankRow;
    category: ({ name: string } & RankRow) | null;
    skill: ({ name: string } & RankRow) | null;
  };
};

/* گام‌های تکمیل پروفایل — کلید = آی‌دی سکشن در ادیت پروفایل */
type CompletionStep = {
  key: string;
  label: string;
  hint: string;
  done: boolean;
  section: string;
};

/* ── مسیر جایگزین چهره برتر — وضعیت درخواست بررسی مستقیم ادمین ──
   GET /api/elite/request → { isTopTalent, frame, request | null } */
type EliteRequestState = {
  id: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type EliteStatus = {
  isTopTalent: boolean;
  frame: FrameLevel;
  request: EliteRequestState | null;
};

const ELITE_REASON_MIN = 30;

/** عدد فارسی با جداکنندهٔ هزارگان — ۵٬۰۰۰ */
function faSep(n: number): string {
  return toFa(n.toLocaleString("en-US")).replace(/,/g, "٬");
}

export function HomeView() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<HomeData | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [meta, setMeta] = useState<ProfileMeta | null>(null);
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  /* مسیر جایگزین چهره برتر */
  const [eliteStatus, setEliteStatus] = useState<EliteStatus | null>(null);
  const [eliteDialogOpen, setEliteDialogOpen] = useState(false);

  /* آکاردئون تکمیل پروفایل — پیش‌فرض باز؛ "1" در localStorage یعنی بسته */
  const [completionCollapsed, setCompletionCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(COMPLETION_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleCompletion = useCallback(() => {
    setCompletionCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COMPLETION_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* حافظهٔ محلی در دسترس نیست — فقط وضعیت همین جلسه */
      }
      return next;
    });
  }, []);

  const refreshEliteStatus = useCallback(() => {
    api<EliteStatus>("/api/elite/request")
      .then((d) => setEliteStatus(d))
      .catch(() => {});
  }, []);

  /* مسیر جایگزین فقط برای اعضا (چهره‌یاب پنل ستاره ندارد) */
  useEffect(() => {
    if (!user || user.isScout) return;
    refreshEliteStatus();
  }, [user, refreshEliteStatus]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api<HomeData>("/api/feed/home").catch(() => null),
      api<ProfileDetail>("/api/profile/me").catch(() => null),
      api<ProfileMeta>("/api/profile/me/meta").catch(() => null),
      api<{ categories: CategoryWithSkills[] }>("/api/categories").catch(() => ({ categories: [] as CategoryWithSkills[] })),
    ])
      .then(([d, p, m, c]) => {
        setData(d);
        setProfile(p);
        setMeta(m);
        setCats(c.categories);
      })
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

  const isScout = !!user?.isScout;

  /* ── چک‌لیست تکمیل پروفایل ── */
  const steps: CompletionStep[] = useMemo(() => {
    if (!profile) return [];
    const hasSkills = profile.categories.some((c) => c.skills.length > 0);
    return [
      { key: "avatar", label: "عکس پروفایل", hint: "با عکس، ۵ برابر بیشتر دیده می‌شی", done: !!profile.avatarUrl, section: "photos" },
      { key: "banner", label: "بنر پروفایل", hint: "کانال اختصاصی خودت را بساز", done: !!profile.bannerUrl, section: "photos" },
      { key: "bio", label: "بیو کوتاه", hint: "در یک خط بگو چه‌کاره‌ای", done: (profile.bioShort || "").trim().length >= 10, section: "photos" },
      { key: "cats", label: "دسته‌بندی", hint: "حوزهٔ استعدادت را انتخاب کن", done: profile.categories.length > 0, section: "categories" },
      { key: "skills", label: "مهارت‌ها", hint: "حداقل یک مهارت ثبت کن", done: hasSkills, section: "categories" },
      { key: "main", label: "دستهٔ اصلی", hint: "رنگ و حلقهٔ پروفایلت", done: !!meta?.mainCategoryId, section: "main-category" },
      { key: "loc", label: "موقعیت", hint: "استان و شهرت را ثبت کن", done: !!(profile.province && profile.city), section: "location" },
      { key: "exp", label: "سابقه / تحصیلات", hint: "رزومهٔ حرفه‌ای بساز", done: profile.experiences.length > 0 || profile.educations.length > 0, section: "experience" },
    ];
  }, [profile, meta]);

  const doneSteps = steps.filter((s) => s.done).length;
  const profilePct = steps.length ? Math.round((doneSteps / steps.length) * 100) : 100;
  const incomplete = steps.filter((s) => !s.done);

  /* ── پیشرفت ستارهٔ من — آستانه‌ها از سرور (stats.nextAt) ──
     ۵۰۰۰ ستاره یا ۵۰۰ رأی → قاب نقره‌ای · ۱۰۰۰۰ ستاره → قاب طلایی */
  const myStars = data?.stats.totalStars ?? 0;
  const myFrame: FrameLevel = data?.stats.frame ?? null;
  const target = data?.stats.nextAt ?? (myFrame === "silver" ? 10000 : 5000);
  const starPct = myFrame === "gold" ? 100 : Math.min(100, Math.round((myStars / target) * 100));
  const remaining = myFrame === "gold" ? 0 : Math.max(0, target - myStars);
  const rank = data?.rank ?? null;

  /* تینت پنل = هدف بعدی: بدون قاب → نقره‌ای (سلیت تیره)؛ نقره‌ای/طلایی → طلایی */
  const goldTint = myFrame === "silver" || myFrame === "gold";

  /* ── مسیر جایگزین — فقط برای کاربرانی که هنوز چهره برتر نیستند
     (درخواست تأییدشده همیشه چیپ تأیید ادمین را نشان می‌دهد) ── */
  const eliteReq = eliteStatus?.request ?? null;
  const alreadyElite = eliteStatus ? eliteStatus.isTopTalent : myFrame != null;
  const showEliteAltPath = eliteReq?.status === "approved" || !alreadyElite;
  const elitePending = eliteReq?.status === "pending";
  const eliteApproved = eliteReq?.status === "approved";

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
    <div className="max-w-2xl mx-auto space-y-4 pb-4">
      {/* ═══ بنرها و تبلیغات ═══ */}
      <BannerSlider />

      {loading ? (
        /* بارگذاری ناحیهٔ بالای صفحه — اسپینر جمع‌وجور (فید خودش اسکلتون دارد) */
        <div role="status" aria-label="در حال بارگذاری" className="grid place-items-center py-12">
          <Icon name="loader" size={28} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* ═══ کارت خوش‌آمد — فقط کلمهٔ خوش‌آمد + نام (دو خط) + آمار در ردیف جدا ═══ */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card p-4 md:p-5"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate({ view: "my-profile" })}
                className="shrink-0 hover:opacity-90 transition-opacity"
                aria-label="پروفایل من"
              >
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.profile?.avatarUrl || null}
                  verified={user.isVerifiedBadge}
                  frame={user.frame ?? undefined}
                  topTalent={user.isTopTalent}
                  gender={user.profile?.gender}
                  size="lg"
                />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-primary tracking-wide leading-none">{greeting}</p>
                <h1 className="text-lg md:text-xl font-black leading-snug line-clamp-2 break-words mt-1">{user.name}</h1>
              </div>
            </div>
            {/* آمار — ارتباط = دنبال‌کننده (یک عدد) — ردیف جدا با جداکننده */}
            <div className="mt-3.5 grid grid-cols-2 border-t border-border pt-3">
              <MiniStat
                value={data ? formatCount(data.stats.connectionsCount) : "—"}
                label="ارتباط"
                icon="users"
              />
              <div className="border-r border-border">
                <MiniStat
                  value={data ? formatCount(data.stats.postsCount) : "—"}
                  label="پست"
                  icon="image"
                />
              </div>
            </div>
          </motion.section>

          {/* ═══ آکاردئون تکمیل پروفایل — فقط اعضا؛ ۱۰۰٪ کامل → مخفی ═══ */}
          {!isScout && incomplete.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="rounded-2xl border border-border bg-card p-4 md:p-5"
            >
              <button
                onClick={toggleCompletion}
                aria-expanded={!completionCollapsed}
                aria-controls="home-completion-body"
                className="w-full flex items-center gap-3 text-right"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold text-primary tracking-widest leading-none">تکمیل پروفایل</span>
                  <span className="block text-lg font-black tracking-tight mt-1">
                    پروفایلت {toFa(profilePct)}٪ کامله
                  </span>
                </span>
                {/* پیشرفت دایره‌ای کوچک */}
                <span className="shrink-0 relative grid place-items-center size-10" aria-hidden>
                  <svg viewBox="0 0 36 36" className="size-10 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none" stroke="var(--primary)" strokeWidth="3.5"
                      strokeLinecap="round" strokeDasharray={`${(profilePct / 100) * 97.4} 97.4`}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-black nums-fa">{toFa(profilePct)}٪</span>
                </span>
                <Icon
                  name="chevronDown"
                  size={18}
                  className={cn(
                    "shrink-0 text-muted-foreground transition-transform duration-200",
                    !completionCollapsed && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {!completionCollapsed && (
                  <motion.div
                    key="home-completion-body"
                    id="home-completion-body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border">
                      {/* نوار پیشرفت */}
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${profilePct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>

                      {/* گام‌های ناقص (حداکثر ۶) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {incomplete.slice(0, 6).map((s) => (
                          <button
                            key={s.key}
                            onClick={() => navigate({ view: "edit-profile", params: { section: s.section } })}
                            className="group flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50
                                       hover:border-primary/40 hover:bg-primary/5 transition-colors text-right"
                          >
                            <span className="shrink-0 grid place-items-center size-9 rounded-xl bg-primary/10 text-primary">
                              <Icon name="arrowLeft" size={16} strokeWidth={2.4} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-extrabold text-foreground leading-tight">{s.label}</span>
                              <span className="block text-[10.5px] text-muted-foreground font-medium mt-0.5 leading-4">{s.hint}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                      {incomplete.length > 6 && (
                        <button
                          onClick={() => navigate({ view: "edit-profile" })}
                          className="mt-3 w-full h-10 rounded-xl bg-primary text-primary-foreground font-extrabold text-[13px] hover:bg-primary/90 transition-colors"
                        >
                          تکمیل بقیهٔ گام‌ها ({toFa(incomplete.length - 6)} مورد)
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </>
      )}

      {/* ═══ فرم معمولی پست — روی صفحه، بدون شیت ═══ */}
      <ComposerInline onPosted={() => load()} />

      {/* ═══ چهره‌یاب → کارت داشبورد (بدون پنل ستاره و چک‌لیست) ═══ */}
      {!loading && isScout && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-emerald-600/20 bg-emerald-600/5 p-4 md:p-5"
        >
          <div className="flex items-center gap-3">
            <span className="shrink-0 grid place-items-center size-11 rounded-xl border border-emerald-600/20 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
              <Icon name="search" size={20} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black tracking-tight leading-snug">داشبورد چهره‌یاب</h2>
              <p className="text-[11.5px] text-muted-foreground font-medium leading-5 mt-0.5">
                جست‌وجوی استعدادها، بررسی ویترین‌ها و مدیریت نیازمندی‌ها
              </p>
            </div>
          </div>
          <div className="mt-3.5 flex gap-2">
            <button
              onClick={() => navigate({ view: "scout" })}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-extrabold text-[12.5px] hover:bg-primary/90 transition-colors"
            >
              ورود به داشبورد چهره‌یاب
            </button>
            <button
              onClick={() => navigate({ view: "create-need" })}
              className="h-10 px-4 rounded-xl border border-border bg-card text-foreground font-bold text-[12.5px]
                         hover:border-primary/40 transition-colors inline-flex items-center gap-1.5"
            >
              <Icon name="plus" size={14} />
              ثبت نیازمندی
            </button>
          </div>
        </motion.section>
      )}

      {/* ═══ پنل رسمی «چهره برتر شو» — فقط اعضا ═══
          ۵۰۰۰ ستاره یا ۵۰۰ رأی → قاب نقره‌ای · ۱۰۰۰۰ ستاره → قاب طلایی */}
      {!loading && !isScout && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="relative overflow-hidden rounded-2xl p-4 md:p-5"
          style={{
            background: goldTint
              ? "linear-gradient(120deg,#2a1a04 0%,#171005 45%,#241604 100%)"
              : "linear-gradient(120deg,#1e293b 0%,#0f172a 45%,#1a2433 100%)",
            boxShadow: goldTint
              ? "inset 0 0 0 1px rgba(245,200,76,.32), 0 10px 30px rgba(146,97,14,.22)"
              : "inset 0 0 0 1px rgba(203,213,225,.32), 0 10px 30px rgba(51,65,85,.22)",
          }}
        >
          <div className="flex items-center gap-3.5">
            <EliteCheckMark size={30} tint={myFrame ?? "silver"} />
            <div className="min-w-0 flex-1">
              <h2
                className={cn(
                  "text-base md:text-lg font-black tracking-tight leading-snug",
                  goldTint ? "text-gold-grad" : "text-white"
                )}
              >
                چهره برتر شو
              </h2>
              <p
                className={cn(
                  "text-[11px] font-medium leading-4 mt-1",
                  goldTint ? "text-amber-100/70" : "text-slate-300/70"
                )}
              >
                ۵۰۰۰ ستاره یا ۵۰۰ رأی → قاب نقره‌ای · ۱۰۰۰۰ ستاره → قاب طلایی
              </p>
            </div>
          </div>

          {/* نوار پیشرفت ستارهٔ من */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={cn(
                  "text-[11px] font-bold nums-fa inline-flex items-center gap-1",
                  goldTint ? "text-amber-100/90" : "text-slate-100/90"
                )}
              >
                <Icon name="star" size={13} className={goldTint ? "text-amber-300" : "text-slate-300"} />
                {formatCount(myStars)} ستارهٔ دریافتی
              </span>
              {myFrame === "gold" ? (
                <span className="shrink-0 inline-flex items-center h-7 px-2.5 rounded-full grad-gold text-white text-[10.5px] font-black">
                  بالاترین سطح — طلایی ✓
                </span>
              ) : (
                <span
                  className={cn(
                    "shrink-0 text-[11px] font-bold nums-fa",
                    goldTint ? "text-amber-100/70" : "text-slate-300/70"
                  )}
                >
                  هدف: {faSep(target)} (قاب {myFrame === "silver" ? "طلایی" : "نقره‌ای"})
                </span>
              )}
            </div>
            <div
              className={cn(
                "h-2.5 rounded-full overflow-hidden bg-black/40 border",
                goldTint ? "border-amber-500/20" : "border-slate-400/20"
              )}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${starPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: goldTint
                    ? "linear-gradient(90deg,#b45309,#f5c84c,#fef3c7)"
                    : "linear-gradient(90deg,#475569,#cbd5e1,#f8fafc)",
                }}
              />
            </div>
            <p
              className={cn(
                "text-[10.5px] font-medium mt-1.5 leading-4",
                goldTint ? "text-amber-100/50" : "text-slate-300/60"
              )}
            >
              {myFrame === "gold"
                ? "در بالاترین سطح چهره برتری — قاب طلایی را داری."
                : myFrame === "silver"
                ? `تا قاب طلایی ${formatCount(remaining)} ستاره مانده`
                : `تا قاب نقره‌ای ${formatCount(remaining)} ستاره مانده`}
            </p>
          </div>

          {/* جایگاه‌ها — فقط عدد، بدون نمایش قبل/بعد */}
          {rank && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <RankChip label="جایگاه در کل:" rank={rank.overall.rank} total={rank.overall.total} />
              {rank.category && (
                <RankChip
                  label={`جایگاه در ${rank.category.name}:`}
                  rank={rank.category.rank}
                  total={rank.category.total}
                  truncateLabel
                />
              )}
              {rank.skill && (
                <RankChip
                  label={`جایگاه در ${rank.skill.name}:`}
                  rank={rank.skill.rank}
                  total={rank.skill.total}
                  truncateLabel
                />
              )}
            </div>
          )}

          <button
            onClick={() => navigate({ view: "explore" })}
            className="mt-4 w-full h-11 rounded-xl text-white font-extrabold text-[13px] shadow-glow-gold transition-transform active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
          >
            مشاهده چهره برتر
          </button>

          {/* ═══ مسیر جایگزین — درخواست بررسی مستقیم ادمین ═══ */}
          {showEliteAltPath &&
            (elitePending ? (
              <div className="mt-2.5 flex justify-center">
                <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-white/25 bg-white/5 text-white/85 text-[11.5px] font-bold">
                  <Icon name="clock" size={13} className="text-white/70" />
                  درخواست بررسی مستقیم: در انتظار بررسی ادمین
                </span>
              </div>
            ) : eliteApproved ? (
              <div className="mt-2.5 flex justify-center">
                <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full grad-gold text-white text-[11.5px] font-black shadow-glow-gold">
                  <EliteCheckMark size={14} tint="gold" />
                  چهره برتر — تأیید ادمین
                </span>
              </div>
            ) : (
              <button
                onClick={() => setEliteDialogOpen(true)}
                className="mt-2.5 w-full h-9 rounded-xl text-[12px] font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                استعداد برتری داری؟ درخواست بررسی مستقیم ادمین
              </button>
            ))}
        </motion.section>
      )}

      {/* ═══ ریل «شاید بشناسید» — پیشنهاد افراد ═══ */}
      {!loading && data && data.suggestions.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <div className="flex items-end justify-between mb-2.5">
            <div>
              <p className="text-[11px] font-bold text-primary tracking-widest">پیشنهاد فرصتینو</p>
              <h2 className="text-lg font-black tracking-tight">شاید بشناسید</h2>
            </div>
            <button
              onClick={() => navigate({ view: "discover" })}
              className="inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:gap-1.5 transition-all"
            >
              کشف بیشتر
              <Icon name="arrowLeft" size={14} strokeWidth={2.6} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1.5">
            {data.suggestions.slice(0, 8).map((t) => (
              <SuggestionCard
                key={t.id}
                talent={t}
                busy={connectingIds.has(t.id)}
                onConnect={() => handleConnect(t)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ═══ دسته‌بندی‌ها ═══ */}
      {!loading && cats.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <div className="flex items-end justify-between mb-2.5">
            <div>
              <p className="text-[11px] font-bold text-primary tracking-widest">دسته‌بندی‌ها</p>
              <h2 className="text-lg font-black tracking-tight">دنبالِ چی هستی؟</h2>
            </div>
            <button
              onClick={() => navigate({ view: "discover" })}
              className="inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:gap-1.5 transition-all"
            >
              همه
              <Icon name="arrowLeft" size={14} strokeWidth={2.6} />
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {cats.slice(0, 10).map((c) => (
              <button
                key={c.id}
                onClick={() => navigate({ view: "category", id: c.id })}
                className="aspect-square rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-1
                           hover:border-primary/40 active:scale-95 transition-[border-color,transform]"
              >
                <span className="grid place-items-center size-10 rounded-xl text-xl" style={{ backgroundColor: `${c.color || "#0f569e"}22` }}>
                  {c.iconUrl || "✨"}
                </span>
                <span className="text-[10.5px] font-bold text-foreground line-clamp-1 px-1 text-center">{c.name}</span>
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {/* ═══ فید پست‌ها — من + ارتباط‌هایم ═══ */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <div className="flex items-end justify-between mb-2.5">
          <div>
            <p className="text-[11px] font-bold text-primary tracking-widest">خط زمانی</p>
            <h2 className="text-lg font-black tracking-tight">از ارتباط‌های شما</h2>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground nums-fa">
            {data ? `${toFa(data.posts.length)} پست` : "…"}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : !data || data.posts.length === 0 ? (
          <EmptyState
            kind="people"
            title="هنوز پستی در خانه نیست"
            description="پست‌های خودت و افرادی که با آن‌ها ارتباط برقرار می‌کنی اینجا دیده می‌شود."
            action={
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => navigate({ view: "discover" })}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-extrabold text-[13px] hover:bg-primary/90 transition-colors"
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

      {/* ═══ مودال مسیر جایگزین چهره برتر — فقط اعضا ═══ */}
      {!isScout && (
        <EliteRequestDialog
          open={eliteDialogOpen}
          onClose={() => setEliteDialogOpen(false)}
          onSubmitted={refreshEliteStatus}
        />
      )}
    </div>
  );
}

/* ── مودال «مسیر جایگزین چهره برتر» — درخواست بررسی مستقیم ادمین ──
   الگوی RatingModal: Sheet + ESC/بک‌دراپ */
function EliteRequestDialog({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  /* قفل اسکرول + ESC */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, submitting]);

  const trimmed = reason.trim();
  const tooShort = trimmed.length < ELITE_REASON_MIN;

  async function submit() {
    if (tooShort || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<{ ok: boolean; message: string }>("/api/elite/request", {
        reason: trimmed,
      });
      toast({ title: "درخواست بررسی مستقیم ثبت شد", description: res.message });
      onClose();
      onSubmitted();
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast({ title: "خطا در ثبت درخواست", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => !submitting && onClose()}
      title="مسیر جایگزین چهره برتر"
      description="اگر سابقه و افتخارات شما نشان می‌دهد استعدادی برتر هستید، می‌توانید به‌جای مسیر ستاره (۵٬۰۰۰ ستاره یا ۵۰۰ رأی) درخواست بررسی مستقیم ادمین را ثبت کنید تا قاب نقره‌ای/طلایی برای شما فعال شود. درخواست شما با صلاح‌دید ادمین و نظر چهره‌یاب‌ها بررسی می‌شود."
      footer={
        <button
          onClick={submit}
          disabled={submitting || tooShort}
          className="w-full h-12 rounded-xl text-white font-extrabold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-[filter] hover:brightness-105 outline-none"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
        >
          {submitting ? (
            <Icon name="loader" size={16} className="animate-spin" />
          ) : (
            <Icon name="send" size={15} />
          )}
          {submitting ? "در حال ارسال…" : "ارسال درخواست بررسی"}
        </button>
      }
    >
      <div>
        {/* متن ادعا — حداقل ۳۰ کاراکتر */}
        <div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="سابقه، افتخارات و دلیل برتری شما…"
            rows={5}
            maxLength={2000}
            className="w-full min-h-[120px] rounded-2xl border-[1.5px] border-input bg-muted/60 px-4 py-3 text-[13px] leading-6 placeholder:text-muted-foreground/70 outline-none focus:border-ring focus:bg-card transition-[border-color,background-color] resize-y"
          />
          <p className="mt-1.5 px-1 text-[11px] font-bold nums-fa">
            <span className={tooShort ? "text-muted-foreground" : "text-emerald-600"}>
              {toFa(trimmed.length)}/{toFa(ELITE_REASON_MIN)} کاراکتر حداقل
            </span>
          </p>
        </div>

        {error && (
          <p className="mt-1.5 text-[12px] font-bold text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      <p className="mt-2 text-center text-[10.5px] text-muted-foreground/80 leading-4">
        با تأیید ادمین، قاب نقره‌ای/طلایی بدون نیاز به آستانهٔ ستاره فعال می‌شود.
      </p>
    </Sheet>
  );
}

/* ── آمار کوچک — ردیفی (آیکون + عدد + برچسب) ── */
function MiniStat({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Icon name={icon} size={15} className="text-primary shrink-0" />
      <span className="text-[15px] font-black nums-fa leading-none">{value}</span>
      <span className="text-[10.5px] font-bold text-muted-foreground leading-none">{label}</span>
    </div>
  );
}

/* ── چیپ جایگاه — داخل پنل تیرهٔ «چهره برتر شو» (فقط عدد) ── */
function RankChip({
  label,
  rank,
  total,
  truncateLabel,
}: {
  label: string;
  rank: number;
  total: number;
  truncateLabel?: boolean;
}) {
  return (
    <span className="inline-flex items-center h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 text-white/85 text-[11px] font-bold nums-fa">
      <span className={truncateLabel ? "max-w-[150px] truncate" : ""}>{label}{" "}</span>
      <span className="shrink-0 whitespace-nowrap">
        {toFa(rank)} از {toFa(total)}
      </span>
    </span>
  );
}

/* ── کارت پیشنهاد فرد — کلاسیک، فقط محو ── */
function SuggestionCard({
  talent,
  busy,
  onConnect,
}: {
  talent: TalentListItem;
  busy: boolean;
  onConnect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="shrink-0 w-[180px] p-4 rounded-2xl border border-border bg-card flex flex-col items-center text-center gap-2"
    >
      <button onClick={() => navigate({ view: "profile", id: talent.id })} aria-label={talent.name}>
        <UserAvatar
          name={talent.name}
          avatarUrl={talent.avatarUrl}
          verified={talent.isVerifiedBadge}
          gender={talent.gender}
          size="xl"
          frame={talent.frame ?? undefined}
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
      <button
        onClick={onConnect}
        disabled={busy}
        className="w-full h-9 rounded-xl text-[11.5px] font-extrabold inline-flex items-center justify-center gap-1.5
                   bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        <Icon name={busy ? "loader" : "userPlus"} size={13} className={busy ? "animate-spin" : ""} />
        {busy ? "در حال ارسال" : "برقراری ارتباط"}
      </button>
    </motion.div>
  );
}
