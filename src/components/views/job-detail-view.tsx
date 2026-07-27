"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api, apiPut, apiPost } from "@/lib/api-client";
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
  Loader2,
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

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Card className="p-6 space-y-4 border-border/60 rounded-2xl">
          <Skeleton className="h-7 w-3/4 rounded" />
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-24 w-full rounded" />
          <Skeleton className="h-6 w-56 rounded" />
        </Card>
        <Card className="p-6 space-y-3 border-border/60 rounded-2xl">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-32 w-full rounded" />
        </Card>
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        kind="jobs"
        title="نیازمندی پیدا نشد"
        description="ممکن است حذف شده باشد یا لینک اشتباه باشد."
        action={
          <Button onClick={() => navigate({ view: "jobs" })} className="gap-1.5 rounded-xl">
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
  const isClosed = job.status === "closed";

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: "jobs" })}
        className="gap-1.5 -mr-2 text-muted-foreground hover:text-foreground rounded-xl h-9"
      >
        <ChevronRight className="w-4 h-4" />
        بازگشت به نیازمندی‌ها
      </Button>

      {/* ═══ Hero card ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-6 border-border/60 shadow-card rounded-2xl space-y-4">
          {/* Title + status */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{job.title}</h1>
              {isClosed ? (
                <Badge variant="secondary" className="gap-1 h-6 rounded-md">
                  <XCircle className="w-3 h-3" /> بسته شده
                </Badge>
              ) : (
                <Badge className="gap-1 bg-success/15 text-success hover:bg-success/15 border-success/30 h-6 rounded-md">
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

          {/* Category + skills */}
          {(job.categoryName || job.skills.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {job.categoryName && (
                <Badge variant="secondary" className="h-6 rounded-md">{job.categoryName}</Badge>
              )}
              {job.skills.map((s) => (
                <Badge
                  key={s.id}
                  variant="outline"
                  className="h-6 rounded-md border-primary/25 text-primary"
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* ═══ Description card ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-6 border-border/60 shadow-card rounded-2xl">
          <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" />
            توضیحات
          </h2>
          <p className="text-[15px] leading-8 whitespace-pre-wrap break-words text-foreground/90">
            {job.description}
          </p>
        </Card>
      </motion.div>

      {/* ═══ Owner card ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-5 border-border/60 shadow-card rounded-2xl">
          <h2 className="text-sm font-bold text-muted-foreground mb-3">صاحب نیازمندی</h2>
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
              <span className="font-bold text-sm truncate block">{job.user.name}</span>
              <p className="text-xs text-muted-foreground">مشاهده پروفایل</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </button>
        </Card>
      </motion.div>

      {/* ═══ Owner actions (close/reopen) ═══ */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-4 border-border/60 shadow-card rounded-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-xl h-9"
                    disabled={isClosed}
                  >
                    <XCircle className="w-4 h-4" />
                    {isClosed ? "بسته شده" : "بستن آگهی"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>بستن این آگهی؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      پس از بستن، آگهی از فهرست عمومی خارج می‌شود و درخواست جدیدی قابل ارسال
                      نخواهد بود. می‌توانید بعداً دوباره بازش کنید.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-xl"
                      onClick={async () => {
                        try {
                          await apiPut(`/api/jobs/${id}`, { status: "closed" });
                          toast({ title: "آگهی بسته شد" });
                          load();
                        } catch (e) {
                          toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
                        }
                      }}
                    >
                      بستن آگهی
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {isClosed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl h-9 border-success/30 text-success hover:bg-success/10"
                  onClick={async () => {
                    try {
                      await apiPut(`/api/jobs/${id}`, { status: "open" });
                      toast({ title: "آگهی باز شد" });
                      load();
                    } catch (e) {
                      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
                    }
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  باز کردن
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ═══ Owner: applications list ═══ */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ApplicationsSection job={job} />
        </motion.div>
      )}

      {/* ═══ Non-owner: apply ═══ */}
      {!isOwner && user && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ApplySection
            jobId={id}
            alreadyApplied={job.appliedByMe}
            jobClosed={isClosed}
            onApplied={load}
          />
        </motion.div>
      )}

      {/* ═══ Guest: login prompt ═══ */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-6 text-center space-y-3 bg-brand-gradient-soft border-primary/20 rounded-2xl shadow-card">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">برای ارسال درخواست وارد شوید</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-7">
                برای ارتباط با صاحب نیازمندی باید وارد حساب خود شوید.
              </p>
            </div>
            <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5 rounded-xl h-10 font-semibold">
              ورود / ثبت‌نام
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/* ── Applications section (owner) ── */
function ApplicationsSection({ job }: { job: JobDetail }) {
  const apps = job.applications ?? [];
  if (apps.length === 0) {
    return (
      <Card className="p-6 border-border/60 shadow-card rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-extrabold">متقاضیان</h2>
          <Badge variant="secondary" className="text-[10px] rounded-md">{toFa(0)}</Badge>
        </div>
        <EmptyState
          kind="people"
          title="هنوز متقاضی‌ای ثبت نکرده است"
          description="منتظر بمانید تا افراد برای این نیازمندی درخواست ارسال کنند."
        />
      </Card>
    );
  }
  return (
    <Card className="p-6 border-border/60 shadow-card rounded-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="font-extrabold">متقاضیان</h2>
        <Badge variant="secondary" className="text-[10px] rounded-md">{toFa(apps.length)}</Badge>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto slim-scroll pr-1 -mr-1">
        {apps.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
            className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors"
          >
            <button onClick={() => navigate({ view: "profile", id: a.applicant.id })}>
              <UserAvatar
                name={a.applicant.name}
                avatarUrl={a.applicant.avatarUrl}
                verified={a.applicant.isVerifiedBadge}
                size="md"
              />
            </button>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => navigate({ view: "profile", id: a.applicant.id })}
                  className="font-bold text-sm hover:text-primary transition-colors truncate"
                >
                  {a.applicant.name}
                </button>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {timeAgoFa(a.createdAt)}
                </span>
              </div>
              {a.message && (
                <p className="text-xs text-muted-foreground leading-7 whitespace-pre-wrap break-words bg-muted/50 rounded-lg p-2.5">
                  {a.message}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 mt-1 gap-1 text-xs rounded-lg"
                onClick={() => navigate({ view: "profile", id: a.applicant.id })}
              >
                مشاهده پروفایل
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

/* ── Apply section (non-owner) ── */
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
      await apiPost(`/api/jobs/${jobId}/apply`, { message: message.trim() });
      toast({ title: "درخواست شما ارسال شد ✅" });
      setMessage("");
      onApplied();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (jobClosed) {
    return (
      <Card className="p-6 text-center bg-muted/30 border-border/60 rounded-2xl shadow-card">
        <XCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground leading-7">
          این نیازمندی بسته شده و دیگر قابل درخواست نیست.
        </p>
      </Card>
    );
  }

  if (alreadyApplied) {
    return (
      <Card className="p-6 text-center space-y-2 bg-success/5 border-success/30 rounded-2xl shadow-card">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
        <h3 className="font-extrabold text-lg">درخواست شما ثبت شده است</h3>
        <p className="text-sm text-muted-foreground leading-7">
          شما قبلاً برای این نیازمندی درخواست ارسال کرده‌اید. در صورت نیاز می‌توانید از
          بخش چت با صاحب آگهی در ارتباط باشید.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-3 border-border/60 shadow-card rounded-2xl">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
          <Send className="w-4 h-4" />
        </span>
        <h2 className="font-extrabold text-lg">ارسال درخواست</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-7">
        برای این نیازمندی، درخواست خود را همراه با توضیحات ارسال کنید. پس از ارسال، یک
        گفتگو با صاحب آگهی آغاز خواهد شد.
      </p>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="خودتان را معرفی کنید، مهارت‌ها و تجربه‌های مرتبط را بنویسید..."
        rows={5}
        maxLength={2000}
        className="resize-none rounded-xl text-[15px] leading-7"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground nums-fa">
          {toFa(message.length)}/{toFa(2000)}
        </span>
        <Button
          onClick={submit}
          disabled={submitting}
          className="gap-1.5 rounded-xl h-10 font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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
