"use client";

/* ═══════════════════════════════════════════════════════════
   ProfileView v3 — کلاسیک و رسمی
   · کاور ۳:۱ بدون دکمه‌های شناور (بنر تمیز — زیر هدر نمی‌رود)
   · آواتار: قاب نقره‌ای/طلایی (چهره برتر) — مربعی برای چهره‌یاب
   · پروفایل رسمی چهره‌یاب (سبک اکانت کمپانی لینکدین)
   · دکمه پلاس شناور (پروفایل خودم): پست جدید / نمونه کار جدید
   · تب‌ها و انیمیشن‌های کلاسیک fade — بدون spring/layoutId
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { ProfileDetail, ProfileMeta, PostWithRelations, CategoryWithSkills } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ScoutBadge } from "@/components/shared/scout-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { Icon } from "@/components/shared/icon";
import { ComposerSheet } from "@/components/composer";
import { PortfolioTab } from "@/components/portfolio/portfolio-tab";
import { AboutTab, ResumeTab, shadeColor } from "@/components/views/profile-tabs";
import { EliteAvatar, EliteCheckMark, TopTalentBanner } from "@/components/ui/elite";
import { Sheet } from "@/components/shared/sheet";
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
  const [postsLoaded, setPostsLoaded] = useState(false); // «لودشدهٔ خالی» ≠ «لودنشده»
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("about");
  const [connBusy, setConnBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);

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

  /* ── پست‌ها: فقط یک‌بار per پروفایل ── */
  useEffect(() => {
    if (tab !== "posts" || !profile || postsLoaded || postsLoading) return;
    setPostsLoading(true);
    api<{ posts: PostWithRelations[] }>(`/api/posts?userId=${profile.userId}`)
      .then((d) => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => {
        setPostsLoading(false);
        setPostsLoaded(true);
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
  /* قاب واقعی از سرور — طلایی (۱۰۰۰۰) بر نقره‌ای (۵۰۰۰) اولویت دارد */
  const frame = profile?.frame ?? meta?.frame ?? null;
  const isGold = frame === "gold";
  const isTopTalent = frame != null;
  /* چهره‌یاب — پروفایل رسمی و حرفه‌ای (الگوی اکانت کمپانی لینکدین) */
  const isScoutProfile = !!profile?.isScout;

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

  /* انتخاب از دکمهٔ پلاس: پست یا نمونه کار */
  function choosePost() {
    setPlusOpen(false);
    setComposerOpen(true);
  }
  function choosePortfolio() {
    setPlusOpen(false);
    setTab("portfolio");
    // فرم نمونه‌کار داخل تب نمونه‌کار باز می‌شود (رویداد سبک)
    setTimeout(() => window.dispatchEvent(new Event("portfolio:new")), 60);
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
              className="h-11 px-5 rounded-xl grad-brand text-white font-extrabold text-sm"
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
  /* مجموع ستاره‌ها — از سریالایزر پروفایل (fallback به متا) */
  const totalStars = profile.totalStars ?? meta?.totalStars ?? 0;
  const showBanner = !!profile.bannerUrl && !profile.bannerUrl.startsWith("default");

  /* ── کاور: طلایی / نقره‌ای / رسمی چهره‌یاب / زمردی عادی ── */
  const coverStyle = isGold
    ? {
        background: `radial-gradient(130% 150% at 88% -12%, rgba(245,200,76,.3) 0%, transparent 55%),
                      radial-gradient(100% 120% at 8% 112%, rgba(146,97,14,.42) 0%, transparent 60%),
                      linear-gradient(160deg, #2a1a04 0%, #171005 48%, #241604 100%)`,
      }
    : isTopTalent
    ? {
        background: `radial-gradient(130% 150% at 88% -12%, rgba(203,213,225,.25) 0%, transparent 55%),
                      radial-gradient(100% 120% at 8% 112%, rgba(71,85,105,.4) 0%, transparent 60%),
                      linear-gradient(160deg, #1e293b 0%, #0f172a 48%, #1a2433 100%)`,
      }
    : isScoutProfile
    ? {
        /* کاور رسمی چهره‌یاب — سرمه‌ای اداری با خطِ نشان */
        background: `radial-gradient(120% 130% at 85% -8%, rgba(61,124,190,.32) 0%, transparent 52%),
                      linear-gradient(160deg, #162a4b 0%, #101835 55%, #0d1426 100%)`,
      }
    : {
        background: `radial-gradient(120% 140% at 85% -10%, ${shadeColor(heroTint, 0.72, 160)} 0%, transparent 55%),
                      radial-gradient(110% 130% at 10% 110%, #052e22 0%, transparent 60%),
                      linear-gradient(160deg, #065f46 0%, #064e3b 45%, #052e22 100%)`,
      };

  /* ── دکمهٔ اصلی بر اساس وضعیت ارتباط ── */
  const primaryAction = (() => {
    if (isSelf) {
      return (
        <button
          onClick={() => navigate({ view: "edit-profile" })}
          className="flex-1 h-12 rounded-xl bg-card border border-border text-foreground font-extrabold text-[13px]
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
          className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-extrabold text-[13px]
                     inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity outline-none
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
          className="flex-1 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300
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
          className="flex-1 h-12 rounded-xl text-white font-extrabold text-[13px]
                     inline-flex items-center justify-center gap-2 outline-none disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
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
        className={cn(
          "flex-1 h-12 rounded-xl text-white font-extrabold text-[13px] inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity outline-none disabled:opacity-60",
          !isTopTalent && "grad-brand",
          isGold && "shadow-[0_6px_20px_rgba(217,119,6,.35)]",
          isTopTalent && !isGold && "shadow-[0_6px_20px_rgba(100,116,139,.35)]"
        )}
        style={
          isGold
            ? { background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }
            : isTopTalent
            ? { background: "linear-gradient(135deg,#94a3b8,#64748b 60%,#475569)" }
            : undefined
        }
      >
        <Icon name={connBusy ? "loader" : "userPlus"} size={17} className={connBusy ? "animate-spin" : ""} />
        {isTopTalent ? "دنبال کردن چهره برتر" : "برقراری ارتباط"}
      </button>
    );
  })();

  /* دکمهٔ ثانویه «درخواست پیام» — وقتی ارتباط برقرار نیست (جریان لینکدینی) */
  const secondaryChatAction =
    !isSelf && conn !== "accepted" ? (
      <button
        onClick={handleStartChat}
        disabled={chatBusy}
        className="h-12 px-4 shrink-0 rounded-xl bg-card border border-primary/30 text-primary font-extrabold text-[12.5px]
                   inline-flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors outline-none
                   disabled:opacity-60"
        aria-label="درخواست پیام"
      >
        <Icon name={chatBusy ? "loader" : "chat"} size={16} className={chatBusy ? "animate-spin" : ""} />
        درخواست پیام
      </button>
    ) : null;

  const tabs: { key: Tab; label: string; count?: number }[] = isScoutProfile
    ? [
        { key: "about", label: "درباره" },
        { key: "posts", label: "پست‌ها", count: profile.postCount },
        { key: "portfolio", label: "نمونه کارها" },
        { key: "resume", label: "رزومه", count: (profile.experiences?.length || 0) + (profile.educations?.length || 0) },
      ]
    : [
        { key: "about", label: "درباره" },
        { key: "portfolio", label: "نمونه کارها" },
        { key: "resume", label: "رزومه", count: (profile.experiences?.length || 0) + (profile.educations?.length || 0) },
        { key: "posts", label: "پست‌ها", count: profile.postCount },
      ];

  return (
    <div className="max-w-2xl mx-auto pb-16 relative">
      {/* ═══════ کاور ۳:۱ — بدون دکمه‌های شناور؛ کاملاً زیر هدر (بدون مارجین منفی) ═══════ */}
      <div className="relative -mx-4 md:mx-0 md:rounded-2xl">
        <div
          className="relative aspect-[3/1] max-h-56 overflow-hidden rounded-b-2xl md:rounded-2xl"
          style={coverStyle}
        >
          {showBanner && (
            <img
              src={profile.bannerUrl ?? undefined}
              alt="بنر پروفایل"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* بافت نقطه‌ای ظریف */}
          <div
            className="absolute inset-0 opacity-[0.1] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(${isGold ? "rgba(245,200,76,.9)" : isTopTalent ? "rgba(203,213,225,.9)" : "rgba(255,255,255,.9)"} 1px, transparent 1px)`,
              backgroundSize: "18px 18px",
            }}
          />
          {/* نشان رسمی چهره‌یاب روی کاور — سمت چپ */}
          {isScoutProfile && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/12 border border-white/25 text-white text-[11px] font-extrabold backdrop-blur-sm">
              <Icon name="compass" size={14} className="text-blue-300" />
              چهره‌یاب تأییدشده
            </span>
          )}
          {/* خط نشان پایین کاور — طلایی/نقره‌ای/چهره‌یاب رسمی */}
          {(isTopTalent || isScoutProfile) && (
            <div
              aria-hidden
              className="absolute bottom-0 inset-x-0 h-[3px]"
              style={{
                background: isGold
                  ? "linear-gradient(90deg, transparent, #b45309, #f5c84c, #fef3c7, #f5c84c, #b45309, transparent)"
                  : isTopTalent
                  ? "linear-gradient(90deg, transparent, #475569, #cbd5e1, #f8fafc, #cbd5e1, #475569, transparent)"
                  : "linear-gradient(90deg, transparent, #162a4b, #3d7cbe, #a4e86d, #3d7cbe, #162a4b, transparent)",
              }}
            />
          )}
        </div>
      </div>

      {/* ═══════ سطر هویت — آواتار (قاب متال / مربعی چهره‌یاب) ═══════
          الگوی لینکدین با مرز قطعی: ردیف با -mt-12 بالا می‌رود تا آواتار
          روی بنر بنشیند (۴۸px)، اما متن با pt-12 دقیقاً از لبهٔ پایین بنر
          شروع می‌شود و items-start است — یعنی هر چند خط که اسم طولانی شود
          فقط به پایین رشد می‌کند و هرگز زیر بنر نمی‌رود */}
      <div className="relative px-4 -mt-12 z-10">
        <div className="flex items-start gap-3.5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="shrink-0"
          >
            {isTopTalent ? (
              <EliteAvatar
                name={profile.name}
                src={profile.avatarUrl}
                box={124}
                variant={frame ?? "silver"}
                square={isScoutProfile}
              />
            ) : isScoutProfile ? (
              /* چهره‌یاب — آواتار مربعی رسمی (سبک کمپانی لینکدین) */
              <div className="rounded-[22%] p-[3px] bg-card border border-border shadow-md">
                <UserAvatar
                  name={profile.name}
                  avatarUrl={profile.avatarUrl}
                  verified={profile.isVerifiedBadge}
                  gender={profile.gender}
                  size="2xl"
                  square
                  ringColor="transparent"
                />
              </div>
            ) : (
              <div
                className="rounded-full p-[3px] shadow-md"
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
              </div>
            )}
          </motion.div>

          {/* pt-12 = همان ۴۸pxی که ردیف بالا رفته — متن دقیقاً از لبهٔ پایین
              کاور شروع می‌شود؛ رشد فقط به سمت پایین است (رفع رفتن زیر بنر) */}
          <div className="flex-1 min-w-0 pt-12">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-[21px] font-black tracking-tight text-foreground leading-tight">
                {profile.name}
              </h1>
              {profile.isScout && <ScoutBadge />}
              {isTopTalent && <EliteCheckMark size={22} tint={isGold ? "gold" : "silver"} />}
            </div>
            {/* سطر رسمی چهره‌یاب — عنوان حرفه‌ای */}
            {isScoutProfile && (
              <p className="mt-0.5 text-[12px] font-bold text-primary">
                استعدادیاب حرفه‌ای — کشف و معرفی استعدادهای برتر
              </p>
            )}
            {isSelf && profile.scoutStatus === "pending" && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-1">
                <Icon name="clock" size={12} />
                درخواست چهره‌یاب شما در انتظار تأیید ادمین است
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

      {/* ═══════ بدنه ═══════ */}
      <div className="px-4 pt-4">
        {/* بایو */}
        {profile.bioShort && (
          <p className="text-[14px] leading-7 text-foreground/90 px-1 text-center">{profile.bioShort}</p>
        )}

        {/* بنر چهره برتر — طلایی / نقره‌ای (فقط اعضا؛ چهره‌یاب نیست) */}
        {isTopTalent && !isScoutProfile && (
          <div className="mt-4">
            <TopTalentBanner variant={isGold ? "gold" : "silver"} />
          </div>
        )}

        {/* نوار آمار — کلاسیک (چهره‌یاب: بدون تخصص/ستاره — گزینه‌های اعضا را ندارد) */}
        <div
          className={cn(
            "mt-4 bg-card border border-border rounded-2xl grid divide-x divide-border rtl:divide-x-reverse",
            isScoutProfile ? "grid-cols-3" : "grid-cols-4"
          )}
        >
          <StatSeg value={formatCount(connCount)} label="ارتباطات" icon="users" />
          <StatSeg value={toFa(profile.postCount)} label="پست‌ها" icon="image" />
          {isScoutProfile ? (
            <StatSeg value={toFa(profile.categories?.length || 0)} label="حوزه‌ها" icon="compass" />
          ) : (
            <>
              <StatSeg value={toFa(profile.categories?.length || 0)} label="تخصص‌ها" icon="award" />
              <StatSeg
                value={toFa(totalStars.toLocaleString("fa-IR"))}
                label="ستاره‌ها"
                icon="star"
                tint={frame}
              />
            </>
          )}
        </div>

        {/* اکشن اصلی + درخواست پیام + PDF */}
        <div className="mt-4 flex items-center gap-2.5">
          {primaryAction}
          {secondaryChatAction}
          <button
            onClick={() => window.open(`/api/resume/${profile.userId}`, "_blank")}
            aria-label="دانلود رزومه PDF"
            className="size-12 shrink-0 rounded-xl bg-card border border-border text-foreground
                       grid place-items-center hover:bg-muted transition-colors outline-none"
          >
            <Icon name="briefcase" size={19} className="text-primary" />
          </button>
        </div>

        {/* تب‌های کلاسیک */}
        <div className="mt-5 p-1 bg-muted/60 rounded-xl flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 h-10 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 outline-none transition-colors",
                tab === t.key
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold nums-fa",
                    tab === t.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {toFa(t.count)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* محتوای تب — fade ساده بدون exit */}
        <div className="mt-5 min-h-[200px]">
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
              {postsLoading ? (
                <PostsSkeleton />
              ) : posts.length === 0 ? (
                <EmptyState
                  kind="posts"
                  title={isSelf ? "پستی ندارید، پست جدید ارسال کنید" : "این کاربر هنوز پستی ندارد"}
                  description={isSelf ? "استعدادت را با جامعه فرصتینو به اشتراک بگذار — همین حالا شروع کن!" : ""}
                  action={
                    isSelf ? (
                      <button
                        onClick={() => setComposerOpen(true)}
                        className="h-12 px-6 rounded-xl grad-brand text-white font-extrabold text-sm
                                   inline-flex items-center gap-2 hover:opacity-90 transition-opacity outline-none"
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
        </div>
      </div>

      {/* ═══ دکمهٔ پلاس شناور — فقط پروفایل خودم (بالای دکمهٔ چت) ═══ */}
      {isSelf && (
        <button
          onClick={() => setPlusOpen(true)}
          className="fixed left-4 z-40 grid place-items-center rounded-full
                     grad-brand text-white border border-black/5 shadow-[0_6px_20px_rgba(0,0,0,0.15)]
                     hover:opacity-90 transition-opacity active:scale-95"
          style={{
            width: "44px",
            height: "44px",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 136px)",
          }}
          aria-label="پست یا نمونه کار جدید"
        >
          <Icon name="plus" size={22} strokeWidth={2.4} />
        </button>
      )}

      {/* انتخاب پست / نمونه کار */}
      <PlusChooserSheet
        open={plusOpen}
        onClose={() => setPlusOpen(false)}
        onPost={choosePost}
        onPortfolio={choosePortfolio}
      />

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

/* ── شیت انتخاب «پست جدید / نمونه کار جدید» ── */
function PlusChooserSheet({
  open,
  onClose,
  onPost,
  onPortfolio,
}: {
  open: boolean;
  onClose: () => void;
  onPost: () => void;
  onPortfolio: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="چی می‌خوای بسازی؟" description="انتخاب کن و بارگذاری کن">
      <div className="space-y-2.5">
        <button
          onClick={onPost}
          className="w-full h-16 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5
                     transition-colors flex items-center gap-3 px-4 text-right outline-none"
        >
          <span className="grid place-items-center size-11 rounded-xl bg-primary/10 text-primary shrink-0">
            <Icon name="image" size={22} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-extrabold text-foreground">پست جدید</span>
            <span className="block text-[11.5px] text-muted-foreground mt-0.5">متن، عکس، ویدیو یا صوت — برای فید</span>
          </span>
          <Icon name="arrowLeft" size={16} className="text-muted-foreground shrink-0" />
        </button>
        <button
          onClick={onPortfolio}
          className="w-full h-16 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5
                     transition-colors flex items-center gap-3 px-4 text-right outline-none"
        >
          <span className="grid place-items-center size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Icon name="briefcase" size={22} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-extrabold text-foreground">نمونه کار جدید</span>
            <span className="block text-[11.5px] text-muted-foreground mt-0.5">به ویترین نمونه‌کارهایت اضافه کن</span>
          </span>
          <Icon name="arrowLeft" size={16} className="text-muted-foreground shrink-0" />
        </button>
      </div>
    </Sheet>
  );
}

/* ─────────── اجزای کوچک ─────────── */

function TabPane({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatSeg({ value, label, icon, tint }: { value: string; label: string; icon: string; tint?: "silver" | "gold" | null }) {
  return (
    <div className="py-3.5 flex flex-col items-center gap-1">
        <div
          className={cn("size-7 rounded-lg grid place-items-center text-white", !tint && "grad-brand")}
          style={
            tint === "gold"
              ? { background: "linear-gradient(135deg,#f5c84c,#d97706)" }
              : tint === "silver"
              ? { background: "linear-gradient(135deg,#cbd5e1,#64748b)" }
              : undefined
          }
        >
          <Icon name={icon} size={14} />
        </div>
      <span
        className={cn(
          "font-black text-[17px] leading-none nums-fa",
          tint === "gold" && "text-amber-600 dark:text-amber-400",
          tint === "silver" && "text-slate-600 dark:text-slate-300"
        )}
      >
        {value}
      </span>
      <span className="text-[10.5px] text-muted-foreground font-bold">{label}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <Skeleton className="aspect-[3/1] max-h-56 rounded-b-2xl rounded-t-none" />
      <div className="px-4 -mt-10 relative z-10">
        <div className="flex items-end gap-3.5">
          <Skeleton className="size-24 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pb-1">
            <Skeleton className="h-6 w-36 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-16 rounded-2xl mt-4" />
        <Skeleton className="h-12 rounded-xl mt-4" />
        <Skeleton className="h-10 rounded-xl mt-5" />
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
