"use client";

/* ═══════════════════════════════════════════════════════════
   DiscoverView v2 — تجربه کشف بازطراحی‌شده
   · فرم فیلتر بزرگ حذف شد → دکمه شناور + پنل انیمیشنی (filter-fab)
   · تب‌ها بدون عدد · جستجوی @آیدی در تب کاربران
   · state فیلتر در هش URL (قابل اشتراک/ریلود)
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate, useNav } from "@/lib/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/shared/icon";
import { FilterFab, countActiveFilters, type FilterFabValue, type FabSortOption } from "@/components/shared/filter-fab";
import type { CategoryWithSkills, TalentListItem, PostWithRelations } from "@/lib/types";
import { getProvinceName } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/format";

type Tab = "posts" | "users";

/* فیلتر کشف = فیلترهای مشترک + مرتب‌سازی (ترکیبی برای تب پست/کاربر) */
type DiscoverFilters = FilterFabValue & { postSort: "recent" | "popular" };

const DISCOVER_SORTS: FabSortOption[] = [
  { value: "recent", label: "جدیدترین" },
  { value: "popular", label: "محبوب‌ترین" },
];

/* تبدیل فیلتر ↔ پارامترهای URL داخل هش */
function filtersToParams(f: DiscoverFilters, tab: Tab): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.categoryId) p.cat = f.categoryId;
  if (f.skillId) p.skill = f.skillId;
  if (f.province) p.prov = f.province;
  if (f.city) p.city = f.city;
  if (tab === "users") p.tab = "users";
  if (f.postSort === "popular") p.sort = "popular";
  return p;
}

function paramsToFilters(p: Record<string, string> | undefined, tab: Tab): { filters: DiscoverFilters; tab: Tab } {
  const f: DiscoverFilters = {
    categoryId: p?.cat || "",
    skillId: p?.skill || "",
    province: p?.prov || "",
    city: p?.city || "",
    postSort: p?.sort === "popular" ? "popular" : "recent",
  };
  return { filters: f, tab: p?.tab === "users" ? "users" : tab };
}

export function DiscoverView() {
  const route = useNav((s) => s.route);
  const routeParams = route.view === "discover" ? route.params : undefined;

  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // مقدار اولیه از URL (fallback امن) — فقط یک‌بار در مانت
  const initialRef = useRef(routeParams);
  const initial = useMemo(() => paramsToFilters(initialRef.current, "posts"), []);
  const [tab, setTab] = useState<Tab>(initial.tab);
  const [filters, setFilters] = useState<DiscoverFilters>(initial.filters);

  const [q, setQ] = useState("");
  // مود جستجوی @آیدی — با تایپ @ فعال می‌شود
  const idMode = tab === "users" && q.trimStart().startsWith("@");

  /* همگام‌سازی با تغییر پارامترهای URL (مثلاً پس از ثبت فیلتر) */
  const paramKey = routeParams ? JSON.stringify(routeParams) : "";
  useEffect(() => {
    if (!routeParams) return;
    const { filters: f, tab: t } = paramsToFilters(routeParams, tab);
    setFilters(f);
    setTab(t);
  }, [paramKey]);

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  const currentCat = useMemo(() => cats.find((c) => c.id === filters.categoryId), [cats, filters.categoryId]);
  const activeFiltersCount = countActiveFilters(filters);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "posts") {
        const data = await api<{ posts: PostWithRelations[] }>(`/api/posts?sort=${filters.postSort}`);
        let filtered = data.posts;
        if (filters.categoryId) filtered = filtered.filter((p) => p.categoryId === filters.categoryId);
        if (filters.skillId) filtered = filtered.filter((p) => p.skillId === filters.skillId);
        if (q.trim() && !q.trim().startsWith("@")) {
          const needle = q.trim();
          filtered = filtered.filter((p) => p.content.includes(needle) || p.user.name.includes(needle));
        }
        setPosts(filtered);
      } else {
        const params = new URLSearchParams();
        if (filters.categoryId) params.set("categoryId", filters.categoryId);
        if (filters.skillId) params.set("skillId", filters.skillId);
        if (filters.province) params.set("province", filters.province);
        if (filters.city) params.set("city", filters.city);
        if (q.trim()) params.set("q", q.trim());
        params.set("sort", filters.postSort === "popular" ? "followers" : "recent");
        const data = await api<{ talents: TalentListItem[] }>(`/api/talents?${params.toString()}`);
        setTalents(data.talents);
      }
    } catch {
      setPosts([]);
      setTalents([]);
    } finally {
      setLoading(false);
    }
  }, [tab, filters, q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  /* ثبت فیلتر → نوشتن در URL؛ روتر همگام می‌کند و محتوا بازخوانی می‌شود */
  function applyFilters(v: FilterFabValue, sort: string) {
    const f: DiscoverFilters = { ...v, postSort: sort === "popular" ? "popular" : "recent" };
    navigate({ view: "discover", params: filtersToParams(f, tab) });
  }

  function clearAll() {
    setQ("");
    navigate({ view: "discover" });
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-28">
      {/* ═══ هدر ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass border border-border/50 p-5 shadow-float"
      >
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="grid place-items-center w-14 h-14 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0">
            <Icon name="compass" size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">کشف</h1>
            <p className="text-[13px] text-muted-foreground mt-1.5 leading-6">
              استعدادها و پست‌ها را کشف کن
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ جستجو — در تب کاربران، @ مود آیدی را فعال می‌کند ═══ */}
      <div className="relative">
        <Icon name="search" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            tab === "posts"
              ? "جستجوی پست یا نویسنده…"
              : idMode
                ? "جستجوی آیدی — مثلاً sara_dev"
                : "جستجوی نام یا مهارت… (با @ آیدی جستجو کن)"
          }
          className={cn(
            "w-full h-14 pr-12 pl-4 rounded-2xl glass border text-[14.5px] focus:outline-none focus:ring-2 transition-all shadow-soft",
            idMode
              ? "border-primary/60 ring-primary/40 focus:ring-primary/60"
              : "border-border/50 focus:ring-primary/60 focus:border-primary/50"
          )}
        />
        {idMode && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-primary/10 text-primary text-[10.5px] font-black">
            <Icon name="userIdentifier" size={13} />
            مود آیدی
          </span>
        )}
      </div>

      {/* ═══ تب‌ها — بدون عدد ═══ */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl glass border border-border/50">
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")} iconName="sparkles" label="پست‌ها" />
        <TabButton active={tab === "users"} onClick={() => setTab("users")} iconName="users" label="کاربران" />
      </div>

      {/* ═══ چیپ‌های فیلتر فعال (جای فرم دائمی) ═══ */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.categoryId && currentCat && (
            <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full glass border border-primary/30 text-primary text-xs font-bold">
              {currentCat.iconUrl} {currentCat.name}
            </span>
          )}
          {filters.province && (
            <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full glass border border-primary/30 text-primary text-xs font-bold">
              <Icon name="mapPin" size={13} />
              {getProvinceName(filters.province)}
              {filters.city ? ` · ${filters.city}` : ""}
            </span>
          )}
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-xs font-bold text-muted-foreground hover:text-rose transition-colors outline-none"
          >
            <Icon name="x" size={13} />
            پاک کردن همه
          </button>
        </div>
      )}

      {/* ═══ نتایج ═══ */}
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
            action={activeFiltersCount > 0 || q ? (
              <button onClick={clearAll} className="h-11 px-5 rounded-2xl grad-brand text-white font-extrabold text-sm shadow-grad outline-none">
                پاک کردن فیلترها
              </button>
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
          title={idMode ? "کاربری با این آیدی پیدا نشد" : "استعدادی یافت نشد"}
          description={idMode ? "آیدی را کامل‌تر بنویس یا بدون @ جستجوی نام را امتحان کن." : "فیلترها را تغییر بده یا عبارت دیگری جستجو کن."}
          action={activeFiltersCount > 0 || q ? (
            <button onClick={clearAll} className="h-11 px-5 rounded-2xl grad-brand text-white font-extrabold text-sm shadow-grad outline-none">
              پاک کردن فیلترها
            </button>
          ) : undefined}
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {talents.map((t, i) => (
            <TalentMiniCard key={t.id} talent={t} index={i} />
          ))}
        </motion.div>
      )}

      {tab === "users" && !loading && talents.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => navigate({ view: "talents" })}
            className="w-full h-11 rounded-2xl text-primary font-bold text-sm hover:bg-primary/5 transition-colors outline-none"
          >
            مشاهده‌ی همه‌ی استعدادها
            <Icon name="arrowLeft" className="w-4 h-4 inline mr-1" />
          </button>
        </div>
      )}

      {/* ═══ دکمه شناور فیلتر ═══ */}
      <FilterFab
        cats={cats}
        value={filters}
        sort={filters.postSort}
        sortOptions={DISCOVER_SORTS}
        onApply={applyFilters}
        title="فیلترهای کشف"
      />
    </div>
  );
}

/* ─────────── اجزای کوچک ─────────── */

function TabButton({
  active, onClick, iconName, label,
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
        "flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-bold transition-all active:scale-95 outline-none",
        active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon name={iconName} className="w-4 h-4" />
      {label}
    </button>
  );
}

function TalentMiniCard({ talent, index = 0 }: { talent: TalentListItem; index?: number }) {
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
        {talent.username && (
          <p className="text-[11px] text-primary font-bold mt-0.5 truncate" dir="ltr">
            @{talent.username}
          </p>
        )}
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
