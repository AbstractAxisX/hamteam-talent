"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Icon } from "@/components/shared/icon";
import type { CategoryWithSkills, TalentListItem } from "@/lib/types";
import { PROVINCES, getCitiesForProvince, getProvinceName } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { toFa, formatCount } from "@/lib/format";

export function TalentsView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
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
      if (province) params.set("province", province);
      if (city) params.set("city", city);
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
  }, [categoryId, skillId, q, sort, province, city]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const hasFilters = Boolean(categoryId || skillId || q || province || city);

  function clearAll() {
    setCategoryId("");
    setSkillId("");
    setQ("");
    setProvince("");
    setCity("");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ═══ Hero header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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
          <div className="hidden sm:flex items-center gap-2">
            <SortPill active={sort === "followers"} onClick={() => setSort("followers")} iconName="users" label="محبوب‌ترین" />
            <SortPill active={sort === "recent"} onClick={() => setSort("recent")} iconName="clock" label="جدیدترین" />
          </div>
        </div>
      </motion.div>

      {/* ═══ Mobile sort ═══ */}
      <div className="sm:hidden flex items-center gap-2">
        <SortPill active={sort === "followers"} onClick={() => setSort("followers")} iconName="users" label="محبوب" />
        <SortPill active={sort === "recent"} onClick={() => setSort("recent")} iconName="clock" label="جدید" />
      </div>

      {/* ═══ Filters card — 4 lines, full-width stacked ═══ */}
      <Card className="glass p-5 rounded-3xl border-border/50 shadow-soft space-y-4">
        {/* Line 1: Category */}
        <SearchableSelect
          label="دسته‌بندی"
          options={cats.map((c) => ({ value: c.id, label: `${c.iconUrl || "✨"} ${c.name}` }))}
          value={categoryId}
          onChange={(v) => {
            setCategoryId(v === "all" ? "" : v);
            setSkillId("");
          }}
          allLabel="همه"
          placeholder="انتخاب دسته‌بندی"
        />

        {/* Line 2: Skill */}
        <SearchableSelect
          label="مهارت"
          options={(currentCat?.skills || []).map((s) => ({ value: s.id, label: s.name }))}
          value={skillId}
          onChange={(v) => setSkillId(v === "all" ? "" : v)}
          allLabel={categoryId ? "همه" : undefined}
          placeholder={categoryId ? "انتخاب مهارت" : "ابتدا دسته‌بندی را انتخاب کنید"}
          disabled={!categoryId}
        />

        {/* Line 3: Text search */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">
            جستجوی نام یا مهارت
          </label>
          <div className="relative">
            <Icon name="search" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="مثلاً: علی، طراحی، برنامه‌نویسی..."
              className="w-full h-11 pr-10 pl-4 rounded-xl bg-background/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Line 4: Province + City grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchableSelect
            label="استان"
            options={PROVINCES.map((p) => ({ value: p.id, label: p.name }))}
            value={province}
            onChange={(v) => {
              setProvince(v === "all" ? "" : v);
              setCity("");
            }}
            allLabel="همه"
            placeholder="انتخاب استان"
          />
          <SearchableSelect
            label="شهر"
            options={getCitiesForProvince(province).map((c) => ({ value: c, label: c }))}
            value={city}
            onChange={(v) => setCity(v === "all" ? "" : v)}
            allLabel="همه"
            placeholder="انتخاب شهر"
            disabled={!province}
          />
        </div>

        {/* Active filters + clear */}
        {hasFilters && (
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {categoryId && currentCat && (
                <FilterChip label={currentCat.name} onRemove={() => { setCategoryId(""); setSkillId(""); }} />
              )}
              {skillId && currentCat && (
                <FilterChip label={currentCat.skills.find((s) => s.id === skillId)?.name || "مهارت"} onRemove={() => setSkillId("")} />
              )}
              {province && (
                <FilterChip label={getProvinceName(province) || "استان"} onRemove={() => { setProvince(""); setCity(""); }} />
              )}
              {city && <FilterChip label={city} onRemove={() => setCity("")} />}
              {q.trim() && <FilterChip label={`«${q.trim()}»`} onRemove={() => setQ("")} />}
            </div>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-rose h-8">
              <Icon name="x" className="w-3.5 h-3.5" /> پاک کردن همه
            </Button>
          </div>
        )}
      </Card>

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
            <Button onClick={clearAll} className="rounded-2xl font-bold">پاک کردن فیلترها</Button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      className="h-8 pl-1 pr-3 rounded-full glass border border-primary/30 text-primary gap-1.5 text-xs font-bold"
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
      className="flex flex-col items-start gap-3 p-5 rounded-3xl glass border border-border/50 hover:border-primary/40 hover:shadow-lift transition-all active:scale-95 text-right w-full"
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
