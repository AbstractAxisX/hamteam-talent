"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatFaDate, formatFaDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type TicketUser = {
  id: string;
  name: string;
  role?: string;
  isVerifiedBadge: boolean;
  isBanned?: boolean;
  avatarUrl: string | null;
  phone?: string;
  nationalId?: string;
  createdAt?: string;
  bioShort?: string;
  province?: string | null;
  city?: string | null;
};

type Reply = {
  id: string;
  content: string;
  isAdmin?: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

type TicketDetail = {
  id: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: TicketUser;
  replies: Reply[];
};

export function TicketDetailView({ id }: { id: string }) {
  const { user, loading: userLoading } = useUser();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<{ ticket: TicketDetail }>(`/api/tickets/${id}`);
      setTicket(d.ticket);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitReply() {
    if (submitting) return;
    if (reply.trim().length < 1) {
      toast({ title: "خالی است", description: "متن پاسخ را بنویسید.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const r = await apiPost<{ ok: boolean; reply: Reply }>(`/api/tickets/${id}`, {
        content: reply.trim(),
      });
      setTicket((t) => (t ? { ...t, replies: [...t.replies, r.reply] } : t));
      setReply("");
      toast({ title: "ارسال شد", description: "پاسخ شما ثبت شد." });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function closeTicket() {
    if (closing) return;
    setClosing(true);
    try {
      await apiPost(`/api/tickets/${id}/close`);
      setTicket((t) => (t ? { ...t, status: "closed" } : t));
      toast({ title: "بسته شد", description: "تیکت بسته شد." });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setClosing(false);
    }
  }

  if (!userLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          kind="tickets"
          title="برای مشاهده تیکت وارد شوید"
          description="برای پیگیری تیکت‌های پشتیبانی ابتدا وارد شوید."
          action={
            <Button onClick={() => navigate({ view: "auth" })} className="rounded-2xl font-bold gap-1.5">
              <Icon name="lock" className="w-4 h-4" />
              ورود / ثبت‌نام
            </Button>
          }
        />
      </div>
    );
  }

  if (loading || !ticket) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Card className="glass p-6 rounded-3xl border-border/50 space-y-4">
          <Skeleton className="h-8 w-3/4 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-32 w-full rounded" />
        </Card>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";
  const isOwner = user?.id === ticket.userId;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ═══ Back button ═══ */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: "tickets" })}
        className="gap-1.5 h-9 rounded-xl font-semibold text-muted-foreground hover:text-foreground"
      >
        <Icon name="arrowRight" className="w-4 h-4" />
        بازگشت به تیکت‌ها
      </Button>

      {/* ═══ Main ticket ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="glass p-6 sm:p-8 rounded-3xl border-border/50 shadow-float space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-black leading-tight tracking-tight flex-1">{ticket.subject}</h1>
              <Badge
                className={cn(
                  "shrink-0 h-7 px-3 rounded-lg font-medium",
                  isClosed ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary border border-primary/30"
                )}
              >
                {isClosed ? "بسته شده" : "باز"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Icon name="clock" className="w-3.5 h-3.5" />
                {timeAgoFa(ticket.createdAt)}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span className="nums-fa">{formatFaDate(ticket.createdAt)}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="chat" className="w-3.5 h-3.5" />
                {toFa(ticket.replies.length)} پاسخ
              </span>
            </div>
          </div>

          {/* Owner info */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-background/40 border border-border/50">
            <button
              onClick={() => navigate({ view: "profile", id: ticket.user.id })}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <UserAvatar
                name={ticket.user.name}
                avatarUrl={ticket.user.avatarUrl}
                verified={ticket.user.isVerifiedBadge}
                size="md"
              />
              <div className="text-right">
                <p className="text-sm font-bold">{ticket.user.name}</p>
                <p className="text-xs text-muted-foreground">سازنده‌ی تیکت</p>
              </div>
            </button>
            {isOwner && !isClosed && (
              <Button
                variant="outline"
                size="sm"
                onClick={closeTicket}
                disabled={closing}
                className="gap-1.5 rounded-2xl font-semibold border-rose/30 text-rose hover:bg-rose/5"
              >
                {closing ? <Spinner className="w-3.5 h-3.5" /> : <Icon name="x" className="w-3.5 h-3.5" />}
                بستن تیکت
              </Button>
            )}
          </div>

          {/* Initial body */}
          <div>
            <h2 className="text-xs font-bold text-muted-foreground mb-2">متن اولیه</h2>
            <p className="text-[15px] leading-8 whitespace-pre-wrap break-words">
              {ticket.body}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* ═══ Replies thread ═══ */}
      {ticket.replies.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground">پاسخ‌ها</h2>
          <div className="space-y-3 max-h-[480px] overflow-y-auto slim-scroll pl-1">
            {ticket.replies.map((r, i) => {
              const isOwn = user?.id === r.user.id;
              const isStaff = !!r.isAdmin;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.25), ease: [0.16, 1, 0.3, 1] }}
                  className={cn("flex flex-col items-start gap-1", isOwn ? "items-end" : "items-start")}
                >
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate({ view: "profile", id: r.user.id })}>
                      <UserAvatar
                        name={r.user.name}
                        avatarUrl={r.user.avatarUrl}
                        size="xs"
                      />
                    </button>
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      {r.user.name}
                      {isStaff && (
                        <Badge className="h-4 px-1 text-[9px] rounded bg-gold/20 text-gold border border-gold/30">پشتیبانی</Badge>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground nums-fa">{timeAgoFa(r.createdAt)}</span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] p-3.5 rounded-2xl border",
                      isOwn
                        ? "bg-primary text-primary-foreground border-primary"
                        : "glass border-border/50"
                    )}
                  >
                    <p className="text-sm leading-7 whitespace-pre-wrap break-words">{r.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Reply form ═══ */}
      {!isClosed ? (
        <Card className="glass p-4 sm:p-5 rounded-3xl border-border/50 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="pencil" className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">پاسخ جدید</h2>
          </div>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="پاسخ خود را بنویسید..."
            rows={4}
            maxLength={5000}
            className="resize-none rounded-2xl bg-background/40 border-border/50 focus-visible:ring-primary/60 min-h-[100px]"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground nums-fa">{toFa(reply.length)} / {toFa(5000)}</span>
            <Button
              onClick={submitReply}
              disabled={submitting}
              className="gap-1.5 rounded-2xl font-bold bg-primary text-primary-foreground shadow-glow"
            >
              {submitting ? <Spinner className="w-4 h-4" /> : <Icon name="send" className="w-4 h-4" />}
              ارسال پاسخ
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="glass p-5 rounded-3xl border-border/50 shadow-soft text-center space-y-2">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-muted text-muted-foreground mx-auto">
            <Icon name="checkCircle" className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-sm">این تیکت بسته شده است</h2>
          <p className="text-xs text-muted-foreground leading-5">
            برای ادامه‌ی گفتگو تیکت جدیدی ثبت کنید.
          </p>
        </Card>
      )}
    </div>
  );
}
