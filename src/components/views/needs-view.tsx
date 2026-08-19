"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { NeedListItem, CategoryWithSkills } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatCount } from "@/lib/format";
import { PROVINCES, getProvinceName, getCitiesForProvince } from "@/lib/geo";
import { cn } from "@/lib/utils";

const ALL = "all";

export function NeedsView() {
  const { user } = useUser();
  const [needs, setNeeds] = useState<NeedListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [skillId, setSkillId] = useState<string>(ALL);
  const [province, setProvince] = useState<string>(ALL);
  const [city, setCity] = useState<string>(ALL);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<CategoryWithSkills[]>([]);

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  const activeFiltersCount = useMemo(
    () =>
      (categoryId !== ALL ? 1 : 0) +
      (skillId !== ALL ? 1 : 0) +
      (province !== ALL ? 1 : 0) +
      (city !== ALL ? 1 : 0),
    [categoryId, skillId, province, city]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId !== ALL) params.set("categoryId", categoryId);
      if (skillId !== ALL) params.set("skillId", skillId);
      if (province !== ALL) params.set("province", province);
      if (city !== ALL) params.set("city", city);
      params.set("sort", sort);
      const data = await api<{ needs: NeedListItem[] }>(`/api/needs?${params.toString()}`);
      setNeeds(data.needs);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [categoryId, skillId, province, city, sort]);

  useEffect(() => {
    const t = setTimeout(() => load(), 160);
    return () => clearTimeout(t);
  }, [load]);

  const currentCategory = categories.find((c) => c.id === categoryId);
  const currentProvince = PROVINCES.find((p) => p.id === province);

  function clearFilters() {
    setCategoryId(ALL);
    setSkillId(ALL);
    setProvince(ALL);
    setCity(ALL);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ═══ Hero header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="relative flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="grid place-items-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0">
              <Icon name="briefcase" className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none">نیازمندی‌ها</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-6">
                همکاری، تیم‌سازی و فرصت‌های شغلی
              </p>
            </div>
          </div>
          {user ? (
            <Button
              onClick={() => navigate({ view: "create-need" })}
              className="gap-1.5 rounded-2xl h-11 font-bold shadow-glow"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>ثبت نیازمندی</span>
            </Button>
          ) : (
            <Button
              onClick={() => navigate({ view: "auth" })}
              variant="outline"
              className="gap-1.5 rounded-2xl h-11 font-bold glass border-border/50"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>ثبت نیازمندی</span>
            </Button>
          )}
        </div>
      </motion.div>

      {/* ═══ Sort + Filter toggle ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        <SortButton active={sort === "recent"} onClick={() => setSort("recent")} iconName="clock" label="جدیدترین" />
        <SortButton active={sort === "popular"} onClick={() => setSort("popular")} iconName="heart" label="پرطرفدارترین" />
        <Button
          variant={activeFiltersCount > 0 ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "gap-1.5 rounded-xl font-bold h-9",
            activeFiltersCount > 0 && "bg-primary text-primary-foreground"
          )}
        >
          <Icon name="grid" className="w-4 h-4" />
          فیلترها
          {activeFiltersCount > 0 && (
            <span className="inline-grid place-items-center min-w-5 h-5 px-1 text-[10px] rounded-full bg-gold text-background">
              {toFa(activeFiltersCount)}
            </span>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9 text-muted-foreground hover:text-rose rounded-xl mr-auto">
            <Icon name="x" className="w-3.5 h-3.5" /> پاک کردن
          </Button>
        )}
      </div>

      {/* ═══ Filters card (collapsible) ═══ */}
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <Card className="glass p-5 border-border/50 shadow-soft rounded-3xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="دسته‌بندی"
                  options={categories.map((c) => ({ value: c.id, label: `${c.iconUrl || "✨"} ${c.name}` }))}
                  value={categoryId}
                  onChange={(v) => { setCategoryId(v); setSkillId(ALL); }}
                  allLabel="همه دسته‌ها"
                />
                <SearchableSelect
                  label="مهارت"
                  options={(currentCategory?.skills || []).map((s) => ({ value: s.id, label: s.name }))}
                  value={skillId}
                  onChange={setSkillId}
                  allLabel="همه مهارت‌ها"
                  placeholder={categoryId !== ALL ? "همه مهارت‌ها" : "ابتدا دسته را انتخاب کنید"}
                  disabled={categoryId === ALL}
                />
                <SearchableSelect
                  label="استان"
                  options={PROVINCES.map((p) => ({ value: p.id, label: p.name }))}
                  value={province}
                  onChange={(v) => { setProvince(v); setCity(ALL); }}
                  allLabel="همه استان‌ها"
                />
                <SearchableSelect
                  label="شهر"
                  options={(currentProvince?.cities || getCitiesForProvince(province)).map((c) => ({ value: c, label: c }))}
                  value={city}
                  onChange={setCity}
                  allLabel="همه شهرها"
                  placeholder={province !== ALL ? "همه شهرها" : "ابتدا استان را انتخاب کنید"}
                  disabled={province === ALL}
                />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Needs grid ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 space-y-3 border-border/50 rounded-3xl glass">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-12 w-full rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                <Skeleton className="w-9 h-9 rounded-full" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : needs.length === 0 ? (
        <EmptyState
          kind="jobs"
          title={activeFiltersCount > 0 ? "با فیلترهای فعلی نیازمندی‌ای یافت نشد" : "هنوز نیازمندی‌ای ثبت نشده"}
          description={
            activeFiltersCount > 0
              ? "فیلترها را تغییر دهید یا پاک کنید تا نتایج بیشتری ببینید."
              : "اولین نفر باشید و نیاز، همکاری یا فرصت خود را منتشر کنید."
          }
          action={
            activeFiltersCount > 0 ? (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5 rounded-xl">
                <Icon name="x" className="w-4 h-4" /> پاک کردن فیلترها
              </Button>
            ) : user ? (
              <Button size="sm" onClick={() => navigate({ view: "create-need" })} className="gap-1.5 rounded-xl">
                <Icon name="plus" className="w-4 h-4" /> ثبت نیازمندی جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {needs.map((need, i) => (
              <NeedCard key={need.id} need={need} index={i} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2 nums-fa">
            {toFa(needs.length)} نیازمندی یافت شد
          </p>
        </>
      )}
    </div>
  );
}

function SortButton({
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
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-1.5 rounded-xl font-bold h-9 shadow-sm",
        !active && "glass border-border/50"
      )}
    >
      <Icon name={iconName} className="w-4 h-4" /> {label}
    </Button>
  );
}

function NeedCard({
  need,
  index = 0,
}: {
  need: NeedListItem;
  index?: number;
}) {
  const locationLabel = need.city
    ? `${need.city}${need.province ? `، ${getProvinceName(need.province)}` : ""}`
    : need.province
    ? getProvinceName(need.province)
    : null;

  const isClosed = need.status === "closed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -2 }}
    >
      <Card
        onClick={() => navigate({ view: "need", id: need.id })}
        className="glass p-5 border-border/50 hover:border-primary/40 hover:shadow-lift transition-all duration-300 cursor-pointer group rounded-3xl h-full flex flex-col"
      >
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[15px] leading-7 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {need.title}
          </h3>
          {isClosed && (
            <Badge variant="secondary" className="shrink-0 text-[10px] h-5 rounded-md font-medium">
              بسته
            </Badge>
          )}
          {need.appliedByMe && !isClosed && (
            <Badge variant="outline" className="shrink-0 text-[10px] h-5 rounded-md border-success/40 text-success font-medium">
              درخواست داده‌ام
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-[13px] text-muted-foreground leading-7 line-clamp-2 whitespace-pre-wrap break-words mb-3">
          {need.description}
        </p>

        {/* Category + skills */}
        {(need.categoryName || need.skills.length > 0) && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {need.categoryName && (
              <Badge variant="secondary" className="text-[10px] py-0 h-5 rounded-md font-medium">
                {need.categoryName}
              </Badge>
            )}
            {need.skills.slice(0, 3).map((s) => (
              <Badge
                key={s.id}
                variant="outline"
                className="text-[10px] py-0 h-5 rounded-md border-primary/25 text-primary font-medium"
              >
                {s.name}
              </Badge>
            ))}
            {need.skills.length > 3 && (
              <span className="text-[10px] text-muted-foreground nums-fa">
                +{toFa(need.skills.length - 3)}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {locationLabel && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Icon name="mapPin" className="w-3.5 h-3.5" />
            {locationLabel}
          </div>
        )}

        {/* Footer: owner + meta */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border/40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate({ view: "profile", id: need.user.id });
            }}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
          >
            <UserAvatar
              name={need.user.name}
              avatarUrl={need.user.avatarUrl}
              verified={need.user.isVerifiedBadge}
              size="sm"
            />
            <span className="text-xs font-semibold truncate max-w-[100px]">
              {need.user.name}
            </span>
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="users" className="w-3.5 h-3.5" />
              {formatCount(need.applicationCount)}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="nums-fa">{timeAgoFa(need.createdAt)}</span>
            <Icon name="chevronLeft" className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
