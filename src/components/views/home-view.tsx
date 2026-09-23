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
import { ComposerInline } from "@/components/composer";
import { BannerSlider } from "@/components/shared/banner-slider";
import { GoldCheckMark, GoldSparkle, RoseGoldCheckMark } from "@/components/ui/elite";
import { toFa, formatCount, formatFaDate } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PostWithRelations, TalentListItem, CategoryWithSkills, ProfileDetail, ProfileMeta } from "@/lib/types";
import type { FrameLevel } from "@/lib/stars";

/* ═══════════════════════════════════════════════════════════
   HomeView — صفحهٔ خانهٔ فرصتینو (ترکیب کامل)
   · بنرها و تبلیغات + خوش‌آمد + آمار (ارتباط / پست)
   · چک‌لیست قدم‌به‌قدم تکمیل پروفایل (شورتکات مستقیم)
   · فرم معمولی پست (روی صفحه — بدون شیت)
   · پنل پیشرفت ستاره «چهره برتر شو» (۵۰۰۰ طلایی / ۱۰۰۰۰ رزگلد)
     + مسیر جایگزین: درخواست بررسی مستقیم ادمین (EliteRequestDialog)
   · شاید بشناسید + دسته‌بندی‌ها + فید ارتباط‌ها
   ═══════════════════════════════════════════════════════════ */

const GOLD_THRESHOLD = 5000;
const ROSE_GOLD_THRESHOLD = 10000;

type HomeData = {
  posts: PostWithRelations[];
  suggestions: TalentListItem[];
  stats: {
    connectionsCount: number;
    postsCount: number;
    followersCount: number;
    totalStars: number;
    frame: FrameLevel;
    nextAt: number | null;
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

  const refreshEliteStatus = useCallback(() => {
    api<EliteStatus>("/api/elite/request")
      .then((d) => setEliteStatus(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
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

  /* ── پیشرفت ستارهٔ من — سطح فعلی/بعدی برای پنل «چهره برتر شو» ── */
  const myStars = data?.stats.totalStars ?? 0;
  const myFrame = data?.stats.frame ?? null;
  const target = myFrame === "rosegold" ? null : data?.stats.nextAt ?? (myFrame === "gold" ? ROSE_GOLD_THRESHOLD : GOLD_THRESHOLD);
  const starPct = target ? Math.min(100, Math.round((myStars / target) * 100)) : 100;
  const remaining = target ? Math.max(0, target - myStars) : 0;

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
    <div className="max-w-2xl mx-auto space-y-5 pb-4">
      {/* ═══ بنرها و تبلیغات (از صفحهٔ عمومی) ═══ */}
      <BannerSlider />

      {/* ═══ نوار خوش‌آمد + آمار (ارتباط / پست) ═══ */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[26px] glass border border-border/60 p-5 md:p-6"
      >
        <div
          aria-hidden
          className="absolute -top-20 -left-14 w-56 h-56 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ backgroundColor: "rgba(61, 124, 190, 0.42)" }}
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
              frame={user.frame ?? undefined}
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
          </div>
          {/* آمار — ارتباط = دنبال‌کننده (یک عدد) */}
          <div className="shrink-0 grid grid-cols-2 gap-2 md:gap-3">
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
          </div>
        </div>
      </motion.section>

      {/* ═══ چک‌لیست قدم‌به‌قدم تکمیل پروفایل (اگر ناقص است) ═══ */}
      {!loading && incomplete.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="rounded-[26px] glass border border-border/60 p-5 md:p-6"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] font-bold text-primary tracking-widest">تکمیل پروفایل</p>
              <h2 className="text-lg font-black tracking-tight">
                پروفایلت {toFa(profilePct)}٪ کامله — قدم آخر!
              </h2>
            </div>
            <div className="shrink-0 relative grid place-items-center size-14">
              <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="var(--primary)" strokeWidth="3.5"
                  strokeLinecap="round" strokeDasharray={`${(profilePct / 100) * 97.4} 97.4`}
                />
              </svg>
              <span className="absolute text-[11px] font-black nums-fa">{toFa(profilePct)}٪</span>
            </div>
          </div>

          {/* نوار پیشرفت */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profilePct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full grad-brand rounded-full"
            />
          </div>

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
              className="mt-3 w-full h-10 rounded-xl grad-brand text-white font-extrabold text-[13px] shadow-grad"
            >
              تکمیل بقیهٔ گام‌ها ({toFa(incomplete.length - 6)} مورد)
            </button>
          )}
        </motion.section>
      )}

      {/* ═══ فرم معمولی پست — روی صفحه، بدون شیت ═══ */}
      <ComposerInline onPosted={() => load()} />

      {/* ═══ پنل پیشرفت ستاره — «چهره برتر شو» (۵۰۰۰ طلایی / ۱۰۰۰۰ رزگلد) ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="relative overflow-hidden rounded-[26px] p-5 md:p-6"
        style={{
          background: "linear-gradient(120deg,#2a1a04 0%,#171005 45%,#241604 100%)",
          boxShadow: "inset 0 0 0 1px rgba(245,200,76,.32), 0 10px 30px rgba(146,97,14,.22)",
        }}
      >
        <GoldSparkle size={11} delay={0.2} style={{ top: "14%", left: "12%" }} />
        <GoldSparkle size={9} delay={1.1} style={{ top: "58%", left: "6%" }} />
        <GoldSparkle size={12} delay={0.6} style={{ top: "12%", right: "20%" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <span
              className="shrink-0 grid place-items-center size-14 rounded-full"
              style={{
                background:
                  myFrame === "rosegold"
                    ? "linear-gradient(135deg,#ffe4e6,#fb7185 45%,#be123c)"
                    : "linear-gradient(135deg,#fef3c7,#f5c84c 45%,#b45309)",
                boxShadow:
                  myFrame === "rosegold"
                    ? "0 8px 24px rgba(225,29,72,.4), inset 0 2px 8px rgba(255,255,255,.5)"
                    : "0 8px 24px rgba(217,119,6,.4), inset 0 2px 8px rgba(255,255,255,.5)",
              }}
            >
              {myFrame === "rosegold" ? <RoseGoldCheckMark size={26} /> : <GoldCheckMark size={26} />}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base md:text-lg font-black tracking-tight text-gold-grad leading-snug">
                چهره برتر شو
              </h2>
              <p className="text-[11.5px] text-amber-100/70 font-medium leading-5 mt-1">
                ۵۰۰۰ ستاره یا ۵۰۰ رأی → قاب طلایی و ارسال هفته‌ای یک پست به چهره برتر · ۱۰۰۰۰ ستاره → قاب رزگلد
              </p>
            </div>
          </div>

          {/* نوار پیشرفت ستارهٔ من */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
              <span className="text-amber-100/90 nums-fa inline-flex items-center gap-1">
                <Icon name="star" size={13} className="text-amber-300" />
                {formatCount(myStars)} ستارهٔ دریافتی
              </span>
              {myFrame === "rosegold" ? (
                <span className="text-rose-200/90 font-black">بالاترین سطح — رزگلد ✓</span>
              ) : target ? (
                <span className="text-amber-100/60 nums-fa">هدف: {formatCount(target)}</span>
              ) : null}
            </div>
            <div className="h-2.5 rounded-full overflow-hidden bg-black/40 border border-amber-500/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${starPct}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={
                  myFrame === "rosegold"
                    ? { background: "linear-gradient(90deg,#be123c,#fb7185,#fecdd3)" }
                    : { background: "linear-gradient(90deg,#b45309,#f5c84c,#fef3c7)" }
                }
              />
            </div>
            <p className="text-[10.5px] text-amber-100/50 font-medium mt-1.5 leading-4">
              {myFrame === "rosegold"
                ? "در بالاترین سطح چهره برتری — قاب رزگلد را داری."
                : myFrame === "gold"
                ? `تا قاب رزگلد ${formatCount(remaining)} ستاره مانده — هر پست می‌تواند ستاره بیاورد.`
                : `تا قاب طلایی و ارسال پست به چهره برتر ${formatCount(remaining)} ستاره مانده.`}
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate({ view: "explore" })}
            className="mt-4 w-full h-11 rounded-2xl text-white font-extrabold text-[13px] shadow-glow-gold"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
          >
            مشاهده چهره برتر
          </motion.button>

          {/* ═══ مسیر جایگزین — درخواست بررسی مستقیم ادمین ═══ */}
          {showEliteAltPath &&
            (elitePending ? (
              <div className="mt-2.5 flex justify-center">
                <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-amber-300/35 bg-amber-400/10 text-amber-100/85 text-[11.5px] font-bold">
                  <Icon name="clock" size={13} className="text-amber-300" />
                  درخواست بررسی مستقیم: در انتظار بررسی ادمین
                </span>
              </div>
            ) : eliteApproved ? (
              <div className="mt-2.5 flex justify-center">
                <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full grad-gold text-white text-[11.5px] font-black shadow-glow-gold">
                  <GoldCheckMark size={14} />
                  چهره برتر — تأیید ادمین ⭐
                </span>
              </div>
            ) : (
              <button
                onClick={() => setEliteDialogOpen(true)}
                className="mt-2.5 w-full h-9 rounded-xl text-[12px] font-bold text-amber-100/60 hover:text-amber-100 hover:bg-amber-100/5 transition-colors"
              >
                استعداد برتری داری؟ درخواست بررسی مستقیم ادمین
              </button>
            ))}
        </div>
      </motion.section>

      {/* ═══ ریل «شاید بشناسید» — پیشنهاد افراد ═══ */}
      {!loading && data && data.suggestions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[11px] font-bold text-primary tracking-widest">پیشنهاد فرصتینو</p>
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

      {/* ═══ دسته‌بندی‌ها (از صفحهٔ عمومی) ═══ */}
      {!loading && cats.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
        >
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[11px] font-bold text-primary tracking-widest">دسته‌بندی‌ها</p>
              <h2 className="text-lg md:text-xl font-black tracking-tight">دنبالِ چی هستی؟</h2>
            </div>
            <button
              onClick={() => navigate({ view: "discover" })}
              className="inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:gap-1.5 transition-all"
            >
              همه
              <Icon name="arrowLeft" size={14} strokeWidth={2.6} className="text-primary" />
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {cats.slice(0, 10).map((c) => (
              <motion.button
                key={c.id}
                onClick={() => navigate({ view: "category", id: c.id })}
                whileTap={{ scale: 0.94 }}
                className="aspect-square rounded-2xl glass border border-border/60 flex flex-col items-center justify-center gap-1
                           hover:border-primary/40 transition-colors"
              >
                <span className="grid place-items-center size-10 rounded-xl text-xl" style={{ backgroundColor: `${c.color || "#0f569e"}22` }}>
                  {c.iconUrl || "✨"}
                </span>
                <span className="text-[10.5px] font-bold text-foreground line-clamp-1 px-1 text-center">{c.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* ═══ فید پست‌ها — من + ارتباط‌هایم ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
      >
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold text-primary tracking-widest">خط زمانی</p>
            <h2 className="text-lg md:text-xl font-black tracking-tight">از ارتباط‌های شما</h2>
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
            description="پست‌های خودت و افرادی که با آن‌ها ارتباط برقرار می‌کنی اینجا دیده می‌شود."
            action={
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => navigate({ view: "discover" })}
                  className="h-10 px-4 rounded-xl grad-brand text-white font-extrabold text-[13px] shadow-grad"
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

      {/* ═══ مودال مسیر جایگزین چهره برتر ═══ */}
      <EliteRequestDialog
        open={eliteDialogOpen}
        onClose={() => setEliteDialogOpen(false)}
        onSubmitted={refreshEliteStatus}
      />
    </div>
  );
}

/* ── مودال «مسیر جایگزین چهره برتر» — درخواست بررسی مستقیم ادمین ──
   الگوی RatingModal: AnimatePresence + اورلی fixed + ESC/بک‌دراپ */
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
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[75] grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="مسیر جایگزین چهره برتر"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !submitting && onClose()}
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 480, damping: 20 }}
            className="relative w-full max-w-md bg-card rounded-[28px] border border-border/70 shadow-float overflow-hidden"
          >
            <div className="h-[3px] w-full grad-gold" aria-hidden />

            <div className="px-5 pt-4 pb-5">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center size-11 rounded-2xl grad-gold shadow-glow-gold shrink-0">
                  <GoldCheckMark size={22} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="text-[15.5px] font-black text-foreground leading-snug">
                    مسیر جایگزین چهره برتر
                  </h2>
                  <p className="text-[11.5px] text-muted-foreground mt-1 leading-5">
                    اگر سابقه و افتخارات شما نشان می‌دهد استعدادی برتر هستید، می‌توانید به‌جای مسیر ستاره (۵٬۰۰۰ ستاره یا ۵۰۰ رأی) از ادمین بررسی مستقیم بخواهید. درخواست شما با صلاح‌دید ادمین و نظر چهره‌یاب‌ها بررسی می‌شود.
                  </p>
                </div>
                <button
                  onClick={() => !submitting && onClose()}
                  aria-label="بستن"
                  className="shrink-0 grid place-items-center size-9 rounded-full bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Icon name="x" size={15} />
                </button>
              </div>

              {/* متن ادعا — حداقل ۳۰ کاراکتر */}
              <div className="mt-4">
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

              <motion.button
                whileTap={submitting || tooShort ? undefined : { scale: 0.96 }}
                onClick={submit}
                disabled={submitting || tooShort}
                className="mt-2.5 w-full h-11 rounded-2xl grad-gold text-white font-extrabold text-[13px] shadow-glow-gold disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-opacity"
              >
                {submitting ? (
                  <Icon name="loader" size={16} className="animate-spin" />
                ) : (
                  <Icon name="send" size={15} />
                )}
                {submitting ? "در حال ارسال…" : "ارسال درخواست بررسی"}
              </motion.button>
              <p className="mt-2 text-center text-[10.5px] text-muted-foreground/80 leading-4">
                نتیجه از طریق اعلان‌ها اعلام می‌شود — با تأیید ادمین، قاب طلایی بدون نیاز به ۵٬۰۰۰ ستاره فعال می‌شود.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
