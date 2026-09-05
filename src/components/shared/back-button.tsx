"use client";

/* ═══════════════════════════════════════════════════════════
   BackButton — دکمه بازگشت مشترک برای هدر همه صفحات
   · history.back() با fallback به فید (رفع خروج از سایت در دیپ‌لینک)
   · دو حالت: دکمه گرد شیشه‌ای / دکمه متنی با برچسب
   ═══════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import { Icon } from "@/components/shared/icon";
import { navigate } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function BackButton({
  label,
  className,
  fallback = { view: "feed" as const },
}: {
  /** برچسب اختیاری کنار آیکون — نبود = فقط آیکون */
  label?: string;
  className?: string;
  /** اگر تاریخچه خالی بود (دیپ‌لینک مستقیم) به کجا برود */
  fallback?: { view: "feed" } | { view: "discover" } | { view: "talents" } | { view: "needs" };
}) {
  function goBack() {
    if (typeof window === "undefined") return;
    // اگر داخل اپ تاریخچه‌ای نیست (لینک مستقیم/اشتراک)، به فید برگرد
    if (window.history.length <= 1) {
      navigate(fallback);
      return;
    }
    window.history.back();
  }

  if (label) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={goBack}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-bold",
          "text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
          className
        )}
        aria-label={label}
      >
        <Icon name="arrowLeft" size={16} strokeWidth={2.4} />
        <span>{label}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={goBack}
      className={cn(
        "grid place-items-center w-10 h-10 rounded-full glass-strong text-foreground",
        "hover:bg-muted/70 transition-colors shrink-0",
        className
      )}
      aria-label="بازگشت"
    >
      <Icon name="arrowLeft" size={18} strokeWidth={2.4} />
    </motion.button>
  );
}
