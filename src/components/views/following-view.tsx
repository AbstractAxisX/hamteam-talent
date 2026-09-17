"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { BackButton } from "@/components/shared/back-button";
import type { PostWithRelations } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Sort = "recent" | "popular";

export function FollowingView() {
  const { user, loading: userLoading } = useUser();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>("recent");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ posts: PostWithRelations[] }>(
        `/api/feed/following?sort=${sort}`
      );
      setPosts(data.posts);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  if (!userLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton label="بازگشت" />
        <Header />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="glass p-8 text-center space-y-3 shadow-card rounded-3xl border-border/50">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
              <Icon name="lock" className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg">برای دیدن فید خود وارد شوید</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-6">
              پست‌های افرادی که دنبال می‌کنید پس از ورود در این صفحه نمایش داده می‌شود.
            </p>
            <Button
              onClick={() => navigate({ view: "auth" })}
              className="gap-1.5 rounded-2xl font-bold mx-auto bg-primary text-primary-foreground"
            >
              ورود / ثبت‌نام
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <BackButton label="بازگشت" />
      <Header />

      {/* ═══ Sort toggle ═══ */}
      <div className="flex items-center gap-2">
        <SortPill active={sort === "recent"} onClick={() => setSort("recent")} iconName="clock" label="جدیدترین" />
        <SortPill active={sort === "popular"} onClick={() => setSort("popular")} iconName="heart" label="محبوب‌ترین" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ view: "discover" })}
          className="gap-1.5 rounded-xl font-semibold text-muted-foreground hover:text-foreground mr-auto h-9"
        >
          <Icon name="compass" className="w-4 h-4" />
          پیدا کردن افراد
        </Button>
      </div>

      {/* ═══ Posts ═══ */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-3xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          kind="posts"
          title="هنوز کسی را دنبال نمی‌کنید"
          description="برای دیدن پست‌های افراد موردنظر، ابتدا آن‌ها را در کشف پیدا و دنبال کنید."
          action={
            <Button onClick={() => navigate({ view: "discover" })} className="gap-1.5 rounded-2xl font-bold">
              <Icon name="compass" className="w-4 h-4" />
              رفتن به کشف
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

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
    >
      <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <div className="relative flex items-center gap-4">
        <div className="grid place-items-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0">
          <Icon name="heart" className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight leading-none">دنبال‌شده‌ها</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-6">
            پست‌های افرادی که آن‌ها را دنبال می‌کنید
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SortPill({
  active,
  onClick,
  iconName,
  label,
}: {
  active: boolean;
  onClick: () => void;
  iconName: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-bold transition-all active:scale-95",
        active ? "bg-primary text-primary-foreground shadow-soft" : "glass border border-border/50 text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon name={iconName} className="w-4 h-4" /> {label}
    </button>
  );
}
