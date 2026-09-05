"use client";

/* ═══════════════════════════════════════════════════════════
   ReportsTab (ادمین) — مدیریت گزارش‌های تخلف (مدیریت محتوا)
   · لیست گزارش‌ها با فیلتر وضعیت (باز / رسیدگی‌شده / رد‌شده)
   · اقدامات: رسیدگی شد، رد گزارش، حذف پست متخلف
   · پیش‌نمایش محتوای پست + نویسنده + گزارش‌دهنده
   ═══════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Flag,
  Check,
  X,
  Trash2,
  Loader2,
  RefreshCw,
  Eye,
  Shield,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { api, apiPatch } from "@/lib/api-client";
import { toFa, timeAgoFa } from "@/lib/format";
import { cn } from "@/lib/utils";

type ReportItem = {
  id: string;
  reason: string;
  note: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
  reporter: { id: string; name: string; isVerifiedBadge: boolean };
  post: {
    id: string;
    content: string;
    createdAt: string;
    isFeatured: boolean;
    reportCount: number;
    user: { id: string; name: string; isBanned: boolean };
  } | null;
};

const REASON_LABELS: Record<string, string> = {
  spam: "اسپم و تبلیغ",
  inappropriate: "محتوای نامناسب",
  insult: "توهین و بی‌احترامی",
  illegal: "خلاف قوانین",
  other: "دلیل دیگر",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: "باز", cls: "bg-amber-100 text-amber-700" },
  resolved: { label: "رسیدگی‌شده", cls: "bg-emerald-100 text-emerald-700" },
  dismissed: { label: "رد شده", cls: "bg-gray-100 text-gray-500" },
};

export function ReportsTab() {
  const [reports, setReports] = useState<ReportItem[] | null>(null);
  const [filter, setFilter] = useState<"open" | "resolved" | "dismissed" | "">("open");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<{ reports: ReportItem[] }>(
        `/api/admin/reports${filter ? `?status=${filter}` : ""}`
      );
      setReports(d.reports || []);
    } catch (e) {
      toast({ title: "خطا در بارگذاری گزارش‌ها", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "resolve" | "dismiss" | "delete-post") {
    if (action === "delete-post" && !confirm("پست متخلف به‌همراه همه گزارش‌هایش حذف شود؟")) return;
    setBusyId(id);
    try {
      await apiPatch(`/api/admin/reports/${id}`, { action });
      toast({
        title:
          action === "resolve" ? "گزارش رسیدگی‌شده علامت خورد" :
          action === "dismiss" ? "گزارش رد شد" :
          "پست حذف شد",
      });
      await load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { key: typeof filter; label: string }[] = [
    { key: "open", label: "باز" },
    { key: "resolved", label: "رسیدگی‌شده" },
    { key: "dismissed", label: "رد شده" },
    { key: "", label: "همه" },
  ];

  return (
    <div className="space-y-4">
      {/* Header + filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span className="grid place-items-center size-9 rounded-xl bg-rose-100 text-rose-600">
              <Flag className="w-5 h-5" />
            </span>
            گزارش‌های تخلف
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {reports ? `${toFa(reports.length)} گزارش` : "در حال بارگذاری…"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key || "all"}
              onClick={() => setFilter(t.key)}
              className={cn(
                "h-9 px-3.5 rounded-xl text-xs font-bold transition-colors",
                filter === t.key
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              )}
            >
              {t.label}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* List */}
      {!reports ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse bg-gray-100 border-gray-200 h-32" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-10 text-center border-gray-200 bg-white">
          <Shield className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
          <p className="font-black text-gray-800">گزارشی در این وضعیت نیست 🎉</p>
          <p className="text-xs text-gray-500 mt-1">محتوای پاک — همینه که می‌خواستیم</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
            >
              <Card className="p-4 border-gray-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold border border-rose-100">
                        {REASON_LABELS[r.reason] || r.reason}
                      </span>
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold", STATUS_META[r.status]?.cls)}>
                        {STATUS_META[r.status]?.label || r.status}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{timeAgoFa(r.createdAt)}</span>
                      {r.post && r.post.reportCount > 1 && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          {toFa(r.post.reportCount)} گزارش برای این پست
                        </span>
                      )}
                    </div>

                    {r.note && (
                      <p className="text-xs text-gray-600 mt-2 leading-5 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                        «{r.note}»
                      </p>
                    )}

                    {r.post ? (
                      <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[11px] font-bold text-gray-700 truncate">
                            پست از {r.post.user.name}
                            {r.post.isFeatured && <span className="text-amber-600"> · برتر</span>}
                            {r.post.user.isBanned && <span className="text-rose-500"> · بن‌شده</span>}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-5 px-3 py-2.5 line-clamp-3">
                          {r.post.content}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 mt-2">پست حذف شده است</p>
                    )}

                    <p className="text-[10px] text-gray-400 mt-2">
                      گزارش‌دهنده: <span className="font-bold text-gray-600">{r.reporter.name}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  {r.status === "open" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {r.post && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.id}
                          onClick={() => act(r.id, "delete-post")}
                          className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                          {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          حذف پست
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, "dismiss")}
                        variant="outline"
                        className="gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        رد
                      </Button>
                      <Button
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, "resolve")}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                        رسیدگی
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
