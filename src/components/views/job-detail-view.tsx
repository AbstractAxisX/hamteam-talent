"use client";

import { useEffect, useState, useCallback } from "react";
import { api, apiPut } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { JobPostWithRelations } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatCount, formatFaDate } from "@/lib/format";
import { getProvinceName } from "@/lib/geo";
import {
  ChevronRight,
  MapPin,
  Users,
  Calendar,
  Briefcase,
  Send,
  Lock,
  CheckCircle2,
  XCircle,
  UserCheck,
} from "lucide-react";

type JobDetail = JobPostWithRelations & {
  applications?: {
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

export function JobDetailView({ id }: { id: string }) {
  const { user } = useUser();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ job: JobDetail }>(`/api/jobs/${id}`);
      setJob(data.job);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("پیدا نشد")) setNotFound(true);
      else toast({ title: "خطا", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-32" />
        <Card className="p-6 space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-6 w-48" />
        </Card>
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        icon={Briefcase}
        title="نیازمندی پیدا نشد"
        description="ممکن است حذف شده باشد یا لینک اشتباه باشد."
        action={
          <Button onClick={() => navigate({ view: "jobs" })} className="gap-1.5">
            بازگشت به فهرست
          </Button>
        }
      />
    );
  }

  if (!job) return null;

  const isOwner = user?.id === job.user.id;
  const locationLabel = job.city
    ? `${job.city}${job.province ? `، ${getProvinceName(job.province)}` : ""}`
    : job.province
    ? getProvinceName(job.province)
    : null;

  return (
    <div className="space-y-4">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: "jobs" })}
        className="gap-1.5 -mr-2 text-muted-foreground"
      >
        <ChevronRight className="w-4 h-4" />
        بازگشت به نیازمندی‌ها
      </Button>

      {/* Main card */}
      <Card className="p-6 space-y-4">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold leading-tight">{job.title}</h1>
              {job.status === "closed" ? (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="w-3 h-3" /> بسته شده
                </Badge>
              ) : (
                <Badge className="gap-1 bg-success/15 text-success hover:bg-success/15 border-success/30">
                  <CheckCircle2 className="w-3 h-3" /> باز
                </Badge>
              )}
            </div>
            {/* Quick meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatFaDate(job.createdAt)}
              </span>
              {locationLabel && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {locationLabel}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {formatCount(job.applicationCount)} درخواست
              </span>
            </div>
          </div>
        </div>

        {/* Category + skills */}
        {(job.categoryName || job.skills.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            {job.categoryName && (
              <Badge variant="secondary" className="h-6">
                {job.categoryName}
              </Badge>
            )}
            {job.skills.map((s) => (
              <Badge
                key={s.id}
                variant="outline"
                className="h-6 border-primary/30 text-primary"
              >
                {s.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            توضیحات
          </h2>
          <p className="text-sm leading-7 whitespace-pre-wrap break-words text-foreground/90">
            {job.description}
          </p>
        </div>

        {/* Owner card */}
        <div className="pt-4 border-t border-border">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            صاحب نیازمندی
          </h2>
          <button
            onClick={() => navigate({ view: "profile", id: job.user.id })}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors w-full text-right"
          >
            <UserAvatar
              name={job.user.name}
              avatarUrl={job.user.avatarUrl}
              verified={job.user.isVerifiedBadge}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm truncate">{job.user.name}</span>
                {job.user.isVerifiedBadge && (
                  <span className="text-warning text-xs" title="تایید شده">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">مشاهده پروفایل</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </button>
        </div>
      </Card>

      {/* Owner actions */}
      {isOwner && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={job.status === "closed"}
                >
                  <XCircle className="w-4 h-4" />
                  {job.status === "closed" ? "بسته شده" : "بستن آگهی"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>بستن این آگهی؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    پس از بستن، آگهی از فهرست عمومی خارج می‌شود و درخواست جدیدی
                    قابل ارسال نخواهد بود. می‌توانید بعداً دوباره بازش کنید.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await apiPut(`/api/jobs/${id}`, { status: "closed" });
                        toast({ title: "آگهی بسته شد" });
                        load();
                      } catch (e) {
                        toast({
                          title: "خطا",
                          description: (e as Error).message,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    بستن آگهی
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {job.status === "closed" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  try {
                    await apiPut(`/api/jobs/${id}`, { status: "open" });
                    toast({ title: "آگهی باز شد" });
                    load();
                  } catch (e) {
                    toast({
                      title: "خطا",
                      description: (e as Error).message,
                      variant: "destructive",
                    });
                  }
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                باز کردن
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Owner: applications list */}
      {isOwner && (
        <ApplicationsSection job={job} />
      )}

      {/* Non-owner: apply */}
      {!isOwner && user && (
        <ApplySection
          jobId={id}
          alreadyApplied={job.appliedByMe}
          jobClosed={job.status === "closed"}
          onApplied={load}
        />
      )}

      {/* Guest: login prompt */}
      {!user && (
        <Card className="p-6 text-center space-y-3 bg-gradient-to-l from-primary/5 to-transparent border-primary/20">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">برای ارسال درخواست وارد شوید</h3>
            <p className="text-sm text-muted-foreground mt-1">
              برای ارتباط با صاحب نیازمندی باید وارد حساب خود شوید.
            </p>
          </div>
          <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5">
            ورود / ثبت‌نام
          </Button>
        </Card>
      )}
    </div>
  );
}

function ApplicationsSection({ job }: { job: JobDetail }) {
  const apps = job.applications ?? [];
  if (apps.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-bold">متقاضیان</h2>
          <Badge variant="secondary" className="text-[10px]">
            {toFa(0)}
          </Badge>
        </div>
        <EmptyState
          icon={UserCheck}
          title="هنوز متقاضی‌ای ثبت نکرده است"
          description="منتظر بمانید تا افراد برای این نیازمندی درخواست ارسال کنند."
        />
      </Card>
    );
  }
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="font-bold">متقاضیان</h2>
        <Badge variant="secondary" className="text-[10px]">
          {toFa(apps.length)}
        </Badge>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto slim-scroll pr-1 -mr-1">
        {apps.map((a) => (
          <div
            key={a.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
          >
            <button
              onClick={() => navigate({ view: "profile", id: a.applicant.id })}
            >
              <UserAvatar
                name={a.applicant.name}
                avatarUrl={a.applicant.avatarUrl}
                verified={a.applicant.isVerifiedBadge}
                size="md"
              />
            </button>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => navigate({ view: "profile", id: a.applicant.id })}
                  className="font-bold text-sm hover:underline truncate"
                >
                  {a.applicant.name}
                </button>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {timeAgoFa(a.createdAt)}
                </span>
              </div>
              {a.message && (
                <p className="text-xs text-muted-foreground leading-6 whitespace-pre-wrap break-words bg-muted/40 rounded-lg p-2">
                  {a.message}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 mt-1 gap-1 text-xs"
                onClick={() =>
                  navigate({ view: "profile", id: a.applicant.id })
                }
              >
                مشاهده پروفایل
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ApplySection({
  jobId,
  alreadyApplied,
  jobClosed,
  onApplied,
}: {
  jobId: string;
  alreadyApplied: boolean;
  jobClosed: boolean;
  onApplied: () => void;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { apiPost } = await import("@/lib/api-client");
      await apiPost(`/api/jobs/${jobId}/apply`, { message: message.trim() });
      toast({ title: "درخواست شما ارسال شد ✅" });
      setMessage("");
      onApplied();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (jobClosed) {
    return (
      <Card className="p-6 text-center bg-muted/30">
        <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          این نیازمندی بسته شده و دیگر قابل درخواست نیست.
        </p>
      </Card>
    );
  }

  if (alreadyApplied) {
    return (
      <Card className="p-6 text-center space-y-2 bg-success/5 border-success/30">
        <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
        <h3 className="font-bold">درخواست شما ثبت شده است</h3>
        <p className="text-sm text-muted-foreground">
          شما قبلاً برای این نیازمندی درخواست ارسال کرده‌اید. در صورت نیاز می‌توانید
          از بخش چت با صاحب آگهی در ارتباط باشید.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Send className="w-5 h-5 text-primary" />
        <h2 className="font-bold">ارسال درخواست</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        برای این نیازمندی، درخواست خود را همراه با توضیحات ارسال کنید. پس از
        ارسال، یک گفتگو با صاحب آگهی آغاز خواهد شد.
      </p>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="خودتان را معرفی کنید، مهارت‌ها و تجربه‌های مرتبط را بنویسید..."
        rows={5}
        maxLength={2000}
        className="resize-none"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {toFa(message.length)}/{toFa(2000)}
        </span>
        <Button
          onClick={submit}
          disabled={submitting}
          className="gap-1.5"
          size="sm"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              در حال ارسال...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              ارسال درخواست
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
