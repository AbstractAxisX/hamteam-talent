"use client";

/* ════════════════════════════════════════════════════════════════════
   ExploreView — "استعدادهای برتر" (Top Talents)
   Vertical Facebook-style feed of featured posts from top-talent users.
   Supports image / video / audio / document media, swipeable carousels,
   full-screen lightbox, double-tap-to-like heart burst, and nested
   multi-level comments in a bottom sheet.
   ════════════════════════════════════════════════════════════════════ */

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount, timeAgoFa, formatFaDate } from "@/lib/format";
import { RatingModal, RatingSummary } from "@/components/shared/rating-control";
import { LikersSheet, commentLikersFetcher, postLikersFetcher } from "@/components/shared/likers-sheet";
import { GoldCheckMark, GoldSparkle, Laurel } from "@/components/ui/elite";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CategoryWithSkills } from "@/lib/types";

/* ════════════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════════════ */

type MediaType = "image" | "video" | "audio" | "doc" | string;

type PostMedia = {
  id: string;
  url: string;
  type: MediaType;
  fileName: string | null;
  fileSize: number;
};

type ExplorePost = {
  id: string;
  content: string;
  createdAt: string;
  categoryId: string | null;
  skillId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  skillName: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  myRating?: number | null;
  media: PostMedia[];
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    gender: string | null;
    isTopTalent: boolean;
    isVerifiedBadge: boolean;
    mainCategoryColor: string | null;
  };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    gender: string | null;
    isTopTalent: boolean;
  };
  likeCount: number;
  myReaction: "like" | "dislike" | null;
  replies: Comment[];
};

/* ════════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════════ */

/* ── Helpers ── */

function formatFileSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${toFa(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${toFa((bytes / 1024).toFixed(1))} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${toFa((bytes / (1024 * 1024)).toFixed(1))} MB`;
  return `${toFa((bytes / (1024 * 1024 * 1024)).toFixed(2))} GB`;
}

function formatAudioTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec)) return "—:—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return toFa(`${m}:${s < 10 ? "0" : ""}${s}`);
}

type DocStyle = {
  /** tailwind classes for the icon container background + text color */
  cls: string;
  /** short label, e.g. "PDF", "DOC" */
  label: string;
  /** inline svg path content for the icon */
  svg: React.ReactNode;
};

function getDocStyle(fileName: string | null): DocStyle {
  const ext = (fileName || "").toLowerCase().split(".").pop() || "";
  if (ext === "pdf")
    return {
      cls: "bg-rose-100 text-rose-600 shadow-[0_10px_26px_rgba(220,38,38,0.22)]",
      label: "PDF",
      svg: (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </>
      ),
    };
  if (ext === "doc" || ext === "docx")
    return {
      cls: "bg-emerald-100 text-emerald-700 shadow-[0_10px_26px_rgba(5,150,105,0.22)]",
      label: "DOC",
      svg: (
        <>
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </>
      ),
    };
  if (ext === "xls" || ext === "xlsx" || ext === "csv")
    return {
      cls: "bg-emerald-100 text-emerald-600 shadow-[0_10px_26px_rgba(22,163,74,0.22)]",
      label: "XLS",
      svg: (
        <>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </>
      ),
    };
  if (ext === "ppt" || ext === "pptx")
    return {
      cls: "bg-amber-100 text-amber-600 shadow-[0_10px_26px_rgba(217,119,6,0.22)]",
      label: "PPT",
      svg: (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      ),
    };
  // default → cyan / general file
  return {
    cls: "bg-cyan-100 text-cyan-600 shadow-[0_10px_26px_rgba(8,145,178,0.22)]",
    label: ext ? ext.toUpperCase().slice(0, 3) : "FILE",
    svg: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    ),
  };
}

function audioTitleFrom(media: PostMedia): string {
  if (media.fileName) {
    const withoutExt = media.fileName.replace(/\.[^/.]+$/, "");
    if (withoutExt) return withoutExt;
  }
  return "موسیقی";
}

/** Module-level registry for the currently-playing audio element, so we can
 *  pause everything else when one starts. */
let currentlyPlayingAudio: HTMLAudioElement | null = null;
function pauseAllAudio(except?: HTMLAudioElement) {
  if (currentlyPlayingAudio && currentlyPlayingAudio !== except) {
    try {
      currentlyPlayingAudio.pause();
    } catch {
      /* ignore */
    }
    currentlyPlayingAudio = null;
  }
  window.dispatchEvent(new CustomEvent("audio-pause-all", { detail: { except } }));
}

/* ════════════════════════════════════════════════════════════════════
   ExploreView — main feed page
   ════════════════════════════════════════════════════════════════════ */

export function ExploreView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [catsLoading, setCatsLoading] = useState(true);

  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");

  // Comment sheet target post
  const [commentsForPost, setCommentsForPost] = useState<ExplorePost | null>(
    null
  );

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {})
      .finally(() => setCatsLoading(false));
  }, []);

  const currentCat = useMemo(
    () => cats.find((c) => c.id === categoryId),
    [cats, categoryId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set("categoryId", categoryId);
      if (skillId) params.set("skillId", skillId);
      const res = await api<{ posts: ExplorePost[] }>(
        `/api/explore/posts?${params.toString()}`
      );
      setPosts(res.posts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, skillId]);

  useEffect(() => {
    const t = setTimeout(load, 180);
    return () => clearTimeout(t);
  }, [load]);

  function clearFilters() {
    setCategoryId("");
    setSkillId("");
  }

  const activeColor = currentCat?.color || "oklch(0.55 0.13 160)";

  /* مجموع امتیازهای کاربران در فید — حس رقابت نخبگان */
  const eliteStats = useMemo(() => {
    const topAuthors = new Set(posts.filter((p) => p.user.isTopTalent).map((p) => p.user.id));
    const totalRatings = posts.reduce((s, p) => s + (p.ratingCount || 0), 0);
    const avg = posts.length
      ? posts.reduce((s, p) => s + (p.ratingAvg || 0), 0) / posts.length
      : 0;
    return { topAuthors: topAuthors.size, totalRatings, avg };
  }, [posts]);

  return (
    <div className="max-w-2xl mx-auto pb-2">
      {/* ═══ هدر سلطنتی نخبگان — ابیسیدین و طلا ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[28px] mb-3 elite-panel"
      >
        {/* غارهای درخشان دو طرف */}
        <motion.div
          initial={{ opacity: 0, x: 12, rotate: -8 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="absolute top-3 left-2 opacity-80"
        >
          <Laurel size={62} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -12, rotate: 8 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="absolute top-3 right-2 opacity-80"
        >
          <Laurel size={62} flip />
        </motion.div>

        {/* ستاره‌های چشمک‌زن */}
        <GoldSparkle size={13} delay={0} style={{ top: "14%", left: "18%" }} />
        <GoldSparkle size={9} delay={0.9} style={{ top: "64%", left: "8%" }} />
        <GoldSparkle size={11} delay={1.7} style={{ top: "22%", right: "22%" }} />
        <GoldSparkle size={8} delay={0.4} style={{ bottom: "18%", right: "12%" }} />

        {/* نور طلایی بالا */}
        <div
          aria-hidden
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: "#f5c84c" }}
        />

        <div className="relative px-5 py-6 sm:px-6 sm:py-7 flex flex-col items-center gap-3">
          {/* مدال طلایی */}
          <motion.div
            initial={{ scale: 0.5, rotate: -14, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 340, damping: 20, delay: 0.12 }}
            className="relative grid place-items-center w-[68px] h-[68px] rounded-[22px] rotate-45"
            style={{
              background: "linear-gradient(135deg, #fef3c7, #f5c84c 40%, #b45309 90%)",
              boxShadow:
                "0 8px 28px rgba(217,119,6,.5), inset 0 1px 0 rgba(255,255,255,.7), inset 0 -2px 6px rgba(120,53,15,.5)",
            }}
          >
            <span className="-rotate-45 drop-shadow-[0_1px_2px_rgba(120,53,15,.6)]">
              <GoldCheckMark size={34} />
            </span>
          </motion.div>

          <div className="text-center">
            <h1 className="text-[22px] sm:text-2xl font-black tracking-tight leading-tight text-gold-grad">
              استعدادهای برتر
            </h1>
            <p className="text-[12.5px] text-amber-100/70 mt-1 leading-6">
              منتخب رسمی مدیران · برترین کارهای جامعهٔ همتیم
            </p>
          </div>

          {/* آمار رقابتی */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="h-7 px-3 rounded-full bg-amber-500/12 border border-amber-400/25 text-amber-200/90
                           text-[10.5px] font-bold inline-flex items-center gap-1.5">
              <Icon name="users" size={12} />
              {toFa(eliteStats.topAuthors)} استعداد برتر
            </span>
            <span className="h-7 px-3 rounded-full bg-amber-500/12 border border-amber-400/25 text-amber-200/90
                           text-[10.5px] font-bold inline-flex items-center gap-1.5">
              <Icon name="star" size={12} />
              میانگین {toFa(eliteStats.avg.toFixed(1))} از ۱۰
            </span>
          </div>
        </div>

        {/* پایین طلایی + عبور نور */}
        <div
          aria-hidden
          className="absolute bottom-0 inset-x-0 h-[3px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, #b45309, #f5c84c, #fef3c7, #f5c84c, #b45309, transparent)",
          }}
        />
        <div
          aria-hidden
          className="absolute top-0 bottom-0 w-16 -skew-x-12 animate-elite-shine pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,251,215,.14), transparent)",
          }}
        />
      </motion.header>

      {/* ═══ Filters ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.04 }}
        className="glass rounded-2xl p-3.5 mb-4 space-y-2.5 shadow-card"
      >
        <SearchableSelect
          label="دسته‌بندی"
          allLabel="همه دسته‌ها"
          options={cats.map((c) => ({
            value: c.id,
            label: `${c.iconUrl || "✨"} ${c.name}`,
          }))}
          value={categoryId}
          onChange={(v) => {
            setCategoryId(v === "all" ? "" : v);
            setSkillId("");
          }}
          placeholder="انتخاب دسته"
        />
        <SearchableSelect
          label="مهارت"
          allLabel={categoryId ? "همه مهارت‌ها" : undefined}
          disabled={!categoryId || catsLoading}
          options={(currentCat?.skills || []).map((s) => ({
            value: s.id,
            label: s.name,
          }))}
          value={skillId}
          onChange={(v) => setSkillId(v === "all" ? "" : v)}
          placeholder={categoryId ? "انتخاب مهارت" : "ابتدا دسته‌بندی را انتخاب کنید"}
        />
        <AnimatePresence>
          {(categoryId || skillId) && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={clearFilters}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors text-xs font-bold"
            >
              <Icon name="x" size={14} />
              حذف فیلترها
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ Feed ═══ */}
      {loading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <EmptyState
          kind="generic"
          title="پستی یافت نشد"
          description={
            (categoryId || skillId)
              ? "با فیلترهای انتخاب‌شده پست برجسته‌ای موجود نیست."
              : "هنوز پست برجسته‌ای برای نمایش وجود ندارد. پست‌ها پس از تأیید و انتخاب مدیر، در این صفحه نمایش داده می‌شوند."
          }
          action={
            (categoryId || skillId) ? (
              <button
                onClick={clearFilters}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                حذف فیلترها
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p, i) => (
            <PostCard
              key={p.id}
              post={p}
              index={i}
              onOpenComments={(post) => setCommentsForPost(post)}
            />
          ))}
        </div>
      )}

      {/* ═══ Comment Sheet ═══ */}
      <AnimatePresence>
        {commentsForPost && (
          <CommentSheet
            post={commentsForPost}
            onClose={() => setCommentsForPost(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Feed Skeleton
   ════════════════════════════════════════════════════════════════════ */

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-[20px] overflow-hidden shadow-card"
        >
          <div className="flex items-center gap-3 p-3.5">
            <Skeleton className="w-11 h-11 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32 rounded-full" />
              <Skeleton className="h-2.5 w-24 rounded-full" />
            </div>
          </div>
          <div className="px-3.5 pb-3 space-y-1.5">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-4/5 rounded-full" />
            <Skeleton className="h-3 w-2/3 rounded-full" />
          </div>
          <Skeleton className="h-[280px] w-full" />
          <div className="flex gap-2 p-3">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PostCard — single card in the vertical feed
   ════════════════════════════════════════════════════════════════════ */

function PostCard({
  post,
  index,
  onOpenComments,
}: {
  post: ExplorePost;
  index: number;
  onOpenComments: (post: ExplorePost) => void;
}) {
  const catColor = post.categoryColor || "oklch(0.55 0.13 160)";
  // رنگ فرد — دستهٔ اصلی کاربر؛ رینگ آواتار و نوار بالای کارت هم‌رنگ می‌شوند
  const ringColor = post.user.mainCategoryColor || catColor;

  const [expanded, setExpanded] = useState(false);
  // امتیازدهی (لایک در استعدادهای برتر حذف شد)
  const [ratingOpen, setRatingOpen] = useState(false);
  const [avg, setAvg] = useState(post.ratingAvg ?? 0);
  const [ratingCount, setRatingCount] = useState(post.ratingCount ?? 0);
  const [myScore, setMyScore] = useState<number | null>(post.myRating ?? null);
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(
    null
  );
  const burstKeyRef = useRef(0);

  // Lightbox state
  const [lightboxStart, setLightboxStart] = useState<number | null>(null);

  // Comment count (kept in sync with sheet updates)
  const [commentCount, setCommentCount] = useState(post.commentCount);

  // double-tap timer
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLong = post.content.length > 220;

  function onSlideTap(e: React.MouseEvent, idx: number) {
    // دابل‌تپ روی رسانه → انفجار قلبی + باز شدن مودال امتیاز
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setBurst({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        key: ++burstKeyRef.current,
      });
      setTimeout(() => setBurst(null), 850);
      setRatingOpen(true);
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null;
        setLightboxStart(idx);
      }, 240);
    }
  }

  function sharePost() {
    const url = `${window.location.origin}/#/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ url, title: post.user.name }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast({ title: "لینک پست کپی شد" });
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.35),
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "relative bg-card rounded-[24px] overflow-hidden shadow-card border",
        post.user.isTopTalent
          ? "border-amber-500/35 shadow-[0_10px_32px_rgba(217,119,6,.14)]"
          : "border-border/50"
      )}
    >
      {/* خط گرادیانی امضای برند بالای کارت — رنگِ فرد (هم‌رنگ رینگ آواتار) */}
      <div
        className="absolute top-0 inset-x-0 h-[3px] z-10"
        style={{
          background: post.user.isTopTalent
            ? "linear-gradient(90deg, transparent, #b45309, #f5c84c, #fef3c7, #f5c84c, #b45309, transparent)"
            : `linear-gradient(90deg, transparent, ${ringColor}, transparent)`,
          opacity: 0.75,
        }}
      />

      {/* نشان «برتر» کارت — فقط نویسندهٔ استعداد برتر */}
      {post.user.isTopTalent && (
        <span
          className="absolute z-20 top-3 left-3 h-6 px-2.5 rounded-full text-[10px] font-black text-[#3a2405]
                     inline-flex items-center gap-1 shadow-[0_4px_12px_rgba(217,119,6,.4)]"
          style={{ background: "linear-gradient(135deg, #fef3c7, #f5c84c 45%, #e08a00)" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0c.9 6.2 4.9 10.2 12 12-7.1 1.8-11.1 5.8-12 12-.9-6.2-4.9-10.2-12-12C7.1 10.2 11.1 6.2 12 0z" />
          </svg>
          برتر
        </span>
      )}

      {/* ═══ Header ═══ */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => navigate({ view: "profile", id: post.user.id })}
          className="shrink-0"
          aria-label={`پروفایل ${post.user.name}`}
        >
          <UserAvatar
            name={post.user.name}
            avatarUrl={post.user.avatarUrl}
            verified={post.user.isVerifiedBadge}
            gender={post.user.gender}
            size="md"
            topTalent={post.user.isTopTalent}
            ringColor={post.user.isTopTalent ? null : ringColor}
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate({ view: "profile", id: post.user.id })}
              className="font-extrabold text-[14.5px] truncate hover:text-primary transition-colors"
            >
              {post.user.name}
            </button>
            {post.user.isVerifiedBadge && !post.user.isTopTalent && (
              <Icon
                name="badgeCheck"
                size={15}
                className="text-gold fill-gold/15 shrink-0"
              />
            )}
            {post.user.isTopTalent && (
              <GoldCheckMark size={16} />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
            <span className="truncate">{timeAgoFa(post.createdAt)}</span>
            {post.categoryName && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: `${catColor}22`,
                    color: catColor,
                  }}
                >
                  {post.categoryIcon && <span>{post.categoryIcon}</span>}
                  {post.categoryName}
                </span>
              </>
            )}
            {post.skillName && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="truncate">{post.skillName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Text content ═══ */}
      {post.content && (
        <>
          <p
            className={cn(
              "px-4 pb-2 text-[14px] leading-[1.95] whitespace-pre-wrap break-words",
              isLong && !expanded && "line-clamp-3"
            )}
          >
            {post.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="block px-4 pb-2.5 text-primary text-[12px] font-extrabold hover:opacity-70 transition-opacity"
            >
              {expanded ? "بستن ↑" : "ادامه مطلب ↓"}
            </button>
          )}
        </>
      )}

      {/* ═══ خلاصهٔ امتیاز — میانگین + تعداد رأی، زیر متن پست ═══ */}
      {(ratingCount > 0 || avg > 0) && (
        <div className="px-4 pb-1">
          <RatingSummary avg={avg} count={ratingCount} onClick={() => setRatingOpen(true)} />
        </div>
      )}

      {/* ═══ Media carousel ═══ */}
      {post.media.length > 0 && (
        <MediaCarousel
          post={post}
          onImageTap={onSlideTap}
          onLightboxClose={() => setLightboxStart(null)}
        />
      )}

      {/* ═══ Action bar — امتیاز + کامنت + اشتراک ═══ */}
      <div className="flex gap-2 px-3 pb-3 pt-2.5">
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          onClick={() => setRatingOpen(true)}
          className={cn(
            "flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-[12.5px] font-extrabold border transition-colors",
            myScore
              ? "text-white grad-gold border-transparent shadow-glow-gold"
              : "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
          )}
          aria-label={myScore ? `ویرایش امتیاز ${toFa(myScore)} از ۱۰` : "ثبت امتیاز"}
        >
          <Icon name="spark" size={19} strokeWidth={2} />
          <span className="nums-fa">{myScore ? `ویرایش (${toFa(myScore)}/۱۰)` : "ثبت امتیاز"}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          onClick={() => onOpenComments({ ...post, commentCount })}
          className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-[12.5px] font-extrabold text-muted-foreground bg-card border border-border hover:bg-muted/70 hover:text-primary transition-colors"
          aria-label="نظرات"
        >
          <Icon name="comment" size={19} strokeWidth={2} />
          <span className="tabular-nums">{formatCount(commentCount)}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          onClick={sharePost}
          className="h-11 px-4 rounded-full flex items-center justify-center gap-2 text-[12.5px] font-extrabold text-muted-foreground bg-card border border-border hover:bg-muted/70 hover:text-primary transition-colors"
          aria-label="اشتراک‌گذاری"
        >
          <Icon name="share" size={19} strokeWidth={2} />
          <span>اشتراک</span>
        </motion.button>
      </div>

      {/* ═══ مودال امتیاز ۱ تا ۱۰ ستاره ═══ */}
      <RatingModal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        postId={post.id}
        initialScore={myScore}
        onSaved={({ avg: a, count: c, myScore: s }) => {
          setAvg(a);
          setRatingCount(c);
          setMyScore(s);
        }}
      />

      {/* ═══ Lightbox ═══ */}
      <AnimatePresence>
        {lightboxStart !== null && post.media.length > 0 && (
          <Lightbox
            post={post}
            startIndex={lightboxStart}
            onClose={() => setLightboxStart(null)}
          />
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MediaCarousel — swipeable horizontal slides with scroll-snap
   ════════════════════════════════════════════════════════════════════ */

function MediaCarousel({
  post,
  onImageTap,
}: {
  post: ExplorePost;
  onImageTap: (e: React.MouseEvent, idx: number) => void;
  onLightboxClose: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const tickingRef = useRef(false);

  const media = post.media;
  const n = media.length;
  const catColor = post.categoryColor || "oklch(0.55 0.13 160)";

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;
        const idx = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
        const clamped = Math.max(0, Math.min(n - 1, idx));
        setActiveIdx(clamped);
        setScrolled(true);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [n]);

  return (
    <div
      className="relative bg-neutral-950"
      style={{ contain: "layout paint" }}
    >
      <div
        ref={trackRef}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {media.map((m, i) => (
          <div
            key={m.id}
            className="relative shrink-0 w-full h-[280px] sm:h-[360px] lg:h-[400px] overflow-hidden snap-start snap-always"
          >
            <SlideContent
              media={m}
              post={post}
              catColor={catColor}
              onImageTap={(e) => onImageTap(e, i)}
            />
          </div>
        ))}
      </div>

      {/* Counter (top-left) */}
      {n > 1 && (
        <div className="absolute top-2.5 left-2.5 z-20 bg-black/55 backdrop-blur-sm text-white text-[10.5px] font-bold px-2.5 py-1 rounded-full pointer-events-none tabular-nums">
          {toFa(activeIdx + 1)}/{toFa(n)}
        </div>
      )}

      {/* Segments (bottom) */}
      {n > 1 && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex gap-1 z-20 pointer-events-none">
          {media.map((_, i) => (
            <span
              key={i}
              className={cn(
                "flex-1 h-[3px] rounded-full transition-colors duration-300",
                i <= activeIdx ? "bg-white" : "bg-white/30"
              )}
            />
          ))}
        </div>
      )}

      {/* Swipe hint */}
      {n > 1 && !scrolled && (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full pointer-events-none">
          بکشید ↔
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SlideContent — renders the right UI per media type
   ════════════════════════════════════════════════════════════════════ */

function SlideContent({
  media,
  post,
  catColor,
  onImageTap,
}: {
  media: PostMedia;
  post: ExplorePost;
  catColor: string;
  onImageTap: (e: React.MouseEvent) => void;
}) {
  if (media.type === "image") {
    return <ImageSlide media={media} onImageTap={onImageTap} />;
  }
  if (media.type === "video") {
    return <VideoSlide media={media} />;
  }
  if (media.type === "audio") {
    return (
      <AudioSlide
        media={media}
        userName={post.user.name}
        catColor={catColor}
      />
    );
  }
  if (media.type === "doc") {
    return <DocSlide media={media} />;
  }
  // Fallback: try to render as image
  return <ImageSlide media={media} onImageTap={onImageTap} />;
}

/* ── Image slide with shimmer placeholder ── */
function ImageSlide({
  media,
  onImageTap,
}: {
  media: PostMedia;
  onImageTap: (e: React.MouseEvent) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="relative w-full h-full cursor-pointer"
      onClick={onImageTap}
    >
      {!loaded && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, #1a2233 40%, #26314b 50%, #1a2233 60%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.2s linear infinite",
          }}
        />
      )}
      <img
        src={media.url}
        alt={media.fileName || "تصویر پست"}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
      <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none">
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        عکس
      </span>
    </div>
  );
}

/* ── Video slide: thumbnail + play button + duration badge; click → inline player ── */
function VideoSlide({ media }: { media: PostMedia }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative w-full h-full bg-black">
        <video
          src={media.url}
          controls
          autoPlay
          className="w-full h-full object-contain"
        />
        <button
          onClick={() => setPlaying(false)}
          className="absolute top-2.5 left-2.5 z-10 w-9 h-9 rounded-full bg-black/65 backdrop-blur-sm grid place-items-center text-white"
          aria-label="بستن ویدیو"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full bg-neutral-900 cursor-pointer group"
      onClick={() => setPlaying(true)}
    >
      {/* Try to show first frame as poster */}
      <video
        src={media.url}
        preload="metadata"
        muted
        playsInline
        className="w-full h-full object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
      {/* Play button */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/95 grid place-items-center shadow-[0_8px_26px_rgba(0,0,0,0.45)] group-active:scale-90 transition-transform">
        <svg viewBox="0 0 24 24" className="w-7 h-7 -mr-0.5" fill="#065f46">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none">
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="2" y="5" width="14" height="14" rx="3" />
          <path d="M22 8l-6 4 6 4V8z" />
        </svg>
        ویدیو
      </span>
    </div>
  );
}

/* ── Audio slide: gradient bg, art, title, equalizer, play/pause, progress ── */
function AudioSlide({
  media,
  userName,
  catColor,
}: {
  media: PostMedia;
  userName: string;
  catColor: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => {
      setCurrent(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrent(0);
      if (currentlyPlayingAudio === audio) currentlyPlayingAudio = null;
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Listen for global pause-all event
  useEffect(() => {
    const onPauseAll = (e: Event) => {
      const detail = (e as CustomEvent).detail as { except?: HTMLAudioElement } | undefined;
      const audio = audioRef.current;
      if (audio && detail?.except !== audio && !audio.paused) {
        audio.pause();
        setPlaying(false);
      }
    };
    window.addEventListener("audio-pause-all", onPauseAll);
    return () => window.removeEventListener("audio-pause-all", onPauseAll);
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      pauseAllAudio(audio);
      currentlyPlayingAudio = audio;
      audio.play().catch(() => {
        toast({ title: "پخش موزیک ناموفق بود 🎧" });
      });
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
      if (currentlyPlayingAudio === audio) currentlyPlayingAudio = null;
    }
  }

  function onSeek(e: React.MouseEvent) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const bar = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    // RTL: progress fills from right to left
    const ratio = (rect.right - e.clientX) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
  }

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center gap-2 px-6 py-6 text-white"
      style={{
        background:
          "linear-gradient(150deg, oklch(0.22 0.04 280), oklch(0.27 0.08 280) 55%, oklch(0.32 0.12 295))",
      }}
    >
      <audio ref={audioRef} src={media.url} preload="metadata" />

      {/* Album art */}
      <div
        className="w-36 h-36 sm:w-40 sm:h-40 rounded-3xl grid place-items-center shadow-[0_14px_36px_rgba(0,0,0,0.5)] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${catColor}, oklch(0.4 0.09 160))`,
        }}
      >
        <Icon name="heart" size={56} className="text-white/90" strokeWidth={1.5} />
        {playing && (
          <div className="absolute bottom-2 left-2 flex items-end gap-0.5 h-3">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-0.5 bg-white/90 rounded-full"
                style={{
                  animation: `eqz 1s ${i * 0.15}s ease-in-out infinite`,
                  transformOrigin: "bottom",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="font-extrabold text-[15px] mt-2 text-center truncate max-w-full">
        {audioTitleFrom(media)}
      </div>
      <div className="text-[11.5px] text-white/70 truncate max-w-full">
        {userName}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 w-full max-w-[290px] mt-1">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-white grid place-items-center shrink-0 shadow-[0_6px_16px_rgba(0,0,0,0.35)] active:scale-90 transition-transform"
          aria-label={playing ? "توقف" : "پخش"}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#065f46">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 -mr-0.5" fill="#065f46">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div
            onClick={onSeek}
            className="h-1.5 rounded-full bg-white/25 overflow-hidden cursor-pointer"
          >
            <div
              className="h-full bg-white transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-white/70 tabular-nums">
            <span>{formatAudioTime(current)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Badge */}
      <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none">
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        موزیک
      </span>

      <style>{`@keyframes eqz{0%,100%{height:25%}50%{height:100%}}`}</style>
    </div>
  );
}

/* ── Document slide: colored icon + filename + size + download button ── */
function DocSlide({ media }: { media: PostMedia }) {
  const style = getDocStyle(media.fileName);
  const name = media.fileName || "سند";

  function handleView() {
    // Try to open in new tab; the browser will display or download
    window.open(media.url, "_blank", "noopener,noreferrer");
  }

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    // Use a real anchor with download attribute for true download
    const a = document.createElement("a");
    a.href = media.url;
    a.download = media.fileName || "document";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "دانلود سند شروع شد ⬇️" });
  }

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center gap-1.5 px-6 py-6"
      style={{
        background: "linear-gradient(160deg, oklch(0.97 0.003 250), oklch(0.93 0.005 250))",
      }}
    >
      <div
        className={cn(
          "w-20 h-20 rounded-3xl grid place-items-center",
          style.cls
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {style.svg}
        </svg>
      </div>
      <div className="font-extrabold text-[14px] mt-2 text-center text-foreground max-w-full px-2 truncate">
        {name}
      </div>
      <div className="text-[11px] text-muted-foreground tabular-nums">
        {style.label} • {formatFileSize(media.fileSize)}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleView}
          className="inline-flex items-center gap-1.5 bg-foreground text-background text-[12px] font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
        >
          <Icon name="image" size={14} />
          مشاهده سند
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 bg-muted text-foreground text-[12px] font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform hover:bg-muted/70"
          aria-label="دانلود"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          دانلود
        </button>
      </div>

      <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none">
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        سند
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Lightbox — full-screen media viewer with swipe
   ════════════════════════════════════════════════════════════════════ */

function Lightbox({
  post,
  startIndex,
  onClose,
}: {
  post: ExplorePost;
  startIndex: number;
  onClose: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(startIndex);
  const tickingRef = useRef(false);

  const media = post.media;
  const n = media.length;

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Scroll to start index on mount
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    requestAnimationFrame(() => {
      track.scrollTo({ left: -startIndex * track.clientWidth, behavior: "auto" });
    });
  }, [startIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;
        const idx = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
        setActiveIdx(Math.max(0, Math.min(n - 1, idx)));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [n]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current = media[activeIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[300] bg-neutral-950/97 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 text-white">
        <span className="text-[12.5px] font-bold bg-white/12 px-3.5 py-1.5 rounded-full tabular-nums">
          {toFa(activeIdx + 1)}/{toFa(n)}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/12 grid place-items-center active:scale-90 transition-transform"
          aria-label="بستن"
        >
          <Icon name="x" size={20} className="text-white" />
        </button>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex-1 flex overflow-x-auto no-scrollbar snap-x snap-mandatory"
      >
        {media.map((m) => (
          <div
            key={m.id}
            className="shrink-0 w-full flex items-center justify-center snap-start snap-always px-1.5 py-1.5"
          >
            <LightboxItem media={m} post={post} />
          </div>
        ))}
      </div>

      {/* Caption */}
      <div className="text-white/90 text-center text-[12.5px] font-bold px-4 py-3.5 min-h-[50px]">
        {current?.type === "image" && (current.fileName || "تصویر")}
        {current?.type === "video" && (current.fileName || "ویدیو")}
        {current?.type === "audio" && audioTitleFrom(current)}
        {current?.type === "doc" && (current.fileName || "سند")}
      </div>
    </motion.div>
  );
}

function LightboxItem({ media, post }: { media: PostMedia; post: ExplorePost }) {
  if (media.type === "image") {
    return (
      <img
        src={media.url}
        alt={media.fileName || "تصویر"}
        className="max-w-full max-h-[72vh] object-contain rounded-lg"
      />
    );
  }
  if (media.type === "video") {
    return (
      <div className="w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden">
        <video
          src={media.url}
          controls
          autoPlay
          className="w-full h-full object-contain"
        />
      </div>
    );
  }
  if (media.type === "audio") {
    return (
      <LightboxAudio
        media={media}
        userName={post.user.name}
        catColor={post.categoryColor || "oklch(0.55 0.13 160)"}
      />
    );
  }
  if (media.type === "doc") {
    return <LightboxDoc media={media} />;
  }
  return null;
}

function LightboxAudio({
  media,
  userName,
  catColor,
}: {
  media: PostMedia;
  userName: string;
  catColor: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => {
      setCurrent(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrent(0);
      if (currentlyPlayingAudio === audio) currentlyPlayingAudio = null;
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const onPauseAll = (e: Event) => {
      const detail = (e as CustomEvent).detail as { except?: HTMLAudioElement } | undefined;
      const audio = audioRef.current;
      if (audio && detail?.except !== audio && !audio.paused) {
        audio.pause();
        setPlaying(false);
      }
    };
    window.addEventListener("audio-pause-all", onPauseAll);
    return () => window.removeEventListener("audio-pause-all", onPauseAll);
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      pauseAllAudio(audio);
      currentlyPlayingAudio = audio;
      audio.play().catch(() => toast({ title: "پخش ناموفق بود 🎧" }));
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
      if (currentlyPlayingAudio === audio) currentlyPlayingAudio = null;
    }
  }

  function onSeek(e: React.MouseEvent) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const bar = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const ratio = (rect.right - e.clientX) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
  }

  return (
    <div className="w-[88%] max-w-md flex flex-col items-center gap-2 text-white">
      <audio ref={audioRef} src={media.url} preload="metadata" />
      <div
        className="w-44 h-44 rounded-[28px] grid place-items-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        style={{
          background: `linear-gradient(135deg, ${catColor}, oklch(0.4 0.09 160))`,
        }}
      >
        <Icon name="heart" size={72} className="text-white/90" strokeWidth={1.5} />
      </div>
      <div className="font-extrabold text-[17px] mt-2 text-center">
        {audioTitleFrom(media)}
      </div>
      <div className="text-[12px] text-white/70">{userName}</div>

      <div
        onClick={onSeek}
        className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden cursor-pointer mt-3.5"
      >
        <div
          className="h-full bg-white"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="w-full flex justify-between text-[11px] text-white/70 mt-1 tabular-nums">
        <span>{formatAudioTime(current)}</span>
        <span>{formatAudioTime(duration)}</span>
      </div>

      <button
        onClick={toggle}
        className="w-14 h-14 rounded-full bg-white grid place-items-center mt-2.5 shadow-[0_10px_26px_rgba(0,0,0,0.4)] active:scale-90 transition-transform"
        aria-label={playing ? "توقف" : "پخش"}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#065f46">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-6 h-6 -mr-0.5" fill="#065f46">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function LightboxDoc({ media }: { media: PostMedia }) {
  const style = getDocStyle(media.fileName);
  function handleDownload() {
    const a = document.createElement("a");
    a.href = media.url;
    a.download = media.fileName || "document";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "دانلود سند شروع شد ⬇️" });
  }
  function handleOpen() {
    window.open(media.url, "_blank", "noopener,noreferrer");
  }
  return (
    <div className="w-[92%] max-w-md h-[80%] bg-white rounded-[18px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-neutral-900 text-white">
        <span className="text-[12.5px] font-extrabold truncate flex-1">
          {media.fileName || "سند"}
        </span>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/15 px-3 py-1.5 rounded-full shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          دانلود
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-neutral-100 p-6 text-center">
        <div className={cn("w-20 h-20 rounded-3xl grid place-items-center", style.cls)}>
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {style.svg}
          </svg>
        </div>
        <div className="font-extrabold text-[14px] text-foreground">
          {media.fileName || "سند"}
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums">
          {style.label} • {formatFileSize(media.fileSize)}
        </div>
        <button
          onClick={handleOpen}
          className="mt-2 inline-flex items-center gap-1.5 bg-foreground text-background text-[12px] font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
        >
          <Icon name="image" size={14} />
          باز کردن در مرورگر
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CommentSheet — bottom sheet with nested multi-level comments
   ════════════════════════════════════════════════════════════════════ */

function CommentSheet({
  post,
  onClose,
}: {
  post: ExplorePost;
  onClose: () => void;
}) {
  const { user: me } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Reply target (a comment id)
  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Drag-to-close
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const loadComments = useCallback(async () => {
    try {
      const d = await api<{ comments: Comment[] }>(
        `/api/posts/${post.id}/comments`
      );
      setComments(d.comments);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onDragStart(e: React.PointerEvent) {
    dragStartRef.current = e.clientY;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onDragMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dy = e.clientY - dragStartRef.current;
    if (dy > 0) setDragY(dy);
  }
  function onDragEnd() {
    if (!dragging) return;
    setDragging(false);
    if (dragY > 90) onClose();
    else setDragY(0);
  }

  async function sendComment() {
    const content = input.trim();
    if (!content) {
      toast({ title: "اول چیزی بنویسید ✍️" });
      return;
    }
    if (!me) {
      toast({ title: "برای کامنت گذاشتن وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    setSending(true);
    try {
      await apiPost(`/api/posts/${post.id}/comments`, { content });
      setInput("");
      await loadComments();
      toast({ title: "نظر شما ثبت شد 💬" });
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function sendReply(parentId: string) {
    const content = replyInput.trim();
    if (!content) {
      toast({ title: "اول چیزی بنویسید ✍️" });
      return;
    }
    if (!me) {
      toast({ title: "برای پاسخ وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    setSendingReply(true);
    try {
      await apiPost(`/api/posts/${post.id}/comments`, {
        content,
        parentId,
      });
      setReplyInput("");
      setReplyTarget(null);
      await loadComments();
      toast({ title: "پاسخ ثبت شد 💬" });
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  }

  async function toggleCommentLike(commentId: string, current: "like" | "dislike" | null) {
    if (!me) {
      toast({ title: "برای واکنش نشان دادن وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    const nextType = current === "like" ? "dislike" : "like";
    // Optimistic update
    setComments((prev) => updateCommentLike(prev, commentId, nextType));
    try {
      const res = await apiPost<{ reaction: "like" | "dislike" | null }>(
        `/api/comments/${commentId}/like`,
        { type: nextType }
      );
      setComments((prev) => applyCommentReaction(prev, commentId, res.reaction));
    } catch (e) {
      // Rollback
      setComments((prev) => applyCommentReaction(prev, commentId, current));
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  }

  const totalComments = countAllComments(comments);

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[490] bg-neutral-950/55 backdrop-blur-[2px]"
      />

      {/* Sheet */}
      <motion.div
        ref={sheetRef}
        initial={{ y: "100%" }}
        animate={{ y: dragY }}
        transition={
          dragging
            ? { duration: 0 }
            : { type: "spring", stiffness: 380, damping: 36 }
        }
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[500] w-full max-w-2xl h-[82vh] bg-card rounded-t-[26px] shadow-[0_-12px_48px_rgba(15,23,42,0.32)] flex flex-col"
        style={{ touchAction: "none" }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className="pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-[5px] rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2.5 border-b border-border">
          <span className="font-extrabold text-[14px]">
            نظرات
            <span className="text-muted-foreground mr-1.5 text-[12px] tabular-nums">
              ({toFa(totalComments)})
            </span>
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted grid place-items-center active:scale-90 transition-transform"
            aria-label="بستن"
          >
            <Icon name="x" size={15} className="text-muted-foreground" />
          </button>
        </div>

        {/* Reply indicator bar */}
        <AnimatePresence>
          {replyTarget && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between px-4 py-1.5 bg-primary/10 text-primary text-[11.5px] font-bold overflow-hidden"
            >
              <span className="truncate">
                در حال پاسخ به <b>{replyTarget.name}</b>
              </span>
              <button
                onClick={() => {
                  setReplyTarget(null);
                  setReplyInput("");
                }}
                className="shrink-0 bg-primary/15 px-2.5 py-1 rounded-full text-[11px] font-extrabold"
              >
                انصراف ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3.5">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24 rounded-full" />
                    <Skeleton className="h-3 w-full rounded-full" />
                    <Skeleton className="h-3 w-3/4 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground text-[12.5px] py-10">
              هنوز نظری ثبت نشده؛ اولین نفر باش ✨
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((c, i) => (
                <CommentNode
                  key={c.id}
                  comment={c}
                  depth={0}
                  index={i}
                  onLike={toggleCommentLike}
                  onReply={(id, name) => {
                    setReplyTarget({ id, name });
                    setReplyInput("");
                  }}
                  replyTargetId={replyTarget?.id || null}
                  replyInput={replyInput}
                  setReplyInput={setReplyInput}
                  onSendReply={sendReply}
                  sendingReply={sendingReply}
                  onCancelReply={() => {
                    setReplyTarget(null);
                    setReplyInput("");
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-3.5 pt-2.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] border-t border-border bg-card">
          {me ? (
            <UserAvatar
              name={me.name}
              avatarUrl={me.profile?.avatarUrl || null}
              gender={me.profile?.gender || null}
              size="sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted grid place-items-center">
              <Icon name="user" size={16} className="text-muted-foreground" />
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void sendComment();
              }
            }}
            placeholder="نظر خود را بنویسید…"
            className="flex-1 h-10 px-4 rounded-full border-[1.5px] border-border bg-muted/50 text-[12.5px] outline-none focus:border-primary focus:bg-card transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => void sendComment()}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-[0_4px_12px_rgba(56,142,142,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="ارسال"
          >
            {sending ? (
              <Icon name="loader" size={16} className="animate-spin" />
            ) : (
              <Icon name="send" size={16} className="-scale-x-100" />
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

/* ── Recursive comment node (handles multiple levels) ── */
function CommentNode({
  comment,
  depth,
  index,
  onLike,
  onReply,
  replyTargetId,
  replyInput,
  setReplyInput,
  onSendReply,
  sendingReply,
  onCancelReply,
}: {
  comment: Comment;
  depth: number;
  index: number;
  onLike: (id: string, current: "like" | "dislike" | null) => void;
  onReply: (id: string, name: string) => void;
  replyTargetId: string | null;
  replyInput: string;
  setReplyInput: (v: string) => void;
  onSendReply: (parentId: string) => void;
  sendingReply: boolean;
  onCancelReply: () => void;
}) {
  const liked = comment.myReaction === "like";
  const showReplyInput = replyTargetId === comment.id;
  // Cap visual indentation at depth 4 to avoid excessive nesting
  const indentPx = Math.min(depth, 4) * 14;
  const [likersOpen, setLikersOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      style={{ paddingRight: depth > 0 ? indentPx : 0 }}
    >
      <div className="flex gap-2.5">
        <button
          onClick={() => navigate({ view: "profile", id: comment.user.id })}
          className="shrink-0"
        >
          <UserAvatar
            name={comment.user.name}
            avatarUrl={comment.user.avatarUrl}
            verified={false}
            gender={comment.user.gender}
            size={depth === 0 ? "sm" : "xs"}
          />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "bg-muted rounded-2xl p-2.5",
              depth === 0 ? "rounded-tr-md" : "rounded-tr-sm"
            )}
          >
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <button
                onClick={() => navigate({ view: "profile", id: comment.user.id })}
                className="font-bold text-[12.5px] hover:text-primary transition-colors"
              >
                {comment.user.name}
              </button>
              {comment.user.isTopTalent && <GoldCheckMark size={13} />}
              <span className="text-[10.5px] text-muted-foreground mr-auto">
                {timeAgoFa(comment.createdAt)}
              </span>
            </div>
            <p className="text-[12.5px] leading-[1.8] whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-1 px-1">
            <button
              onClick={() => onLike(comment.id, comment.myReaction)}
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-bold transition-colors",
                liked
                  ? "text-rose"
                  : "text-muted-foreground hover:text-rose"
              )}
              aria-label="پسندیدن کامنت"
            >
              <Icon
                name="heart"
                size={13}
                className={liked ? "fill-rose" : ""}
              />
            </button>
            {comment.likeCount > 0 && (
              <button
                onClick={() => setLikersOpen(true)}
                className={cn(
                  "-mr-3 text-[11px] font-bold tabular-nums transition-colors",
                  liked ? "text-rose" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="مشاهده لایک‌کنندگان کامنت"
              >
                {toFa(comment.likeCount)}
              </button>
            )}
            <LikersSheet
              open={likersOpen}
              onClose={() => setLikersOpen(false)}
              title="لایک‌کنندگان کامنت"
              fetcher={commentLikersFetcher(comment.id)}
              emptyTitle="هنوز لایکی نیست"
              emptyDesc="اولین لایک را تو بزن!"
            />
            <button
              onClick={() => onReply(comment.id, comment.user.name)}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              پاسخ
            </button>
          </div>
        </div>
      </div>

      {/* Reply input (inline) */}
      <AnimatePresence>
        {showReplyInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 mr-[44px] overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSendReply(comment.id);
                  }
                }}
                placeholder={`پاسخ به ${comment.user.name}…`}
                className="flex-1 h-9 px-3.5 rounded-full border-[1.5px] border-border bg-muted/50 text-[12px] outline-none focus:border-primary focus:bg-card transition-colors"
              />
              <button
                onClick={() => onSendReply(comment.id)}
                disabled={!replyInput.trim() || sendingReply}
                className="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 disabled:opacity-40"
                aria-label="ارسال پاسخ"
              >
                {sendingReply ? (
                  <Icon name="loader" size={14} className="animate-spin" />
                ) : (
                  <Icon name="send" size={14} className="-scale-x-100" />
                )}
              </button>
              <button
                onClick={onCancelReply}
                className="w-9 h-9 rounded-full grid place-items-center text-muted-foreground hover:text-foreground"
                aria-label="انصراف"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nested replies (recursive) */}
      {comment.replies.length > 0 && (
        <div
          className="mt-3 mr-2 pr-3 border-r-2 border-border space-y-3.5"
        >
          {comment.replies.map((r, i) => (
            <CommentNode
              key={r.id}
              comment={r}
              depth={depth + 1}
              index={i}
              onLike={onLike}
              onReply={onReply}
              replyTargetId={replyTargetId}
              replyInput={replyInput}
              setReplyInput={setReplyInput}
              onSendReply={onSendReply}
              sendingReply={sendingReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ── Comment helpers ── */

function countAllComments(comments: Comment[]): number {
  let n = 0;
  for (const c of comments) {
    n += 1;
    if (c.replies?.length) n += countAllComments(c.replies);
  }
  return n;
}

function updateCommentLike(
  comments: Comment[],
  id: string,
  nextType: "like" | "dislike"
): Comment[] {
  return comments.map((c) => {
    if (c.id === id) {
      const wasLiked = c.myReaction === "like";
      const willLike = nextType === "like";
      const delta = wasLiked === willLike ? 0 : willLike ? 1 : -1;
      return {
        ...c,
        myReaction: nextType,
        likeCount: Math.max(0, c.likeCount + delta),
      };
    }
    if (c.replies?.length) {
      return { ...c, replies: updateCommentLike(c.replies, id, nextType) };
    }
    return c;
  });
}

function applyCommentReaction(
  comments: Comment[],
  id: string,
  reaction: "like" | "dislike" | null
): Comment[] {
  return comments.map((c) => {
    if (c.id === id) {
      const wasLiked = c.myReaction === "like";
      const willLike = reaction === "like";
      const delta = wasLiked === willLike ? 0 : willLike ? 1 : -1;
      return {
        ...c,
        myReaction: reaction,
        likeCount: Math.max(0, c.likeCount + delta),
      };
    }
    if (c.replies?.length) {
      return { ...c, replies: applyCommentReaction(c.replies, id, reaction) };
    }
    return c;
  });
}

/* ════════════════════════════════════════════════════════════════════
   PostDetailView — full post view with inline comments
   ════════════════════════════════════════════════════════════════════ */

export function PostDetailView({ id, fromProfile }: { id: string; fromProfile?: boolean }) {
  const { user: me } = useUser();
  const [post, setPost] = useState<ExplorePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // لایک (مخصوص دید از پروفایل)
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [likeBounce, setLikeBounce] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);

  // امتیاز (مخصوص دید از استعدادهای برتر)
  const [ratingOpen, setRatingOpen] = useState(false);
  const [avg, setAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myScore, setMyScore] = useState<number | null>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Lightbox
  const [lightboxStart, setLightboxStart] = useState<number | null>(null);

  // Expanded post text
  const [expanded, setExpanded] = useState(false);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      // ۱) جستجو در پست‌های برتر (featured)
      const data = await api<{ posts: ExplorePost[] }>("/api/explore/posts");
      const found = data.posts.find((p) => p.id === id);
      if (found) {
        setPost(found);
        setLiked(found.likedByMe);
        setLikeCount(found.likeCount);
        setAvg(found.ratingAvg ?? 0);
        setRatingCount(found.ratingCount ?? 0);
        setMyScore(found.myRating ?? null);
        return;
      }
      // ۲) fallback: پست‌های عادی (مثل پست‌های پروفایل) + دسته‌بندی‌ها برای رنگ/آیکون
      const [all, catsRes] = await Promise.all([
        api<{ posts: any[] }>("/api/posts?sort=recent"),
        api<{ categories: CategoryWithSkills[] }>("/api/categories").catch(
          (): { categories: CategoryWithSkills[] } => ({ categories: [] })
        ),
      ]);
      const catMap = new Map<string, CategoryWithSkills>(
        catsRes.categories.map((c) => [c.id, c] as [string, CategoryWithSkills])
      );
      const p = all.posts.find((x) => x.id === id);
      if (!p) {
        setNotFound(true);
        return;
      }
      const cat = p.categoryId ? catMap.get(p.categoryId) : undefined;
      const mapped: ExplorePost = {
        id: p.id,
        content: p.content,
        createdAt: p.createdAt,
        categoryId: p.categoryId ?? null,
        skillId: p.skillId ?? null,
        categoryName: p.categoryName ?? cat?.name ?? null,
        categoryIcon: cat?.iconUrl ?? null,
        categoryColor: cat?.color ?? null,
        skillName: p.skillName ?? null,
        likeCount: p.likeCount ?? 0,
        commentCount: 0,
        likedByMe: p.likedByMe ?? false,
        media: (p.media ?? []).map((m: any) => ({
          id: m.id,
          url: m.url,
          type: m.type,
          fileName: null,
          fileSize: 0,
        })),
        user: {
          id: p.user.id,
          name: p.user.name,
          avatarUrl: p.user.avatarUrl ?? null,
          gender: null,
          isTopTalent: false,
          isVerifiedBadge: p.user.isVerifiedBadge ?? false,
          mainCategoryColor: cat?.color ?? null,
        },
      };
      setPost(mapped);
      setLiked(mapped.likedByMe);
      setLikeCount(mapped.likeCount);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const data = await api<{ comments: Comment[] }>(
        `/api/posts/${id}/comments`
      );
      setComments(data.comments);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadPost();
    void loadComments();
  }, [loadPost, loadComments]);

  async function toggleLike() {
    if (!me) {
      toast({ title: "برای لایک کردن وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    if (!wasLiked) {
      setLikeBounce(true);
      setTimeout(() => setLikeBounce(false), 600);
    }
    setLiking(true);
    try {
      await apiPost(`/api/posts/${id}/like`);
    } catch (e) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLiking(false);
    }
  }

  async function sendComment() {
    const content = input.trim();
    if (!content || !me) return;
    setSending(true);
    try {
      await apiPost(`/api/posts/${id}/comments`, { content });
      setInput("");
      await loadComments();
      toast({ title: "نظر شما ثبت شد 💬" });
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function sendReply(parentId: string) {
    const content = replyInput.trim();
    if (!content || !me) return;
    setSendingReply(true);
    try {
      await apiPost(`/api/posts/${id}/comments`, {
        content,
        parentId,
      });
      setReplyInput("");
      setReplyTarget(null);
      await loadComments();
      toast({ title: "پاسخ ثبت شد 💬" });
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  }

  async function toggleCommentLike(commentId: string, current: "like" | "dislike" | null) {
    if (!me) {
      toast({ title: "برای واکنش نشان دادن وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    const nextType = current === "like" ? "dislike" : "like";
    setComments((prev) => updateCommentLike(prev, commentId, nextType));
    try {
      const res = await apiPost<{ reaction: "like" | "dislike" | null }>(
        `/api/comments/${commentId}/like`,
        { type: nextType }
      );
      setComments((prev) => applyCommentReaction(prev, commentId, res.reaction));
    } catch (e) {
      setComments((prev) => applyCommentReaction(prev, commentId, current));
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  }

  function sharePost() {
    const url = `${window.location.origin}/#/post/${id}`;
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast({ title: "لینک پست کپی شد" });
    }
  }

  if (loading) return <PostDetailSkeleton />;

  if (notFound || !post) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6">
        <EmptyState
          kind="generic"
          title="پست پیدا نشد"
          description="ممکن است حذف شده باشد یا دیگر برجسته نباشد."
          action={
            <button
              onClick={() => navigate({ view: "explore" })}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
            >
              بازگشت به استعدادهای برتر
            </button>
          }
        />
      </div>
    );
  }

  const catColor = post.categoryColor || "oklch(0.55 0.13 160)";
  const ringColor = post.user.mainCategoryColor || catColor;
  const isLong = post.content.length > 220;

  return (
    <div className="max-w-2xl mx-auto pb-2">
      {/* Back row */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => window.history.back()}
          className="grid place-items-center w-10 h-10 rounded-full glass text-foreground hover:bg-foreground/5 transition-colors"
          aria-label="بازگشت"
        >
          <Icon name="chevronRight" size={20} />
        </button>
        <span className="text-[11px] text-muted-foreground">
          {timeAgoFa(post.createdAt)} · {formatFaDate(post.createdAt)}
        </span>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card rounded-[20px] overflow-hidden shadow-card"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-3.5 pt-3.5 pb-1.5">
          <button
            onClick={() => navigate({ view: "profile", id: post.user.id })}
            className="shrink-0"
          >
            <UserAvatar
              name={post.user.name}
              avatarUrl={post.user.avatarUrl}
              verified={post.user.isVerifiedBadge}
              gender={post.user.gender}
              size="md"
              topTalent={post.user.isTopTalent}
              ringColor={post.user.isTopTalent ? null : ringColor}
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate({ view: "profile", id: post.user.id })}
                className="font-extrabold text-[14px] truncate hover:text-primary transition-colors"
              >
                {post.user.name}
              </button>
              {post.user.isVerifiedBadge && !post.user.isTopTalent && (
                <Icon name="badgeCheck" size={15} className="text-gold fill-gold/15" />
              )}
              {post.user.isTopTalent && <GoldCheckMark size={16} />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
              <span>{timeAgoFa(post.createdAt)}</span>
              {post.categoryName && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: `${catColor}22`, color: catColor }}
                  >
                    {post.categoryIcon && <span>{post.categoryIcon}</span>}
                    {post.categoryName}
                  </span>
                </>
              )}
              {post.skillName && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="truncate">{post.skillName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Text */}
        {post.content && (
          <>
            <p
              className={cn(
                "px-3.5 pb-2 text-[13.5px] leading-[1.95] whitespace-pre-wrap break-words",
                isLong && !expanded && "line-clamp-3"
              )}
            >
              {post.content}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="block px-3.5 pb-2.5 text-primary text-[12px] font-extrabold hover:opacity-70 transition-opacity"
              >
                {expanded ? "بستن ↑" : "ادامه مطلب ↓"}
              </button>
            )}
          </>
        )}

        {/* خلاصهٔ امتیاز — فقط در حالت استعدادهای برتر */}
        {!fromProfile && (ratingCount > 0 || avg > 0) && (
          <div className="px-3.5 pb-1">
            <RatingSummary avg={avg} count={ratingCount} onClick={() => setRatingOpen(true)} />
          </div>
        )}

        {/* Media */}
        {post.media.length > 0 && (
          <MediaCarousel
            post={post}
            onImageTap={(_, idx) => setLightboxStart(idx)}
            onLightboxClose={() => setLightboxStart(null)}
          />
        )}

        {/* Actions — مبدأ‌آگاه: از پروفایل = لایک، از استعدادهای برتر = امتیاز */}
        <div className="flex gap-2 p-2.5">
          {fromProfile ? (
            <div
              className={cn(
                "flex-1 h-11 rounded-xl flex items-center justify-center gap-1 transition-colors overflow-hidden",
                liked ? "text-rose bg-rose/10" : "text-muted-foreground bg-muted"
              )}
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => void toggleLike()}
                disabled={liking}
                className="h-full px-3 grid place-items-center shrink-0 outline-none"
                aria-label="پسندیدن"
              >
                <motion.span
                  animate={likeBounce ? { scale: [1, 1.5, 0.85, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon
                    name="heart"
                    size={20}
                    className={liked ? "fill-rose text-rose" : ""}
                    strokeWidth={2}
                  />
                </motion.span>
              </motion.button>
              <button
                onClick={() => setLikersOpen(true)}
                className="h-full flex-1 min-w-0 grid place-items-center text-[12.5px] font-extrabold tabular-nums hover:bg-black/5 dark:hover:bg-white/10 transition-colors outline-none rounded-l-xl"
                aria-label="مشاهده لایک‌کنندگان"
              >
                {formatCount(likeCount)}
              </button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setRatingOpen(true)}
              className={cn(
                "flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[12.5px] font-extrabold transition-colors",
                myScore
                  ? "text-white grad-gold shadow-glow-gold"
                  : "text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
              )}
              aria-label={myScore ? "ویرایش امتیاز" : "ثبت امتیاز"}
            >
              <Icon name="spark" size={20} strokeWidth={2} />
              <span className="nums-fa">{myScore ? `ویرایش (${toFa(myScore)}/۱۰)` : "ثبت امتیاز"}</span>
            </motion.button>
          )}
          <div className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[12.5px] font-extrabold text-muted-foreground bg-muted">
            <Icon name="comment" size={20} strokeWidth={2} />
            <span className="tabular-nums">{formatCount(post.commentCount)}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={sharePost}
            className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[12.5px] font-extrabold text-muted-foreground bg-muted hover:bg-muted/70 transition-colors"
            aria-label="اشتراک‌گذاری"
          >
            <Icon name="share" size={20} strokeWidth={2} />
            <span>اشتراک</span>
          </motion.button>
        </div>

        {/* مودال امتیاز (فقط حالت استعدادهای برتر) */}
        {!fromProfile && (
          <RatingModal
            open={ratingOpen}
            onClose={() => setRatingOpen(false)}
            postId={id}
            initialScore={myScore}
            onSaved={({ avg: a, count: c, myScore: s }) => {
              setAvg(a);
              setRatingCount(c);
              setMyScore(s);
            }}
          />
        )}

        {/* شیت لایک‌کنندگان (فقط حالت پروفایل) */}
        {fromProfile && (
          <LikersSheet
            open={likersOpen}
            onClose={() => setLikersOpen(false)}
            title="لایک‌کنندگان پست"
            fetcher={postLikersFetcher(id)}
            emptyTitle="هنوز لایکی نیست"
            emptyDesc="اولین لایک را تو بزن!"
          />
        )}
      </motion.article>

      {/* Inline comments */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground px-1">
          <Icon name="comment" size={14} />
          نظرات
          <span className="text-[10px] tabular-nums">
            ({toFa(countAllComments(comments))})
          </span>
        </div>
        {commentsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-2.5">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-3 w-full rounded-full" />
                  <Skeleton className="h-3 w-3/4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-4">
            هنوز نظری ثبت نشده. اولین نفر باش!
          </p>
        ) : (
          <div className="space-y-3.5">
            {comments.map((c, i) => (
              <CommentNode
                key={c.id}
                comment={c}
                depth={0}
                index={i}
                onLike={toggleCommentLike}
                onReply={(cid, name) => {
                  setReplyTarget({ id: cid, name });
                  setReplyInput("");
                }}
                replyTargetId={replyTarget?.id || null}
                replyInput={replyInput}
                setReplyInput={setReplyInput}
                onSendReply={sendReply}
                sendingReply={sendingReply}
                onCancelReply={() => {
                  setReplyTarget(null);
                  setReplyInput("");
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky comment input */}
      {me && (
        <div className="sticky bottom-0 mt-4 -mx-1 px-1 py-2.5 bg-background/95 backdrop-blur-md border-t border-border">
          <div className="flex items-center gap-2">
            <UserAvatar
              name={me.name}
              avatarUrl={me.profile?.avatarUrl || null}
              gender={me.profile?.gender || null}
              size="sm"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendComment();
                }
              }}
              placeholder="نظر خود را بنویسید…"
              className="flex-1 h-10 px-4 rounded-full border-[1.5px] border-border bg-muted/50 text-[12.5px] outline-none focus:border-primary focus:bg-card transition-colors"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => void sendComment()}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 disabled:opacity-40"
              aria-label="ارسال"
            >
              {sending ? (
                <Icon name="loader" size={16} className="animate-spin" />
              ) : (
                <Icon name="send" size={16} className="-scale-x-100" />
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxStart !== null && post.media.length > 0 && (
          <Lightbox
            post={post}
            startIndex={lightboxStart}
            onClose={() => setLightboxStart(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <div className="bg-card rounded-[20px] overflow-hidden shadow-card">
        <div className="flex items-center gap-3 p-3.5">
          <Skeleton className="w-11 h-11 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <Skeleton className="h-2.5 w-24 rounded-full" />
          </div>
        </div>
        <div className="px-3.5 pb-3 space-y-1.5">
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
        </div>
        <Skeleton className="h-[280px] w-full" />
        <div className="flex gap-2 p-2.5">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-3/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
