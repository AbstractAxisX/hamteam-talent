"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SearchableSelect } from "@/components/shared/searchable-select";
import type {
  CategoryWithSkills,
  TalentListItem,
  PostWithRelations,
} from "@/lib/types";
import { PROVINCES, getCitiesForProvince, getProvinceName } from "@/lib/geo";
import {
  Search,
  Compass,
  Sparkles,
  Flame,
  Clock,
  ArrowLeft,
  Users,
  SlidersHorizontal,
  X,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa, formatCount } from "@/lib/format";

type Tab = "posts" | "users";
type PostSort = "recent" | "popular";
type UserSort = "recent" | "followers";

export function DiscoverView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);

  // Filters — "" means "all" (no filter)
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [postSort, setPostSort] = useState<PostSort>("recent");
  const [userSort, setUserSort] = useState<UserSort>("followers");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  const currentCat = useMemo(
    () => cats.find((c) => c.id === categoryId),
    [cats, categoryId]
  );

  const activeFiltersCount = [q, categoryId, skillId, province, city].filter(
    Boolean
  ).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "posts") {
        // /api/posts only supports sort+userId — fetch all, filter client-side by category/skill
        const data = await api<{ posts: PostWithRelations[] }>(
          `/api/posts?sort=${postSort}`
        );
        let filtered = data.posts;
        if (categoryId)
          filtered = filtered.filter((p) => p.categoryId === categoryId);
        if (skillId) filtered = filtered.filter((p) => p.skillId === skillId);
        if (q.trim()) {
          const needle = q.trim();
          filtered = filtered.filter(
            (p) => p.content.includes(needle) || p.user.name.includes(needle)
          );
        }
        setPosts(filtered);
      } else {
        const params = new URLSearchParams();
        if (categoryId) params.set("categoryId", categoryId);
        if (skillId) params.set("skillId", skillId);
        if (province) params.set("province", province);
        if (city) params.set("city", city);
        if (q.trim()) params.set("q", q.trim());
        params.set("sort", userSort);
        const data = await api<{ talents: TalentListItem[] }>(
          `/api/talents?${params.toString()}`
        );
        setTalents(data.talents);
      }
    } catch {
      setPosts([]);
      setTalents([]);
    } finally {
      setLoading(false);
    }
  }, [tab, categoryId, skillId, province, city, q, postSort, userSort]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  function clearAll() {
    setQ("");
    setCategoryId("");
    setSkillId("");
    setProvince("");
    setCity("");
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              <Compass className="w-5 h-5" />
            </span>
            کشف
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            استعدادها و پست‌ها رو کشف کن
          </p>
        </div>
      </motion.div>

      {/* Search bar + filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              tab === "posts"
                ? "جستجوی پست یا نویسنده..."
                : "جستجوی نام یا مهارت..."
            }
            className="w-full h-11 pr-10 pl-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all shadow-sm"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters((s) => !s)}
          className={cn(
            "h-11 w-11 rounded-xl border-border shrink-0 relative",
            showFilters && "bg-primary text-primary-foreground border-primary"
          )}
          aria-label="فیلترها"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-bold">
              {toFa(activeFiltersCount)}
            </span>
          )}
        </Button>
      </div>

      {/* Category quick-chips row */}
      {cats.length > 0 && (
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setCategoryId("")}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold transition-all active:scale-95 shrink-0",
                !categoryId
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              )}
            >
              همه
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCategoryId(categoryId === c.id ? "" : c.id);
                  setSkillId("");
                }}
                className={cn(
                  "inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-bold transition-all active:scale-95 shrink-0",
                  categoryId === c.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="text-sm">{c.iconUrl || "✨"}</span>
                <span className="whitespace-nowrap">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Filters card — 4 full-width stacked rows with labels ═══ */}
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                فیلترهای دقیق
              </h3>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-muted-foreground h-8 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  پاک کردن همه
                </Button>
              )}
            </div>

            {/* Row 1: Category — full width */}
            <SearchableSelect
              label="دسته‌بندی"
              options={cats.map((c) => ({
                value: c.id,
                label: `${c.iconUrl || "✨"} ${c.name}`,
              }))}
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v === "all" ? "" : v);
                setSkillId("");
              }}
              allLabel="همه"
              placeholder="انتخاب دسته‌بندی"
            />

            {/* Row 2: Skill — full width (chained to category) */}
            <SearchableSelect
              label="مهارت"
              options={(currentCat?.skills || []).map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              value={skillId}
              onChange={(v) => setSkillId(v === "all" ? "" : v)}
              allLabel={categoryId ? "همه" : undefined}
              placeholder={
                categoryId ? "انتخاب مهارت" : "ابتدا دسته‌بندی را انتخاب کنید"
              }
              disabled={!categoryId}
            />

            {/* Row 3: Province — full width */}
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

            {/* Row 4: City — full width (chained to province) */}
            <SearchableSelect
              label="شهر"
              options={getCitiesForProvince(province).map((c) => ({
                value: c,
                label: c,
              }))}
              value={city}
              onChange={(v) => setCity(v === "all" ? "" : v)}
              allLabel="همه"
              placeholder="انتخاب شهر"
              disabled={!province}
            />

            {tab === "users" && (
              <p className="text-[11px] text-muted-foreground leading-5">
                فیلتر استان/شهر فقط برای تب کاربران فعال است.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {categoryId && currentCat && (
            <FilterChip
              label={currentCat.name}
              onRemove={() => {
                setCategoryId("");
                setSkillId("");
              }}
            />
          )}
          {skillId && currentCat && (
            <FilterChip
              label={
                currentCat.skills.find((s) => s.id === skillId)?.name || "مهارت"
              }
              onRemove={() => setSkillId("")}
            />
          )}
          {province && (
            <FilterChip
              label={getProvinceName(province) || "استان"}
              icon={MapPin}
              onRemove={() => {
                setProvince("");
                setCity("");
              }}
            />
          )}
          {city && (
            <FilterChip
              label={city}
              icon={MapPin}
              onRemove={() => setCity("")}
            />
          )}
          {q.trim() && (
            <FilterChip label={`«${q.trim()}»`} onRemove={() => setQ("")} />
          )}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-muted border border-border">
        <TabButton
          active={tab === "posts"}
          onClick={() => setTab("posts")}
          icon={Sparkles}
          label="پست‌ها"
          count={!loading ? posts.length : undefined}
        />
        <TabButton
          active={tab === "users"}
          onClick={() => setTab("users")}
          icon={Users}
          label="کاربران"
          count={!loading ? talents.length : undefined}
        />
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        {tab === "posts" ? (
          <>
            <SortPill
              active={postSort === "recent"}
              onClick={() => setPostSort("recent")}
              icon={Clock}
              label="جدیدترین"
            />
            <SortPill
              active={postSort === "popular"}
              onClick={() => setPostSort("popular")}
              icon={Flame}
              label="محبوب‌ترین"
            />
          </>
        ) : (
          <>
            <SortPill
              active={userSort === "followers"}
              onClick={() => setUserSort("followers")}
              icon={Users}
              label="محبوب‌ترین"
            />
            <SortPill
              active={userSort === "recent"}
              onClick={() => setUserSort("recent")}
              icon={Clock}
              label="جدیدترین"
            />
          </>
        )}
      </div>

      {/* Results */}
      {loading ? (
        tab === "posts" ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        )
      ) : tab === "posts" ? (
        posts.length === 0 ? (
          <EmptyState
            kind="posts"
            title="پستی یافت نشد"
            description="فیلترها رو تغییر بده یا بعداً سر بزن."
            action={
              activeFiltersCount > 0 ? (
                <Button onClick={clearAll} className="rounded-2xl font-bold">
                  پاک کردن فیلترها
                </Button>
              ) : undefined
            }
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {posts.map((p, i) => (
              <PostCard key={p.id} post={p} index={i} />
            ))}
          </motion.div>
        )
      ) : talents.length === 0 ? (
        <EmptyState
          kind="people"
          title="استعدادی یافت نشد"
          description="فیلترها رو تغییر بده یا عبارت دیگه‌ای جستجو کن."
          action={
            activeFiltersCount > 0 ? (
              <Button onClick={clearAll} className="rounded-2xl font-bold">
                پاک کردن فیلترها
              </Button>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {talents.map((t, i) => (
            <TalentMiniCard key={t.id} talent={t} index={i} />
          ))}
        </motion.div>
      )}

      {/* "همه" link to talents for users tab */}
      {tab === "users" && !loading && talents.length > 0 && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ view: "talents" })}
            className="w-full rounded-xl text-primary font-bold h-10"
          >
            مشاهده‌ی همه‌ی استعدادها
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-bold transition-all active:scale-95",
        active
          ? "bg-card text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "text-[10px] font-bold rounded-full px-1.5 py-0.5",
            active ? "bg-primary/10 text-primary" : "bg-muted-foreground/15"
          )}
        >
          {toFa(count)}
        </span>
      )}
    </button>
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

function FilterChip({
  label,
  icon: Icon,
  onRemove,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className="h-7 pl-1 pr-2.5 rounded-full bg-secondary text-secondary-foreground gap-1.5 text-xs font-bold"
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span className="max-w-[120px] truncate">{label}</span>
      <button
        onClick={onRemove}
        className="grid place-items-center w-5 h-5 rounded-full hover:bg-foreground/10 transition-colors"
        aria-label="حذف"
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}

function TalentMiniCard({
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
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={() => navigate({ view: "profile", id: talent.id })}
      className="flex flex-col items-center text-center p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-95"
    >
      <UserAvatar
        name={talent.name}
        avatarUrl={talent.avatarUrl}
        verified={talent.isVerifiedBadge}
        gender={talent.gender}
        size="lg"
      />
      <h3 className="mt-2 font-bold text-sm line-clamp-1">{talent.name}</h3>
      {talent.bioShort && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-5 min-h-[2.5rem]">
          {talent.bioShort}
        </p>
      )}
      {talent.city && (
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{talent.city}</span>
        </div>
      )}
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary">
        <CheckCircle2 className="w-3 h-3" />
        <span>{formatCount(talent.followersCount)} دنبال‌کننده</span>
      </div>
    </motion.button>
  );
}
