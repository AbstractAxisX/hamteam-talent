"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatFaDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type Ticket = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
};

export function TicketsView() {
  const { user, loading: userLoading } = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<{ tickets: Ticket[] }>("/api/tickets");
      setTickets(d.tickets);
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

  if (!userLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Header count={null} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="glass p-8 text-center space-y-3 shadow-card rounded-3xl border-border/50">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
              <Icon name="lock" className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg">برای ثبت تیکت وارد شوید</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-6">
              برای ارتباط با تیم پشتیبانی و پیگیری تیکت‌های خود وارد شوید.
            </p>
            <Button
              onClick={() => navigate({ view: "auth" })}
              className="gap-1.5 rounded-2xl font-bold mx-auto bg-primary text-primary-foreground"
            >
              ورود / ثبت‌نام
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Header count={tickets.length} openCount={openCount} loading={loading} onRefresh={load} onCreate={() => setShowDialog(true)} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass p-5 border-border/50 rounded-3xl space-y-3">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-3 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </Card>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          kind="tickets"
          title="تیکتی ثبت نکرده‌اید"
          description="برای ارتباط با پشتیبانی، گزارش مشکل یا درخواست ویژگی تیکت جدید ثبت کنید."
          action={
            <Button onClick={() => setShowDialog(true)} className="gap-1.5 rounded-2xl font-bold">
              <Icon name="plus" className="w-4 h-4" />
              ثبت اولین تیکت
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tickets.map((t, i) => (
              <TicketCard key={t.id} ticket={t} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreateTicketDialog open={showDialog} onOpenChange={setShowDialog} onCreated={load} />
    </div>
  );
}

function Header({
  count,
  openCount,
  loading,
  onRefresh,
  onCreate,
}: {
  count: number | null;
  openCount?: number;
  loading: boolean;
  onRefresh: () => void;
  onCreate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
    >
      <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="relative flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="grid place-items-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0">
            <Icon name="ticket" className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">تیکت‌های پشتیبانی</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-6">
              {loading ? "در حال بارگذاری..." : count === null ? "ارتباط با تیم پشتیبانی" : count === 0 ? "هنوز تیکتی ثبت نشده" : `${toFa(count)} تیکت · ${toFa(openCount ?? 0)} باز`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="rounded-2xl w-10 h-10 hover:bg-primary/5"
            aria-label="به‌روزرسانی"
          >
            <Icon name="loader" className="w-4 h-4" />
          </Button>
          <Button
            onClick={onCreate}
            className="gap-1.5 rounded-2xl font-bold bg-primary text-primary-foreground shadow-glow"
          >
            <Icon name="plus" className="w-4 h-4" />
            تیکت جدید
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function TicketCard({ ticket, index }: { ticket: Ticket; index: number }) {
  const isOpen = ticket.status === "open";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25), ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        onClick={() => navigate({ view: "ticket", id: ticket.id })}
        className="glass p-5 border-border/50 hover:border-primary/40 hover:shadow-lift transition-all cursor-pointer group rounded-3xl"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[15px] leading-7 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {ticket.subject}
          </h3>
          <Badge
            className={cn(
              "shrink-0 h-6 px-2 text-[10px] rounded-md font-medium",
              isOpen ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted text-muted-foreground"
            )}
          >
            {isOpen ? "باز" : "بسته"}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="chat" className="w-3.5 h-3.5" />
            <span className="nums-fa">{toFa(ticket.replyCount)} پاسخ</span>
          </span>
          <span className="inline-flex items-center gap-1.5 nums-fa">
            {timeAgoFa(ticket.updatedAt)}
            <Icon name="chevronLeft" className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

function CreateTicketDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;
    if (subject.trim().length < 3) {
      toast({ title: "موضوع کوتاه است", description: "موضوع باید حداقل ۳ نویسه باشد.", variant: "destructive" });
      return;
    }
    if (body.trim().length < 5) {
      toast({ title: "متن کوتاه است", description: "متن تیکت باید حداقل ۵ نویسه باشد.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const r = await apiPost<{ ok: boolean; id: string }>("/api/tickets", {
        subject: subject.trim(),
        body: body.trim(),
      });
      toast({ title: "ثبت شد", description: "تیکت شما با موفقیت ثبت شد." });
      setSubject("");
      setBody("");
      onOpenChange(false);
      onCreated();
      // Navigate to the new ticket
      navigate({ view: "ticket", id: r.id });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/50 rounded-3xl max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Icon name="plus" className="w-5 h-5 text-primary" />
            تیکت جدید
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-6">
            برای گزارش مشکل، درخواست ویژگی یا ارتباط با پشتیبانی فرم زیر را پر کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">موضوع</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع کوتاه تیکت"
              maxLength={200}
              className="rounded-xl bg-background/40 border-border/50 focus-visible:ring-primary/60 h-11"
            />
            <p className="text-[11px] text-muted-foreground nums-fa text-left">{toFa(subject.length)} / {toFa(200)}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">متن تیکت</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="توضیح کامل مشکل یا درخواست خود را بنویسید..."
              rows={5}
              maxLength={5000}
              className="resize-none rounded-xl bg-background/40 border-border/50 focus-visible:ring-primary/60 min-h-[120px]"
            />
            <p className="text-[11px] text-muted-foreground nums-fa text-left">{toFa(body.length)} / {toFa(5000)}</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl font-semibold">
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="gap-1.5 rounded-2xl font-bold bg-primary text-primary-foreground shadow-glow"
          >
            {submitting ? <Spinner className="w-4 h-4" /> : <Icon name="send" className="w-4 h-4" />}
            ثبت تیکت
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
