"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import type { CategoryWithSkills } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount } from "@/lib/format";
import { PROVINCES, getProvinceName } from "@/lib/geo";
import {
  Users,
  Search,
  Clock,
  TrendingUp,
  X,
  MapPin,
  Tag,
  Layers,
  Filter,
  MapPinned,
  UserCheck,
  Sparkles,
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
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3"
      >
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-primary/10 text-primary shrink-0 shadow-soft">
          <Users className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">کشف افراد</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            جستجوی افراد حرفه‌ای بر اساس مهارت، تخصص و موقعیت
          </p>
        </div>
      </motion.div>

      {/* Search input */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-2 flex-wrap"
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="جستجوی نام یا تخصص..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-10 h-11 rounded-xl text-[15px] shadow-soft border-border/60"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant={activeFilterCount > 0 ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFiltersOpen((o) => !o)}
          className="gap-1.5 rounded-xl font-semibold h-11 lg:hidden"
        >
          <Filter className="w-4 h-4" />
          فیلتر
          {activeFilterCount > 0 && (
            <span className="inline-grid place-items-center min-w-5 h-5 px-1 text-[10px] rounded-full bg-primary text-primary-foreground">
              {toFa(activeFilterCount)}
            </span>
          )}
        </Button>
      </motion.div>

      {/* Sort toggle */}
      <div className="flex items-center gap-1.5">
        <SortButton
          active={sort === "recent"}
          onClick={() => setSort("recent")}
          icon={Clock}
          label="جدیدترین"
        />
        <SortButton
          active={sort === "followers"}
          onClick={() => setSort("followers")}
          icon={TrendingUp}
          label="پرطرفدارترین"
        />
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

          {/* Skill (chained) */}
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

          {/* City (chained) */}
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
        </motion.div>
      )}

      {/* Results count */}
      {!loading && users.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>
            {toFa(users.length)} نفر یافت شد
          </span>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 space-y-3 rounded-2xl border-border/60 shadow-card text-center">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 mx-auto rounded" />
              <div className="flex justify-center gap-1.5 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          kind={activeFilterCount > 0 ? "search" : "people"}
          title={activeFilterCount > 0 ? "فردی با این مشخصات پیدا نشد" : "هنوز کاربری وجود ندارد"}
          description={
            activeFilterCount > 0
              ? "فیلترها را تغییر دهید یا عبارت جستجو را اصلاح کنید."
              : "به‌زودی کاربران حرفه‌ای در این صفحه ظاهر می‌شوند."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u, i) => (
            <PeopleCard key={u.id} user={u} index={i} />
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

function PeopleCard({
  user,
  index = 0,
}: {
  user: PeopleListItem;
  index?: number;
}) {
  const provinceName = getProvinceName(user.province);
  const location = [provinceName, user.city].filter(Boolean).join("، ");
  const visibleCategories = user.categories.slice(0, 3);
  const overflowCount = Math.max(0, user.categories.length - 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Card
        className="p-5 rounded-2xl border-border/60 shadow-card hover:shadow-lift hover:border-primary/30 transition-all duration-300 cursor-pointer group text-center"
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
        {/* Avatar */}
        <div className="flex justify-center">
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            verified={user.isVerifiedBadge}
            size="lg"
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Name */}
        <h3 className="mt-3 font-bold text-[15px] truncate group-hover:text-primary transition-colors">
          {user.name}
        </h3>

        {/* Location */}
        {location && (
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <MapPinned className="w-3 h-3 shrink-0 text-primary/70" />
            <span className="truncate max-w-[180px]">{location}</span>
          </div>
        )}

        {/* Bio */}
        {user.bioShort && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-6 min-h-[3rem]">
            {user.bioShort}
          </p>
        )}

        {/* Category badges */}
        {visibleCategories.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {visibleCategories.map((c, i) => (
              <Badge
                key={`${c.name}-${i}`}
                variant={i === 0 ? "secondary" : "outline"}
                className="text-[10px] py-0 h-5 rounded-md font-medium"
              >
                {c.name}
              </Badge>
            ))}
            {overflowCount > 0 && (
              <Badge variant="outline" className="text-[10px] py-0 h-5 rounded-md font-medium">
                +{toFa(overflowCount)}
              </Badge>
            )}
          </div>
        )}

        {/* Followers count */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <UserCheck className="w-3.5 h-3.5 text-primary" />
          <span className="nums-fa">{formatCount(user.followersCount)}</span>
          <span>دنبال‌کننده</span>
        </div>
      </Card>
    </motion.div>
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
