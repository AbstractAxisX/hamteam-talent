"use client";

/* ═══════════════════════════════════════════════════════════
   RatingControl — سیستم امتیازدهی ۱ تا ۱۰ ستاره
   · RatingModal — مودال ثبت/ویرایش امتیاز (Sheet کلاسیک)
   · RatingSummary — نمایش میانگین + تعداد رأی زیر پست
   · ثبت/ویرایش idempotent (unique per کاربر/پست در سرور)
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toFa } from "@/lib/format";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Icon } from "@/components/shared/icon";
import { Sheet } from "@/components/shared/sheet";
import { cn } from "@/lib/utils";

/* ─────────── ستاره (SVG با کنترل پرشدگی) ─────────── */

function Star({ fill, size = 26, className }: { fill: number; size?: number; className?: string }) {
  // fill: 0..1 — پرشدگی جزئی برای میانگین
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="1" y1="0" x2="0" y2="0">
          <stop offset={fill} stopColor="#f59e0b" />
          <stop offset={fill} stopColor="rgba(120,120,120,.28)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95L12 2.6z"
        fill={`url(#${id})`}
        stroke="#f59e0b"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─────────── خلاصهٔ میانگین — زیر متن پست ─────────── */

export function RatingSummary({ avg, count, onClick }: { avg: number; count: number; onClick?: () => void }) {
  if (count === 0) return null;
  const avgFa = toFa(avg.toFixed(1)).replace(".", "٫");
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1.5",
        onClick && "hover:bg-amber-500/20 transition-colors outline-none"
      )}
      aria-label={`میانگین امتیاز ${avgFa} از ۱۰ با ${toFa(count)} رأی`}
    >
      <Star fill={Math.max(0, Math.min(1, avg / 10))} size={15} />
      <span className="text-[12px] font-black text-amber-700 dark:text-amber-300 nums-fa">{avgFa}</span>
      <span className="text-[10.5px] font-bold text-muted-foreground nums-fa">از ۱۰ · {toFa(count)} رأی</span>
    </Tag>
  );
}

/* ─────────── مودال امتیاز — Sheet کلاسیک ─────────── */

export function RatingModal({
  open, onClose, postId, initialScore, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  postId: string;
  initialScore: number | null;
  onSaved?: (res: { avg: number; count: number; myScore: number }) => void;
}) {
  const { user } = useUser();
  const [score, setScore] = React.useState<number | null>(initialScore);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setScore(initialScore);
      setError(null);
      setSubmitting(false);
    }
  }, [open, initialScore]);

  async function submit() {
    if (score == null || submitting) return;
    if (!user) {
      onClose();
      navigate({ view: "auth" });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ score }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ثبت امتیاز ناموفق بود");
      onSaved?.({ avg: data.avg, count: data.count, myScore: data.myScore });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const editing = initialScore != null && initialScore > 0;

  return (
    <Sheet
      open={open}
      onClose={() => !submitting && onClose()}
      title={editing ? "ویرایش امتیاز" : "به این استعداد چند امتیاز می‌دی؟"}
      description={editing ? "امتیاز قبلی‌ات را می‌توانی عوض کنی." : "از ۱ تا ۱۰ ستاره — امتیازت هر زمان قابل ویرایش است."}
      footer={
        <div className="flex items-center gap-2.5">
          {editing && (
            <button
              onClick={onClose}
              disabled={submitting}
              className="h-12 px-5 rounded-2xl border border-border text-muted-foreground font-bold text-sm hover:bg-muted transition-colors outline-none"
            >
              انصراف
            </button>
          )}
          <button
            onClick={submit}
            disabled={score == null || submitting}
            className={cn(
              "flex-1 h-12 rounded-2xl text-white font-extrabold text-sm inline-flex items-center justify-center gap-2",
              "disabled:opacity-50 outline-none transition-[filter] hover:brightness-105"
            )}
            style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)" }}
          >
            {submitting ? <Icon name="loader" size={17} className="animate-spin" /> : <Icon name="star" size={17} />}
            {editing ? "ذخیرهٔ ویرایش" : "ثبت امتیاز"}
          </button>
        </div>
      }
    >
      {/* ستاره‌ها */}
      <div className="flex items-center justify-between" dir="rtl">
        {Array.from({ length: 10 }).map((_, i) => {
          const val = i + 1;
          const active = score != null && val <= score;
          return (
            <motion.button
              key={val}
              onClick={() => setScore(val)}
              whileTap={{ scale: 0.82 }}
              aria-label={`${toFa(val)} ستاره`}
              className="p-0.5 outline-none -mx-0.5"
            >
              <span className="block">
                <Star fill={active ? 1 : 0} size={26} />
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* بازخورد آنی */}
      <div className="mt-3 text-center min-h-[20px]">
        {score != null ? (
          <p className="text-[12.5px] font-black text-amber-700 dark:text-amber-300">
            {labelFor(score)}
          </p>
        ) : (
          <p className="text-[11.5px] text-muted-foreground font-bold">ستاره‌ها را انتخاب کن</p>
        )}
      </div>

      {error && (
        <p className="mt-2 text-center text-[11.5px] font-bold text-destructive" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}

function labelFor(score: number): string {
  if (score >= 9) return `بی‌نظیر بود! (${toFa(score)}/۱۰)`;
  if (score >= 7) return `خیلی خوبه! (${toFa(score)}/۱۰)`;
  if (score >= 5) return `خوبه (${toFa(score)}/۱۰)`;
  if (score >= 3) return `متوسط (${toFa(score)}/۱۰)`;
  return `ضعیف (${toFa(score)}/۱۰)`;
}
