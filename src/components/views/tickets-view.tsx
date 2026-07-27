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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa } from "@/lib/format";
import {
  Ticket as TicketIcon,
  Plus,
  MessageSquare,
  ChevronLeft,
  RefreshCcw,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";

/* ───────────────────────────── Types ───────────────────────────── */

type TicketItem = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
};

/* ───────────────────────────── Main View ───────────────────────────── */

export function TicketsView() {
  const { user, loading: userLoading } = useUser();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ tickets: TicketItem[] }>("/api/tickets");
      setTickets(data.tickets);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      navigate({ view: "auth" });
    }
  }, [user, userLoading]);

  async function handleCreate() {
    const s = subject.trim();
    const t = body.trim();
    if (s.length < 3) {
      toast({ title: "خطا", description: "موضوع حداقل ۳ نویسه باشد", variant: "destructive" });
      return;
    }
    if (t.length < 5) {
      toast({ title: "خطا", description: "متن تیکت حداقل ۵ نویسه باشد", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost<{ ok: boolean; id: string }>("/api/tickets", {
        subject: s,
        body: t,
      });
      toast({ title: "تیکت ثبت شد", description: "پاسخ شما به‌زودی داده خواهد شد" });
      setCreateOpen(false);
      setSubject("");
      setBody("");
      navigate({ view: "ticket", id: res.id });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (userLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-gradient text-white shadow-card">
            <TicketIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-tight tracking-tight">
              تیکت‌های پشتیبانی
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              سوالات، گزارش‌ها و درخواست‌های پشتیبانی
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={load}
            aria-label="بارگذاری مجدد"
            disabled={loading}
            className="rounded-xl hover:bg-muted"
          >
            <RefreshCcw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="gap-1.5 rounded-xl shadow-card hover:shadow-lift transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">تیکت جدید</span>
            <span className="sm:hidden">جدید</span>
          </Button>
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-0 rounded-2xl border-border/60 shadow-card overflow-hidden">
          <EmptyState
            kind="tickets"
            title="هنوز تیکتی ثبت نکرده‌اید"
            description="برای سوال، گزارش یا درخواست پشتیبانی، تیکت جدیدی ایجاد کنید."
            action={
              <Button
                onClick={() => setCreateOpen(true)}
                className="gap-1.5 rounded-xl shadow-card hover:shadow-lift transition-shadow"
              >
                <Plus className="w-4 h-4" />
                ایجاد اولین تیکت
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t, i) => {
            const isOpen = t.status === "open";
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                  delay: Math.min(i * 0.04, 0.4),
                }}
              >
                <Card
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate({ view: "ticket", id: t.id })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate({ view: "ticket", id: t.id });
                    }
                  }}
                  className="p-4 cursor-pointer hover:shadow-lift hover:border-primary/30 transition-all group rounded-2xl border-border/60 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`grid place-items-center w-11 h-11 rounded-2xl shrink-0 transition-colors ${
                          isOpen
                            ? "bg-success/12 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <TicketIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                            {t.subject}
                          </h3>
                          <StatusBadge isOpen={isOpen} />
                        </div>
                        <div className="flex items-center gap-2.5 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {toFa(t.replyCount)} پاسخ
                          </span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          <span>آخرین به‌روزرسانی {timeAgoFa(t.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all shrink-0" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>تیکت جدید</DialogTitle>
            <DialogDescription>
              تیم پشتیبانی در اسرع وقت پاسخ تیکت شما را خواهد داد.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-subject">موضوع</Label>
              <Input
                id="ticket-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: مشکل در ورود به حساب"
                maxLength={200}
                className="rounded-xl"
              />
              <div className="text-xs text-muted-foreground text-left">
                {toFa(subject.length)} / {toFa(200)}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticket-body">متن تیکت</Label>
              <Textarea
                id="ticket-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="توضیحات کامل را وارد کنید..."
                rows={5}
                maxLength={5000}
                className="rounded-xl resize-none"
              />
              <div className="text-xs text-muted-foreground text-left">
                {toFa(body.length)} / {toFa(5000)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={submitting}
              className="rounded-xl"
            >
              انصراف
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="gap-1.5 rounded-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ثبت تیکت
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ───────────────────────────── Status Badge ───────────────────────────── */

function StatusBadge({ isOpen }: { isOpen: boolean }) {
  return isOpen ? (
    <Badge className="bg-success/12 text-success border-success/25 hover:bg-success/15">
      <CheckCircle2 className="w-3 h-3 ml-0.5" />
      باز
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-muted text-muted-foreground">
      بسته‌شده
    </Badge>
  );
}
