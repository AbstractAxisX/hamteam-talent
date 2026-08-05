"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import type {
  CategoryWithSkills,
  TalentListItem,
  PostWithRelations,
} from "@/lib/types";
import {
  Search,
  Sparkles,
  Flame,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/format";

export function DiscoverView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [talentsRes, postsRes] = await Promise.all([
        api<{ talents: TalentListItem[] }>(
          `/api/talents?sort=followers&q=${encodeURIComponent(q.trim())}`
        ),
        api<{ posts: PostWithRelations[] }>(`/api/posts?sort=${sort}`),
      ]);
      setTalents(talentsRes.talents);
      setPosts(postsRes.posts);
    } catch {
      setTalents([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [q, sort]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold">کشف استعدادها</h1>
          <span className="text-2xl">✨</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی استعداد (نام یا مهارت)..."
            className="w-full h-12 pr-10 pl-4 rounded-2xl bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-lime focus:border-lime transition-all shadow-sm"
          />
        </div>
      </motion.div>

      {/* Category chips row */}
      {cats.length > 0 && (
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 w-max">
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate({ view: "category", id: c.id })}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-card border border-border/60 hover:border-lime hover:bg-lime/10 transition-all active:scale-95 shrink-0"
              >
                <span className="text-base">{c.iconUrl || "✨"}</span>
                <span className="text-sm font-bold whitespace-nowrap">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort toggle */}
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

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Top talents section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-lime" />
                استعدادهای برتر
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ view: "talents" })}
                className="text-forest font-bold"
              >
                همه
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
            </div>

            {talents.length === 0 ? (
              <EmptyState
                kind="search"
                title="استعدادی پیدا نشد"
                description="عبارت دیگه‌ای رو امتحان کن."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {talents.slice(0, 6).map((t, i) => (
                  <TalentCardMini key={t.id} talent={t} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* Recent posts section */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose" />
              پست‌های جدید
            </h2>
            {posts.length === 0 ? (
              <EmptyState
                kind="posts"
                title="پستی یافت نشد"
                description="اولین پست را شما منتشر کنید."
              />
            ) : (
              <div className="space-y-4">
                {posts.slice(0, 10).map((p, i) => (
                  <PostCard key={p.id} post={p} index={i} />
                ))}
              </div>
            )}
          </section>
        </>
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
          ? "bg-lime text-forest shadow-sm"
          : "bg-card border border-border/60 text-muted-foreground hover:bg-muted"
      )}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function TalentCardMini({
  talent,
  index = 0,
}: {
  talent: TalentListItem;
  index?: number;
}) {
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
      className="flex flex-col items-center text-center p-4 rounded-2xl bg-card border border-border/60 hover:border-lime hover:shadow-md transition-all active:scale-95"
    >
      <UserAvatar
        name={talent.name}
        avatarUrl={talent.avatarUrl}
        verified={talent.isVerifiedBadge}
        size="lg"
      />
      <h3 className="mt-2 font-bold text-sm line-clamp-1">{talent.name}</h3>
      {talent.bioShort && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-5 min-h-[2.5rem]">
          {talent.bioShort}
        </p>
      )}
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground font-bold">
        <span className="text-rose">♥</span>
        <span>{formatCount(talent.followersCount)} دنبال‌کننده</span>
      </div>
    </motion.button>
  );
}
