"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type {
  ProfileDetail,
  ProfileMeta,
  PostWithRelations,
  CategoryWithSkills,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount, formatFaDate } from "@/lib/format";
import { getProvinceName } from "@/lib/geo";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────
   ProfileView — full-screen immersive design, dark green glass theme.
   Avatar breaks the header boundary (overlaps by half).
   Pill tabs for درباره | رزومه | پست‌ها.
   ───────────────────────────────────────────────────────────────────── */

type Tab = "about" | "resume" | "posts";

export function ProfileView({ id }: { id: string }) {
  const { user: me } = useUser();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [meta, setMeta] = useState<ProfileMeta | null>(null);
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("about");
  const [connBusy, setConnBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  /* ── Fetch profile + meta + categories ── */
  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setPosts([]); // Reset posts when switching profile
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

  useEffect(() => {
    load();
  }, [load]);

  /* ── Load posts when posts tab opened ── */
  useEffect(() => {
    if (tab !== "posts" || !profile || posts.length > 0 || postsLoading) return;
    setPostsLoading(true);
    api<{ posts: PostWithRelations[] }>(`/api/posts?userId=${profile.userId}`)
      .then((d) => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, [tab, profile, posts.length, postsLoading]);

  /* ── Category color map ── */
  const catColorMap = useMemo(() => {
    const m = new Map<string, string>();
    cats.forEach((c) => m.set(c.id, c.color || ""));
    return m;
  }, [cats]);

  /* ── Ring color for avatar: profile.mainCategoryId → category.color ── */
  const ringColor = useMemo(() => {
    if (!profile) return null;
    const mainCatId = profile.mainCategoryId ?? meta?.mainCategoryId ?? null;
    if (mainCatId) return catColorMap.get(mainCatId) ?? null;
    // Fallback: first category color
    const firstCat = profile.categories?.[0];
    if (firstCat) return catColorMap.get(firstCat.id) ?? null;
    return null;
  }, [profile, meta, catColorMap]);

  const isSelf = me?.id === profile?.userId;
  const isTopTalent = profile?.isTopTalent ?? meta?.isTopTalent ?? false;

  /* ── Connection actions ── */
  async function handleConnection() {
    if (!profile || !me) return;
    setConnBusy(true);
    try {
      const res = await apiPost<{ status: string }>(`/api/connections`, {
        receiverId: profile.userId,
      });
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
      const res = await apiPost<{ conversationId: string; status: string }>(
        `/api/chat/start`,
        { userId: profile.userId }
      );
      if (res.conversationId) {
        navigate({ view: "chat", conversationId: res.conversationId });
      }
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setChatBusy(false);
    }
  }

  /* ── Loading state — full screen skeleton ── */
  if (loading) return <ProfileSkeleton />;

  if (notFound || !profile) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6">
        <EmptyState
          kind="people"
          title="کاربر پیدا نشد"
          description="ممکن است این حساب حذف شده یا شناسه اشتباه باشد."
          action={
            <Button
              onClick={() => navigate({ view: "explore" })}
              className="bg-primary text-primary-foreground"
            >
              <Icon name="sparkles" size={16} />
              کشف استعدادها
            </Button>
          }
        />
      </div>
    );
  }

  const connCount = (profile.followersCount || 0) + (profile.followingCount || 0);
  const province = getProvinceName(profile.province);

  /* ── Connection status label & button ── */
  const conn = profile.connectionStatus;
  const connBtn = (() => {
    if (isSelf) return null;
    if (conn === "self") return null;
    if (conn === "accepted") {
      return (
        <Button
          variant="outline"
          onClick={handleStartChat}
          disabled={chatBusy}
          className="border-primary/30 text-primary hover:bg-primary/5 h-11 px-5 gap-2 font-bold"
        >
          {chatBusy ? (
            <Icon name="loader" size={16} className="animate-spin" />
          ) : (
            <Icon name="chat" size={16} />
          )}
          پیام
        </Button>
      );
    }
    if (conn === "pending-sent") {
      return (
        <Button
          disabled
          className="border border-warning/30 text-warning bg-warning/5 h-11 px-5 gap-2 font-bold"
        >
          <Icon name="clock" size={16} />
          ارسال شد
        </Button>
      );
    }
    if (conn === "pending-received") {
      return (
        <Button
          onClick={handleConnection}
          disabled={connBusy}
          className="bg-gold h-11 px-5 gap-2 font-bold shadow-lg shadow-gold/20"
          style={{ color: "oklch(0.15 0.01 80)" }}
        >
          {connBusy ? (
            <Icon name="loader" size={16} className="animate-spin" />
          ) : (
            <Icon name="check" size={16} />
          )}
          تأیید ارتباط
        </Button>
      );
    }
    return (
      <Button
        onClick={handleConnection}
        disabled={connBusy}
        className="bg-primary text-primary-foreground h-11 px-5 gap-2 font-bold shadow-lg shadow-primary/20"
      >
        {connBusy ? (
          <Icon name="loader" size={16} className="animate-spin" />
        ) : (
          <Icon name="userPlus" size={16} />
        )}
        ارتباط
      </Button>
    );
  })();

  /* ── Tab pill items ── */
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "about", label: "درباره" },
    { key: "resume", label: "رزومه", count: (profile.experiences?.length || 0) + (profile.educations?.length || 0) },
    { key: "posts", label: "پست‌ها", count: profile.postCount },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* ═══════ IMMERSIVE HEADER — هویت زمردی، متن همیشه روشن ═══════ */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-b-[40px]"
        style={{
          background: `linear-gradient(165deg, ${ringColor ? shadeColor(ringColor, 0.5, 160) : "#0d9488"} 0%, #065f46 55%, #052e22 100%)`,
        }}
      >
        {/* Category color accent stripe at the very top */}
        <div
          className="absolute top-0 inset-x-0 h-1.5"
          style={{ background: ringColor || "#10b981" }}
        />
        {/* Soft glow blobs — emerald + gold */}
        <div
          className="absolute -top-20 right-0 w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: ringColor || "#10b981" }}
        />
        <div
          className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "#fbbf24" }}
        />

        {/* Top action row — متن/آیکون همیشه سفید (هدر همیشه تیره است) */}
        <div className="relative flex items-center justify-between p-4 pt-6">
          <button
            onClick={() => window.history.back()}
            className="grid place-items-center w-10 h-10 rounded-full bg-white/12 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
            aria-label="بازگشت"
          >
            <Icon name="chevronRight" size={20} />
          </button>

          {isSelf ? (
            <Button
              variant="ghost"
              onClick={() => navigate({ view: "edit-profile" })}
              className="bg-white/12 backdrop-blur-md text-white hover:bg-white/20 h-10 px-4 gap-2 font-bold rounded-full border border-white/15"
            >
              <Icon name="pencil" size={16} />
              ویرایش
            </Button>
          ) : (
            <button
              onClick={() => navigate({ view: "chat" })}
              className="grid place-items-center w-10 h-10 rounded-full bg-white/12 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
              aria-label="چت"
            >
              <Icon name="chat" size={20} />
            </button>
          )}
        </div>

        {/* Username + name — white on emerald */}
        <div className="relative px-6 pb-10 pt-2 text-center">
          {/* Top Talent crown badge */}
          {isTopTalent && (
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.15 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 text-[11px] font-extrabold border border-amber-300/30"
              style={{ background: "rgba(251, 191, 36, 0.16)", color: "#fde68a" }}
            >
              <Icon name="crown" size={14} />
              استعداد برتر
            </motion.div>
          )}

          <h1 className="text-2xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
            {profile.name}
          </h1>
          {profile.username && (
            <p className="text-sm mt-1 font-mono text-emerald-100/85" dir="ltr">
              @{profile.username}
            </p>
          )}

          {/* Location + joined chip row — glass سفید روی سبز */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px]">
            {province && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/12 backdrop-blur-md text-white/90">
                <Icon name="mapPin" size={11} />
                {province}
                {profile.city ? ` · ${profile.city}` : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/12 backdrop-blur-md text-white/90">
              <Icon name="calendar" size={11} />
              {formatFaDate(profile.createdAt)}
            </span>
          </div>
        </div>
      </motion.header>

      {/* ═══════ آواتار — خارج از هدر تا clip نشود، با هم‌پوشانی تمیز ═══════ */}
      <div className="relative flex justify-center -mt-14 z-10">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26, delay: 0.1 }}
        >
          <div
            className="rounded-full p-1.5 shadow-[0_8px_32px_rgba(6,95,70,0.45)]"
            style={{
              background: `linear-gradient(135deg, ${ringColor || "#10b981"}, #065f46)`,
            }}
          >
            <UserAvatar
              name={profile.name}
              avatarUrl={profile.avatarUrl}
              verified={profile.isVerifiedBadge}
              gender={profile.gender}
              size="2xl"
              ringColor="transparent"
              className="ring-4 ring-background"
            />
          </div>
        </motion.div>
      </div>

      {/* ═══════ BODY ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="px-4 pt-5"
      >
        {/* Bio */}
        {profile.bioShort && (
          <p className="text-center text-[15px] leading-7 text-foreground/90 px-2">
            {profile.bioShort}
          </p>
        )}

        {/* Stats row — ارتباات + posts */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <StatBlock
            value={formatCount(connCount)}
            label="ارتباطات"
            icon="users"
          />
          <StatBlock
            value={toFa(profile.postCount)}
            label="پست‌ها"
            icon="image"
          />
          <StatBlock
            value={toFa((profile.categories?.length || 0))}
            label="تخصص‌ها"
            icon="award"
          />
        </div>

        {/* Action row */}
        {connBtn && (
          <div className="flex items-center justify-center gap-3 mt-5">
            {connBtn}
            {isSelf && (
              <Button
                onClick={() => window.open(`/api/resume/${profile.userId}`, "_blank")}
                className="bg-card text-foreground border border-border hover:bg-card/70 h-11 px-5 gap-2 font-bold"
              >
                <Icon name="briefcase" size={16} />
                رزومه PDF
              </Button>
            )}
          </div>
        )}

        {/* ═══════ PILL TABS — حباب گرادیانی ═══════ */}
        <div className="relative mt-5 p-1 bg-card rounded-2xl glass flex gap-1 shadow-card">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative z-10 flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              style={{
                color: tab === t.key ? "#ffffff" : undefined,
              }}
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
                    "relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums",
                    tab === t.key ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {toFa(t.count)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══════ TAB CONTENT ═══════ */}
        <div className="mt-5 min-h-[200px]">
          <AnimatePresence mode="wait">
            {tab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <AboutTab profile={profile} catColorMap={catColorMap} />
              </motion.div>
            )}
            {tab === "resume" && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <ResumeTab profile={profile} isSelf={isSelf} userId={profile.userId} />
              </motion.div>
            )}
            {tab === "posts" && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {postsLoading ? (
                  <PostsSkeleton />
                ) : posts.length === 0 ? (
                  <EmptyState
                    kind="posts"
                    title={isSelf ? "هنوز پستی نگذاشته‌اید" : "این کاربر هنوز پستی ندارد"}
                    description={isSelf ? "اولین پست خود را در فید بسازید." : ""}
                    action={
                      isSelf ? (
                        <Button
                          onClick={() => navigate({ view: "feed" })}
                          className="bg-primary text-primary-foreground"
                        >
                          <Icon name="plus" size={16} />
                          ساخت پست
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */
/*  About tab: bio + categories with color chips + skills               */
/* ───────────────────────────────────────────────────────────────────── */

function AboutTab({
  profile,
  catColorMap,
}: {
  profile: ProfileDetail;
  catColorMap: Map<string, string>;
}) {
  const cats = profile.categories || [];
  if (!profile.bioLong && !profile.bioShort && cats.length === 0) {
    return (
      <EmptyState
        kind="generic"
        title="اطلاعاتی موجود نیست"
        description="این کاربر هنوز درباره خودش ننوشته است."
      />
    );
  }
  return (
    <div className="space-y-5">
      {profile.bioLong && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-muted-foreground">
            <Icon name="info" size={14} />
            درباره من
          </div>
          <p className="text-[14px] leading-8 whitespace-pre-wrap text-foreground/90">
            {profile.bioLong}
          </p>
        </motion.div>
      )}

      {cats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-1">
            <Icon name="award" size={14} />
            حوزه‌های تخصصی
          </div>
          <div className="space-y-3">
            {cats.map((c, i) => {
              const color = catColorMap.get(c.id) || "oklch(0.6 0.15 160)";
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <h3 className="font-bold text-sm flex-1">{c.name}</h3>
                  </div>
                  {c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {c.skills.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border"
                          style={{
                            background: shadeColor(color, 0.18, 165, 0.85),
                            borderColor: shadeColor(color, 0.3, 165),
                            color: shadeColor(color, 0.92, 165, 1),
                          }}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.skills.length === 0 && (
                    <p className="text-xs text-muted-foreground">مهارت‌ای ثبت نشده</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Phone (if visible) */}
      {profile.phone && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
            <Icon name="phone" size={18} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground">شماره تماس</p>
            <p className="text-sm font-bold font-mono" dir="ltr">{profile.phone}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */
/*  Resume tab: experiences timeline + educations + PDF button          */
/* ───────────────────────────────────────────────────────────────────── */

function ResumeTab({
  profile,
  isSelf,
  userId,
}: {
  profile: ProfileDetail;
  isSelf: boolean;
  userId: string;
}) {
  const exps = profile.experiences || [];
  const edus = profile.educations || [];

  if (exps.length === 0 && edus.length === 0) {
    return (
      <EmptyState
        kind="generic"
        title="رزومه‌ای ثبت نشده"
        description={isSelf ? "برای تکمیل رزومه به ویرایش پروفایل بروید." : ""}
        action={
          isSelf ? (
            <Button
              onClick={() => navigate({ view: "edit-profile" })}
              className="bg-primary text-primary-foreground"
            >
              <Icon name="pencil" size={16} />
              ویرایش پروفایل
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* PDF download button */}
      <button
        onClick={() => window.open(`/api/resume/${userId}`, "_blank")}
        className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl glass hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
            <Icon name="briefcase" size={20} />
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">دانلود رزومه PDF</p>
            <p className="text-[11px] text-muted-foreground">نسخه کامل با فرمت چاپ</p>
          </div>
        </div>
        <Icon name="chevronLeft" size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      {/* Experiences */}
      {exps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Icon name="rocket" size={16} className="text-primary" />
            <h3 className="text-sm font-bold">تجربه‌ها</h3>
            <span className="text-[10px] text-muted-foreground">({toFa(exps.length)})</span>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute top-2 bottom-2 right-[7px] w-0.5 bg-border/60" />
            <div className="space-y-4">
              {exps.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pr-8"
                >
                  <div className="absolute right-0 top-2 w-4 h-4 rounded-full border-2 border-primary bg-background" />
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-sm leading-tight">{e.jobTitle}</h4>
                      {e.categoryName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                          {e.categoryName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Icon name="briefcase" size={11} />
                      {e.organization}
                      {e.skillName && <span className="text-foreground/60"> · {e.skillName}</span>}
                    </p>
                    {(e.startDate || e.endDate) && (
                      <p className="text-[11px] text-muted-foreground/80 mb-2" dir="ltr">
                        {[e.startDate, e.endDate || "تاکنون"].filter(Boolean).join(" — ")}
                      </p>
                    )}
                    {e.description && (
                      <p className="text-xs leading-6 text-foreground/80 mt-2 whitespace-pre-wrap">
                        {e.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Educations */}
      {edus.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Icon name="award" size={16} className="text-gold" />
            <h3 className="text-sm font-bold">تحصیلات</h3>
            <span className="text-[10px] text-muted-foreground">({toFa(edus.length)})</span>
          </div>
          <div className="space-y-3">
            {edus.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm">{e.degree}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Icon name="mapPin" size={11} />
                      {e.institution}
                    </p>
                  </div>
                  {e.year && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold/10 text-gold shrink-0">
                      {toFa(e.year)}
                    </span>
                  )}
                </div>
                {e.description && (
                  <p className="text-xs leading-6 text-foreground/80 mt-2 whitespace-pre-wrap">
                    {e.description}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */
/*  Small components                                                    */
/* ───────────────────────────────────────────────────────────────────── */

function StatBlock({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: string;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="glass rounded-2xl py-3 flex flex-col items-center"
    >
      <div className="grad-brand w-7 h-7 rounded-xl grid place-items-center text-white mb-1">
        <Icon name={icon} size={15} />
      </div>
      <span className="font-black text-lg leading-none nums-fa">{value}</span>
      <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
    </motion.div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative overflow-hidden rounded-b-[40px] bg-card h-64">
        <Skeleton className="absolute inset-0" />
        <Skeleton className="absolute top-0 inset-x-0 h-1.5" />
        <div className="relative flex justify-center items-end h-full pb-0">
          <div className="translate-y-1/2">
            <Skeleton className="w-32 h-32 rounded-full ring-4 ring-background" />
          </div>
        </div>
      </div>
      <div className="px-4 pt-20 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-11 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
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

/* ── Color helper: shade a hex/oklch color toward a darker version ── */
function shadeColor(
  color: string,
  lightness: number,
  hue: number,
  alpha: number = 1
): string {
  // If color is hex, parse and create an oklch tint
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = hue;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }
    return `oklch(${lightness} 0.04 ${h.toFixed(0)}${alpha < 1 ? ` / ${alpha}` : ""})`;
  }
  return color;
}
