"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { NeedDetail } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatCount, formatFaDate } from "@/lib/format";
import { getProvinceName } from "@/lib/geo";
import { cn } from "@/lib/utils";

/* ── Spinner (no lucide) ── */
function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function NeedDetailView({ id }: { id: string }) {
  const { user, loading: userLoading } = useUser();
  const [need, setNeed] = useState<NeedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api<{ need: NeedDetail }>(`/api/needs/${id}`);
      setNeed(data.need);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("یافت نشد")) setNotFound(true);
      else toast({ title: "خطا", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          kind="jobs"
          title="نیازمندی یافت نشد"
          description="ممکن است حذف شده باشد یا شناسه اشتباه باشد."
          action={
            <Button onClick={() => navigate({ view: "needs" })} className="rounded-2xl font-bold gap-1.5">
              <Icon name="arrowRight" className="w-4 h-4" />
              بازگشت به نیازمندی‌ها
            </Button>
          }
        />
      </div>
    );
  }

  if (loading || !need) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Card className="glass p-6 rounded-3xl border-border/50 space-y-4">
          <Skeleton className="h-8 w-3/4 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-32 w-full rounded" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </Card>
      </div>
    );
  }

  const isOwner = user?.id === need.user.id;
  const isClosed = need.status === "closed";
  const locationLabel = need.city
    ? `${need.city}${need.province ? `، ${getProvinceName(need.province)}` : ""}`
    : need.province
    ? getProvinceName(need.province)
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ═══ Back button ═══ */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: "needs" })}
        className="gap-1.5 h-9 rounded-xl font-semibold text-muted-foreground hover:text-foreground"
      >
        <Icon name="arrowRight" className="w-4 h-4" />
        بازگشت
      </Button>

      {/* ═══ Main need card ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="glass p-6 sm:p-8 rounded-3xl border-border/50 shadow-float space-y-6">
          {/* Header: title + status */}
          <div>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-black leading-tight tracking-tight flex-1">{need.title}</h1>
              {isClosed && (
                <Badge variant="secondary" className="shrink-0 h-7 px-3 rounded-lg font-medium">
                  بسته شده
                </Badge>
              )}
              {need.appliedByMe && !isClosed && (
                <Badge variant="outline" className="shrink-0 h-7 px-3 rounded-lg border-success/40 text-success font-medium">
                  درخواست داده‌ام
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Icon name="clock" className="w-3.5 h-3.5" />
                {timeAgoFa(need.createdAt)}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span className="nums-fa">{formatFaDate(need.createdAt)}</span>
              {locationLabel && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="mapPin" className="w-3.5 h-3.5" />
                    {locationLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Category + skill badges */}
          {(need.categoryName || need.skills.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {need.categoryName && (
                <Badge variant="secondary" className="text-xs h-7 px-3 rounded-lg font-medium">
                  {need.categoryName}
                </Badge>
              )}
              {need.skills.map((s) => (
                <Badge
                  key={s.id}
                  variant="outline"
                  className="text-xs h-7 px-3 rounded-lg border-primary/30 text-primary font-medium"
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-xs font-bold text-muted-foreground mb-2">توضیحات</h2>
            <p className="text-[15px] leading-8 whitespace-pre-wrap break-words">
              {need.description}
            </p>
          </div>

          {/* Attachments */}
          {need.attachments.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-muted-foreground mb-2">پیوست‌ها</h2>
              <div className="space-y-2">
                {need.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-background/40 border border-border/50 hover:border-primary/40 transition-colors group"
                  >
                    <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon name="upload" className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{a.fileName}</p>
                      <p className="text-xs text-muted-foreground nums-fa">
                        {a.fileSize > 0 ? `${toFa(Math.max(1, Math.round(a.fileSize / 1024)))} کیلوبایت` : "نامشخص"}
                      </p>
                    </div>
                    <Icon name="arrowLeft" className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Footer: owner + stats */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/50">
            <button
              onClick={() => navigate({ view: "profile", id: need.user.id })}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <UserAvatar
                name={need.user.name}
                avatarUrl={need.user.avatarUrl}
                verified={need.user.isVerifiedBadge}
                size="md"
              />
              <div className="text-right">
                <p className="text-sm font-bold">{need.user.name}</p>
                <p className="text-xs text-muted-foreground">سازنده‌ی نیازمندی</p>
              </div>
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Icon name="users" className="w-4 h-4" />
                <span className="nums-fa">{formatCount(need.applicationCount)} درخواست</span>
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══ Apply section ═══ */}
      {!isOwner && (
        <AnimatePresence mode="wait">
          {userLoading ? (
            <motion.div key="loading" exit={{ opacity: 0 }}>
              <Skeleton className="h-40 rounded-3xl" />
            </motion.div>
          ) : !user ? (
            <motion.div key="auth" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="glass p-6 rounded-3xl border-border/50 shadow-soft text-center space-y-3">
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
                  <Icon name="lock" className="w-6 h-6" />
                </div>
                <h2 className="font-bold text-lg">برای ثبت درخواست وارد شوید</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-6">
                  برای ارسال درخواست به این نیازمندی ابتدا باید وارد شوید.
                </p>
                <Button
                  onClick={() => navigate({ view: "auth" })}
                  className="gap-1.5 rounded-2xl font-bold mx-auto bg-primary text-primary-foreground"
                >
                  ورود / ثبت‌نام
                </Button>
              </Card>
            </motion.div>
          ) : need.appliedByMe ? (
            <motion.div key="applied" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="glass p-6 rounded-3xl border-success/40 shadow-soft text-center space-y-3">
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-success/15 text-success mx-auto">
                  <Icon name="checkCircle" className="w-7 h-7" />
                </div>
                <h2 className="font-bold text-lg">درخواست شما ثبت شد</h2>
                <p className="text-sm text-muted-foreground leading-6">
                  سازنده از طریق چت با شما در ارتباط خواهد بود.
                </p>
              </Card>
            </motion.div>
          ) : isClosed ? (
            <motion.div key="closed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="glass p-6 rounded-3xl border-border/50 shadow-soft text-center space-y-3">
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-muted text-muted-foreground mx-auto">
                  <Icon name="alert" className="w-6 h-6" />
                </div>
                <h2 className="font-bold text-lg">این نیازمندی بسته شده</h2>
                <p className="text-sm text-muted-foreground leading-6">
                  دیگر امکان ثبت درخواست وجود ندارد.
                </p>
              </Card>
            </motion.div>
          ) : (
            <ApplyForm needId={need.id} onApplied={load} key="form" />
          )}
        </AnimatePresence>
      )}

      {/* ═══ Applications (owner-only) ═══ */}
      {isOwner && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass p-5 sm:p-6 rounded-3xl border-border/50 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Icon name="users" className="w-5 h-5 text-primary" />
                درخواست‌ها
              </h2>
              <Badge variant="secondary" className="h-6 px-2 text-xs rounded-md">
                {toFa(need.applicationCount)}
              </Badge>
            </div>
            {need.applications.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                هنوز درخواستی برای این نیازمندی ثبت نشده.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto slim-scroll">
                {need.applications.map((app) => (
                  <div key={app.id} className="flex items-start gap-3 p-3 rounded-2xl bg-background/40 border border-border/50">
                    <button
                      onClick={() => navigate({ view: "profile", id: app.applicant.id })}
                      className="shrink-0"
                    >
                      <UserAvatar
                        name={app.applicant.name}
                        avatarUrl={app.applicant.avatarUrl}
                        verified={app.applicant.isVerifiedBadge}
                        size="md"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => navigate({ view: "profile", id: app.applicant.id })}
                          className="font-bold text-sm hover:text-primary transition-colors truncate"
                        >
                          {app.applicant.name}
                        </button>
                        <span className="text-xs text-muted-foreground nums-fa shrink-0">
                          {timeAgoFa(app.createdAt)}
                        </span>
                      </div>
                      {app.applicant.bioShort && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{app.applicant.bioShort}</p>
                      )}
                      {app.message && (
                        <p className="text-[13px] leading-6 mt-2 text-foreground/90 whitespace-pre-wrap break-words">
                          {app.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function ApplyForm({
  needId,
  onApplied,
}: {
  needId: string;
  onApplied: () => void;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiPost(`/api/needs/${needId}/apply`, { message: message.trim() });
      toast({ title: "ارسال شد", description: "درخواست شما با موفقیت ثبت شد." });
      onApplied();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <Card className="glass p-5 sm:p-6 rounded-3xl border-border/50 shadow-soft space-y-4">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Icon name="send" className="w-5 h-5 text-primary" />
            ثبت درخواست
          </h2>
          <p className="text-xs text-muted-foreground mt-1">برای سازنده پیام بگذار (اختیاری)</p>
        </div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="مثلاً: سلام، من در این حوزه تجربه دارم و می‌تونم کمکتون کنم..."
          rows={4}
          maxLength={1000}
          className="resize-none rounded-2xl bg-background/40 border-border/50 focus-visible:ring-primary/60 min-h-[120px]"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground nums-fa">
            {toFa(message.length)} / {toFa(1000)}
          </span>
          <Button
            onClick={submit}
            disabled={submitting}
            className="gap-1.5 rounded-2xl font-bold bg-primary text-primary-foreground shadow-glow"
          >
            {submitting ? <Spinner className="w-3.5 h-3.5" /> : <Icon name="send" className="w-4 h-4" />}
            ارسال درخواست
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
