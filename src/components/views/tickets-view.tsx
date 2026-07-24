"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Ticket as TicketIcon, Plus, MessageSquare, ChevronLeft, RefreshCcw } from "lucide-react";

type TicketItem = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
};

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
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
            <TicketIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">تیکت‌های پشتیبانی</h1>
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
          >
            <RefreshCcw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">تیکت جدید</span>
            <span className="sm:hidden">جدید</span>
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={TicketIcon}
            title="هنوز تیکتی ثبت نکرده‌اید"
            description="برای سوال، گزارش یا درخواست پشتیبانی، تیکت جدیدی ایجاد کنید."
            action={
              <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                ایجاد اولین تیکت
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const isOpen = t.status === "open";
            return (
              <Card
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate({ view: "ticket", id: t.id })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate({ view: "ticket", id: t.id });
                  }
                }}
                className="p-4 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${
                        isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <TicketIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {t.subject}
                        </h3>
                        <Badge
                          variant={isOpen ? "default" : "secondary"}
                          className={
                            isOpen
                              ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10"
                              : ""
                          }
                        >
                          {isOpen ? "باز" : "بسته‌شده"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {toFa(t.replyCount)} پاسخ
                        </span>
                        <span>·</span>
                        <span>آخرین به‌روزرسانی {timeAgoFa(t.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
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
            >
              انصراف
            </Button>
            <Button onClick={handleCreate} disabled={submitting} className="gap-1.5">
              {submitting ? "در حال ارسال..." : "ثبت تیکت"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
