"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount, timeAgoFa, formatFaDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CategoryWithSkills } from "@/lib/types";

// ═════════════════════════════════════════════════════════════════
// Types matching API responses
// ═════════════════════════════════════════════════════════════════

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
  media: { id: string; url: string; type: string }[];
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

type ExplorePerson = {
  id: string;
  name: string;
  isVerifiedBadge: boolean;
  isTopTalent: boolean;
  bioShort: string;
  avatarUrl: string | null;
  gender: string | null;
  province: string | null;
  city: string | null;
  categories: { id: string; name: string; iconUrl: string | null; color: string | null }[];
  mainCategoryColor: string | null;
  followersCount: number;
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

// ═════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════

// Convert hex (#RRGGBB) to a soft tinted background using OKLCH chroma reduction
function softTint(color: string | null | undefined): string {
  if (!color) return "oklch(0.96 0.012 270)";
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 270;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }
    return `oklch(0.96 0.025 ${h.toFixed(0)})`;
  }
  return color;
}

// Subtle gradient tint for tile backgrounds (text-only posts)
function softTintGradient(color: string | null | undefined): string {
  if (!color) return "linear-gradient(135deg, oklch(0.97 0.012 270), oklch(0.94 0.018 270))";
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 270;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }
    return `linear-gradient(135deg, oklch(0.97 0.025 ${h.toFixed(0)}), oklch(0.93 0.04 ${h.toFixed(0)})`;
  }
  return `linear-gradient(135deg, ${color}, ${color})`;
}

// ═════════════════════════════════════════════════════════════════
// ExploreView — Instagram-like grid of featured posts + top talent people
// ═════════════════════════════════════════════════════════════════

type Tab = "posts" | "people";

export function ExploreView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [people, setPeople] = useState<ExplorePerson[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [catsLoading, setCatsLoading] = useState(true);

  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");

  // Load categories once
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

  // Load posts + people whenever filters change (debounced)
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const postParams = new URLSearchParams();
      if (categoryId) postParams.set("categoryId", categoryId);
      if (skillId) postParams.set("skillId", skillId);
      const peopleParams = new URLSearchParams();
      if (categoryId) peopleParams.set("categoryId", categoryId);

      const [postsRes, peopleRes] = await Promise.all([
        api<{ posts: ExplorePost[] }>(`/api/explore/posts?${postParams.toString()}`),
        api<{ people: ExplorePerson[] }>(`/api/explore/people?${peopleParams.toString()}`),
      ]);
      setPosts(postsRes.posts);
      setPeople(peopleRes.people);
    } catch {
      setPosts([]);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, skillId]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  function clearFilters() {
    setCategoryId("");
    setSkillId("");
  }

  return (
    <div className="max-w-5xl mx-auto pb-2">
      {/* ═══ Hero Header ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-card p-5 sm:p-6 shadow-[0_8px_30px_-12px_oklch(0.5_0.22_275/0.25)] mb-4"
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-16 -left-10 w-56 h-56 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.6 0.22 275)" }}
        />
        <div
          className="absolute -bottom-20 -right-12 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.72 0.16 75)" }}
        />
        <div className="relative flex items-center gap-4">
          <div className="grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 shrink-0">
            <Icon name="sparkles" size={30} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              استعدادهای برتر
            </h1>
            <p className="text-sm text-muted-foreground mt-1 leading-6">
              بهترین پست‌ها و افراد همتیم را کشف کنید
            </p>
          </div>
        </div>
      </motion.header>

      {/* ═══ Filters card ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 mb-4"
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
        {tab === "posts" && (
          <SearchableSelect
            label="مهارت"
            allLabel={categoryId ? "همه مهارت‌ها" : undefined}
            disabled={!categoryId}
            options={(currentCat?.skills || []).map((s) => ({ value: s.id, label: s.name }))}
            value={skillId}
            onChange={(v) => setSkillId(v === "all" ? "" : v)}
            placeholder={categoryId ? "انتخاب مهارت" : "ابتدا دسته‌بندی را انتخاب کنید"}
          />
        )}
        {(categoryId || skillId) && (
          <button
            onClick={clearFilters}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors text-xs font-bold"
          >
            <Icon name="x" size={14} className="-rtl:scale-x-100" />
            حذف فیلترها
          </button>
        )}
      </motion.div>

      {/* ═══ Segmented tabs ═══ */}
      <div className="sticky top-0 z-30 -mx-1 px-1 pb-3">
        <div className="relative flex p-1 bg-card rounded-2xl shadow-sm gap-1">
          <TabsIndicator activeKey={tab} />
          <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>
            <span>پست‌ها</span>
            {!loading && (
              <span className="text-[10px] text-muted-foreground font-bold tabular-nums">
                {toFa(posts.length)}
              </span>
            )}
          </TabButton>
          <TabButton active={tab === "people"} onClick={() => setTab("people")}>
            <span>افراد</span>
            {!loading && (
              <span className="text-[10px] text-muted-foreground font-bold tabular-nums">
                {toFa(people.length)}
              </span>
            )}
          </TabButton>
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {tab === "posts" ? <PostsGridSkeleton /> : <PeopleGridSkeleton />}
          </motion.div>
        ) : tab === "posts" ? (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {posts.length === 0 ? (
              <EmptyState
                kind="generic"
                title="پستی یافت نشد"
                description="با فیلترهای انتخاب‌شده پست برجسته‌ای موجود نیست. فیلترها را تغییر دهید."
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
              <PostsGrid posts={posts} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="people"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {people.length === 0 ? (
              <EmptyState
                kind="people"
                title="فردی یافت نشد"
                description="هیچ استعداد برتری با این فیلتر موجود نیست."
                action={
                  categoryId ? (
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
              <PeopleGrid people={people} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tabs indicator (animated pill behind active tab) ──
function TabsIndicator({ activeKey }: { activeKey: Tab }) {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl bg-primary shadow-md shadow-primary/20"
      style={{
        right: activeKey === "posts" ? "calc(50% - 0.25rem)" : "0.25rem",
      }}
    />
  );
}

// ── Tab button ──
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative z-10 flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors",
        active
          ? "text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════
// PostsGrid — Instagram-like 2/3 column grid
// ═════════════════════════════════════════════════════════════════

function PostsGrid({ posts }: { posts: ExplorePost[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2.5">
      {posts.map((post, i) => (
        <ExplorePostTile key={post.id} post={post} index={i} />
      ))}
    </div>
  );
}

function ExplorePostTile({ post, index }: { post: ExplorePost; index: number }) {
  const hasMedia = post.media && post.media.length > 0;
  const firstMedia = hasMedia ? post.media[0] : null;
  const isVideo = firstMedia?.type === "video";
  const bgColor = softTintGradient(post.categoryColor);
  const ringColor = post.user.mainCategoryColor || "var(--border)";
  // Show like/comment counts only when > 0
  const showStats = post.likeCount > 0 || post.commentCount > 0;

  return (
    <motion.button
      type="button"
      onClick={() => navigate({ view: "post", id: post.id })}
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className="group relative aspect-square overflow-hidden rounded-2xl sm:rounded-3xl bg-card shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-300 text-right block"
      aria-label={`پست ${post.user.name}`}
    >
      {/* Media or text-content background */}
      {firstMedia ? (
        isVideo ? (
          <div className="absolute inset-0 bg-muted grid place-items-center overflow-hidden">
            <video
              src={firstMedia.url}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute top-2 left-2 grid place-items-center w-7 h-7 rounded-full bg-black/65 text-white backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        ) : (
          <img
            src={firstMedia.url}
            alt={post.content.slice(0, 40) || post.user.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )
      ) : (
        <div
          className="absolute inset-0 p-3.5 flex flex-col justify-between"
          style={{ background: bgColor }}
        >
          {/* Top: category chip */}
          <div className="flex items-start justify-between gap-1.5">
            {post.categoryName ? (
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-card/85 backdrop-blur-sm text-foreground text-[10px] font-bold shadow-sm">
                {post.categoryIcon ? <span>{post.categoryIcon}</span> : null}
                <span className="truncate max-w-[80px]">{post.categoryName}</span>
              </span>
            ) : (
              <span />
            )}
            {post.skillName && (
              <span className="hidden sm:inline-flex items-center h-6 px-2 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                {post.skillName}
              </span>
            )}
          </div>
          {/* Middle: content */}
          <p className={cn(
            "text-foreground/85 leading-6 line-clamp-6 sm:line-clamp-7 drop-shadow-sm",
            post.content.length > 120 ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm font-medium"
          )}>
            {post.content}
          </p>
          {/* Bottom: spacer */}
          <div className="h-4" />
        </div>
      )}

      {/* Top-right category chip (when media) */}
      {firstMedia && post.categoryName && (
        <div className="absolute top-2 right-2 z-10 max-w-[70%]">
          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-black/55 text-white text-[10px] font-bold backdrop-blur-[2px]">
            {post.categoryIcon ? <span>{post.categoryIcon}</span> : null}
            <span className="truncate">{post.categoryName}</span>
          </span>
        </div>
      )}

      {/* Hover overlay (desktop) */}
      <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-black/0 via-black/0 to-black/0 group-hover:from-black/40 transition-colors duration-300" />

      {/* Bottom overlay with poster info + counts */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 px-2.5 py-2 flex items-center gap-2 transition-colors",
          firstMedia ? "bg-gradient-to-t from-black/85 via-black/55 to-transparent text-white" : "bg-gradient-to-t from-card/95 to-card/0 text-foreground"
        )}
      >
        <UserAvatar
          name={post.user.name}
          avatarUrl={post.user.avatarUrl}
          gender={post.user.gender}
          ringColor={post.user.mainCategoryColor}
          size="xs"
        />
        <span className={cn(
          "flex-1 text-[11px] font-bold truncate",
          firstMedia ? "text-white" : "text-foreground"
        )}>
          {post.user.name}
        </span>
        {showStats && (
          <div className="flex items-center gap-2 shrink-0">
            {post.likeCount > 0 && (
              <span className={cn(
                "flex items-center gap-0.5 text-[10px] font-bold",
                firstMedia ? "text-white" : "text-rose"
              )}>
                <Icon name="heart" size={12} className={post.likedByMe ? "fill-current" : ""} />
                {formatCount(post.likeCount)}
              </span>
            )}
            {post.commentCount > 0 && (
              <span className={cn(
                "flex items-center gap-0.5 text-[10px] font-bold",
                firstMedia ? "text-white" : "text-muted-foreground"
              )}>
                <Icon name="comment" size={12} />
                {formatCount(post.commentCount)}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════════════
// PeopleGrid — top talent users
// ═════════════════════════════════════════════════════════════════

function PeopleGrid({ people }: { people: ExplorePerson[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
      {people.map((person, i) => (
        <PeopleTile key={person.id} person={person} index={i} />
      ))}
    </div>
  );
}

function PeopleTile({ person, index }: { person: ExplorePerson; index: number }) {
  return (
    <motion.button
      type="button"
      onClick={() => navigate({ view: "profile", id: person.id })}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="group relative bg-card rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-300 flex flex-col items-center text-center text-right overflow-hidden"
    >
      {/* Decorative corner glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ backgroundColor: person.mainCategoryColor || "var(--primary)" }}
      />

      {/* Avatar with category color ring */}
      <div className="relative mb-3">
        <UserAvatar
          name={person.name}
          avatarUrl={person.avatarUrl}
          gender={person.gender}
          verified={person.isVerifiedBadge}
          ringColor={person.mainCategoryColor}
          size="xl"
        />
        {person.isTopTalent && (
          <span className="absolute -top-1 -right-1 grid place-items-center w-7 h-7 rounded-full bg-gold text-white shadow-md ring-2 ring-card">
            <Icon name="crown" size={14} />
          </span>
        )}
      </div>

      {/* Name + verified */}
      <div className="flex items-center justify-center gap-1 mb-1 min-w-0 w-full">
        <h3 className="font-bold text-sm truncate">{person.name}</h3>
      </div>

      {/* Bio */}
      {person.bioShort ? (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-5 mb-2 min-h-[2.5rem]">
          {person.bioShort}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground/60 italic mb-2 min-h-[2.5rem]">
          بدون توضیحات
        </p>
      )}

      {/* Categories */}
      {person.categories.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 mb-2">
          {person.categories.slice(0, 2).map((c) => (
            <Badge
              key={c.id}
              variant="secondary"
              className="text-[10px] py-0 h-5 rounded-full font-medium"
            >
              {c.iconUrl ? `${c.iconUrl} ` : ""}
              {c.name}
            </Badge>
          ))}
          {person.categories.length > 2 && (
            <Badge variant="outline" className="text-[10px] py-0 h-5 rounded-full font-medium">
              +{toFa(person.categories.length - 2)}
            </Badge>
          )}
        </div>
      )}

      {/* Followers count */}
      <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
        <Icon name="userPlus" size={13} />
        <span className="font-bold text-foreground tabular-nums">
          {formatCount(person.followersCount)}
        </span>
        <span>دنبال‌کننده</span>
      </div>
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════════════
// Loading skeletons
// ═════════════════════════════════════════════════════════════════

function PostsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-2xl sm:rounded-3xl" />
      ))}
    </div>
  );
}

function PeopleGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-3xl p-4 sm:p-5 flex flex-col items-center gap-3 shadow-sm"
        >
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="w-full h-3 rounded" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PostDetailView — Instagram-like full post + comments + replies
// ═════════════════════════════════════════════════════════════════

export function PostDetailView({ id }: { id: string }) {
  const { user: me, loading: userLoading } = useUser();
  const [post, setPost] = useState<ExplorePost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Sheet drag-to-close on mobile
  const [sheetY, setSheetY] = useState(0);

  // Like state (local)
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  // Comment input
  const [commentInput, setCommentInput] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Follow state
  const [following, setFollowing] = useState(false);
  const [followingBusy, setFollowingBusy] = useState(false);

  // ── Load post ──
  const loadPost = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api<{ posts: ExplorePost[] }>("/api/explore/posts");
      const found = data.posts.find((p) => p.id === id);
      if (!found) {
        setNotFound(true);
        return;
      }
      setPost(found);
      setLiked(found.likedByMe);
      setLikeCount(found.likeCount);
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ── Load comments ──
  const loadComments = useCallback(async () => {
    try {
      const data = await api<{ comments: Comment[] }>(`/api/posts/${id}/comments`);
      setComments(data.comments);
    } catch {
      setComments([]);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [loadPost, loadComments]);

  // Focus reply input when opened
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      setTimeout(() => replyInputRef.current?.focus(), 100);
    }
  }, [replyingTo]);

  // ── Handlers ──
  async function toggleLike() {
    if (!me) {
      toast({ title: "برای لایک کردن وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    setLiking(true);
    try {
      await apiPost(`/api/posts/${id}/like`);
    } catch (e) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLiking(false);
    }
  }

  async function sendComment() {
    if (!me) {
      toast({ title: "برای کامنت گذاشتن وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    const content = commentInput.trim();
    if (!content) return;
    setSendingComment(true);
    try {
      await apiPost(`/api/posts/${id}/comments`, { content });
      setCommentInput("");
      await loadComments();
      toast({ title: "کامنت شما ثبت شد ✅" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSendingComment(false);
    }
  }

  function startReply(commentId: string) {
    if (!me) {
      toast({ title: "برای پاسخ دادن وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    setReplyingTo(commentId);
    setReplyInput("");
  }

  function cancelReply() {
    setReplyingTo(null);
    setReplyInput("");
  }

  async function sendReply(parentId: string) {
    const content = replyInput.trim();
    if (!content) return;
    setSendingReply(true);
    try {
      await apiPost(`/api/posts/${id}/comments`, { content, parentId });
      setReplyInput("");
      setReplyingTo(null);
      await loadComments();
      toast({ title: "پاسخ شما ثبت شد ✅" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  }

  async function toggleCommentReaction(commentId: string, type: "like" | "dislike") {
    if (!me) {
      toast({ title: "برای واکنش وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    const snapshot = comments;
    setComments(updateCommentReaction(comments, commentId, type));
    try {
      const res = await apiPost<{ reaction: "like" | "dislike" | null }>(
        `/api/comments/${commentId}/like`,
        { type }
      );
      setComments((prev) => syncCommentReaction(prev, commentId, res.reaction));
    } catch (e) {
      setComments(snapshot);
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function toggleFollow() {
    if (!me) {
      toast({ title: "برای دنبال کردن وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    if (!post) return;
    setFollowingBusy(true);
    try {
      const res = await apiPost<{ status: string }>("/api/connections", {
        receiverId: post.user.id,
      });
      if (res.status === "accepted") {
        setFollowing(true);
        toast({ title: "ارتباط برقرار شد ✅" });
      } else if (res.status === "pending-sent") {
        setFollowing(true);
        toast({ title: "درخواست دنبال کردن ارسال شد 📨" });
      } else if (res.status === "pending-received") {
        toast({ title: "این شخص به شما درخواست داده است. به ارتباطات مراجعه کنید." });
      }
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setFollowingBusy(false);
    }
  }

  function goBack() {
    if (typeof window !== "undefined") window.history.back();
  }

  // ── Drag-to-close on mobile (only when at top of scroll) ──
  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 120) {
      goBack();
    }
    setSheetY(0);
  }

  // ── Loading state ──
  if (loading) return <PostDetailSkeleton />;

  // ── Not found ──
  if (notFound || !post) {
    return (
      <div className="lg:p-4 pt-safe pb-safe">
        <EmptyState
          kind="generic"
          title="پست پیدا نشد"
          description="ممکن است این پست حذف شده باشد یا دیگر برجسته نباشد."
          action={
            <button
              onClick={() => navigate({ view: "explore" })}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              بازگشت به استعدادها
            </button>
          }
        />
      </div>
    );
  }

  const isOwner = me?.id === post.user.id;
  const commentCount = comments.length;
  const totalReplies = comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
  const totalComments = commentCount + totalReplies;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: sheetY }}
      transition={{ type: "spring", stiffness: 320, damping: 36 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.4}
      onDragEnd={onDragEnd}
      className="fixed inset-0 z-50 bg-background flex flex-col pt-safe pb-safe lg:static lg:z-auto lg:inset-auto lg:pt-0 lg:pb-0 lg:cursor-default"
      style={{ touchAction: "none" }}
    >
      {/* Drag handle (mobile only) */}
      <div className="lg:hidden shrink-0 pt-2 pb-1 flex justify-center bg-card/95 lg:bg-transparent">
        <div className="w-10 h-1.5 rounded-full bg-foreground/20" />
      </div>

      {/* ═══ Header ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0 flex items-center gap-3 p-3 border-b border-border/60 bg-card/95 lg:bg-card lg:rounded-2xl lg:border lg:m-1 lg:shadow-sm"
      >
        {/* Back / Close button */}
        <button
          onClick={goBack}
          className="shrink-0 grid place-items-center w-10 h-10 rounded-full hover:bg-foreground/5 active:scale-90 transition-all"
          aria-label="بستن"
        >
          <Icon name="chevronRight" size={22} />
        </button>

        {/* Poster avatar with category ring */}
        <button
          onClick={() => navigate({ view: "profile", id: post.user.id })}
          className="shrink-0"
          aria-label={post.user.name}
        >
          <UserAvatar
            name={post.user.name}
            avatarUrl={post.user.avatarUrl}
            gender={post.user.gender}
            verified={post.user.isVerifiedBadge}
            ringColor={post.user.mainCategoryColor}
            size="md"
          />
        </button>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate({ view: "profile", id: post.user.id })}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <span className="font-bold text-sm truncate">{post.user.name}</span>
            {post.user.isTopTalent && (
              <span className="inline-flex items-center gap-0.5 h-4 px-1.5 rounded-full bg-gold/15 text-gold text-[9px] font-bold shrink-0">
                <Icon name="award" size={10} />
                استعداد برتر
              </span>
            )}
          </button>
          <p className="text-[11px] text-muted-foreground">
            {timeAgoFa(post.createdAt)} · {formatFaDate(post.createdAt)}
          </p>
        </div>

        {/* Follow button */}
        {!isOwner && !userLoading && (
          <button
            onClick={toggleFollow}
            disabled={followingBusy}
            className={cn(
              "shrink-0 h-9 px-4 rounded-full font-bold text-xs transition-all flex items-center gap-1.5",
              following
                ? "bg-muted text-muted-foreground border border-border"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20",
              followingBusy && "opacity-70"
            )}
          >
            {followingBusy ? (
              <Icon name="loader" size={14} className="animate-spin" />
            ) : following ? (
              <>
                <Icon name="userCheck" size={14} />
                دنبال‌شده
              </>
            ) : (
              <>
                <Icon name="userPlus" size={14} />
                دنبال کردن
              </>
            )}
          </button>
        )}
      </motion.header>

      {/* ═══ Scrollable body ═══ */}
      <div
        className="flex-1 overflow-y-auto slim-scroll lg:overflow-visible"
        style={{ touchAction: "pan-y" }}
      >
        <div className="max-w-2xl mx-auto px-3 py-4 sm:px-4 sm:py-5 space-y-5">
          {/* Category + skill badges */}
          {(post.categoryName || post.skillName) && (
            <div className="flex flex-wrap items-center gap-2">
              {post.categoryName && (
                <Badge variant="secondary" className="text-xs py-1 px-2.5 rounded-lg font-medium">
                  {post.categoryIcon ? `${post.categoryIcon} ` : ""}
                  {post.categoryName}
                </Badge>
              )}
              {post.skillName && (
                <Badge
                  variant="outline"
                  className="text-xs py-1 px-2.5 rounded-lg border-primary/30 text-primary font-medium"
                >
                  {post.skillName}
                </Badge>
              )}
            </div>
          )}

          {/* Post content — large beautiful typography */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[17px] sm:text-lg leading-8 sm:leading-9 whitespace-pre-wrap break-words text-foreground">
              {post.content}
            </p>
          </motion.div>

          {/* Media */}
          {post.media.length > 0 && (
            <div className="space-y-2">
              {post.media.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="relative overflow-hidden rounded-2xl bg-card shadow-sm"
                >
                  {m.type === "video" ? (
                    <video
                      src={m.url}
                      controls
                      playsInline
                      className="w-full max-h-[70vh] object-contain"
                    />
                  ) : (
                    <img
                      src={m.url}
                      alt={post.content.slice(0, 60) || post.user.name}
                      className="w-full max-h-[70vh] object-cover"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Like button + counts */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 py-1"
          >
            <button
              onClick={toggleLike}
              disabled={liking}
              className={cn(
                "flex items-center gap-2 h-11 px-4 rounded-full font-bold text-sm transition-all active:scale-95 shadow-sm",
                liked
                  ? "bg-rose/10 text-rose shadow-rose/10"
                  : "bg-muted text-muted-foreground hover:bg-rose/5 hover:text-rose"
              )}
            >
              <motion.span
                key={liked ? "liked" : "unliked"}
                initial={{ scale: 1 }}
                whileTap={{ scale: 1.4 }}
                transition={{ type: "spring", stiffness: 500, damping: 10 }}
              >
                <Icon name="heart" size={20} className={liked ? "fill-current" : ""} />
              </motion.span>
              <span className="tabular-nums">{formatCount(likeCount)} لایک</span>
            </button>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Icon name="comment" size={16} />
              <span className="tabular-nums">{formatCount(totalComments)} کامنت</span>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* ═══ Comments section ═══ */}
          <section className="space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Icon name="comment" size={18} className="text-primary" />
              کامنت‌ها
              <span className="text-xs text-muted-foreground font-normal tabular-nums">
                ({toFa(commentCount)})
              </span>
            </h3>

            {comments.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <div className="grid place-items-center w-12 h-12 mx-auto mb-2 rounded-full bg-muted">
                  <Icon name="comment" size={20} className="opacity-50" />
                </div>
                <p>اولین نفر باشید که کامنت می‌گذارد.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {comments.map((c, i) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      depth={0}
                      postId={id}
                      onReply={startReply}
                      replyingTo={replyingTo}
                      replyInput={replyInput}
                      setReplyInput={setReplyInput}
                      sendingReply={sendingReply}
                      sendReply={sendReply}
                      cancelReply={cancelReply}
                      replyInputRef={replyInputRef}
                      onReact={toggleCommentReaction}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Spacer for fixed bottom input */}
          <div className="h-4 lg:h-0" />
        </div>
      </div>

      {/* ═══ Sticky comment input ═══ */}
      <div className="shrink-0 border-t border-border/60 bg-card/95 lg:bg-card lg:border lg:rounded-2xl lg:m-1 p-3 lg:shadow-sm">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <Textarea
            ref={commentInputRef}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendComment();
              }
            }}
            placeholder="کامنت بنویسید..."
            rows={1}
            className="resize-none max-h-32 min-h-[44px] rounded-xl bg-muted/60 border-border/60 focus-visible:ring-1 focus-visible:ring-ring text-sm leading-6"
          />
          <button
            onClick={sendComment}
            disabled={!commentInput.trim() || sendingComment}
            className={cn(
              "shrink-0 grid place-items-center w-11 h-11 rounded-xl transition-all active:scale-90",
              commentInput.trim() && !sendingComment
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            aria-label="ارسال"
          >
            {sendingComment ? (
              <Icon name="loader" size={20} className="animate-spin" />
            ) : (
              <Icon name="send" size={20} className="-scale-x-100" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════
// CommentItem — recursive (handles replies nested under parents)
// ═════════════════════════════════════════════════════════════════

function CommentItem({
  comment,
  depth,
  postId,
  onReply,
  replyingTo,
  replyInput,
  setReplyInput,
  sendingReply,
  sendReply,
  cancelReply,
  replyInputRef,
  onReact,
  index,
}: {
  comment: Comment;
  depth: number;
  postId: string;
  onReply: (commentId: string) => void;
  replyingTo: string | null;
  replyInput: string;
  setReplyInput: (v: string) => void;
  sendingReply: boolean;
  sendReply: (parentId: string) => void;
  cancelReply: () => void;
  replyInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onReact: (commentId: string, type: "like" | "dislike") => void;
  index: number;
}) {
  const isReply = depth > 0;
  const isReplyingHere = replyingTo === comment.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay: Math.min(index * 0.03, 0.25),
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "flex gap-2.5",
        isReply && "pr-3 sm:pr-4 border-r-2 border-border/40"
      )}
    >
      {/* Avatar */}
      <button
        onClick={() => navigate({ view: "profile", id: comment.user.id })}
        className="shrink-0"
        aria-label={comment.user.name}
      >
        <UserAvatar
          name={comment.user.name}
          avatarUrl={comment.user.avatarUrl}
          gender={comment.user.gender}
          size={isReply ? "xs" : "sm"}
        />
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="bg-muted/40 rounded-2xl px-3 py-2">
          {/* Name + verified + top-talent badge */}
          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
            <button
              onClick={() => navigate({ view: "profile", id: comment.user.id })}
              className="font-bold text-[13px] hover:text-primary transition-colors truncate"
            >
              {comment.user.name}
            </button>
            {comment.user.isTopTalent && (
              <span className="inline-flex items-center gap-0.5 h-3.5 px-1 rounded-full bg-gold/15 text-gold text-[9px] font-bold">
                <Icon name="award" size={9} />
              </span>
            )}
          </div>
          <p className="text-[13px] leading-6 whitespace-pre-wrap break-words text-foreground">
            {comment.content}
          </p>
        </div>

        {/* Meta row: time + like/dislike + reply */}
        <div className="flex items-center gap-3 mt-1.5 px-1 text-[11px] text-muted-foreground">
          <span>{timeAgoFa(comment.createdAt)}</span>

          {/* Like */}
          <button
            onClick={() => onReact(comment.id, "like")}
            className={cn(
              "flex items-center gap-1 font-bold transition-colors",
              comment.myReaction === "like"
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <motion.span
              whileTap={{ scale: 1.3 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
            >
              <Icon
                name="thumbsUp"
                size={14}
                className={comment.myReaction === "like" ? "fill-current" : ""}
              />
            </motion.span>
            {comment.likeCount > 0 && (
              <span className="tabular-nums">{toFa(comment.likeCount)}</span>
            )}
          </button>

          {/* Dislike */}
          <button
            onClick={() => onReact(comment.id, "dislike")}
            className={cn(
              "flex items-center gap-1 font-bold transition-colors",
              comment.myReaction === "dislike"
                ? "text-rose"
                : "text-muted-foreground hover:text-rose"
            )}
          >
            <motion.span
              whileTap={{ scale: 1.3 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
            >
              <Icon
                name="thumbsDown"
                size={14}
                className={comment.myReaction === "dislike" ? "fill-current" : ""}
              />
            </motion.span>
          </button>

          {/* Reply — only on top-level comments */}
          {!isReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="font-bold hover:text-foreground transition-colors"
            >
              پاسخ
            </button>
          )}
        </div>

        {/* Inline reply input */}
        <AnimatePresence initial={false}>
          {isReplyingHere && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-end gap-2 mt-2">
                <Textarea
                  ref={replyInputRef}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply(comment.id);
                    }
                    if (e.key === "Escape") cancelReply();
                  }}
                  placeholder={`پاسخ به ${comment.user.name}...`}
                  rows={1}
                  className="resize-none max-h-28 min-h-[40px] text-[13px] leading-6 rounded-xl bg-muted/60 border-border/60 focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button
                  onClick={() => sendReply(comment.id)}
                  disabled={!replyInput.trim() || sendingReply}
                  className={cn(
                    "shrink-0 grid place-items-center w-10 h-10 rounded-xl transition-all active:scale-90",
                    replyInput.trim() && !sendingReply
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  aria-label="ارسال پاسخ"
                >
                  {sendingReply ? (
                    <Icon name="loader" size={16} className="animate-spin" />
                  ) : (
                    <Icon name="send" size={16} className="-scale-x-100" />
                  )}
                </button>
                <button
                  onClick={cancelReply}
                  className="shrink-0 grid place-items-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-foreground/5 active:scale-90 transition-all"
                  aria-label="انصراف"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((r, i) => (
              <CommentItem
                key={r.id}
                comment={r}
                depth={depth + 1}
                postId={postId}
                onReply={onReply}
                replyingTo={replyingTo}
                replyInput={replyInput}
                setReplyInput={setReplyInput}
                sendingReply={sendingReply}
                sendReply={sendReply}
                cancelReply={cancelReply}
                replyInputRef={replyInputRef}
                onReact={onReact}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PostDetailSkeleton
// ═════════════════════════════════════════════════════════════════

function PostDetailSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Skeleton className="h-14 rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-6 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-11 w-40 rounded-full" />
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-12 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Comment reaction helpers (immutable updates for nested structures)
// ═════════════════════════════════════════════════════════════════

function updateCommentReaction(
  comments: Comment[],
  commentId: string,
  type: "like" | "dislike"
): Comment[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      return applyOptimisticReaction(c, type);
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: updateCommentReaction(c.replies, commentId, type) };
    }
    return c;
  });
}

function applyOptimisticReaction(c: Comment, type: "like" | "dislike"): Comment {
  const prev = c.myReaction;
  if (prev === type) {
    return {
      ...c,
      myReaction: null,
      likeCount: type === "like" ? Math.max(0, c.likeCount - 1) : c.likeCount,
    };
  }
  return {
    ...c,
    myReaction: type,
    likeCount:
      prev === "like"
        ? Math.max(0, c.likeCount - 1)
        : type === "like"
          ? c.likeCount + 1
          : c.likeCount,
  };
}

function syncCommentReaction(
  comments: Comment[],
  commentId: string,
  serverReaction: "like" | "dislike" | null
): Comment[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      return { ...c, myReaction: serverReaction };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: syncCommentReaction(c.replies, commentId, serverReaction) };
    }
    return c;
  });
}
