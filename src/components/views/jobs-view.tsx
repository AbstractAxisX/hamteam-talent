"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { JobPostWithRelations, CategoryWithSkills } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatCount } from "@/lib/format";
import { PROVINCES, getProvinceName } from "@/lib/geo";
import {
  Briefcase,
  Plus,
  X,
  Clock,
  Flame,
  MapPin,
  Users,
  Filter,
  ChevronLeft,
} from "lucide-react";

const ALL = "__all__";

export function JobsView() {
  const { user } = useUser();
  const [jobs, setJobs] = useState<JobPostWithRelations[]>([]);
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
      const data = await api<{ jobs: JobPostWithRelations[] }>(
        `/api/jobs?${params.toString()}`
      );
      setJobs(data.jobs);
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
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* ═══ Header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between gap-3 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-12 h-12 rounded-2xl bg-brand-gradient text-white shadow-card shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight">نیازمندی‌ها</h1>
            <p className="text-sm text-muted-foreground mt-0.5 leading-6">
              همکاری، تیم‌سازی و فرصت‌های شغلی
            </p>
          </div>
        </div>
        {user ? (
          <Button
            onClick={() => navigate({ view: "create-job" })}
            className="gap-1.5 rounded-xl h-10 font-semibold shadow-card"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت آگهی</span>
          </Button>
        ) : (
          <Button
            onClick={() => navigate({ view: "auth" })}
            variant="outline"
            className="gap-1.5 rounded-xl h-10 font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت آگهی</span>
          </Button>
        )}
      </motion.div>

      {/* ═══ Sort + Filter toggle ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        <SortButton active={sort === "recent"} onClick={() => setSort("recent")} icon={Clock} label="جدیدترین" />
        <SortButton active={sort === "popular"} onClick={() => setSort("popular")} icon={Flame} label="پرطرفدارترین" />
        <Button
          variant={activeFiltersCount > 0 ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className="gap-1.5 rounded-xl font-semibold h-9"
        >
          <Filter className="w-4 h-4" />
          فیلترها
          {activeFiltersCount > 0 && (
            <span className="inline-grid place-items-center min-w-5 h-5 px-1 text-[10px] rounded-full bg-primary text-primary-foreground">
              {toFa(activeFiltersCount)}
            </span>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 h-9 text-muted-foreground hover:text-rose rounded-xl"
          >
            <X className="w-3.5 h-3.5" /> پاک کردن
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
            <Card className="p-5 border-border/60 shadow-card rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">دسته‌بندی</label>
                  <Select
                    value={categoryId}
                    onValueChange={(v) => { setCategoryId(v); setSkillId(ALL); }}
                  >
                    <SelectTrigger className="w-full rounded-xl h-10"><SelectValue placeholder="همه دسته‌ها" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>همه دسته‌ها</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Skill (chained) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">مهارت</label>
                  <Select
                    value={skillId}
                    onValueChange={setSkillId}
                    disabled={categoryId === ALL}
                  >
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder={categoryId !== ALL ? "همه مهارت‌ها" : "ابتدا دسته را انتخاب کنید"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>همه مهارت‌ها</SelectItem>
                      {currentCategory?.skills.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Province */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">استان</label>
                  <Select
                    value={province}
                    onValueChange={(v) => { setProvince(v); setCity(ALL); }}
                  >
                    <SelectTrigger className="w-full rounded-xl h-10"><SelectValue placeholder="همه استان‌ها" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>همه استان‌ها</SelectItem>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City (chained) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">شهر</label>
                  <Select
                    value={city}
                    onValueChange={setCity}
                    disabled={province === ALL}
                  >
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder={province !== ALL ? "همه شهرها" : "ابتدا استان را انتخاب کنید"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>همه شهرها</SelectItem>
                      {currentProvince?.cities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Jobs grid ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 space-y-3 border-border/60 rounded-2xl">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-12 w-full rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                <Skeleton className="w-9 h-9 rounded-full" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
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
                <X className="w-4 h-4" /> پاک کردن فیلترها
              </Button>
            ) : user ? (
              <Button size="sm" onClick={() => navigate({ view: "create-job" })} className="gap-1.5 rounded-xl">
                <Plus className="w-4 h-4" /> ثبت آگهی جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jobs.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            {toFa(jobs.length)} نیازمندی یافت شد
          </p>
        </>
      )}
    </div>
  );
}

/* ── Sort toggle button (feed-view pattern) ── */
function SortButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="gap-1.5 rounded-xl font-semibold h-9 shadow-card"
    >
      <Icon className="w-4 h-4" /> {label}
    </Button>
  );
}

/* ── Job card ── */
function JobCard({ job, index = 0 }: { job: JobPostWithRelations; index?: number }) {
  const locationLabel = job.city
    ? `${job.city}${job.province ? `، ${getProvinceName(job.province)}` : ""}`
    : job.province
    ? getProvinceName(job.province)
    : null;

  const isClosed = job.status === "closed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        onClick={() => navigate({ view: "job", id: job.id })}
        className="p-5 border-border/60 shadow-card hover:shadow-lift transition-shadow duration-300 cursor-pointer group rounded-2xl h-full flex flex-col"
      >
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[15px] leading-7 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {job.title}
          </h3>
          {isClosed && (
            <Badge variant="secondary" className="shrink-0 text-[10px] h-5 rounded-md font-medium">
              بسته
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-[13px] text-muted-foreground leading-7 line-clamp-2 whitespace-pre-wrap break-words mb-3">
          {job.description}
        </p>

        {/* Category + skills */}
        {(job.categoryName || job.skills.length > 0) && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {job.categoryName && (
              <Badge variant="secondary" className="text-[10px] py-0 h-5 rounded-md font-medium">
                {job.categoryName}
              </Badge>
            )}
            {job.skills.slice(0, 3).map((s) => (
              <Badge
                key={s.id}
                variant="outline"
                className="text-[10px] py-0 h-5 rounded-md border-primary/25 text-primary font-medium"
              >
                {s.name}
              </Badge>
            ))}
            {job.skills.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{toFa(job.skills.length - 3)}</span>
            )}
          </div>
        )}

        {/* Location */}
        {locationLabel && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5" />
            {locationLabel}
          </div>
        )}

        {/* Footer: owner + meta */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border/60">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate({ view: "profile", id: job.user.id });
            }}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
          >
            <UserAvatar
              name={job.user.name}
              avatarUrl={job.user.avatarUrl}
              verified={job.user.isVerifiedBadge}
              size="sm"
            />
            <span className="text-xs font-semibold truncate max-w-[100px]">{job.user.name}</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {formatCount(job.applicationCount)}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span>{timeAgoFa(job.createdAt)}</span>
            <ChevronLeft className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
