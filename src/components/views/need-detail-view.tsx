"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost, apiPut } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { NeedDetail } from "@/lib/types";
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
  Briefcase,
  MapPin,
  Clock,
  Users,
  Paperclip,
  Download,
  Lock,
  CheckCircle2,
  Send,
  ArrowRight,
  Trash2,
  Power,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NeedDetailView({ id }: { id: string }) {
  const { user, loading: userLoading } = useUser();
  const [need, setNeed] = useState<NeedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api<{ need: NeedDetail }>(`/api/needs/${id}`);
      setNeed(data.need);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("یافت نشد")) setNotFound(true);
      else {
        toast({
          title: "خطا",
          description: msg,
          variant: "destructive",
        });
      }
      setNeed(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(load, 60);
    return () => clearTimeout(t);
  }, [load, reloadKey]);

  const isOwner = Boolean(user && need && user.id === need.user.id);

  async function toggleStatus() {
    if (!need) return;
    const next = need.status === "open" ? "closed" : "open";
    try {
      await apiPut(`/api/needs/${id}`, { status: next });
      setNeed({ ...need, status: next });
      toast({
        title: next === "closed" ? "نیازمندی بسته شد" : "نیازمندی باز شد",
      });
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  }

  async function deleteNeed() {
    try {
      const { apiDelete } = await import("@/lib/api-client");
      await apiDelete(`/api/needs/${id}`);
      toast({ title: "نیازمندی حذف شد" });
      navigate({ view: "needs" });
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  }

  /* ── Not found ── */
  if (!loading && notFound) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          kind="jobs"
          title="نیازمندی یافت نشد"
          description="ممکن است حذف شده باشد یا لینک نادرست باشد."
          action={
            <Button
              onClick={() => navigate({ view: "needs" })}
              className="gap-1.5 rounded-2xl"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به نیازمندی‌ها
            </Button>
          }
        />
      </div>
    );
  }

  if (loading || userLoading) return <DetailSkeleton />;

  if (!need) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          kind="generic"
          title="خطا در بارگذاری"
          description="لطفاً دوباره تلاش کنید."
          action={
            <Button
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-2xl"
            >
              تلاش مجدد
            </Button>
          }
        />
      </div>
    );
  }

  const locationLabel = need.city
    ? `${need.city}${need.province ? `، ${getProvinceName(need.province)}` : ""}`
    : need.province
    ? getProvinceName(need.province)
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ═══ Back button (mobile) ═══ */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: "needs" })}
        className="gap-1 text-muted-foreground h-8 -mr-2"
      >
        <ArrowRight className="w-4 h-4" />
        نیازمندی‌ها
      </Button>

      {/* ═══ Main card ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-6 rounded-2xl border-border/60 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <Briefcase className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-extrabold leading-7">
                  {need.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {timeAgoFa(need.createdAt)}
                  <span className="text-muted-foreground/50">•</span>
                  {formatFaDate(need.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 items-end">
              {need.status === "closed" ? (
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground text-[10px] h-5 rounded-md font-medium"
                >
                  بسته شده
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-success/40 text-success text-[10px] h-5 rounded-md font-medium"
                >
                  باز
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-[15px] leading-8 whitespace-pre-wrap break-words text-foreground/90">
            {need.description}
          </p>

          {/* Category + skills */}
          {(need.categoryName || need.skills.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap mt-4">
              {need.categoryName && (
                <Badge
                  variant="secondary"
                  className="text-[11px] h-6 rounded-md font-medium"
                >
                  {need.categoryName}
                </Badge>
              )}
              {need.skills.map((s) => (
                <Badge
                  key={s.id}
                  variant="outline"
                  className="text-[11px] h-6 rounded-md border-primary/30 text-primary font-medium"
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Location + application count */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            {locationLabel && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {locationLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {formatCount(need.applicationCount)} درخواست
            </span>
          </div>

          {/* Owner card */}
          <button
            onClick={() => navigate({ view: "profile", id: need.user.id })}
            className="mt-5 w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors text-right"
          >
            <UserAvatar
              name={need.user.name}
              avatarUrl={need.user.avatarUrl}
              verified={need.user.isVerifiedBadge}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{need.user.name}</p>
              <p className="text-[11px] text-muted-foreground">سازنده نیازمندی</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </button>

          {/* Attachments */}
          {need.attachments.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                پیوست‌ها ({toFa(need.attachments.length)})
              </p>
              <div className="space-y-1.5">
                {need.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors group"
                  >
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {a.fileName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatBytes(a.fileSize)}
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Owner actions */}
          {isOwner && (
            <div className="mt-5 flex items-center gap-2 pt-4 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleStatus}
                className="gap-1.5 rounded-xl h-9"
              >
                <Power className="w-4 h-4" />
                {need.status === "open" ? "بستن نیازمندی" : "باز کردن"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-xl h-9 text-rose border-rose/30 hover:bg-rose/5"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف نیازمندی؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      این عمل قابل بازگشت نیست. تمام درخواست‌های مرتبط نیز حذف می‌شوند.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">
                      انصراف
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteNeed}
                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      حذف کن
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ═══ Owner: Applications section ═══ */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                درخواست‌ها
              </h2>
              <Badge
                variant="secondary"
                className="text-[11px] h-6 rounded-md font-bold"
              >
                {toFa(need.applications.length)}
              </Badge>
            </div>
            {need.applications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  هنوز درخواستی دریافت نشده است.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto slim-scroll divide-y divide-border/40">
                <AnimatePresence>
                  {need.applications.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(i * 0.04, 0.3),
                      }}
                      className="p-4 flex items-start gap-3"
                    >
                      <button
                        onClick={() =>
                          navigate({ view: "profile", id: a.applicant.id })
                        }
                        className="shrink-0"
                      >
                        <UserAvatar
                          name={a.applicant.name}
                          avatarUrl={a.applicant.avatarUrl}
                          verified={a.applicant.isVerifiedBadge}
                          size="md"
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() =>
                              navigate({
                                view: "profile",
                                id: a.applicant.id,
                              })
                            }
                            className="font-bold text-sm hover:text-primary transition-colors"
                          >
                            {a.applicant.name}
                          </button>
                          <span className="text-[10px] text-muted-foreground">
                            · {timeAgoFa(a.createdAt)}
                          </span>
                        </div>
                        {a.applicant.bioShort && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {a.applicant.bioShort}
                          </p>
                        )}
                        {a.message && (
                          <p className="text-[13px] text-foreground/80 leading-6 mt-1.5 p-2.5 rounded-lg bg-muted/40">
                            {a.message}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate({ view: "profile", id: a.applicant.id })
                        }
                        className="shrink-0 h-8 text-primary hover:bg-primary/5"
                      >
                        مشاهده پروفایل
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* ═══ Non-owner: Apply section ═══ */}
      {!isOwner && (
        <ApplySection need={need} loggedIn={Boolean(user)} />
      )}
    </div>
  );
}

/* ── Apply form section ── */
function ApplySection({
  need,
  loggedIn,
}: {
  need: NeedDetail;
  loggedIn: boolean;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(need.appliedByMe);

  useEffect(() => {
    setApplied(need.appliedByMe);
  }, [need.appliedByMe]);

  async function submit() {
    if (!loggedIn) {
      navigate({ view: "auth" });
      return;
    }
    if (need.status === "closed") {
      toast({
        title: "این نیازمندی بسته شده است",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(`/api/needs/${need.id}/apply`, { message });
      setApplied(true);
      setMessage("");
      toast({ title: "درخواست شما ثبت شد ✅" });
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

  if (!loggedIn) {
    return (
      <Card className="p-6 rounded-2xl border-border/60 shadow-sm">
        <div className="flex flex-col items-center text-center gap-3">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
            <Lock className="w-6 h-6" />
          </span>
          <div>
            <p className="font-bold">برای ثبت درخواست وارد شوید</p>
            <p className="text-xs text-muted-foreground mt-1">
              برای ارسال درخواست باید حساب کاربری داشته باشید.
            </p>
          </div>
          <Button
            onClick={() => navigate({ view: "auth" })}
            className="gap-1.5 rounded-xl font-bold"
          >
            ورود / ثبت‌نام
          </Button>
        </div>
      </Card>
    );
  }

  if (applied) {
    return (
      <Card className="p-6 rounded-2xl border-success/30 bg-success/5 shadow-sm">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-success/15 text-success">
            <CheckCircle2 className="w-6 h-6" />
          </span>
          <div>
            <p className="font-bold text-success">درخواست شما ثبت شد</p>
            <p className="text-xs text-muted-foreground mt-1">
              سازنده نیازمندی درخواست شما را مشاهده خواهد کرد.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (need.status === "closed") {
    return (
      <Card className="p-6 rounded-2xl border-border/60 shadow-sm">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-muted text-muted-foreground">
            <Briefcase className="w-6 h-6" />
          </span>
          <div>
            <p className="font-bold">این نیازمندی بسته شده است</p>
            <p className="text-xs text-muted-foreground mt-1">
              دیگر نمی‌توانید برای آن درخواست ارسال کنید.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 rounded-2xl border-border/60 shadow-sm space-y-3">
      <div>
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          ارسال درخواست
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          یک پیام کوتاه به سازنده بنویسید (اختیاری).
        </p>
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="سلام، من به این نیازمندی علاقه‌مندم چون..."
        className="min-h-[100px] resize-none rounded-xl text-sm leading-7"
        maxLength={1000}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground">
          {toFa(message.length)}/{toFa(1000)}
        </span>
        <Button
          onClick={submit}
          disabled={submitting}
          className="gap-1.5 rounded-xl font-bold"
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

/* ── Skeleton ── */
function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Skeleton className="h-8 w-32 rounded" />
      <Card className="p-6 rounded-2xl space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        </div>
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </Card>
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}

/* ── Helpers ── */
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${toFa(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${toFa((bytes / 1024).toFixed(0))} کیلوبایت`;
  return `${toFa((bytes / 1024 / 1024).toFixed(1))} مگابایت`;
}
