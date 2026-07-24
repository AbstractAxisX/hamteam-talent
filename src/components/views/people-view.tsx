"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import type { CategoryWithSkills } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount } from "@/lib/format";
import { PROVINCES, getProvinceName } from "@/lib/geo";
import {
  Users,
  Search,
  Sparkles,
  UserCheck,
  Clock,
  TrendingUp,
  X,
  MapPin,
  Tag,
  Layers,
  Filter,
  MapPinned,
} from "lucide-react";

const ALL = "__all__";

type PeopleListItem = {
  id: string;
  name: string;
  isVerifiedBadge: boolean;
  bioShort: string;
  avatarUrl: string | null;
  province: string | null;
  city: string | null;
  categories: { name: string }[];
  followersCount: number;
};

export function PeopleView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [skillId, setSkillId] = useState<string>(ALL);
  const [province, setProvince] = useState<string>(ALL);
  const [city, setCity] = useState<string>(ALL);
  const [sort, setSort] = useState<"recent" | "followers">("recent");

  const [users, setUsers] = useState<PeopleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load categories once
  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  // Debounce text search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 320);
    return () => clearTimeout(t);
  }, [q]);

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

  // Skill list: if category selected → only that category's skills;
  // otherwise all skills grouped.
  const skillGroups = useMemo<CategoryWithSkills[]>(() => {
    if (selectedCat) return [selectedCat];
    return cats;
  }, [cats, selectedCat]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (categoryId !== ALL) params.set("categoryId", categoryId);
      if (skillId !== ALL) params.set("skillId", skillId);
      if (province !== ALL) params.set("province", province);
      if (city !== ALL) params.set("city", city);
      params.set("sort", sort);
      const data = await api<{ users: PeopleListItem[] }>(
        `/api/people?${params.toString()}`
      );
      setUsers(data.users);
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, categoryId, skillId, province, city, sort]);

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
    (city !== ALL ? 1 : 0) +
    (debouncedQ ? 1 : 0);

  const clearAll = () => {
    setQ("");
    setDebouncedQ("");
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
          <Users className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">افراد</h1>
          <p className="text-sm text-muted-foreground">
            کشف افراد حرفه‌ای بر اساس مهارت
          </p>
        </div>
      </div>

      {/* Search + sort + filter toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="جستجوی نام یا تخصص..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-9"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="پاک کردن"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant={activeFilterCount > 0 ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFiltersOpen((o) => !o)}
          className="gap-1.5"
        >
          <Filter className="w-4 h-4" />
          فیلتر
          {activeFilterCount > 0 && (
            <span className="inline-grid place-items-center min-w-5 h-5 px-1 text-[10px] rounded-full bg-primary text-primary-foreground">
              {toFa(activeFilterCount)}
            </span>
          )}
        </Button>
      </div>

      {/* Sort toggle */}
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
          variant={sort === "followers" ? "default" : "outline"}
          size="sm"
          onClick={() => setSort("followers")}
          className="gap-1.5"
        >
          <TrendingUp className="w-4 h-4" /> بیشترین دنبال‌کننده
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

          {/* Skill (chained) */}
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

          {/* City (chained) */}
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
          {debouncedQ && (
            <FilterChip label={`«${debouncedQ}»`} onClear={() => setQ("")} />
          )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="فردی با این مشخصات پیدا نشد"
          description="فیلترها را تغییر دهید یا عبارت جستجو را اصلاح کنید."
          action={
            activeFilterCount > 0 ? (
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5">
                <X className="w-4 h-4" /> پاک کردن فیلترها
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <PeopleCard key={u.id} user={u} />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && users.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          {toFa(users.length)} نفر یافت شد
        </p>
      )}
    </div>
  );
}

function PeopleCard({ user }: { user: PeopleListItem }) {
  const provinceName = getProvinceName(user.province);
  const location = [provinceName, user.city].filter(Boolean).join("، ");

  return (
    <Card
      className="p-4 hover:shadow-md transition-all cursor-pointer hover:border-primary/30 group"
      onClick={() => navigate({ view: "profile", id: user.id })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate({ view: "profile", id: user.id });
        }
      }}
    >
      <div className="flex items-start gap-3">
        <UserAvatar
          name={user.name}
          avatarUrl={user.avatarUrl}
          verified={user.isVerifiedBadge}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
              {user.name}
            </h3>
          </div>
          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPinned className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </div>

      {user.bioShort && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-6 min-h-[3rem]">
          {user.bioShort}
        </p>
      )}

      {user.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.categories.slice(0, 3).map((c, i) => (
            <Badge
              key={`${c.name}-${i}`}
              variant={i === 0 ? "secondary" : "outline"}
              className="text-[10px] py-0 h-5"
            >
              {c.name}
            </Badge>
          ))}
          {user.categories.length > 3 && (
            <Badge variant="outline" className="text-[10px] py-0 h-5">
              +{toFa(user.categories.length - 3)}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserCheck className="w-3.5 h-3.5 text-primary" />
          <span>{formatCount(user.followersCount)} دنبال‌کننده</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-primary hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            navigate({ view: "profile", id: user.id });
          }}
        >
          مشاهده پروفایل
        </Button>
      </div>
    </Card>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
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
