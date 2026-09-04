"use client";

/* ═══════════════════════════════════════════════════════════
   TalentsView — استعدادها
   · فرم فیلتر دائمی حذف شد → دکمه شناور + مودال (filter-fab)
   · جستجوی متنی در خود صفحه · مرتب‌سازی داخل مودال
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/shared/icon";
import {
  FilterFab,
  countActiveFilters,
  type FilterFabValue,
  type FabSortOption,
} from "@/components/shared/filter-fab";
import type { CategoryWithSkills, TalentListItem } from "@/lib/types";
import { getProvinceName } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { toFa, formatCount } from "@/lib/format";

const TALENT_SORTS: FabSortOption[] = [
  { value: "followers", label: "محبوب‌ترین" },
  { value: "recent", label: "جدیدترین" },
];

const EMPTY: FilterFabValue = { categoryId: "", skillId: "", province: "", city: "" };

export function TalentsView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<FilterFabValue>(EMPTY);
  const [sort, setSort] = useState<"recent" | "followers">("followers");

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  const currentCat = useMemo(
    () => cats.find((c) => c.id === filters.categoryId),
    [cats, filters.categoryId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.skillId) params.set("skillId", filters.skillId);
      if (filters.province) params.set("province", filters.province);
      if (filters.city) params.set("city", filters.city);
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
  }, [filters, q, sort]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const activeFiltersCount = countActiveFilters(filters);
  const hasFilters = activeFiltersCount > 0 || Boolean(q.trim());

  function clearAll() {
    setFilters(EMPTY);
    setQ("");
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ═══ Hero header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="grid place-items-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0">
            <Icon name="sparkles" className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">استعدادها</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-6">
              {loading ? "در حال بارگذاری..." : `${toFa(talents.length)} استعداد یافت شد`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ جستجوی متنی ═══ */}
      <div className="relative">
        <Icon name="search" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی نام یا مهارت…"
          className="w-full h-14 pr-12 pl-4 rounded-2xl glass border border-border/50 text-[14.5px]
                     focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/50
                     transition-all shadow-soft"
        />
      </div>

      {/* ═══ چیپ‌های فیلتر فعال (جای فرم دائمی) ═══ */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.categoryId && currentCat && (
            <FilterChip label={currentCat.name} onRemove={() => setFilters((f) => ({ ...f, categoryId: "", skillId: "" }))} />
          )}
          {filters.skillId && currentCat && (
            <FilterChip
              label={currentCat.skills.find((s) => s.id === filters.skillId)?.name || "مهارت"}
              onRemove={() => setFilters((f) => ({ ...f, skillId: "" }))}
            />
          )}
          {filters.province && (
            <FilterChip
              label={getProvinceName(filters.province) || "استان"}
              onRemove={() => setFilters((f) => ({ ...f, province: "", city: "" }))}
            />
          )}
          {filters.city && <FilterChip label={filters.city} onRemove={() => setFilters((f) => ({ ...f, city: "" }))} />}
          {q.trim() && <FilterChip label={`«${q.trim()}»`} onRemove={() => setQ("")} />}
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-xs font-bold text-muted-foreground hover:text-rose transition-colors outline-none"
          >
            <Icon name="x" size={13} />
            پاک کردن همه
          </button>
        </div>
      )}

      {/* ═══ Results grid ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 rounded-3xl glass border-border/50 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </Card>
          ))}
        </div>
      ) : talents.length === 0 ? (
        <EmptyState
          kind="people"
          title="استعدادی یافت نشد"
          description="فیلترها را تغییر بده یا عبارت دیگری جستجو کن."
          action={hasFilters ? (
            <button onClick={clearAll} className="h-11 px-5 rounded-2xl grad-brand text-white font-extrabold text-sm shadow-grad outline-none">
              پاک کردن فیلترها
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {talents.map((t, i) => (
            <TalentCardLarge key={t.id} talent={t} index={i} />
          ))}
        </div>
      )}

      {/* ═══ دکمه شناور فیلتر ═══ */}
      <FilterFab
        cats={cats}
        value={filters}
        sort={sort}
        sortOptions={TALENT_SORTS}
        onApply={(v, s) => {
          setFilters(v);
          setSort(s === "recent" ? "recent" : "followers");
        }}
        title="فیلترهای استعدادها"
      />
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className="h-9 pl-1 pr-3.5 rounded-full glass border border-primary/30 text-primary gap-1.5 text-xs font-bold"
    >
      <span className="max-w-[120px] truncate">{label}</span>
      <button
        onClick={onRemove}
        className="grid place-items-center w-6 h-6 rounded-full hover:bg-primary/15 transition-colors"
        aria-label="حذف"
      >
        <Icon name="x" className="w-3 h-3" />
      </button>
    </Badge>
  );
}

// ── Exported TalentCardLarge — also used by CategoryView ──
export function TalentCardLarge({
  talent,
  index = 0,
}: {
  talent: TalentListItem;
  index?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -2 }}
      onClick={() => navigate({ view: "profile", id: talent.id })}
      className={cn(
        "flex flex-col items-start gap-3 p-5 rounded-3xl glass border border-border/50",
        "hover:border-primary/40 hover:shadow-lift transition-all active:scale-95 text-right w-full"
      )}
    >
      <div className="flex items-center gap-3 w-full">
        <UserAvatar
          name={talent.name}
          avatarUrl={talent.avatarUrl}
          verified={talent.isVerifiedBadge}
          gender={talent.gender}
          size="lg"
          ringColor="oklch(0.6 0.15 160 / 0.3)"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-base truncate">{talent.name}</h3>
            {talent.isVerifiedBadge && <Icon name="badgeCheck" className="w-4 h-4 text-gold shrink-0" />}
          </div>
          {talent.city && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Icon name="mapPin" className="w-3 h-3" />
              <span className="truncate">{talent.city}</span>
            </div>
          )}
        </div>
      </div>
      {talent.bioShort && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-6 min-h-[3rem]">
          {talent.bioShort}
        </p>
      )}
      {talent.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {talent.categories.slice(0, 3).map((c) => (
            <Badge
              key={c.id}
              variant="secondary"
              className="bg-primary/10 text-primary text-[10px] py-0.5 h-6 rounded-lg font-medium gap-1"
            >
              <span>{c.iconUrl || "✨"}</span>
              <span>{c.name}</span>
            </Badge>
          ))}
          {talent.categories.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">+{toFa(talent.categories.length - 3)}</span>
          )}
        </div>
      )}
      <div className="w-full pt-1 mt-auto flex items-center justify-between border-t border-border/40">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
          <Icon name="users" className="w-3 h-3" />
          {formatCount(talent.followersCount)} دنبال‌کننده
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold">
          <Icon name="arrowLeft" className="w-3 h-3" />
          مشاهده
        </span>
      </div>
    </motion.button>
  );
}
