"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import type { CategoryWithSkills, TalentListItem } from "@/lib/types";
import { PROVINCES } from "@/lib/geo";
import {
  Search,
  Sparkles,
  MapPin,
  Users,
  Clock,
  X,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa, formatCount } from "@/lib/format";

export function TalentsView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
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
  const currentProvince = useMemo(
    () => PROVINCES.find((p) => p.id === province),
    [province]
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
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </span>
            استعدادها
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {!loading ? `${toFa(talents.length)} استعداد` : "در حال بارگذاری..."}
          </p>
        </div>
      </motion.div>

      {/* ═══ Filters card — full-width stacked rows ═══ */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
        {/* Row 1: Category — FULL WIDTH */}
        <Select
          value={categoryId}
          onValueChange={(v) => {
            setCategoryId(v);
            setSkillId("");
          }}
        >
          <SelectTrigger className="rounded-xl h-11 w-full">
            <SelectValue placeholder="دسته‌بندی" />
          </SelectTrigger>
          <SelectContent>
            {cats.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.iconUrl || "✨"} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Row 2: Skill — FULL WIDTH (chained to category) */}
        <Select value={skillId} onValueChange={setSkillId} disabled={!categoryId}>
          <SelectTrigger className="rounded-xl h-11 w-full">
            <SelectValue placeholder={categoryId ? "مهارت" : "ابتدا دسته‌بندی را انتخاب کنید"} />
          </SelectTrigger>
          <SelectContent>
            {currentCat?.skills.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Row 3: Text search — FULL WIDTH */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی نام یا بیو..."
            className="w-full h-11 pr-10 pl-4 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
          />
        </div>

        {/* Row 4: Province + City — side by side */}
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={province}
            onValueChange={(v) => {
              setProvince(v);
              setCity("");
            }}
          >
            <SelectTrigger className="rounded-xl h-11">
              <SelectValue placeholder="استان" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={city} onValueChange={setCity} disabled={!province}>
            <SelectTrigger className="rounded-xl h-11">
              <SelectValue placeholder="شهر" />
            </SelectTrigger>
            <SelectContent>
              {currentProvince?.cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Row 5: Sort + Clear */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            <SortPill
              active={sort === "followers"}
              onClick={() => setSort("followers")}
              icon={Users}
              label="محبوب‌ترین"
            />
            <SortPill
              active={sort === "recent"}
              onClick={() => setSort("recent")}
              icon={Clock}
              label="جدیدترین"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground h-8"
            >
              <X className="w-3.5 h-3.5" /> پاک کردن
            </Button>
          )}
        </div>
      </div>

      {/* ═══ Results ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : talents.length === 0 ? (
        <EmptyState
          kind="people"
          title="استعدادی یافت نشد"
          description="فیلترها رو تغییر بده یا عبارت دیگه‌ای جستجو کن."
          action={
            hasFilters ? (
              <Button onClick={clearAll} className="rounded-2xl font-bold">
                پاک کردن فیلترها
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
        "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-all active:scale-95",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      )}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={() => navigate({ view: "profile", id: talent.id })}
      className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-95 text-right w-full"
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
          {talent.isVerifiedBadge && (
            <BadgeCheck className="w-4 h-4 text-gold shrink-0" />
          )}
        </div>
        {talent.bioShort && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-5">
            {talent.bioShort}
          </p>
        )}
        {(talent.city || talent.province) && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{talent.city || talent.province}</span>
          </div>
        )}
        {talent.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {talent.categories.slice(0, 2).map((c) => (
              <Badge
                key={c.id}
                variant="secondary"
                className="bg-primary/10 text-primary text-[10px] py-0 h-5 rounded-md font-medium gap-1"
              >
                <span>{c.iconUrl || "✨"}</span>
                <span>{c.name}</span>
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose">
          <Users className="w-3 h-3" />
          <span>{formatCount(talent.followersCount)} دنبال‌کننده</span>
        </div>
      </div>
    </motion.button>
  );
}
