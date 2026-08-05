"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { PostWithRelations } from "@/lib/types";
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
import { LandingView } from "@/components/views/landing-view";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import { Loader2, Clock, Flame, Sparkles, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MyCategory = {
  id: string;
  name: string;
  skills: { id: string; name: string }[];
};

export function FeedView() {
  const { user, loading: userLoading } = useUser();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ posts: PostWithRelations[] }>(
        `/api/posts?sort=${sort}`
      );
      setPosts(data.posts);
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [load, user]);

  // ── Guests see the landing page ──
  if (!user && !userLoading) return <LandingView />;

  if (userLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-10 rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold">خانه</h1>
          <p className="text-sm text-muted-foreground">
            جدیدترین استعدادها و پست‌ها
          </p>
        </div>
        <span className="grid place-items-center w-10 h-10 rounded-2xl bg-lime/20 text-2xl">
          🌿
        </span>
      </motion.div>

      {/* Create post box */}
      {user && <CreatePostBox onCreated={load} />}

      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        <SortButton
          active={sort === "recent"}
          onClick={() => setSort("recent")}
          icon={Clock}
          label="جدیدترین"
        />
        <SortButton
          active={sort === "popular"}
          onClick={() => setSort("popular")}
          icon={Flame}
          label="محبوب‌ترین"
        />
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 space-y-3 gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="h-2.5 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          kind="posts"
          title="هنوز پستی وجود ندارد"
          description="اولین پست را شما منتشر کنید و استعدادت رو نشون بده."
          action={
            <Button
              onClick={() => navigate({ view: "discover" })}
              className="rounded-2xl bg-lime text-forest font-bold"
            >
              کشف استعدادها
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function SortButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-bold transition-all active:scale-95",
        active
          ? "bg-lime text-forest shadow-sm"
          : "bg-card border border-border/60 text-muted-foreground hover:bg-muted"
      )}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

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
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-lime/20 text-forest shrink-0">
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
              className="rounded-xl bg-forest text-lime font-bold hover:bg-forest/90"
            >
              تکمیل پروفایل
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {/* Collapsed state */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full p-4 flex items-center gap-3 text-right hover:bg-muted/40 transition-colors"
        >
          <span className="text-sm text-muted-foreground flex-1">
            چه چیزی می‌خواهی به اشتراک بگذاری؟
          </span>
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-forest text-lime shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </span>
        </button>
      ) : (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-lime/20 text-forest">
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
              className="rounded-xl bg-lime text-forest font-bold hover:bg-lime/90 gap-1.5"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "انتشار پست"
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
}
