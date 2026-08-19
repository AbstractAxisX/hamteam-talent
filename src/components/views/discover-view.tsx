"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Icon } from "@/components/shared/icon";
import type {
  CategoryWithSkills,
  TalentListItem,
  PostWithRelations,
} from "@/lib/types";
import { PROVINCES, getCitiesForProvince, getProvinceName } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { toFa, formatCount, timeAgoFa } from "@/lib/format";

type Tab = "posts" | "users";
type PostSort = "recent" | "popular";
type UserSort = "recent" | "followers";

export function DiscoverView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [postSort, setPostSort] = useState<PostSort>("recent");
  const [userSort, setUserSort] = useState<UserSort>("followers");

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  const currentCat = useMemo(
    () => cats.find((c) => c.id === categoryId),
    [cats, categoryId]
  );

  const activeFiltersCount = [categoryId, skillId, province, city].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "posts") {
        const data = await api<{ posts: PostWithRelations[] }>(
          `/api/posts?sort=${postSort}`
        );
        let filtered = data.posts;
        if (categoryId) filtered = filtered.filter((p) => p.categoryId === categoryId);
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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ═══ Hero Header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
      >
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="grid place-items-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0">
            <Icon name="compass" className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">کشف</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-6">
              استعدادها و پست‌ها را کشف کن
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ Search bar ═══ */}
      <div className="relative">
        <Icon name="search" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === "posts" ? "جستجوی پست یا نویسنده..." : "جستجوی نام یا مهارت..."}
          className="w-full h-14 pr-12 pl-4 rounded-2xl glass border border-border/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/50 transition-all shadow-soft"
        />
      </div>

      {/* ═══ Tab switcher ═══ */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl glass border border-border/50">
        <TabButton
          active={tab === "posts"}
          onClick={() => setTab("posts")}
          iconName="sparkles"
          label="پست‌ها"
          count={!loading ? posts.length : undefined}
        />
        <TabButton
          active={tab === "users"}
          onClick={() => setTab("users")}
          iconName="users"
          label="کاربران"
          count={!loading ? talents.length : undefined}
        />
      </div>

      {/* ═══ Sort toggle ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        {tab === "posts" ? (
          <>
            <SortPill active={postSort === "recent"} onClick={() => setPostSort("recent")} iconName="clock" label="جدیدترین" />
            <SortPill active={postSort === "popular"} onClick={() => setPostSort("popular")} iconName="heart" label="محبوب‌ترین" />
          </>
        ) : (
          <>
            <SortPill active={userSort === "followers"} onClick={() => setUserSort("followers")} iconName="users" label="محبوب‌ترین" />
            <SortPill active={userSort === "recent"} onClick={() => setUserSort("recent")} iconName="clock" label="جدیدترین" />
          </>
        )}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 h-9 text-muted-foreground hover:text-rose rounded-xl mr-auto">
            <Icon name="x" className="w-3.5 h-3.5" /> پاک کردن همه
          </Button>
        )}
      </div>

      {/* ═══ Filters card — 4 full-width stacked rows with labels ═══ */}
      <Card className="glass p-5 rounded-3xl border-border/50 shadow-soft space-y-4">
        <div className="flex items-center gap-2 pb-1">
          <Icon name="grid" className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">فیلترهای دقیق</h3>
        </div>

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

        <SearchableSelect
          label="مهارت"
          options={(currentCat?.skills || []).map((s) => ({ value: s.id, label: s.name }))}
          value={skillId}
          onChange={(v) => setSkillId(v === "all" ? "" : v)}
          allLabel={categoryId ? "همه" : undefined}
          placeholder={categoryId ? "انتخاب مهارت" : "ابتدا دسته‌بندی را انتخاب کنید"}
          disabled={!categoryId}
        />

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

        {tab === "posts" && (
          <p className="text-[11px] text-muted-foreground leading-5">
            فیلتر استان/شهر فقط برای تب کاربران فعال است.
          </p>
        )}
      </Card>

      {/* ═══ Active filter chips ═══ */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {categoryId && currentCat && (
            <FilterChip label={currentCat.name} onRemove={() => { setCategoryId(""); setSkillId(""); }} />
          )}
          {skillId && currentCat && (
            <FilterChip label={currentCat.skills.find((s) => s.id === skillId)?.name || "مهارت"} onRemove={() => setSkillId("")} />
          )}
          {province && <FilterChip label={getProvinceName(province) || "استان"} onRemove={() => { setProvince(""); setCity(""); }} />}
          {city && <FilterChip label={city} onRemove={() => setCity("")} />}
        </div>
      )}

      {/* ═══ Results ═══ */}
      {loading ? (
        tab === "posts" ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-3xl" />
            ))}
          </div>
        )
      ) : tab === "posts" ? (
        posts.length === 0 ? (
          <EmptyState
            kind="posts"
            title="پستی یافت نشد"
            description="فیلترها را تغییر بده یا بعداً سر بزن."
            action={activeFiltersCount > 0 ? (
              <Button onClick={clearAll} className="rounded-2xl font-bold">پاک کردن فیلترها</Button>
            ) : undefined}
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <AnimatePresence>
              {posts.map((p, i) => (
                <PostCard key={p.id} post={p} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )
      ) : talents.length === 0 ? (
        <EmptyState
          kind="people"
          title="استعدادی یافت نشد"
          description="فیلترها را تغییر بده یا عبارت دیگری جستجو کن."
          action={activeFiltersCount > 0 ? (
            <Button onClick={clearAll} className="rounded-2xl font-bold">پاک کردن فیلترها</Button>
          ) : undefined}
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {talents.map((t, i) => (
            <TalentMiniCard key={t.id} talent={t} index={i} />
          ))}
        </motion.div>
      )}

      {/* ═══ "همه" link to talents for users tab ═══ */}
      {tab === "users" && !loading && talents.length > 0 && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ view: "talents" })}
            className="w-full rounded-2xl text-primary font-bold h-11"
          >
            مشاهده‌ی همه‌ی استعدادها
            <Icon name="arrowLeft" className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  iconName,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  iconName: string;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-bold transition-all active:scale-95",
        active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon name={iconName} className="w-4 h-4" />
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "text-[10px] font-bold rounded-full px-1.5 py-0.5",
            active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted-foreground/15"
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
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "glass border border-border/50 text-muted-foreground hover:text-foreground"
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
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate({ view: "profile", id: talent.id })}
      className="flex items-start gap-3 p-4 rounded-3xl glass border border-border/50 hover:border-primary/40 hover:shadow-lift transition-all active:scale-95 text-right w-full"
    >
      <UserAvatar
        name={talent.name}
        avatarUrl={talent.avatarUrl}
        verified={talent.isVerifiedBadge}
        gender={talent.gender}
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <h3 className="font-bold text-sm truncate">{talent.name}</h3>
          {talent.isVerifiedBadge && <Icon name="badgeCheck" className="w-4 h-4 text-gold shrink-0" />}
        </div>
        {talent.bioShort && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-5">
            {talent.bioShort}
          </p>
        )}
        {talent.city && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Icon name="mapPin" className="w-3 h-3" />
            <span className="truncate">{talent.city}</span>
          </div>
        )}
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary">
          <Icon name="userCheck" className="w-3 h-3" />
          <span>{formatCount(talent.followersCount)} دنبال‌کننده</span>
        </div>
      </div>
    </motion.button>
  );
}
