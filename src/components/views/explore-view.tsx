"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api-client";
import type { PostWithRelations, CategoryWithSkills } from "@/lib/types";
import { PostCard } from "@/components/views/feed-view";
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
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import { PROVINCES, getProvinceName } from "@/lib/geo";
import {
  Compass,
  Sparkles,
  Flame,
  Clock,
  X,
  MapPin,
  Tag,
  Layers,
  Filter,
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-11 h-11 rounded-xl bg-primary/10 text-primary shrink-0">
          <Compass className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">اکسپلور</h1>
          <p className="text-sm text-muted-foreground">
            کشف پست‌ها بر اساس مهارت و موقعیت
          </p>
        </div>
      </div>

      {/* Sort + filter toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Button
            variant={sort === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("recent")}
            className="gap-1.5"
          >
            <Clock className="w-4 h-4" /> جدیدترین
          </Button>
          <Button
            variant={sort === "popular" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("popular")}
            className="gap-1.5"
          >
            <Flame className="w-4 h-4" /> محبوب‌ترین
          </Button>
        </div>
        <Button
          variant={activeFilterCount > 0 ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFiltersOpen((o) => !o)}
          className="gap-1.5"
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
      <Card className={`p-4 space-y-3 ${filtersOpen ? "" : "hidden"} sm:!block`}>
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Filter className="w-4 h-4" />
            فیلتر پیشرفته
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" /> پاک کردن همه ({toFa(activeFilterCount)})
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> دسته‌بندی
            </label>
            <Select value={categoryId} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full">
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
              <Layers className="w-3.5 h-3.5" /> مهارت
            </label>
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger className="w-full">
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
              <MapPin className="w-3.5 h-3.5" /> استان
            </label>
            <Select value={province} onValueChange={onProvinceChange}>
              <SelectTrigger className="w-full">
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
              <MapPin className="w-3.5 h-3.5" /> شهر
            </label>
            <Select
              value={city}
              onValueChange={setCity}
              disabled={province === ALL}
            >
              <SelectTrigger className="w-full">
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
          <div className="sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="w-full gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" /> پاک کردن همه فیلترها ({toFa(activeFilterCount)})
            </Button>
          </div>
        )}
      </Card>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="پستی با این فیلترها پیدا نشد"
          description="فیلترها را تغییر دهید یا پاک کنید تا پست‌های بیشتری ببینید."
          action={
            activeFilterCount > 0 ? (
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5">
                <X className="w-4 h-4" /> پاک کردن فیلترها
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onLike={() => load()} />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && posts.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          {toFa(posts.length)} پست یافت شد
        </p>
      )}
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
    >
      {label}
      <X className="w-3 h-3" />
    </button>
  );
}


