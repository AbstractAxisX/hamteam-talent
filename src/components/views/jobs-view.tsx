"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
} from "lucide-react";

export function JobsView() {
  const { user } = useUser();
  const [jobs, setJobs] = useState<JobPostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [categoryId, setCategoryId] = useState<string>("");
  const [skillId, setSkillId] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const [categories, setCategories] = useState<CategoryWithSkills[]>([]);

  // Load all categories + skills once
  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  const activeFiltersCount = useMemo(
    () =>
      (categoryId ? 1 : 0) +
      (skillId ? 1 : 0) +
      (province ? 1 : 0) +
      (city ? 1 : 0),
    [categoryId, skillId, province, city]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set("categoryId", categoryId);
      if (skillId) params.set("skillId", skillId);
      if (province) params.set("province", province);
      if (city) params.set("city", city);
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
    load();
  }, [load]);

  const currentCategory = categories.find((c) => c.id === categoryId);
  const currentProvince = PROVINCES.find((p) => p.id === province);

  function clearFilters() {
    setCategoryId("");
    setSkillId("");
    setProvince("");
    setCity("");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">نیازمندی‌ها</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              همکاری، تیم‌سازی و پروژه
            </p>
          </div>
        </div>
        {user && (
          <Button
            onClick={() => navigate({ view: "create-job" })}
            className="gap-1.5"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">ثبت نیازمندی</span>
          </Button>
        )}
        {!user && (
          <Button
            onClick={() => navigate({ view: "auth" })}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">ثبت نیازمندی</span>
          </Button>
        )}
      </div>

      {/* Sort toggle + filter button */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          <Button
            variant={sort === "recent" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSort("recent")}
            className="gap-1.5 h-8"
          >
            <Clock className="w-4 h-4" /> جدیدترین
          </Button>
          <Button
            variant={sort === "popular" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSort("popular")}
            className="gap-1.5 h-8"
          >
            <Flame className="w-4 h-4" /> پرطرفدارترین
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className="gap-1.5 h-8"
        >
          <Filter className="w-4 h-4" />
          فیلترها
          {activeFiltersCount > 0 && (
            <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
              {toFa(activeFiltersCount)}
            </Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 h-8 text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" /> پاک کردن
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                دسته‌بندی
              </label>
              <Select
                value={categoryId || "ALL"}
                onValueChange={(v) => {
                  setCategoryId(v === "ALL" ? "" : v);
                  setSkillId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه دسته‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه دسته‌ها</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skill — chained to category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                مهارت
              </label>
              <Select
                value={skillId || "ALL"}
                onValueChange={(v) => setSkillId(v === "ALL" ? "" : v)}
                disabled={!categoryId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={categoryId ? "همه مهارت‌ها" : "ابتدا دسته را انتخاب کنید"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه مهارت‌ها</SelectItem>
                  {currentCategory?.skills.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Province */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                استان
              </label>
              <Select
                value={province || "ALL"}
                onValueChange={(v) => {
                  setProvince(v === "ALL" ? "" : v);
                  setCity("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه استان‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه استان‌ها</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City — chained to province */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                شهر
              </label>
              <Select
                value={city || "ALL"}
                onValueChange={(v) => setCity(v === "ALL" ? "" : v)}
                disabled={!province}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={province ? "همه شهرها" : "ابتدا استان را انتخاب کنید"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه شهرها</SelectItem>
                  {currentProvince?.cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* Jobs list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="نیازمندی‌ای یافت نشد"
          description={
            activeFiltersCount > 0
              ? "با فیلترهای فعلی نیازمندی‌ای موجود نیست. فیلترها را تغییر دهید یا پاک کنید."
              : "هنوز هیچ نیازمندی ثبت نشده است. اولین نفر باشید!"
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5"
            >
              <X className="w-4 h-4" /> پاک کردن فیلترها
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job }: { job: JobPostWithRelations }) {
  const locationLabel = job.city
    ? `${job.city}${job.province ? `، ${getProvinceName(job.province)}` : ""}`
    : job.province
    ? getProvinceName(job.province)
    : null;

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate({ view: "job", id: job.id })}
    >
      <div className="space-y-2">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {job.title}
          </h3>
          {job.status === "closed" && (
            <Badge variant="secondary" className="shrink-0 text-[10px] h-5">
              بسته
            </Badge>
          )}
        </div>

        {/* Description (truncated 2 lines) */}
        <p className="text-sm text-muted-foreground leading-6 line-clamp-2 whitespace-pre-wrap break-words">
          {job.description}
        </p>

        {/* Category + skills */}
        {(job.categoryName || job.skills.length > 0) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {job.categoryName && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {job.categoryName}
              </Badge>
            )}
            {job.skills.slice(0, 3).map((s) => (
              <Badge
                key={s.id}
                variant="outline"
                className="text-[10px] h-5 border-primary/30 text-primary"
              >
                {s.name}
              </Badge>
            ))}
            {job.skills.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{toFa(job.skills.length - 3)}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {locationLabel && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {locationLabel}
          </div>
        )}

        {/* Footer: owner + meta */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
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
            <span className="text-xs font-medium truncate max-w-[100px]">
              {job.user.name}
            </span>
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {formatCount(job.applicationCount)}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span>{timeAgoFa(job.createdAt)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
