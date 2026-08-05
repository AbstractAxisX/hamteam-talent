"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import type { CategoryWithSkills, TalentListItem } from "@/lib/types";
import {
  Search,
  Sparkles,
  MapPin,
  Users,
  Clock,
  Flame,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa, formatCount } from "@/lib/format";

export function TalentsView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [sort, setSort] = useState<"recent" | "followers">("followers");

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
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
      if (q.trim()) params.set("q", q.trim());
      params.set("sort", sort);
      const data = await api<{ talents: TalentListItem[] }>(
        `/api/talents?${params.toString()}`
      );
      setTalents(data.talents);
    } catch {
      setTalents([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, skillId, q, sort]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const hasFilters = Boolean(categoryId || skillId || q);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold">استعدادها</h1>
          <p className="text-sm text-muted-foreground">
            {toFa(talents.length)} استعداد فعال
          </p>
        </div>
        <span className="grid place-items-center w-10 h-10 rounded-2xl bg-lime/20">
          <Sparkles className="w-5 h-5 text-forest" />
        </span>
      </motion.div>

      {/* Filters card */}
      <div className="space-y-3 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی نام یا بیو..."
            className="w-full h-11 pr-10 pl-4 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-lime focus:border-lime transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              setSkillId("");
            }}
          >
            <SelectTrigger className="rounded-xl h-11">
              <SelectValue placeholder="دسته‌بندی" />
            </SelectTrigger>
            <SelectContent>
              {cats.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.iconUrl || "✨"} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={skillId} onValueChange={setSkillId} disabled={!categoryId}>
            <SelectTrigger className="rounded-xl h-11">
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

        {/* Sort + Clear */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            <SortPill
              active={sort === "followers"}
              onClick={() => setSort("followers")}
              icon={Users}
              label="محبوب‌ترین"
            />
            <SortPill
              active={sort === "recent"}
              onClick={() => setSort("recent")}
              icon={Clock}
              label="جدیدترین"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryId("");
                setSkillId("");
                setQ("");
              }}
              className="text-muted-foreground h-8"
            >
              <X className="w-3.5 h-3.5" /> پاک کردن
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : talents.length === 0 ? (
        <EmptyState
          kind="people"
          title="استعدادی یافت نشد"
          description="فیلترها رو تغییر بده یا عبارت دیگه‌ای جستجو کن."
          action={
            hasFilters ? (
              <Button
                onClick={() => {
                  setCategoryId("");
                  setSkillId("");
                  setQ("");
                }}
                className="rounded-2xl bg-lime text-forest font-bold"
              >
                پاک کردن فیلترها
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {talents.map((t, i) => (
            <TalentCardLarge key={t.id} talent={t} index={i} />
          ))}
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
        "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-all active:scale-95",
        active
          ? "bg-lime text-forest shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      )}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

export function TalentCardLarge({
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
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={() => navigate({ view: "profile", id: talent.id })}
      className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/60 hover:border-lime hover:shadow-md transition-all active:scale-95 text-right w-full"
    >
      <UserAvatar
        name={talent.name}
        avatarUrl={talent.avatarUrl}
        verified={talent.isVerifiedBadge}
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm truncate">{talent.name}</h3>
        {talent.bioShort && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-5">
            {talent.bioShort}
          </p>
        )}
        {(talent.city || talent.province) && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{talent.city || talent.province}</span>
          </div>
        )}
        {talent.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {talent.categories.slice(0, 2).map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-lime/15 text-forest text-[10px] font-bold"
              >
                <span>{c.iconUrl || "✨"}</span>
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose">
          <Flame className="w-3 h-3" />
          <span>{formatCount(talent.followersCount)} دنبال‌کننده</span>
        </div>
      </div>
    </motion.button>
  );
}
