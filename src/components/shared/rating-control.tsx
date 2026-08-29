"use client";

/* ═══════════════════════════════════════════════════════════
   RatingControl — سیستم امتیازدهی ۱ تا ۱۰ ستاره
   · RatingModal — مودال ثبت/ویرایش امتیاز (بازخورد آنی)
   · RatingSummary — نمایش میانگین + تعداد رأی زیر پست
   · ثبت/ویرایش idempotent (unique per کاربر/پست در سرور)
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toFa } from "@/lib/format";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Icon } from "@/components/shared/icon";
import { Btn, IconBtn, SPRING } from "@/components/ui/atoms";
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

/* ─────────── مودال امتیاز ─────────── */

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

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, submitting]);

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
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="ثبت امتیاز">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !submitting && onClose()}
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12, transition: { duration: 0.18 } }}
            transition={SPRING.bounce}
            className="relative w-full max-w-sm bg-card rounded-[28px] border border-border/70 shadow-float overflow-hidden"
          >
            <div className="h-[3px] w-full grad-gold" aria-hidden />

            <div className="px-5 pt-4 pb-5">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center size-11 rounded-2xl grad-gold shadow-glow-gold shrink-0">
                  <Icon name="spark" size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="text-[15.5px] font-black text-foreground leading-snug">
                    {editing ? "ویرایش امتیاز" : "به این استعداد چند امتیاز می‌دی؟"}
                  </h2>
                  <p className="text-[11.5px] text-muted-foreground mt-1 leading-5">
                    {editing ? "امتیاز قبلی‌ات را می‌توانی عوض کنی." : "از ۱ تا ۱۰ ستاره — امتیازت هر زمان قابل ویرایش است."}
                  </p>
                </div>
                <IconBtn label="بستن" variant="soft" size={36} onClick={() => !submitting && onClose()}>
                  <Icon name="x" size={16} />
                </IconBtn>
              </div>

              {/* ستاره‌ها */}
              <div className="mt-5 flex items-center justify-between" dir="rtl">
                {Array.from({ length: 10 }).map((_, i) => {
                  const val = i + 1;
                  const active = score != null && val <= score;
                  return (
                    <motion.button
                      key={val}
                      onClick={() => setScore(val)}
                      whileTap={{ scale: 0.82 }}
                      whileHover={{ scale: 1.14, y: -2 }}
                      transition={SPRING.tap}
                      aria-label={`${toFa(val)} ستاره`}
                      className="p-0.5 outline-none -mx-0.5"
                    >
                      <motion.span
                        animate={active ? { scale: [1, 1.22, 1], rotate: [0, -8, 0] } : { scale: 1, rotate: 0 }}
                        transition={{ duration: 0.34 }}
                        className="block"
                      >
                        <Star fill={active ? 1 : 0} size={26} />
                      </motion.span>
                    </motion.button>
                  );
                })}
              </div>

              {/* بازخورد آنی */}
              <div className="mt-3 text-center min-h-[20px]">
                <AnimatePresence mode="wait">
                  {score != null ? (
                    <motion.p
                      key={score}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16 }}
                      className="text-[12.5px] font-black text-amber-700 dark:text-amber-300"
                    >
                      {labelFor(score)}
                    </motion.p>
                  ) : (
                    <p className="text-[11.5px] text-muted-foreground font-bold">ستاره‌ها را انتخاب کن</p>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <p className="mt-2 text-center text-[11.5px] font-bold text-destructive" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2.5">
                {editing && (
                  <Btn variant="ghost" size="lg" onClick={onClose} disabled={submitting}>
                    انصراف
                  </Btn>
                )}
                <Btn
                  variant="grad"
                  size="lg"
                  className="flex-1 grad-gold"
                  onClick={submit}
                  disabled={score == null || submitting}
                  loading={submitting}
                >
                  {editing ? "ذخیرهٔ ویرایش" : "ثبت امتیاز"}
                </Btn>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function labelFor(score: number): string {
  if (score >= 9) return `بی‌نظیر بود! (${toFa(score)}/۱۰)`;
  if (score >= 7) return `خیلی خوبه! (${toFa(score)}/۱۰)`;
  if (score >= 5) return `خوبه (${toFa(score)}/۱۰)`;
  if (score >= 3) return `متوسط (${toFa(score)}/۱۰)`;
  return `ضعیف (${toFa(score)}/۱۰)`;
}
