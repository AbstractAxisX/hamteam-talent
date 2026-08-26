"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatCount } from "@/lib/format";
import { getProvinceName } from "@/lib/geo";
import {
  Briefcase,
  Users,
  Inbox,
  Send,
  ChevronLeft,
  MapPin,
  CheckCircle2,
  XCircle,
  Lock,
  Plus,
} from "lucide-react";

type PostedJob = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  applicationCount: number;
  categoryName: string | null;
  city: string | null;
  province: string | null;
  applications: {
    id: string;
    message: string;
    createdAt: string;
    applicant: {
      id: string;
      name: string;
      isVerifiedBadge: boolean;
      avatarUrl: string | null;
    };
  }[];
};

type AppliedJob = {
  id: string;
  message: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    status: string;
    city: string | null;
    province: string | null;
    createdAt: string;
    categoryName: string | null;
    user: {
      id: string;
      name: string;
      isVerifiedBadge: boolean;
      avatarUrl: string | null;
    };
  };
};

export function MyJobsView() {
  const { user, loading: userLoading } = useUser();
  const [posted, setPosted] = useState<PostedJob[]>([]);
  const [applied, setApplied] = useState<AppliedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ posted: PostedJob[]; applied: AppliedJob[] }>(
        "/api/jobs/my-jobs"
      );
      setPosted(data.posted);
      setApplied(data.applied);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  // Not logged in
  if (!userLoading && !user) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <ViewHeader />
        <Card className="p-8 text-center space-y-3 border-border/60 shadow-card rounded-2xl">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-lg">برای مشاهده نیازمندی‌های خود وارد شوید</h2>
          <p className="text-sm text-muted-foreground leading-7">
            نیازمندی‌ها و درخواست‌های شما در این صفحه نمایش داده می‌شود.
          </p>
          <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5 rounded-xl h-10 font-semibold">
            ورود / ثبت‌نام
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <ViewHeader />

      <Tabs defaultValue="posted" className="w-full">
        <TabsList className="w-full h-11 rounded-xl bg-muted p-1">
          <TabsTrigger value="posted" className="gap-1.5 flex-1 rounded-lg font-semibold data-[state=active]:shadow-card">
            <Briefcase className="w-4 h-4" />
            نیازمندی‌های من
            {posted.length > 0 && (
              <span className="inline-grid place-items-center min-w-5 h-5 px-1 text-[10px] rounded-full bg-primary/15 text-primary">
                {toFa(posted.length)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="applied" className="gap-1.5 flex-1 rounded-lg font-semibold data-[state=active]:shadow-card">
            <Send className="w-4 h-4" />
            درخواست‌های من
            {applied.length > 0 && (
              <span className="inline-grid place-items-center min-w-5 h-5 px-1 text-[10px] rounded-full bg-primary/15 text-primary">
                {toFa(applied.length)}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Posted tab */}
        <TabsContent value="posted" className="mt-4">
          {loading ? (
            <PostedSkeleton />
          ) : posted.length === 0 ? (
            <EmptyState
              kind="jobs"
              title="هنوز نیازمندی‌ای ثبت نکرده‌اید"
              description="اولین نیازمندی خود را ثبت کنید تا افراد مرتبط آن را ببینند و برایشان اعلان ارسال شود."
              action={
                <Button onClick={() => navigate({ view: "create-job" })} className="gap-1.5 rounded-xl h-10 font-semibold">
                  <Plus className="w-4 h-4" />
                  ثبت نیازمندی جدید
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {posted.map((job, i) => (
                <PostedJobCard key={job.id} job={job} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Applied tab */}
        <TabsContent value="applied" className="mt-4">
          {loading ? (
            <AppliedSkeleton />
          ) : applied.length === 0 ? (
            <EmptyState
              kind="search"
              title="درخواستی ارسال نکرده‌اید"
              description="در فهرست نیازمندی‌ها جست‌وجو کنید و برای موارد مرتبط درخواست بفرستید."
              action={
                <Button variant="outline" onClick={() => navigate({ view: "jobs" })} className="gap-1.5 rounded-xl h-10 font-semibold">
                  <Briefcase className="w-4 h-4" />
                  مشاهده نیازمندی‌ها
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {applied.map((a, i) => (
                <AppliedJobCard key={a.id} app={a} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Header ── */
function ViewHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between gap-3 flex-wrap"
    >
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-brand-gradient text-white shadow-card shrink-0">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">نیازمندی‌های من</h1>
          <p className="text-sm text-muted-foreground mt-0.5 leading-6">
            مدیریت آگهی‌ها و درخواست‌ها
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate({ view: "create-job" })}
        className="gap-1.5 rounded-xl h-10 font-semibold"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">ثبت نیازمندی</span>
      </Button>
    </motion.div>
  );
}

/* ── Posted job card ── */
function PostedJobCard({ job, index = 0 }: { job: PostedJob; index?: number }) {
  const locationLabel = job.city
    ? `${job.city}${job.province ? `، ${getProvinceName(job.province)}` : ""}`
    : job.province
    ? getProvinceName(job.province)
    : null;
  const isOpen = job.status === "open";
  const recentApps = job.applications.slice(0, 3);
  const remaining = job.applications.length - recentApps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="p-5 border-border/60 shadow-card hover:shadow-lift transition-shadow rounded-2xl space-y-3">
        <div
          className="cursor-pointer"
          onClick={() => navigate({ view: "job", id: job.id })}
        >
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="font-bold text-[15px] leading-7 hover:text-primary transition-colors line-clamp-2 flex-1">
              {job.title}
            </h3>
            {isOpen ? (
              <Badge variant="outline" className="gap-1 border-success/30 text-success shrink-0 rounded-md h-6">
                <CheckCircle2 className="w-3 h-3" /> باز
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 shrink-0 rounded-md h-6">
                <XCircle className="w-3 h-3" /> بسته
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            {job.categoryName && (
              <Badge variant="secondary" className="h-5 text-[10px] rounded-md">{job.categoryName}</Badge>
            )}
            {locationLabel && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {locationLabel}
              </span>
            )}
            <span>{timeAgoFa(job.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {formatCount(job.applicationCount)} درخواست
            </span>
          </div>
        </div>

        {/* Recent applicants preview */}
        {job.applications.length > 0 && (
          <div className="pt-3 border-t border-border/60 space-y-2">
            <p className="text-xs font-bold text-muted-foreground">متقاضیان اخیر</p>
            <div className="space-y-2">
              {recentApps.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40">
                  <button onClick={() => navigate({ view: "profile", id: a.applicant.id })}>
                    <UserAvatar
                      name={a.applicant.name}
                      avatarUrl={a.applicant.avatarUrl}
                      verified={a.applicant.isVerifiedBadge}
                      size="sm"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate({ view: "profile", id: a.applicant.id })}
                      className="text-xs font-semibold hover:text-primary transition-colors truncate block"
                    >
                      {a.applicant.name}
                    </button>
                    {a.message && (
                      <p className="text-[11px] text-muted-foreground truncate">{a.message}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {timeAgoFa(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
            {remaining > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs gap-1 rounded-lg"
                onClick={() => navigate({ view: "job", id: job.id })}
              >
                مشاهده {toFa(remaining)} درخواست دیگر
                <ChevronLeft className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 gap-1.5 rounded-xl font-semibold"
          onClick={() => navigate({ view: "job", id: job.id })}
        >
          مشاهده جزئیات
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
      </Card>
    </motion.div>
  );
}

/* ── Applied job card ── */
function AppliedJobCard({ app, index = 0 }: { app: AppliedJob; index?: number }) {
  const job = app.job;
  const locationLabel = job.city
    ? `${job.city}${job.province ? `، ${getProvinceName(job.province)}` : ""}`
    : job.province
    ? getProvinceName(job.province)
    : null;
  const isOpen = job.status === "open";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        className="p-5 border-border/60 shadow-card hover:shadow-lift transition-shadow cursor-pointer rounded-2xl space-y-3"
        onClick={() => navigate({ view: "job", id: job.id })}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[15px] leading-7 hover:text-primary transition-colors line-clamp-2">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({ view: "profile", id: job.user.id });
                }}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <UserAvatar
                  name={job.user.name}
                  avatarUrl={job.user.avatarUrl}
                  verified={job.user.isVerifiedBadge}
                  size="sm"
                />
                <span className="text-xs font-semibold truncate max-w-[120px]">{job.user.name}</span>
              </button>
            </div>
          </div>
          {isOpen ? (
            <Badge variant="outline" className="gap-1 border-success/30 text-success shrink-0 rounded-md h-6">
              <CheckCircle2 className="w-3 h-3" /> باز
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 shrink-0 rounded-md h-6">
              <XCircle className="w-3 h-3" /> بسته
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {job.categoryName && (
            <Badge variant="secondary" className="h-5 text-[10px] rounded-md">{job.categoryName}</Badge>
          )}
          {locationLabel && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationLabel}
            </span>
          )}
          <span>ارسال {timeAgoFa(app.createdAt)}</span>
        </div>

        {app.message && (
          <div className="pt-3 border-t border-border/60">
            <p className="text-xs font-bold text-muted-foreground mb-1.5">پیام شما</p>
            <p className="text-xs text-foreground/80 leading-7 line-clamp-3 bg-muted/50 rounded-lg p-2.5 whitespace-pre-wrap break-words">
              {app.message}
            </p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 gap-1.5 rounded-xl font-semibold"
          onClick={(e) => {
            e.stopPropagation();
            navigate({ view: "job", id: job.id });
          }}
        >
          مشاهده نیازمندی
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
      </Card>
    </motion.div>
  );
}

/* ── Skeletons ── */
function PostedSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-5 space-y-3 border-border/60 rounded-2xl">
          <Skeleton className="h-5 w-3/4 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-12 w-full rounded" />
        </Card>
      ))}
    </div>
  );
}

function AppliedSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-5 space-y-3 border-border/60 rounded-2xl">
          <Skeleton className="h-5 w-3/4 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-12 w-full rounded" />
        </Card>
      ))}
    </div>
  );
}
