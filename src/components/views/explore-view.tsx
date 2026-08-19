"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CategoryWithSkills } from "@/lib/types";

/* ═════════════════════════════════════════════════════════════════
   Types matching API responses
   ═════════════════════════════════════════════════════════════════ */

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

type Tab = "posts" | "people";

/* ═════════════════════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════════════════════ */

// Convert any color (hex / oklch) to a soft tinted dark background
function darkTint(color: string | null | undefined, alpha: number = 0.85): string {
  if (!color) return "oklch(0.17 0.012 165)";
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 165;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }
    return `oklch(0.2 0.03 ${h.toFixed(0)} / ${alpha})`;
  }
  return color;
}

/* ═════════════════════════════════════════════════════════════════
   ExploreView — Instagram-like grid of featured posts + top talent
   ═════════════════════════════════════════════════════════════════ */

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

  const activeColor = currentCat?.color || "oklch(0.6 0.15 160)";

  return (
    <div className="max-w-5xl mx-auto pb-2">
      {/* ═══ IMMERSIVE HEADER ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-b-[32px] glass-strong mb-4"
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: `radial-gradient(circle at 80% 0%, ${activeColor} 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute -bottom-16 -left-12 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.75 0.15 80)" }}
        />

        <div className="relative p-6 sm:p-7">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.5, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 24, delay: 0.1 }}
              className="grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-primary-foreground shrink-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${activeColor}, oklch(0.4 0.1 160))`,
                boxShadow: `0 8px 24px ${activeColor}40`,
              }}
            >
              <Icon name="sparkles" size={28} />
            </motion.div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                اکسپلور
              </h1>
              <p className="text-sm text-muted-foreground mt-1 leading-6">
                بهترین پست‌ها و استعدادهای برتر را کشف کنید
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ═══ FILTERS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="glass rounded-2xl p-4 mb-4 space-y-3"
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
            <Icon name="x" size={14} />
            حذف فیلترها
          </button>
        )}
      </motion.div>

      {/* ═══ SEGMENTED TABS ═══ */}
      <div className="sticky top-0 z-30 -mx-1 px-1 pb-3">
        <div className="relative flex p-1 glass rounded-2xl gap-1">
          <TabsIndicator activeKey={tab} color={activeColor} />
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

      {/* ═══ CONTENT ═══ */}
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
            transition={{ duration: 0.25 }}
          >
            {posts.length === 0 ? (
              <EmptyState
                kind="generic"
                title="پستی یافت نشد"
                description="با فیلترهای انتخاب‌شده پست برجسته‌ای موجود نیست."
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
            transition={{ duration: 0.25 }}
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

/* ── Tabs indicator (animated pill) ── */
function TabsIndicator({ activeKey, color }: { activeKey: Tab; color: string }) {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl shadow-md"
      style={{
        right: activeKey === "posts" ? "calc(50% - 0.25rem)" : "0.25rem",
        background: color,
        boxShadow: `0 4px 12px ${color}50`,
      }}
    />
  );
}

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
        active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Posts Grid — Instagram-like, dark green glass tiles
   ═════════════════════════════════════════════════════════════════ */

function PostsGrid({ posts }: { posts: ExplorePost[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {posts.map((p, i) => (
        <PostTile key={p.id} post={p} index={i} />
      ))}
    </div>
  );
}

function PostTile({ post, index }: { post: ExplorePost; index: number }) {
  const hasMedia = post.media.length > 0;
  const catColor = post.categoryColor || "oklch(0.6 0.15 160)";
  const tileColor = darkTint(post.categoryColor, 0.7);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate({ view: "post", id: post.id })}
      className="relative aspect-square rounded-2xl overflow-hidden group text-right block"
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: hasMedia
            ? `url(${post.media[0].url}) center/cover`
            : `linear-gradient(135deg, ${tileColor}, ${darkTint(post.categoryColor, 0.9)})`,
        }}
      />

      {/* Pattern overlay for text tiles */}
      {!hasMedia && (
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, white 0%, transparent 30%), radial-gradient(circle at 80% 80%, white 0%, transparent 30%)",
          }}
        />
      )}

      {/* Dark bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Category icon at top-right */}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full glass-strong text-[10px] font-bold flex items-center gap-1">
        {post.categoryIcon && <span>{post.categoryIcon}</span>}
        <span className="text-foreground/90 truncate max-w-[80px]">
          {post.categoryName || "عمومی"}
        </span>
      </div>

      {/* Top Talent crown */}
      {post.user.isTopTalent && (
        <div className="absolute top-2 left-2 grid place-items-center w-6 h-6 rounded-full bg-gold text-black shadow-md">
          <Icon name="crown" size={12} />
        </div>
      )}

      {/* Text preview for text-only posts */}
      {!hasMedia && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-3">
          <p className="text-xs sm:text-sm text-foreground/90 line-clamp-3 text-center leading-5">
            {post.content}
          </p>
        </div>
      )}

      {/* Bottom: poster + counts */}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <div className="flex items-center gap-1.5">
          <div
            className="rounded-full p-0.5"
            style={{
              background: post.user.mainCategoryColor || catColor,
            }}
          >
            <UserAvatar
              name={post.user.name}
              avatarUrl={post.user.avatarUrl}
              gender={post.user.gender}
              verified={post.user.isVerifiedBadge}
              size="xs"
              ringColor="transparent"
            />
          </div>
          <span className="text-[11px] font-bold text-white truncate flex-1">
            {post.user.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-white/95">
          <span className="flex items-center gap-0.5 text-[10px] font-bold">
            <Icon name="heart" size={12} className={post.likedByMe ? "fill-rose text-rose" : ""} />
            {formatCount(post.likeCount)}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-bold">
            <Icon name="comment" size={12} />
            {formatCount(post.commentCount)}
          </span>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
    </motion.button>
  );
}

/* ═════════════════════════════════════════════════════════════════
   People Grid
   ═════════════════════════════════════════════════════════════════ */

function PeopleGrid({ people }: { people: ExplorePerson[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {people.map((p, i) => (
        <PersonCard key={p.id} person={p} index={i} />
      ))}
    </div>
  );
}

function PersonCard({ person, index }: { person: ExplorePerson; index: number }) {
  const ringColor = person.mainCategoryColor || person.categories?.[0]?.color || "oklch(0.6 0.15 160)";
  const location = [person.province, person.city].filter(Boolean).join("، ");

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={{ scale: 0.96 }}
      onClick={() => navigate({ view: "profile", id: person.id })}
      className="relative glass rounded-2xl p-4 flex flex-col items-center text-center overflow-hidden group"
    >
      {/* Background glow */}
      <div
        className="absolute -top-12 right-0 w-32 h-32 rounded-full opacity-25 blur-2xl pointer-events-none group-hover:opacity-40 transition-opacity"
        style={{ background: ringColor }}
      />

      {/* Crown badge */}
      {person.isTopTalent && (
        <div className="absolute top-2 right-2 grid place-items-center w-6 h-6 rounded-full bg-gold text-black shadow-md">
          <Icon name="crown" size={12} />
        </div>
      )}

      {/* Avatar */}
      <div className="relative mb-3">
        <UserAvatar
          name={person.name}
          avatarUrl={person.avatarUrl}
          verified={person.isVerifiedBadge}
          gender={person.gender}
          size="xl"
          ringColor={ringColor}
        />
      </div>

      {/* Name */}
      <h3 className="font-bold text-sm truncate w-full">{person.name}</h3>

      {/* Bio */}
      {person.bioShort && (
        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-5">
          {person.bioShort}
        </p>
      )}

      {/* Categories */}
      {person.categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {person.categories.slice(0, 2).map((c) => (
            <span
              key={c.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold border"
              style={{
                background: darkTint(c.color, 0.7),
                borderColor: c.color || "oklch(0.6 0.15 160)",
                color: "oklch(0.85 0.04 165)",
              }}
            >
              {c.iconUrl || "✨"} {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between w-full pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Icon name="users" size={11} />
          {formatCount(person.followersCount)}
        </span>
        {location && (
          <span className="flex items-center gap-1 truncate">
            <Icon name="mapPin" size={11} />
            {location}
          </span>
        )}
      </div>
    </motion.button>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Post Detail View — full-screen mobile (drag to close), inline desktop
   ═════════════════════════════════════════════════════════════════ */

export function PostDetailView({ id }: { id: string }) {
  const { user: me, loading: userLoading } = useUser();
  const [post, setPost] = useState<ExplorePost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Drag-to-close (mobile only)
  const [sheetY, setSheetY] = useState(0);
  const dragControls = useRef<{ startY: number | null }>({ startY: null });

  // Like state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [likeBounce, setLikeBounce] = useState(false);

  // Comment input
  const [commentInput, setCommentInput] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Load post
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

  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      setTimeout(() => replyInputRef.current?.focus(), 100);
    }
  }, [replyingTo]);

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
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLiking(false);
    }
  }

  async function sendComment() {
    const content = commentInput.trim();
    if (!content || !me) return;
    setSendingComment(true);
    try {
      const res = await apiPost<{ id: string }>(`/api/posts/${id}/comments`, { content });
      setCommentInput("");
      await loadComments();
      // Optimistically update comment count visually if needed
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
      toast({ title: "کامنت ارسال شد" });
      void res;
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSendingComment(false);
    }
  }

  async function sendReply(parentId: string) {
    const content = replyInput.trim();
    if (!content || !me) return;
    setSendingReply(true);
    try {
      await apiPost<{ id: string }>(`/api/posts/${id}/comments`, {
        content,
        parentId,
      });
      setReplyInput("");
      setReplyingTo(null);
      await loadComments();
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  }

  async function toggleCommentLike(commentId: string, type: "like" | "dislike") {
    if (!me) {
      toast({ title: "برای واکنش نشان دادن وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    try {
      const res = await apiPost<{ reaction: "like" | "dislike" | null }>(
        `/api/comments/${commentId}/like`,
        { type }
      );
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            let delta = 0;
            if (c.myReaction === "like" && res.reaction !== "like") delta = -1;
            if (c.myReaction !== "like" && res.reaction === "like") delta = 1;
            return {
              ...c,
              likeCount: Math.max(0, c.likeCount + delta),
              myReaction: res.reaction,
            };
          }
          // Replies
          return {
            ...c,
            replies: c.replies.map((r) => {
              if (r.id === commentId) {
                let delta = 0;
                if (r.myReaction === "like" && res.reaction !== "like") delta = -1;
                if (r.myReaction !== "like" && res.reaction === "like") delta = 1;
                return {
                  ...r,
                  likeCount: Math.max(0, r.likeCount + delta),
                  myReaction: res.reaction,
                };
              }
              return r;
            }),
          };
        })
      );
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  /* Drag-to-close handlers (mobile only) */
  function onDragStart(e: React.TouchEvent) {
    dragControls.current.startY = e.touches[0].clientY;
  }
  function onDragMove(e: React.TouchEvent) {
    if (dragControls.current.startY === null) return;
    const delta = e.touches[0].clientY - dragControls.current.startY;
    if (delta > 0) setSheetY(delta);
  }
  function onDragEnd() {
    if (sheetY > 120) {
      window.history.back();
    }
    setSheetY(0);
    dragControls.current.startY = null;
  }

  if (loading || userLoading) return <PostDetailSkeleton />;

  if (notFound || !post) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6">
        <EmptyState
          kind="generic"
          title="پست پیدا نشد"
          description="ممکن است حذف شده باشد."
          action={
            <button
              onClick={() => navigate({ view: "explore" })}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
            >
              بازگشت به اکسپلور
            </button>
          }
        />
      </div>
    );
  }

  const catColor = post.categoryColor || "oklch(0.6 0.15 160)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: sheetY }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="fixed inset-0 lg:static z-50 lg:z-auto bg-background lg:bg-transparent flex flex-col"
    >
      {/* Drag handle (mobile only) */}
      <div
        className="lg:hidden flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
      >
        <div className="w-10 h-1.5 rounded-full bg-muted-foreground/40" />
      </div>

      <div className="flex-1 overflow-y-auto slim-scroll">
        <div className="max-w-2xl mx-auto p-4 lg:p-0 space-y-4">
          {/* ── Back row ── */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="grid place-items-center w-10 h-10 rounded-full glass text-foreground hover:bg-white/5 transition-colors"
              aria-label="بازگشت"
            >
              <Icon name="chevronRight" size={20} />
            </button>
            <span className="text-xs text-muted-foreground">
              {timeAgoFa(post.createdAt)} · {formatFaDate(post.createdAt)}
            </span>
          </div>

          {/* ── Poster header card ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-3 flex items-center gap-3"
          >
            <button
              onClick={() => navigate({ view: "profile", id: post.user.id })}
              className="shrink-0"
            >
              <UserAvatar
                name={post.user.name}
                avatarUrl={post.user.avatarUrl}
                verified={post.user.isVerifiedBadge}
                gender={post.user.gender}
                size="lg"
                ringColor={post.user.mainCategoryColor || catColor}
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate({ view: "profile", id: post.user.id })}
                  className="font-bold text-sm truncate hover:text-primary transition-colors"
                >
                  {post.user.name}
                </button>
                {post.user.isTopTalent && (
                  <span className="grid place-items-center w-4 h-4 rounded-full bg-gold text-black shrink-0">
                    <Icon name="crown" size={10} />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {(post.categoryName || post.skillName) && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: catColor }}
                    />
                    {post.categoryName}
                    {post.skillName && <span> · {post.skillName}</span>}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Media or content ── */}
          {post.media.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden bg-card"
            >
              {post.media[0].type === "video" ? (
                <video
                  src={post.media[0].url}
                  controls
                  className="w-full max-h-[60vh] object-contain"
                />
              ) : (
                <img
                  src={post.media[0].url}
                  alt={post.content.slice(0, 50)}
                  className="w-full max-h-[60vh] object-contain"
                />
              )}
            </motion.div>
          )}

          {/* ── Content ── */}
          {post.content && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4"
            >
              <p className="text-[15px] leading-8 whitespace-pre-wrap break-words">
                {post.content}
              </p>
            </motion.div>
          )}

          {/* ── Action bar (Like with bounce + comments count) ── */}
          <div className="flex items-center gap-2 glass rounded-2xl p-2.5">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={toggleLike}
              disabled={liking}
              className={cn(
                "flex items-center gap-2 h-10 px-3 rounded-xl font-bold text-sm transition-colors",
                liked
                  ? "text-rose"
                  : "text-muted-foreground hover:text-rose"
              )}
            >
              <motion.span
                animate={
                  likeBounce
                    ? { scale: [1, 1.5, 0.85, 1.2, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.6 }}
              >
                <Icon
                  name="heart"
                  size={20}
                  className={liked ? "fill-rose text-rose" : ""}
                />
              </motion.span>
              <span className="nums-fa">{formatCount(likeCount)}</span>
            </motion.button>
            <div className="flex items-center gap-2 h-10 px-3 text-muted-foreground text-sm font-bold">
              <Icon name="comment" size={20} />
              <span className="nums-fa">{formatCount(post.commentCount)}</span>
            </div>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                  toast({ title: "لینک کپی شد" });
                }
              }}
              className="h-10 px-3 grid place-items-center text-muted-foreground hover:text-primary transition-colors mr-auto"
              aria-label="اشتراک‌گذاری"
            >
              <Icon name="share" size={18} />
            </button>
          </div>

          {/* ── Comments section ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-1">
              <Icon name="comment" size={14} />
              کامنت‌ها
              <span className="text-[10px]">({toFa(comments.length)})</span>
            </div>

            {comments.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  هنوز کامنتی گذاشته نشده. اولین نفر باش!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {comments.map((c, i) => (
                  <CommentItem
                    key={c.id}
                    c={c}
                    index={i}
                    currentUserId={me?.id}
                    onLike={toggleCommentLike}
                    onReply={(id) => {
                      setReplyingTo(id);
                      setReplyInput("");
                    }}
                    replyingTo={replyingTo}
                    replyInput={replyInput}
                    setReplyInput={setReplyInput}
                    onSendReply={sendReply}
                    sendingReply={sendingReply}
                    onCancelReply={() => setReplyingTo(null)}
                    replyInputRef={replyInputRef}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Comment input (sticky bottom) ── */}
      {me && (
        <div className="shrink-0 border-t border-border/60 glass p-3 pb-safe">
          <div className="max-w-2xl mx-auto flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendComment();
                  }
                }}
                placeholder="کامنت بنویسید..."
                className="flex-1 min-h-[44px] max-h-32 resize-none text-sm rounded-2xl pr-4 pl-3 py-2.5 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40"
                rows={1}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={sendComment}
              disabled={!commentInput.trim() || sendingComment}
              className="h-11 w-11 p-0 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
              aria-label="ارسال"
            >
              {sendingComment ? (
                <Icon name="loader" size={18} className="animate-spin" />
              ) : (
                <Icon name="send" size={18} className="-scale-x-100" />
              )}
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Single comment with replies ── */
function CommentItem({
  c,
  index,
  currentUserId,
  onLike,
  onReply,
  replyingTo,
  replyInput,
  setReplyInput,
  onSendReply,
  sendingReply,
  onCancelReply,
  replyInputRef,
}: {
  c: Comment;
  index: number;
  currentUserId?: string;
  onLike: (id: string, type: "like" | "dislike") => void;
  onReply: (id: string) => void;
  replyingTo: string | null;
  replyInput: string;
  setReplyInput: (v: string) => void;
  onSendReply: (parentId: string) => void;
  sendingReply: boolean;
  onCancelReply: () => void;
  replyInputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const isMine = c.user.id === currentUserId;
  const liked = c.myReaction === "like";
  const disliked = c.myReaction === "dislike";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="space-y-2"
    >
      <div className="flex gap-2.5">
        <button
          onClick={() => navigate({ view: "profile", id: c.user.id })}
          className="shrink-0"
        >
          <UserAvatar
            name={c.user.name}
            avatarUrl={c.user.avatarUrl}
            verified={false}
            gender={c.user.gender}
            size="sm"
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="glass rounded-2xl rounded-tr-md p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <button
                onClick={() => navigate({ view: "profile", id: c.user.id })}
                className="font-bold text-xs hover:text-primary transition-colors"
              >
                {c.user.name}
              </button>
              {c.user.isTopTalent && (
                <span className="grid place-items-center w-3.5 h-3.5 rounded-full bg-gold text-black">
                  <Icon name="crown" size={8} />
                </span>
              )}
              <span className="text-[10px] text-muted-foreground mr-auto">
                {timeAgoFa(c.createdAt)}
              </span>
            </div>
            <p className="text-sm leading-6 whitespace-pre-wrap break-words">
              {c.content}
            </p>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 px-1 text-[10px]">
            <button
              onClick={() => onLike(c.id, "like")}
              className={cn(
                "flex items-center gap-1 font-bold transition-colors",
                liked ? "text-rose" : "text-muted-foreground hover:text-rose"
              )}
            >
              <Icon name="thumbsUp" size={11} className={liked ? "fill-rose" : ""} />
              {c.likeCount > 0 && <span className="nums-fa">{toFa(c.likeCount)}</span>}
            </button>
            <button
              onClick={() => onLike(c.id, "dislike")}
              className={cn(
                "flex items-center gap-1 font-bold transition-colors",
                disliked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
              )}
            >
              <Icon name="thumbsDown" size={11} className={disliked ? "fill-destructive" : ""} />
            </button>
            <button
              onClick={() => onReply(c.id)}
              className="font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              پاسخ
            </button>
            {isMine && (
              <span className="font-bold text-muted-foreground mr-auto">(شما)</span>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {c.replies.length > 0 && (
        <div className="pr-8 space-y-2">
          {c.replies.map((r) => (
            <ReplyItem
              key={r.id}
              r={r}
              currentUserId={currentUserId}
              onLike={onLike}
              onReply={onReply}
            />
          ))}
        </div>
      )}

      {/* Reply input */}
      <AnimatePresence>
        {replyingTo === c.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pr-8 overflow-hidden"
          >
            <div className="flex items-end gap-2">
              <Textarea
                ref={replyInputRef}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSendReply(c.id);
                  }
                }}
                placeholder={`پاسخ به ${c.user.name}...`}
                className="flex-1 min-h-[40px] max-h-24 resize-none text-xs rounded-xl pr-3 pl-2 py-2 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40"
                rows={1}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onSendReply(c.id)}
                disabled={!replyInput.trim() || sendingReply}
                className="h-9 w-9 p-0 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-40"
              >
                {sendingReply ? (
                  <Icon name="loader" size={14} className="animate-spin" />
                ) : (
                  <Icon name="send" size={14} className="-scale-x-100" />
                )}
              </motion.button>
              <button
                onClick={onCancelReply}
                className="h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReplyItem({
  r,
  currentUserId,
  onLike,
  onReply,
}: {
  r: Comment;
  currentUserId?: string;
  onLike: (id: string, type: "like" | "dislike") => void;
  onReply: (id: string) => void;
}) {
  const isMine = r.user.id === currentUserId;
  const liked = r.myReaction === "like";
  const disliked = r.myReaction === "dislike";

  return (
    <div className="flex gap-2">
      <button
        onClick={() => navigate({ view: "profile", id: r.user.id })}
        className="shrink-0"
      >
        <UserAvatar
          name={r.user.name}
          avatarUrl={r.user.avatarUrl}
          verified={false}
          gender={r.user.gender}
          size="xs"
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="glass rounded-xl rounded-tr-md p-2.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <button
              onClick={() => navigate({ view: "profile", id: r.user.id })}
              className="font-bold text-[11px] hover:text-primary"
            >
              {r.user.name}
            </button>
            <span className="text-[10px] text-muted-foreground mr-auto">
              {timeAgoFa(r.createdAt)}
            </span>
          </div>
          <p className="text-xs leading-5 whitespace-pre-wrap break-words">
            {r.content}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-0.5 px-1 text-[10px]">
          <button
            onClick={() => onLike(r.id, "like")}
            className={cn(
              "flex items-center gap-1 font-bold transition-colors",
              liked ? "text-rose" : "text-muted-foreground hover:text-rose"
            )}
          >
            <Icon name="thumbsUp" size={10} className={liked ? "fill-rose" : ""} />
            {r.likeCount > 0 && <span className="nums-fa">{toFa(r.likeCount)}</span>}
          </button>
          <button
            onClick={() => onLike(r.id, "dislike")}
            className={cn(
              "flex items-center gap-1 font-bold transition-colors",
              disliked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
            )}
          >
            <Icon name="thumbsDown" size={10} className={disliked ? "fill-destructive" : ""} />
          </button>
          <button
            onClick={() => onReply(r.id)}
            className="font-bold text-muted-foreground hover:text-foreground"
          >
            پاسخ
          </button>
          {isMine && (
            <span className="font-bold text-muted-foreground mr-auto">(شما)</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Skeletons
   ═════════════════════════════════════════════════════════════════ */

function PostsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {[...Array(9)].map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-2xl" />
      ))}
    </div>
  );
}

function PeopleGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-2xl" />
      ))}
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-0 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-[60vh] rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-12 rounded-2xl" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
