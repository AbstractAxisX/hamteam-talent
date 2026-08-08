"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { PostWithRelations, TalentListItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LandingView } from "@/components/views/landing-view";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount } from "@/lib/format";
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  X,
  UserPlus,
  ArrowLeft,
  Users,
  Compass,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MyCategory = {
  id: string;
  name: string;
  skills: { id: string; name: string }[];
};

type HomeFeed = {
  followedPosts: PostWithRelations[];
  relevantTalents: TalentListItem[];
  sameSkillPeople: TalentListItem[];
  followingCount: number;
};

export function FeedView() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<HomeFeed>("/api/feed/home");
      setData(d);
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [load, user, reloadKey]);

  // ── Guests see the landing page ──
  if (!user && !userLoading) return <LandingView />;

  if (userLoading || loading) {
    return <FeedSkeleton />;
  }

  if (!data) {
    return (
      <EmptyState
        kind="generic"
        title="خطا در بارگذاری"
        description="لطفاً دوباره تلاش کنید."
        action={
          <Button
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-2xl"
          >
            تلاش مجدد
          </Button>
        }
      />
    );
  }

  const hasFollowedPosts = data.followedPosts.length > 0;
  const hasRelevant = data.relevantTalents.length > 0;
  const hasSameSkill = data.sameSkillPeople.length > 0;

  return (
    <div className="space-y-7 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold">خانه</h1>
          <p className="text-sm text-muted-foreground">
            {user?.name ? `سلام ${user.name} 👋` : "خوش آمدی به همتیم"}
          </p>
        </div>
        <span className="grid place-items-center w-10 h-10 rounded-2xl bg-primary/10 text-primary text-xl">
          <Sparkles className="w-5 h-5" />
        </span>
      </motion.div>

      {/* Create post box */}
      <CreatePostBox
        onCreated={() => setReloadKey((k) => k + 1)}
        key={`cp-${reloadKey}`}
      />

      {/* ══════ Section 1: Posts from followed users ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3"
      >
        <SectionHeader
          icon={Users}
          title="پست‌های دنبال‌شوندگان"
          count={data.followingCount}
          onAll={() => navigate({ view: "following" })}
        />

        {!hasFollowedPosts ? (
          <Card className="p-5 border-dashed border-2 border-border/60">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-primary/10 text-primary shrink-0">
                <Compass className="w-5 h-5" />
              </span>
              <div className="flex-1">
                <p className="font-bold text-sm">شما هنوز کسی را دنبال نمی‌کنید</p>
                <p className="text-xs text-muted-foreground leading-6 mt-1">
                  با دنبال کردن استعدادهای دیگر، پست‌های آن‌ها را اینجا ببینید.
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate({ view: "discover" })}
                  className="rounded-xl mt-3 h-9 font-bold"
                >
                  کشف استعدادها
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.followedPosts.slice(0, 5).map((p, i) => (
              <PostCard key={p.id} post={p} index={i} />
            ))}
            {data.followedPosts.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ view: "following" })}
                className="w-full rounded-xl text-primary font-bold h-10"
              >
                مشاهده‌ی همه‌ی پست‌ها
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </motion.section>

      {/* ══════ Section 2: Relevant talents — horizontal scroll ══════ */}
      {hasRelevant && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="space-y-3"
        >
          <SectionHeader
            icon={Sparkles}
            title="استعدادهای مرتبط"
            onAll={() => navigate({ view: "talents" })}
          />
          <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 w-max pb-1">
              {data.relevantTalents.map((t, i) => (
                <TalentMiniCard
                  key={t.id}
                  talent={t}
                  index={i}
                  onFollowed={() => setReloadKey((k) => k + 1)}
                />
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ══════ Section 3: Same-skill people — grid ══════ */}
      {hasSameSkill && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="space-y-3"
        >
          <SectionHeader
            icon={Users}
            title="افراد هم‌مهارت"
            onAll={() => navigate({ view: "talents" })}
          />
          <div className="grid grid-cols-2 gap-3">
            {data.sameSkillPeople.slice(0, 6).map((t, i) => (
              <TalentSquareCard
                key={t.id}
                talent={t}
                index={i}
                onFollowed={() => setReloadKey((k) => k + 1)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ══════ Empty prompt for new users ══════ */}
      {!hasFollowedPosts && !hasRelevant && !hasSameSkill && (
        <EmptyState
          kind="people"
          title="فعالیتی برای نمایش نیست"
          description="با تکمیل پروفایل و دنبال‌کردن استعدادهای دیگر، فید شما پر می‌شود."
          action={
            <Button
              onClick={() => navigate({ view: "discover" })}
              className="rounded-2xl"
            >
              کشف استعدادها
              <ArrowLeft className="w-4 h-4" />
            </Button>
          }
        />
      )}
    </div>
  );
}

// ── Section header ──
function SectionHeader({
  icon: Icon,
  title,
  count,
  onAll,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  onAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-extrabold flex items-center gap-2">
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </span>
        {title}
        {typeof count === "number" && (
          <span className="text-xs text-muted-foreground font-medium">
            ({toFa(count)})
          </span>
        )}
      </h2>
      {onAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAll}
          className="text-primary font-bold h-8"
        >
          همه
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

// ── Horizontal talent mini-card with follow button ──
function TalentMiniCard({
  talent,
  index = 0,
  onFollowed,
}: {
  talent: TalentListItem;
  index?: number;
  onFollowed: () => void;
}) {
  const [followed, setFollowed] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  async function follow() {
    setPending(true);
    setLoading(true);
    try {
      const res = await apiPost<{ status: string }>("/api/connections", {
        receiverId: talent.id,
      });
      if (res.status === "accepted") {
        setFollowed(true);
        toast({ title: "ارتباط برقرار شد ✅" });
      } else {
        setFollowed(true);
        toast({ title: "درخواست ارسال شد ✅" });
      }
      onFollowed();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="w-60 shrink-0 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
    >
      <button
        onClick={() => navigate({ view: "profile", id: talent.id })}
        className="flex items-start gap-3 w-full text-right"
      >
        <UserAvatar
          name={talent.name}
          avatarUrl={talent.avatarUrl}
          verified={talent.isVerifiedBadge}
          gender={talent.gender}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{talent.name}</h3>
          {talent.bioShort && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-5">
              {talent.bioShort}
            </p>
          )}
        </div>
      </button>
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          disabled={loading || followed}
          onClick={follow}
          className={cn(
            "flex-1 h-9 rounded-xl font-bold text-xs gap-1.5",
            followed || pending
              ? "bg-secondary text-secondary-foreground hover:bg-secondary"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : followed || pending ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              دنبال شد
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              دنبال‌کردن
            </>
          )}
        </Button>
        <span className="text-[11px] text-muted-foreground font-bold">
          {formatCount(talent.followersCount)} دنبال
        </span>
      </div>
    </motion.div>
  );
}

// ── Square card for same-skill grid ──
function TalentSquareCard({
  talent,
  index = 0,
  onFollowed,
}: {
  talent: TalentListItem;
  index?: number;
  onFollowed: () => void;
}) {
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function follow() {
    setLoading(true);
    try {
      const res = await apiPost<{ status: string }>("/api/connections", {
        receiverId: talent.id,
      });
      setFollowed(true);
      toast({
        title: res.status === "accepted" ? "ارتباط برقرار شد ✅" : "درخواست ارسال شد ✅",
      });
      onFollowed();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={() => navigate({ view: "profile", id: talent.id })}
      className="flex flex-col items-center text-center p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-95"
    >
      <div className="relative">
        <UserAvatar
          name={talent.name}
          avatarUrl={talent.avatarUrl}
          verified={talent.isVerifiedBadge}
          gender={talent.gender}
          size="xl"
        />
      </div>
      <h3 className="mt-2 font-bold text-sm line-clamp-1">{talent.name}</h3>
      {talent.bioShort && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-5 min-h-[2.5rem]">
          {talent.bioShort}
        </p>
      )}
      <div className="mt-2 flex items-center gap-3 w-full">
        <Button
          size="sm"
          disabled={loading || followed}
          onClick={(e) => {
            e.stopPropagation();
            follow();
          }}
          className={cn(
            "flex-1 h-8 rounded-lg font-bold text-[11px] gap-1",
            followed
              ? "bg-secondary text-secondary-foreground hover:bg-secondary"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : followed ? (
            "دنبال شد"
          ) : (
            "دنبال‌کردن"
          )}
        </Button>
        <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground font-bold">
          <Heart className="w-3 h-3 text-rose" />
          {formatCount(talent.followersCount)}
        </span>
      </div>
    </motion.button>
  );
}

// ── Loading skeleton ──
function FeedSkeleton() {
  return (
    <div className="space-y-7 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <Skeleton className="w-10 h-10 rounded-2xl" />
      </div>
      <Skeleton className="h-14 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-40 rounded" />
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-44 rounded" />
        <div className="flex gap-3 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-60 h-36 rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Create post box (collapsible) ──
function CreatePostBox({ onCreated }: { onCreated: () => void }) {
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [cats, setCats] = useState<MyCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api<{ categories: MyCategory[] }>("/api/me/skills")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  const currentCat = cats.find((c) => c.id === categoryId);

  async function submit() {
    if (!content.trim() || !categoryId || !skillId) {
      toast({
        title: "خطا",
        description: "متن، دسته‌بندی و مهارت را تکمیل کنید",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/posts", { content, categoryId, skillId });
      setContent("");
      setCategoryId("");
      setSkillId("");
      setOpen(false);
      toast({ title: "پست منتشر شد ✅" });
      onCreated();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (cats.length === 0) {
    return (
      <Card className="p-4 border-dashed border-2 border-border/60">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold mb-1">اول مهارت‌هات رو ثبت کن</p>
            <p className="text-xs text-muted-foreground leading-6 mb-3">
              برای پست‌گذاری ابتدا دسته‌بندی و مهارت‌های خود را در پروفایل ثبت کنید.
            </p>
            <Button
              size="sm"
              onClick={() => navigate({ view: "edit-profile" })}
              className="rounded-xl font-bold"
            >
              تکمیل پروفایل
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      {/* Collapsed state */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full p-4 flex items-center gap-3 text-right hover:bg-muted/40 transition-colors"
        >
          <span className="text-sm text-muted-foreground flex-1">
            چه چیزی می‌خواهی به اشتراک بگذاری؟
          </span>
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </span>
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="w-4 h-4" />
                </span>
                پست جدید
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="grid place-items-center w-8 h-8 rounded-lg hover:bg-muted"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Textarea
              autoFocus
              placeholder="ایده، پروژه یا استعدادت رو بنویس..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-0 focus-visible:ring-1 text-[15px] leading-7"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v);
                  setSkillId("");
                }}
              >
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={skillId}
                onValueChange={setSkillId}
                disabled={!categoryId}
              >
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="مهارت" />
                </SelectTrigger>
                <SelectContent>
                  {currentCat?.skills.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {toFa(content.length)}/{toFa(2000)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="text-muted-foreground gap-1.5 h-8"
                  title="به‌زودی"
                >
                  <ImageIcon className="w-4 h-4" /> تصویر
                </Button>
              </div>
              <Button
                size="sm"
                onClick={submit}
                disabled={submitting || !content.trim() || !skillId}
                className="rounded-xl font-bold gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "انتشار پست"
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </Card>
  );
}
