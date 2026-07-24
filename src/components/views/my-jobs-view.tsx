"use client";

import { useEffect, useState, useCallback } from "react";
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
      <div className="space-y-4">
        <ViewHeader />
        <Card className="p-8 text-center space-y-3">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg">برای مشاهده نیازمندی‌های خود وارد شوید</h2>
          <p className="text-sm text-muted-foreground">
            نیازمندی‌ها و درخواست‌های شما در این صفحه نمایش داده می‌شود.
          </p>
          <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5">
            ورود / ثبت‌نام
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ViewHeader />

      <Tabs defaultValue="posted" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="posted" className="gap-1.5 flex-1">
            <Briefcase className="w-4 h-4" />
            نیازمندی‌های من
            {posted.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary"
              >
                {toFa(posted.length)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applied" className="gap-1.5 flex-1">
            <Send className="w-4 h-4" />
            درخواست‌های من
            {applied.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary"
              >
                {toFa(applied.length)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Posted tab */}
        <TabsContent value="posted" className="mt-4">
          {loading ? (
            <PostedSkeleton />
          ) : posted.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="هنوز نیازمندی‌ای ثبت نکرده‌اید"
              description="اولین نیازمندی خود را ثبت کنید تا افراد مرتبط آن را ببینند و برایشان اعلان ارسال شود."
              action={
                <Button
                  onClick={() => navigate({ view: "create-job" })}
                  className="gap-1.5"
                >
                  ثبت نیازمندی جدید
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {posted.map((job) => (
                <PostedJobCard key={job.id} job={job} />
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
              icon={Inbox}
              title="درخواستی ارسال نکرده‌اید"
              description="در فهرست نیازمندی‌ها جست‌وجو کنید و برای موارد مرتبط درخواست بفرستید."
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "jobs" })}
                  className="gap-1.5"
                >
                  مشاهده نیازمندی‌ها
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {applied.map((a) => (
                <AppliedJobCard key={a.id} app={a} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ViewHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">نیازمندی‌های من</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            مدیریت آگهی‌ها و درخواست‌ها
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate({ view: "create-job" })}
        className="gap-1.5"
      >
        <Briefcase className="w-4 h-4" />
        <span className="hidden sm:inline">ثبت نیازمندی</span>
      </Button>
    </div>
  );
}

function PostedJobCard({ job }: { job: PostedJob }) {
  const locationLabel = job.city
    ? `${job.city}${job.province ? `، ${getProvinceName(job.province)}` : ""}`
    : job.province
    ? getProvinceName(job.province)
    : null;
  const isOpen = job.status === "open";
  const recentApps = job.applications.slice(0, 3);
  const remaining = job.applications.length - recentApps.length;

  return (
    <Card className="p-4 space-y-3 hover:shadow-md transition-shadow">
      <div
        className="cursor-pointer"
        onClick={() => navigate({ view: "job", id: job.id })}
      >
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="font-bold text-base leading-snug hover:text-primary transition-colors line-clamp-2">
            {job.title}
          </h3>
          {isOpen ? (
            <Badge
              variant="outline"
              className="gap-1 border-success/30 text-success shrink-0"
            >
              <CheckCircle2 className="w-3 h-3" /> باز
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 shrink-0">
              <XCircle className="w-3 h-3" /> بسته
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
          {job.categoryName && (
            <Badge variant="secondary" className="h-5 text-[10px]">
              {job.categoryName}
            </Badge>
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
        <div className="pt-3 border-t border-border space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            متقاضیان اخیر
          </p>
          <div className="space-y-2">
            {recentApps.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40"
              >
                <button
                  onClick={() =>
                    navigate({ view: "profile", id: a.applicant.id })
                  }
                >
                  <UserAvatar
                    name={a.applicant.name}
                    avatarUrl={a.applicant.avatarUrl}
                    verified={a.applicant.isVerifiedBadge}
                    size="sm"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() =>
                      navigate({ view: "profile", id: a.applicant.id })
                    }
                    className="text-xs font-medium hover:underline truncate block"
                  >
                    {a.applicant.name}
                  </button>
                  {a.message && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {a.message}
                    </p>
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
              className="w-full h-8 text-xs gap-1"
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
        className="w-full h-8 gap-1.5"
        onClick={() => navigate({ view: "job", id: job.id })}
      >
        مشاهده جزئیات
        <ChevronLeft className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
}

function AppliedJobCard({ app }: { app: AppliedJob }) {
  const job = app.job;
  const locationLabel = job.city
    ? `${job.city}${job.province ? `، ${getProvinceName(job.province)}` : ""}`
    : job.province
    ? getProvinceName(job.province)
    : null;
  const isOpen = job.status === "open";

  return (
    <Card
      className="p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate({ view: "job", id: job.id })}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-snug hover:text-primary transition-colors line-clamp-2">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
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
              <span className="text-xs font-medium truncate max-w-[120px]">
                {job.user.name}
              </span>
            </button>
          </div>
        </div>
        {isOpen ? (
          <Badge
            variant="outline"
            className="gap-1 border-success/30 text-success shrink-0"
          >
            <CheckCircle2 className="w-3 h-3" /> باز
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 shrink-0">
            <XCircle className="w-3 h-3" /> بسته
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        {job.categoryName && (
          <Badge variant="secondary" className="h-5 text-[10px]">
            {job.categoryName}
          </Badge>
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
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            پیام شما
          </p>
          <p className="text-xs text-foreground/80 leading-6 line-clamp-3 bg-muted/40 rounded-lg p-2 whitespace-pre-wrap break-words">
            {app.message}
          </p>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 gap-1.5"
        onClick={(e) => {
          e.stopPropagation();
          navigate({ view: "job", id: job.id });
        }}
      >
        مشاهده نیازمندی
        <ChevronLeft className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
}

function PostedSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-12 w-full" />
        </Card>
      ))}
    </div>
  );
}

function AppliedSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-12 w-full" />
        </Card>
      ))}
    </div>
  );
}
