"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import type { PostWithRelations, CategoryWithSkills } from "@/lib/types";
import { PostCard } from "@/components/shared/post-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import { PROVINCES, getProvinceName } from "@/lib/geo";
import {
  Compass,
  Clock,
  Flame,
  X,
  MapPin,
  Tag,
  Layers,
  Filter,
  Sparkles,
} from "lucide-react";

const ALL = "__all__";

export function ExploreView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [skillId, setSkillId] = useState<string>(ALL);
  const [province, setProvince] = useState<string>(ALL);
  const [city, setCity] = useState<string>(ALL);
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load categories once
  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  // Cascading: when category changes, reset skill
  const onCategoryChange = (v: string) => {
    setCategoryId(v);
    setSkillId(ALL);
  };

  // Cascading: when province changes, reset city
  const onProvinceChange = (v: string) => {
    setProvince(v);
    setCity(ALL);
  };

  const selectedCat = useMemo(
    () => cats.find((c) => c.id === categoryId),
    [cats, categoryId]
  );

  const selectedProvince = useMemo(
    () => PROVINCES.find((p) => p.id === province),
    [province]
  );

  // Build the skill list: if category selected → that category's skills;
  // otherwise all skills grouped by category.
  const skillGroups = useMemo<CategoryWithSkills[]>(() => {
    if (selectedCat) return [selectedCat];
    return cats;
  }, [cats, selectedCat]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId !== ALL) params.set("categoryId", categoryId);
      if (skillId !== ALL) params.set("skillId", skillId);
      if (province !== ALL) params.set("province", province);
      if (city !== ALL) params.set("city", city);
      params.set("sort", sort);
      const data = await api<{ posts: PostWithRelations[] }>(
        `/api/explore?${params.toString()}`
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
  }, [categoryId, skillId, province, city, sort]);

  // Debounced fetch on filter/sort change
  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 180);
    return () => clearTimeout(t);
  }, [load]);

  const activeFilterCount =
    (categoryId !== ALL ? 1 : 0) +
    (skillId !== ALL ? 1 : 0) +
    (province !== ALL ? 1 : 0) +
    (city !== ALL ? 1 : 0);

  const clearAll = () => {
    setCategoryId(ALL);
    setSkillId(ALL);
    setProvince(ALL);
    setCity(ALL);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3"
      >
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-primary/10 text-primary shrink-0 shadow-soft">
          <Compass className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">کشف پست‌ها</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            جستجوی پست‌ها بر اساس مهارت، دسته‌بندی و موقعیت مکانی
          </p>
        </div>
      </motion.div>

      {/* Sort toggle + filter toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
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
        <Button
          variant={activeFilterCount > 0 ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFiltersOpen((o) => !o)}
          className="gap-1.5 rounded-xl font-semibold h-9 lg:hidden"
        >
          <Filter className="w-4 h-4" />
          فیلترها
          {activeFilterCount > 0 && (
            <span className="inline-grid place-items-center min-w-5 h-5 px-1 text-[10px] rounded-full bg-primary text-primary-foreground">
              {toFa(activeFilterCount)}
            </span>
          )}
        </Button>
      </div>

      {/* Filters card */}
      <Card className={`p-4 sm:p-5 space-y-3 rounded-2xl border-border/60 shadow-card ${filtersOpen ? "" : "hidden"} lg:!block`}>
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Filter className="w-4 h-4 text-primary" />
            فیلتر پیشرفته
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="gap-1.5 text-muted-foreground hover:text-destructive rounded-lg h-8"
            >
              <X className="w-3.5 h-3.5" /> پاک کردن همه ({toFa(activeFilterCount)})
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" /> دسته‌بندی
            </label>
            <Select value={categoryId} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full rounded-xl h-10">
                <SelectValue placeholder="همه دسته‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه دسته‌ها</SelectItem>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill (chained to category) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" /> مهارت
            </label>
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger className="w-full rounded-xl h-10">
                <SelectValue placeholder="همه مهارت‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه مهارت‌ها</SelectItem>
                {skillGroups.map((c) => (
                  <SelectGroup key={c.id}>
                    {!selectedCat && (
                      <SelectLabel className="text-primary/80">
                        {c.name}
                      </SelectLabel>
                    )}
                    {c.skills.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Province */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> استان
            </label>
            <Select value={province} onValueChange={onProvinceChange}>
              <SelectTrigger className="w-full rounded-xl h-10">
                <SelectValue placeholder="همه استان‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه استان‌ها</SelectItem>
                {PROVINCES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City (chained to province) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> شهر
            </label>
            <Select
              value={city}
              onValueChange={setCity}
              disabled={province === ALL}
            >
              <SelectTrigger className="w-full rounded-xl h-10">
                <SelectValue
                  placeholder={
                    province === ALL ? "ابتدا استان را انتخاب کنید" : "همه شهرها"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {province !== ALL && (
                  <SelectItem value={ALL}>همه شهرها</SelectItem>
                )}
                {selectedProvince?.cities.map((cityName) => (
                  <SelectItem key={cityName} value={cityName}>
                    {cityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile clear button */}
        {activeFilterCount > 0 && (
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="w-full gap-1.5 text-muted-foreground hover:text-destructive rounded-lg h-9"
            >
              <X className="w-4 h-4" /> پاک کردن همه فیلترها ({toFa(activeFilterCount)})
            </Button>
          </div>
        )}
      </Card>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-1.5"
        >
          {categoryId !== ALL && (
            <FilterChip
              label={cats.find((c) => c.id === categoryId)?.name ?? ""}
              onClear={() => {
                setCategoryId(ALL);
                setSkillId(ALL);
              }}
            />
          )}
          {skillId !== ALL && (
            <FilterChip
              label={
                cats
                  .flatMap((c) => c.skills)
                  .find((s) => s.id === skillId)?.name ?? ""
              }
              onClear={() => setSkillId(ALL)}
            />
          )}
          {province !== ALL && (
            <FilterChip
              label={getProvinceName(province) ?? ""}
              onClear={() => {
                setProvince(ALL);
                setCity(ALL);
              }}
            />
          )}
          {city !== ALL && (
            <FilterChip label={city} onClear={() => setCity(ALL)} />
          )}
        </motion.div>
      )}

      {/* Results count */}
      {!loading && posts.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>
            {toFa(posts.length)} پست یافت شد
          </span>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 space-y-3 rounded-2xl border-border/60 shadow-card">
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
          kind={activeFilterCount > 0 ? "search" : "posts"}
          title={activeFilterCount > 0 ? "پستی با این فیلترها پیدا نشد" : "هنوز پستی وجود ندارد"}
          description={
            activeFilterCount > 0
              ? "فیلترها را تغییر دهید یا پاک کنید تا پست‌های بیشتری ببینید."
              : "به‌زودی اولین پست‌ها در این صفحه ظاهر می‌شوند."
          }
          action={
            activeFilterCount > 0 ? (
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5 rounded-xl font-semibold">
                <X className="w-4 h-4" /> پاک کردن فیلترها
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="gap-1.5 rounded-xl font-semibold h-9"
    >
      <Icon className="w-4 h-4" /> {label}
    </Button>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      onClick={onClear}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
    >
      <span className="max-w-[120px] truncate">{label}</span>
      <X className="w-3 h-3 shrink-0" />
    </button>
  );
}
