"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount, timeAgoFa, formatFaDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CategoryWithSkills } from "@/lib/types";
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  X,
  ChevronRight,
  Sparkles,
  BadgeCheck,
  Award,
  UserPlus,
  Loader2,
  Image as ImageIcon,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

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
  if (!color) return "oklch(0.96 0.012 200)";
  // Try to extract hue from common formats; fallback to a neutral tint
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 200;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }
    return `oklch(0.96 0.02 ${h.toFixed(0)})`;
  }
  return color;
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
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* ═══ Header ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3"
      >
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-sm shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight">استعدادهای برتر</h1>
          <p className="text-sm text-muted-foreground mt-0.5">بهترین پست‌ها و افراد برتر همتیم</p>
        </div>
      </motion.header>

      {/* ═══ Filters card ═══ */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3 shadow-sm">
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
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            حذف فیلترها
          </button>
        )}
      </div>

      {/* ═══ Segmented tabs ═══ */}
      <div className="flex p-1 bg-muted/60 rounded-2xl gap-1">
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>
          پست‌ها
          {!loading && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {toFa(posts.length)}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === "people"} onClick={() => setTab("people")}>
          افراد
          {!loading && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {toFa(people.length)}
            </span>
          )}
        </TabButton>
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
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
        "flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
        active
          ? "bg-card shadow-sm text-foreground"
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
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
  const ringColor = post.user.mainCategoryColor || "var(--border)";
  const bgColor = softTint(post.categoryColor);

  return (
    <motion.button
      type="button"
      onClick={() => navigate({ view: "post", id: post.id })}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="group relative aspect-square overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow text-right block"
      aria-label={`پست ${post.user.name}`}
    >
      {/* Media or text-content background */}
      {firstMedia ? (
        isVideo ? (
          <div className="absolute inset-0 bg-muted grid place-items-center">
            <video
              src={firstMedia.url}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute top-2 left-2 grid place-items-center w-7 h-7 rounded-full bg-black/60 text-white">
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
          className="absolute inset-0 p-3 flex items-center"
          style={{ backgroundColor: bgColor }}
        >
          <p className={cn(
            "text-foreground/80 leading-6 line-clamp-6",
            post.content.length > 100 ? "text-xs" : "text-sm font-medium"
          )}>
            {post.content}
          </p>
        </div>
      )}

      {/* Top-left category chip (if any) */}
      {post.categoryName && (
        <div className="absolute top-2 right-2 z-10 max-w-[70%]">
          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-black/55 text-white text-[10px] font-bold backdrop-blur-[2px]">
            {post.categoryIcon ? post.categoryIcon : null}
            <span className="truncate">{post.categoryName}</span>
          </span>
        </div>
      )}

      {/* Bottom overlay with poster info + counts */}
      <div className="absolute inset-x-0 bottom-0 bg-black/55 text-white px-2.5 py-2 flex items-center gap-2">
        <div
          className="rounded-full shrink-0"
          style={{ boxShadow: `0 0 0 2.5px ${ringColor}` }}
        >
          <UserAvatar
            name={post.user.name}
            avatarUrl={post.user.avatarUrl}
            gender={post.user.gender}
            size="xs"
          />
        </div>
        <span className="flex-1 text-[11px] font-bold truncate">{post.user.name}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-[10px] font-medium">
            <Heart className="w-3 h-3" />
            {formatCount(post.likeCount)}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium">
            <MessageSquare className="w-3 h-3" />
            {formatCount(post.commentCount)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════════════
// PeopleGrid — top talent users
// ═════════════════════════════════════════════════════════════════

function PeopleGrid({ people }: { people: ExplorePerson[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {people.map((person, i) => (
        <PeopleTile key={person.id} person={person} index={i} />
      ))}
    </div>
  );
}

function PeopleTile({ person, index }: { person: ExplorePerson; index: number }) {
  const ringColor = person.mainCategoryColor || "var(--border)";
  return (
    <motion.button
      type="button"
      onClick={() => navigate({ view: "profile", id: person.id })}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="group bg-card border border-border/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center text-right"
    >
      {/* Avatar with category color ring */}
      <div className="relative mb-3">
        <div
          className="rounded-full"
          style={{ boxShadow: `0 0 0 3.5px ${ringColor}` }}
        >
          <UserAvatar
            name={person.name}
            avatarUrl={person.avatarUrl}
            gender={person.gender}
            verified={person.isVerifiedBadge}
            size="xl"
          />
        </div>
        {person.isTopTalent && (
          <span className="absolute -top-1 -right-1 grid place-items-center w-6 h-6 rounded-full bg-gold text-white shadow-sm border-2 border-card">
            <Award className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Name + verified */}
      <div className="flex items-center justify-center gap-1 mb-1 min-w-0 w-full">
        <h3 className="font-bold text-sm truncate">{person.name}</h3>
        {person.isVerifiedBadge && (
          <BadgeCheck className="w-4 h-4 text-gold fill-gold/15 shrink-0" />
        )}
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
              className="text-[10px] py-0 h-5 rounded-md font-medium"
            >
              {c.iconUrl ? `${c.iconUrl} ` : ""}
              {c.name}
            </Badge>
          ))}
          {person.categories.length > 2 && (
            <Badge variant="outline" className="text-[10px] py-0 h-5 rounded-md font-medium">
              +{toFa(person.categories.length - 2)}
            </Badge>
          )}
        </div>
      )}

      {/* Followers count */}
      <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground pt-1">
        <UserPlus className="w-3.5 h-3.5" />
        <span className="font-bold text-foreground">{formatCount(person.followersCount)}</span>
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl sm:rounded-2xl" />
      ))}
    </div>
  );
}

function PeopleGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col items-center gap-3"
        >
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="w-full h-3 rounded" />
          <Skeleton className="w-16 h-5 rounded" />
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

  // Like state (local)
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  // Comment input
  const [commentInput, setCommentInput] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Reply state — which comment we're replying to (its id), and the reply text
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
    // Capture snapshot for clean rollback on failure
    const snapshot = comments;
    // Optimistic update
    setComments(updateCommentReaction(comments, commentId, type));
    try {
      const res = await apiPost<{ reaction: "like" | "dislike" | null }>(
        `/api/comments/${commentId}/like`,
        { type }
      );
      // Sync to server result
      setComments((prev) => syncCommentReaction(prev, commentId, res.reaction));
    } catch (e) {
      // Rollback to snapshot captured before optimistic update
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

  // ── Loading state ──
  if (loading) return <PostDetailSkeleton />;

  // ── Not found ──
  if (notFound || !post) {
    return (
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
    );
  }

  const ringColor = post.user.mainCategoryColor || "var(--border)";
  const isOwner = me?.id === post.user.id;
  const commentCount = comments.length;
  // Count replies too
  const totalReplies = comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
  const totalComments = commentCount + totalReplies;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col pt-safe pb-safe lg:static lg:z-auto lg:inset-auto lg:pt-0 lg:pb-0">
      {/* ═══ Header ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0 flex items-center gap-3 p-3 border-b border-border/60 bg-card/95 lg:bg-card lg:rounded-2xl lg:border"
      >
        {/* Back / Close button */}
        <button
          onClick={goBack}
          className="shrink-0 grid place-items-center w-10 h-10 rounded-full hover:bg-foreground/5 active:scale-90 transition-all"
          aria-label="بستن"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Poster avatar with category ring */}
        <button
          onClick={() => navigate({ view: "profile", id: post.user.id })}
          className="shrink-0"
          aria-label={post.user.name}
        >
          <div
            className="rounded-full"
            style={{ boxShadow: `0 0 0 2.5px ${ringColor}` }}
          >
            <UserAvatar
              name={post.user.name}
              avatarUrl={post.user.avatarUrl}
              gender={post.user.gender}
              verified={post.user.isVerifiedBadge}
              size="md"
            />
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate({ view: "profile", id: post.user.id })}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <span className="font-bold text-sm truncate">{post.user.name}</span>
            {post.user.isVerifiedBadge && (
              <BadgeCheck className="w-4 h-4 text-gold fill-gold/15 shrink-0" />
            )}
            {post.user.isTopTalent && (
              <span className="inline-flex items-center gap-0.5 h-4 px-1.5 rounded-full bg-gold/15 text-gold text-[9px] font-bold shrink-0">
                <Award className="w-2.5 h-2.5" />
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
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
              followingBusy && "opacity-70"
            )}
          >
            {followingBusy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : following ? (
              <>
                <UserCheck2 className="w-3.5 h-3.5" />
                دنبال‌شده
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                دنبال کردن
              </>
            )}
          </button>
        )}
      </motion.header>

      {/* ═══ Scrollable body ═══ */}
      <div className="flex-1 overflow-y-auto slim-scroll lg:overflow-visible">
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
              {post.media.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative overflow-hidden rounded-2xl border border-border/60 bg-card"
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
            className="flex items-center gap-3 py-2"
          >
            <button
              onClick={toggleLike}
              disabled={liking}
              className={cn(
                "flex items-center gap-2 h-11 px-4 rounded-full font-bold text-sm transition-all active:scale-95",
                liked
                  ? "bg-rose/10 text-rose"
                  : "bg-muted text-muted-foreground hover:bg-rose/5 hover:text-rose"
              )}
            >
              <motion.span
                key={liked ? "liked" : "unliked"}
                initial={{ scale: 1 }}
                whileTap={{ scale: 1.35 }}
                transition={{ type: "spring", stiffness: 500, damping: 12 }}
              >
                <Heart className={cn("w-5 h-5", liked && "fill-current")} />
              </motion.span>
              <span>{formatCount(likeCount)} لایک</span>
            </button>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span>{formatCount(totalComments)} کامنت</span>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* ═══ Comments section ═══ */}
          <section className="space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              کامنت‌ها
              <span className="text-xs text-muted-foreground font-normal">
                ({toFa(commentCount)})
              </span>
            </h3>

            {comments.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
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
      <div className="shrink-0 border-t border-border/60 bg-card/95 lg:bg-card lg:border lg:rounded-2xl lg:m-3 p-3 lg:shadow-sm">
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
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            aria-label="ارسال"
          >
            {sendingComment ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── UserCheck2 (not in our imports) — use BadgeCheck replacement ──
function UserCheck2({ className }: { className?: string }) {
  return <BadgeCheck className={className} />;
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
  const ringColor = "var(--border)"; // comments don't carry mainCategoryColor, use neutral

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
        <div
          className="rounded-full"
          style={{ boxShadow: `0 0 0 2px ${ringColor}` }}
        >
          <UserAvatar
            name={comment.user.name}
            avatarUrl={comment.user.avatarUrl}
            gender={comment.user.gender}
            size={isReply ? "xs" : "sm"}
          />
        </div>
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
                <Award className="w-2 h-2" />
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
              <ThumbsUp
                className={cn("w-3.5 h-3.5", comment.myReaction === "like" && "fill-current")}
              />
            </motion.span>
            {comment.likeCount > 0 && <span>{toFa(comment.likeCount)}</span>}
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
              <ThumbsDown
                className={cn("w-3.5 h-3.5", comment.myReaction === "dislike" && "fill-current")}
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={cancelReply}
                  className="shrink-0 grid place-items-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-foreground/5 active:scale-90 transition-all"
                  aria-label="انصراف"
                >
                  <X className="w-4 h-4" />
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
    // Remove reaction (and decrement if it was a like)
    return {
      ...c,
      myReaction: null,
      likeCount: type === "like" ? Math.max(0, c.likeCount - 1) : c.likeCount,
    };
  }
  // Switching to type
  return {
    ...c,
    myReaction: type,
    // If previously liked, decrement
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
      // We don't fully know server-side likeCount delta without re-fetching;
      // the optimistic update is close enough; just sync myReaction.
      return { ...c, myReaction: serverReaction };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: syncCommentReaction(c.replies, commentId, serverReaction) };
    }
    return c;
  });
}

function rollbackCommentReaction(
  _comments: Comment[],
  _commentId: string,
  _type: "like" | "dislike"
): Comment[] {
  // Retained for API symmetry with updateCommentReaction / syncCommentReaction.
  // toggleCommentReaction captures a snapshot before the optimistic update and
  // restores it on failure (cleaner than computing the inverse of
  // applyOptimisticReaction across nested reply trees).
  return _comments;
}

