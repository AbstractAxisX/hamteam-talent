"use client";

/* ═══════════════════════════════════════════════════════════
   TicketsTab (ادمین) — مدیریت تیکت‌های پشتیبانی
   · لیست تیکت‌ها (باز/بسته) + جزئیات با پاسخ‌ها
   · پاسخ ادمین (isAdmin=true + اعلان به کاربر)
   · بستن / بازگشایی تیکت
   ═══════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Ticket as TicketIcon,
  Loader2,
  RefreshCw,
  Send,
  Lock,
  LockOpen,
  ChevronLeft,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { api, apiPatch, apiPost } from "@/lib/api-client";
import { toFa, timeAgoFa } from "@/lib/format";
import { cn } from "@/lib/utils";

type AdminTicketItem = {
  id: string;
  subject: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  user: {
    id: string;
    name: string;
    phone: string;
    isVerifiedBadge: boolean;
    isBanned: boolean;
    avatarUrl: string | null;
  };
};

type AdminTicketDetail = {
  id: string;
  subject: string;
  body: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; phone: string; avatarUrl: string | null };
  replies: {
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
    authorName: string;
  }[];
};

export function TicketsTab() {
  const [tickets, setTickets] = useState<AdminTicketItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<{ tickets: AdminTicketItem[] }>("/api/admin/tickets");
      setTickets(d.tickets || []);
    } catch (e) {
      toast({ title: "خطا در بارگذاری تیکت‌ها", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = useCallback(async (id: string) => {
    setOpenId(id);
    setDetail(null);
    setDetailLoading(true);
    setReply("");
    try {
      const d = await api<{ ticket: AdminTicketDetail }>(`/api/admin/tickets/${id}`);
      setDetail(d.ticket);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  async function sendReply() {
    if (!openId || !reply.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/admin/tickets/${openId}/reply`, { content: reply.trim() });
      setReply("");
      toast({ title: "پاسخ ارسال شد و به کاربر اعلان دادیم" });
      await openDetail(openId);
      await load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    if (!openId || !detail) return;
    const next = detail.status === "closed" ? "open" : "closed";
    setActing(true);
    try {
      await apiPatch(`/api/admin/tickets/${openId}`, { status: next });
      toast({ title: next === "closed" ? "تیکت بسته شد" : "تیکت بازگشایی شد" });
      await openDetail(openId);
      await load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span className="grid place-items-center size-9 rounded-xl bg-indigo-100 text-indigo-600">
              <TicketIcon className="w-5 h-5" />
            </span>
            تیکت‌های پشتیبانی
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {tickets
              ? `${toFa(tickets.filter((t) => t.status === "open").length)} باز از ${toFa(tickets.length)} تیکت`
              : "در حال بارگذاری…"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          بروزرسانی
        </Button>
      </div>

      {/* List */}
      {!tickets ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse bg-gray-100 border-gray-200 h-20" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-10 text-center border-gray-200 bg-white">
          <TicketIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="font-black text-gray-800">هنوز تیکتی ثبت نشده</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
              onClick={() => openDetail(t.id)}
              className="w-full text-right"
            >
              <Card
                className={cn(
                  "p-4 border bg-white shadow-sm hover:shadow-md transition-shadow",
                  openId === t.id ? "border-emerald-400" : "border-gray-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "shrink-0 grid place-items-center size-10 rounded-xl",
                      t.status === "open" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {t.status === "open" ? <TicketIcon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-900 truncate">{t.subject}</p>
                      <span
                        className={cn(
                          "shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold",
                          t.status === "open" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {t.status === "open" ? "باز" : "بسته"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {t.user.name} · {toFa(t.replyCount)} پاسخ · {timeAgoFa(t.updatedAt)}
                    </p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              </Card>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {openId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpenId(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative w-[min(94vw,560px)] max-h-[86vh] flex flex-col bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            {/* Modal header */}
            <div className="shrink-0 px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
              <div className="min-w-0">
                <h3 className="font-black text-gray-900 truncate">{detail?.subject || "…"}</h3>
                {detail && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {detail.user.name} · {detail.user.phone}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {detail && (
                  <Button size="sm" variant="outline" onClick={toggleStatus} disabled={acting} className="gap-1.5">
                    {acting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : detail.status === "closed" ? (
                      <LockOpen className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    {detail.status === "closed" ? "بازگشایی" : "بستن"}
                  </Button>
                )}
                <button
                  onClick={() => setOpenId(null)}
                  className="grid place-items-center size-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                  aria-label="بستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[200px]">
              {detailLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : detail ? (
                <>
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <p className="text-[10px] font-bold text-gray-400 mb-1.5">متن تیکت</p>
                    <p className="text-sm text-gray-800 leading-7 whitespace-pre-wrap">{detail.body}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{timeAgoFa(detail.createdAt)}</p>
                  </div>

                  {detail.replies.map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        "rounded-2xl p-3.5 border",
                        r.isAdmin
                          ? "bg-emerald-50/70 border-emerald-200 ms-8"
                          : "bg-white border-gray-200 me-8"
                      )}
                    >
                      <p className="text-[10px] font-bold mb-1 flex items-center gap-1.5">
                        <span className={r.isAdmin ? "text-emerald-600" : "text-gray-600"}>{r.authorName}</span>
                        {r.isAdmin && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-black">
                            پشتیبانی
                          </span>
                        )}
                        <span className="text-gray-300">· {timeAgoFa(r.createdAt)}</span>
                      </p>
                      <p className="text-[13px] text-gray-700 leading-6 whitespace-pre-wrap">{r.content}</p>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-center text-gray-400 text-sm py-8">تیکت بارگذاری نشد</p>
              )}
            </div>

            {/* Reply input */}
            {detail && detail.status === "open" && (
              <div className="shrink-0 p-4 border-t border-gray-100 bg-gray-50/60">
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="پاسخ پشتیبانی…"
                    rows={2}
                    className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm
                               placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                  <Button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="h-11 w-11 p-0 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -scale-x-100" />}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
