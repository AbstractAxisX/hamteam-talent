"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import type { PostWithRelations } from "@/lib/types";
import { UserCheck, Clock, Flame, ArrowLeft, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";

export function FollowingView() {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ posts: PostWithRelations[] }>(
        `/api/feed/following?sort=${sort}`
      );
      setPosts(data.posts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    const t = setTimeout(load, 150);
    return () => clearTimeout(t);
  }, [load, reloadKey]);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              <UserCheck className="w-5 h-5" />
            </span>
            دنبال‌شده‌ها
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            پست‌های منتشرشده توسط استعدادهایی که دنبال می‌کنی
          </p>
        </div>
      </motion.div>

      {/* Sort toggle */}
      {!loading && posts.length > 0 && (
        <div className="flex items-center gap-2">
          <SortPill
            active={sort === "recent"}
            onClick={() => setSort("recent")}
            icon={Clock}
            label="جدیدترین"
          />
          <SortPill
            active={sort === "popular"}
            onClick={() => setSort("popular")}
            icon={Flame}
            label="محبوب‌ترین"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          kind="posts"
          title="هنوز پستی برای نمایش نیست"
          description="پست‌های منتشرشده توسط استعدادهایی که دنبال می‌کنی اینجا نمایش داده می‌شوند. برای شروع، استعدادهای جدید را کشف کن."
          action={
            <Button
              onClick={() => navigate({ view: "discover" })}
              className="rounded-2xl font-bold"
            >
              <Compass className="w-4 h-4" />
              کشف استعدادها
            </Button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="text-xs text-muted-foreground font-medium">
            {toFa(posts.length)} پست
          </div>
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </motion.div>
      )}

      {/* Footer CTA */}
      {!loading && posts.length > 0 && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ view: "discover" })}
            className="w-full rounded-xl text-primary font-bold h-10"
          >
            کشف استعدادهای بیشتر
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function SortPill({
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
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-card border border-border text-muted-foreground hover:bg-muted"
      )}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
