"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, formatFaDateTime, toFa } from "@/lib/format";
import { getProvinceName } from "@/lib/geo";
import {
  Ticket as TicketIcon,
  ArrowRight,
  Send,
  Lock,
  Shield,
  BadgeCheck,
  Ban,
  CheckCircle2,
  User as UserIcon,
  CalendarDays,
  MapPin,
  Phone,
  IdCard,
  Loader2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

/* ───────────────────────────── Types ───────────────────────────── */

type TicketDetail = {
  id: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    role: string;
    isVerifiedBadge: boolean;
    isBanned: boolean;
    avatarUrl: string | null;
    phone: string;
    nationalId: string;
    createdAt: string;
    bioShort: string;
    province: string | null;
    city: string | null;
  };
  replies: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      role: string;
      avatarUrl: string | null;
    };
  }[];
};

/* ───────────────────────────── Main View ───────────────────────────── */

export function TicketDetailView({ id }: { id: string }) {
  const { user, loading: userLoading } = useUser();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [targetUserState, setTargetUserState] = useState<{
    isVerifiedBadge: boolean;
    isBanned: boolean;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ ticket: TicketDetail }>(`/api/tickets/${id}`);
      setTicket(data.ticket);
      setTargetUserState({
        isVerifiedBadge: data.ticket.user.isVerifiedBadge,
        isBanned: data.ticket.user.isBanned,
      });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!userLoading && !user) {
      navigate({ view: "auth" });
    }
  }, [user, userLoading]);

  const isAdmin = user?.role === "admin";
  const isOwner = ticket && user ? ticket.userId === user.id : false;
  const canClose = ticket && user ? (isOwner || isAdmin) && ticket.status === "open" : false;

  async function handleReply() {
    const text = reply.trim();
    if (text.length < 1) return;
    setSubmitting(true);
    try {
      const res = await apiPost<{
        ok: boolean;
        reply: TicketDetail["replies"][number];
      }>(`/api/tickets/${id}`, { content: text });
      setTicket((prev) =>
        prev ? { ...prev, replies: [...prev.replies, res.reply] } : prev
      );
      setReply("");
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
      toast({ title: "پاسخ ثبت شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    try {
      await apiPost(`/api/tickets/${id}/close`);
      setTicket((prev) => (prev ? { ...prev, status: "closed" } : prev));
      toast({ title: "تیکت بسته شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setClosing(false);
    }
  }

  async function handleAdminAction(action: "ban" | "unban" | "verify" | "unverify") {
    if (!ticket) return;
    try {
      const res = (await api(`/api/admin/users/${ticket.user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
        headers: { "Content-Type": "application/json" },
      })) as { ok: boolean; user: { isBanned: boolean; isVerifiedBadge: boolean } };
      setTargetUserState({
        isVerifiedBadge: res.user.isVerifiedBadge,
        isBanned: res.user.isBanned,
      });
      toast({
        title: "عملیات انجام شد",
        description:
          action === "ban"
            ? "کاربر مسدود شد"
            : action === "unban"
              ? "مسدودیت کاربر لغو شد"
              : action === "verify"
                ? "تیک آبی اعطا شد"
                : "تیک آبی لغو شد",
      });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  /* ── Loading state ── */
  if (userLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  /* ── Not found ── */
  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <BackButton />
        <Card className="p-0 rounded-2xl border-border/60 overflow-hidden">
          <EmptyState
            kind="tickets"
            title="تیکت یافت نشد"
            description="ممکن است حذف شده باشد یا شناسه اشتباه باشد."
            action={
              <Button
                variant="outline"
                onClick={() => navigate({ view: "tickets" })}
                className="gap-1.5 rounded-2xl border-forest/30 text-forest hover:bg-forest/5"
              >
                <ArrowRight className="w-4 h-4" />
                بازگشت به تیکت‌ها
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const isOpen = ticket.status === "open";
  const targetVerified = targetUserState?.isVerifiedBadge ?? ticket.user.isVerifiedBadge;
  const targetBanned = targetUserState?.isBanned ?? ticket.user.isBanned;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Back button */}
      <BackButton />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* ═══ Main thread ═══ */}
        <div className="space-y-4 min-w-0">
          {/* ── Ticket header card ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="p-5 rounded-2xl border-border/60 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "grid place-items-center w-11 h-11 rounded-2xl shrink-0",
                      isOpen
                        ? "bg-lime/20 text-forest"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <TicketIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-extrabold leading-tight tracking-tight">
                      {ticket.subject}
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      <span>{formatFaDateTime(ticket.createdAt)}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span>توسط {ticket.user.name}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge isOpen={isOpen} />
              </div>
              <Separator className="my-4" />
              <p className="text-sm whitespace-pre-wrap leading-7">{ticket.body}</p>
            </Card>
          </motion.div>

          {/* ── Replies thread ── */}
          <Card className="p-0 overflow-hidden rounded-2xl border-border/60 shadow-sm">
            <div className="px-5 py-3.5 border-b border-border/60 bg-forest text-lime flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span className="grid place-items-center w-6 h-6 rounded-lg bg-white/10">
                  <TicketIcon className="w-3.5 h-3.5" />
                </span>
                گفتگو ({toFa(ticket.replies.length)} پاسخ)
              </h2>
            </div>
            <div
              ref={scrollRef}
              className="max-h-[460px] overflow-y-auto slim-scroll p-4 space-y-3 bg-cream-gradient"
            >
              {ticket.replies.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  هنوز پاسخی ثبت نشده است
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {ticket.replies.map((r) => {
                    const replyIsAdmin = r.user.role === "admin";
                    const isCreator = r.user.id === ticket.userId;
                    // Per spec: creator = right (forest), admin = left (lime accent)
                    const onRight = isCreator && !replyIsAdmin;
                    return (
                      <motion.div
                        key={r.id}
                        layout="position"
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                          "flex gap-3",
                          // onRight (creator) → bubble on RIGHT in RTL → use flex-row-reverse
                          onRight ? "flex-row-reverse" : ""
                        )}
                      >
                        <div className="shrink-0">
                          <UserAvatar
                            name={r.user.name}
                            avatarUrl={r.user.avatarUrl}
                            size="sm"
                            verified={false}
                          />
                        </div>
                        <div
                          className={cn(
                            "min-w-0 max-w-[80%] flex flex-col",
                            onRight ? "items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "inline-block px-3.5 py-2.5 shadow-sm",
                              replyIsAdmin
                                ? // Admin → LEFT, lime accent
                                  "bg-lime/15 border border-lime/40 rounded-2xl rounded-tr-md"
                                : onRight
                                  ? // Creator → RIGHT, forest
                                    "bg-forest text-white rounded-2xl rounded-tl-md"
                                  : // Other (non-admin, non-creator) → LEFT, card
                                    "bg-card border border-border/60 rounded-2xl rounded-tr-md"
                            )}
                          >
                            <div
                              className={cn(
                                "flex items-center gap-1.5 mb-1",
                                onRight ? "justify-end" : ""
                              )}
                            >
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  replyIsAdmin
                                    ? "text-forest"
                                    : onRight
                                      ? "text-white"
                                      : "text-foreground"
                                )}
                              >
                                {r.user.name}
                              </span>
                              {replyIsAdmin && (
                                <Badge className="bg-forest text-lime border-forest hover:bg-forest text-[10px] py-0 px-1.5 gap-0.5">
                                  <Shield className="w-3 h-3" />
                                  مدیر
                                </Badge>
                              )}
                            </div>
                            <p
                              className={cn(
                                "text-sm whitespace-pre-wrap leading-7 text-right",
                                onRight ? "text-white" : "text-foreground"
                              )}
                            >
                              {r.content}
                            </p>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 px-1">
                            {timeAgoFa(r.createdAt)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </Card>

          {/* ── Reply box ── */}
          {isOpen ? (
            <Card className="p-4 rounded-2xl border-border/60 shadow-sm">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                rows={3}
                maxLength={5000}
                disabled={submitting}
                className="rounded-xl resize-none focus-visible:ring-lime/50"
              />
              <div className="flex items-center justify-between mt-3 gap-2">
                <span className="text-xs text-muted-foreground">
                  {toFa(reply.length)} / {toFa(5000)}
                </span>
                <div className="flex items-center gap-2">
                  {canClose && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 rounded-2xl border-rose/40 text-rose hover:bg-rose/5"
                          disabled={closing}
                        >
                          <Lock className="w-4 h-4" />
                          <span className="hidden sm:inline">بستن تیکت</span>
                          <span className="sm:hidden">بستن</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>بستن تیکت</AlertDialogTitle>
                          <AlertDialogDescription>
                            آیا از بستن این تیکت مطمئن هستید؟ پس از بسته شدن، امکان ارسال پاسخ جدید وجود ندارد.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleClose}
                            className="bg-rose hover:bg-rose/90 rounded-2xl"
                          >
                            بستن تیکت
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button
                    onClick={handleReply}
                    size="sm"
                    className="gap-1.5 rounded-2xl bg-lime text-forest font-bold hover:bg-lime/90 shadow-md"
                    disabled={submitting || reply.trim().length === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        ارسال پاسخ
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 rounded-2xl border-border/60 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                این تیکت بسته شده است. در صورت نیاز، تیکت جدیدی ایجاد کنید.
              </div>
            </Card>
          )}
        </div>

        {/* ═══ Admin sidebar ═══ */}
        {isAdmin && (
          <aside className="space-y-4">
            <Card className="p-4 rounded-2xl border-border/60 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="grid place-items-center w-7 h-7 rounded-lg bg-forest/10 text-forest">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold">اطلاعات کاربر</h3>
              </div>

              <div className="flex flex-col items-center text-center pb-3">
                <UserAvatar
                  name={ticket.user.name}
                  avatarUrl={ticket.user.avatarUrl}
                  verified={targetVerified}
                  size="lg"
                />
                <button
                  onClick={() => navigate({ view: "profile", id: ticket.user.id })}
                  className="font-bold mt-2.5 hover:text-forest transition-colors"
                >
                  {ticket.user.name}
                </button>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap justify-center">
                  <Badge variant="secondary" className="text-[10px]">
                    {ticket.user.role === "admin" ? "مدیر" : "کاربر"}
                  </Badge>
                  {targetVerified && (
                    <Badge className="bg-gold/15 text-gold border-gold/30 hover:bg-gold/15 text-[10px] gap-0.5">
                      <BadgeCheck className="w-3 h-3" />
                      تاییدشده
                    </Badge>
                  )}
                  {targetBanned && (
                    <Badge variant="destructive" className="text-[10px] gap-0.5">
                      <Ban className="w-3 h-3" />
                      مسدود
                    </Badge>
                  )}
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2.5 text-xs">
                <InfoRow icon={Phone} label="شماره موبایل">
                  <span className="font-mono" dir="ltr">
                    {toFa(ticket.user.phone)}
                  </span>
                </InfoRow>
                <InfoRow icon={IdCard} label="کد ملی">
                  <span className="font-mono" dir="ltr">
                    {toFa(ticket.user.nationalId)}
                  </span>
                </InfoRow>
                <InfoRow icon={CalendarDays} label="عضویت">
                  {formatFaDateTime(ticket.user.createdAt)}
                </InfoRow>
                {ticket.user.province && (
                  <InfoRow icon={MapPin} label="موقعیت">
                    {getProvinceName(ticket.user.province)}
                    {ticket.user.city ? `، ${ticket.user.city}` : ""}
                  </InfoRow>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3.5 gap-1.5 rounded-xl border-forest/30 text-forest hover:bg-forest/5"
                onClick={() => navigate({ view: "profile", id: ticket.user.id })}
              >
                <UserIcon className="w-4 h-4" />
                مشاهده پروفایل
              </Button>

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground">اقدامات سریع</div>
                {!targetVerified ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 rounded-xl border-gold/40 text-gold hover:bg-gold/10 hover:text-gold"
                    onClick={() => handleAdminAction("verify")}
                    disabled={ticket.user.id === user.id}
                  >
                    <BadgeCheck className="w-4 h-4" />
                    اعطای تیک آبی
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 rounded-xl"
                    onClick={() => handleAdminAction("unverify")}
                    disabled={ticket.user.id === user.id}
                  >
                    <BadgeCheck className="w-4 h-4" />
                    لغو تیک آبی
                  </Button>
                )}
                {!targetBanned ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 rounded-xl border-rose/40 text-rose hover:bg-rose/5 hover:text-rose"
                        disabled={ticket.user.id === user.id}
                      >
                        <Ban className="w-4 h-4" />
                        مسدود کردن کاربر
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>مسدود کردن کاربر</AlertDialogTitle>
                        <AlertDialogDescription>
                          کاربر پس از مسدود شدن نمی‌تواند وارد سیستم شود. آیا مطمئن هستید؟
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleAdminAction("ban")}
                          className="bg-rose hover:bg-rose/90 rounded-2xl"
                        >
                          مسدود کردن
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 rounded-xl border-success/40 text-success hover:bg-success/10 hover:text-success"
                    onClick={() => handleAdminAction("unban")}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    رفع مسدودیت
                  </Button>
                )}
              </div>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Small Components ───────────────────────────── */

function BackButton() {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: "tickets" })}
        className="gap-1.5 -mr-2 rounded-2xl hover:bg-forest/5 hover:text-forest"
      >
        <ArrowRight className="w-4 h-4" />
        تیکت‌ها
      </Button>
    </div>
  );
}

function StatusBadge({ isOpen }: { isOpen: boolean }) {
  return isOpen ? (
    <Badge className="bg-lime/20 text-forest border-lime/40 hover:bg-lime/25">
      <CheckCircle2 className="w-3 h-3 ml-0.5" />
      باز
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-muted text-muted-foreground gap-0.5">
      <Lock className="w-3 h-3" />
      بسته‌شده
    </Badge>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-[10px] mb-0.5">{label}</div>
        <div className="font-medium text-xs">{children}</div>
      </div>
    </div>
  );
}
