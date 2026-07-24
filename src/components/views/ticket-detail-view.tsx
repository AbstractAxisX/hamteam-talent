"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
      // scroll to bottom
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
      const res = await api(`/api/admin/users/${ticket.user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
        headers: { "Content-Type": "application/json" },
      }) as { ok: boolean; user: { isBanned: boolean; isVerifiedBadge: boolean } };
      setTargetUserState({
        isVerifiedBadge: res.user.isVerifiedBadge,
        isBanned: res.user.isBanned,
      });
      toast({
        title: "عملیات انجام شد",
        description:
          action === "ban" ? "کاربر مسدود شد"
          : action === "unban" ? "مسدودیت کاربر لغو شد"
          : action === "verify" ? "تیک آبی اعطا شد"
          : "تیک آبی لغو شد",
      });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  if (userLoading || !user) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={TicketIcon}
          title="تیکت یافت نشد"
          description="ممکن است حذف شده باشد یا شناسه اشتباه باشد."
          action={
            <Button variant="outline" onClick={() => navigate({ view: "tickets" })} className="gap-1.5">
              <ArrowRight className="w-4 h-4" />
              بازگشت به تیکت‌ها
            </Button>
          }
        />
      </Card>
    );
  }

  const isOpen = ticket.status === "open";
  const targetVerified = targetUserState?.isVerifiedBadge ?? ticket.user.isVerifiedBadge;
  const targetBanned = targetUserState?.isBanned ?? ticket.user.isBanned;

  return (
    <div className="space-y-4">
      {/* Back button + header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ view: "tickets" })}
          className="gap-1.5 -mr-2"
        >
          <ArrowRight className="w-4 h-4" />
          تیکت‌ها
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Main thread */}
        <div className="space-y-4 min-w-0">
          {/* Ticket header card */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${
                    isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <TicketIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold leading-tight">{ticket.subject}</h1>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>{formatFaDateTime(ticket.createdAt)}</span>
                    <span>·</span>
                    <span>توسط {ticket.user.name}</span>
                  </div>
                </div>
              </div>
              <Badge
                variant={isOpen ? "default" : "secondary"}
                className={isOpen ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10" : ""}
              >
                {isOpen ? "باز" : "بسته‌شده"}
              </Badge>
            </div>
            <Separator className="my-4" />
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{ticket.body}</p>
          </Card>

          {/* Replies thread */}
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                گفتگو ({toFa(ticket.replies.length)} پاسخ)
              </h2>
            </div>
            <div
              ref={scrollRef}
              className="max-h-[460px] overflow-y-auto slim-scroll p-4 space-y-3"
            >
              {ticket.replies.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  هنوز پاسخی ثبت نشده است
                </div>
              ) : (
                ticket.replies.map((r) => {
                  const replyIsAdmin = r.user.role === "admin";
                  const isMe = r.user.id === user.id;
                  return (
                    <div
                      key={r.id}
                      className={`flex gap-3 ${
                        isMe ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div className="shrink-0">
                        <UserAvatar
                          name={r.user.name}
                          avatarUrl={r.user.avatarUrl}
                          size="sm"
                          verified={false}
                        />
                      </div>
                      <div className={`min-w-0 flex-1 ${isMe ? "items-end text-right" : ""}`}>
                        <div
                          className={`inline-block rounded-xl px-3 py-2 max-w-[85%] ${
                            replyIsAdmin
                              ? "bg-warning/10 border border-warning/30"
                              : isMe
                              ? "bg-primary/10"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-semibold">{r.user.name}</span>
                            {replyIsAdmin && (
                              <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/15 text-[10px] py-0 px-1.5">
                                <Shield className="w-3 h-3" />
                                مدیریت
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-right">
                            {r.content}
                          </p>
                        </div>
                        <div className={`text-[10px] text-muted-foreground mt-1 ${isMe ? "text-left" : ""}`}>
                          {timeAgoFa(r.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Reply box */}
          {isOpen ? (
            <Card className="p-4">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                rows={3}
                maxLength={5000}
                disabled={submitting}
              />
              <div className="flex items-center justify-between mt-3 gap-2">
                <span className="text-xs text-muted-foreground">
                  {toFa(reply.length)} / {toFa(5000)}
                </span>
                <div className="flex items-center gap-2">
                  {canClose && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5" disabled={closing}>
                          <Lock className="w-4 h-4" />
                          بستن تیکت
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>بستن تیکت</AlertDialogTitle>
                          <AlertDialogDescription>
                            آیا از بستن این تیکت مطمئن هستید؟ پس از بسته شدن، امکان ارسال پاسخ جدید وجود ندارد.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>انصراف</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleClose}
                            className="bg-destructive hover:bg-destructive/90"
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
                    className="gap-1.5"
                    disabled={submitting || reply.trim().length === 0}
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "در حال ارسال..." : "ارسال پاسخ"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                این تیکت بسته شده است. در صورت نیاز، تیکت جدیدی ایجاد کنید.
              </div>
            </Card>
          )}
        </div>

        {/* Admin sidebar */}
        {isAdmin && (
          <aside className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-semibold">اطلاعات کاربر</h3>
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
                  className="font-semibold mt-2 hover:text-primary transition-colors"
                >
                  {ticket.user.name}
                </button>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap justify-center">
                  <Badge variant="secondary" className="text-[10px]">
                    {ticket.user.role === "admin" ? "مدیر" : "کاربر"}
                  </Badge>
                  {targetVerified && (
                    <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/15 text-[10px]">
                      <BadgeCheck className="w-3 h-3" />
                      تاییدشده
                    </Badge>
                  )}
                  {targetBanned && (
                    <Badge variant="destructive" className="text-[10px]">
                      <Ban className="w-3 h-3" />
                      مسدود
                    </Badge>
                  )}
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-muted-foreground">شماره موبایل</div>
                    <div className="font-mono" dir="ltr">{toFa(ticket.user.phone)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-muted-foreground">کد ملی</div>
                    <div className="font-mono" dir="ltr">{toFa(ticket.user.nationalId)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="text-muted-foreground">عضویت</div>
                    <div>{formatFaDateTime(ticket.user.createdAt)}</div>
                  </div>
                </div>
                {ticket.user.province && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="text-muted-foreground">موقعیت</div>
                      <div>
                        {getProvinceName(ticket.user.province)}
                        {ticket.user.city ? `، ${ticket.user.city}` : ""}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 gap-1.5"
                onClick={() => navigate({ view: "profile", id: ticket.user.id })}
              >
                <UserIcon className="w-4 h-4" />
                مشاهده پروفایل
              </Button>

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">اقدامات سریع</div>
                {!targetVerified ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
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
                    className="w-full gap-1.5"
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
                        className="w-full gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={ticket.user.id === user.id}
                      >
                        <Ban className="w-4 h-4" />
                        مسدود کردن کاربر
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>مسدود کردن کاربر</AlertDialogTitle>
                        <AlertDialogDescription>
                          کاربر پس از مسدود شدن نمی‌تواند وارد سیستم شود. آیا مطمئن هستید؟
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleAdminAction("ban")}
                          className="bg-destructive hover:bg-destructive/90"
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
                    className="w-full gap-1.5 border-success/40 text-success hover:bg-success/10 hover:text-success"
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
