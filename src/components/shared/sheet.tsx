"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════
   Sheet — مودال کلاسیک استاندارد پروژه
   · موبایل: بات‌شیت پایین (سطح تک‌رنگ، دستگیره، اسکرول‌قفل)
   · دسکتاپ (sm+): دیالوگ وسط‌چین
   · بدون بلور/گرادیان — روکش سیادهٔ ساده، هدر تمیز با جداکننده
   ═══════════════════════════════════════════════════════════ */

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  closeLabel = "بستن",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** ردیف اکشن‌های پایین (چسبیده به انتهای شیت) */
  footer?: React.ReactNode;
  /** کلاس سطح بیرونی شیت */
  className?: string;
  /** کلاس ناحیهٔ محتوا */
  contentClassName?: string;
  closeLabel?: string;
}) {
  /* قفل اسکرول + ESC */
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true">
          {/* روکش — سیاه ساده بدون بلور */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={cn(
              "relative w-full sm:max-w-md bg-card border-t sm:border border-border",
              "rounded-t-2xl sm:rounded-2xl shadow-[0_-8px_30px_rgba(16,24,53,0.16)] sm:shadow-[0_16px_50px_rgba(16,24,53,0.22)]",
              "flex flex-col max-h-[88dvh] pb-safe",
              className
            )}
          >
            {/* دستگیره (موبایل) */}
            <div className="sm:hidden pt-2.5 pb-1 grid place-items-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* هدر تمیز: عنوان راست + بستن چپ + جداکننده */}
            {(title || description) && (
              <div className="px-5 pt-2 sm:pt-4 pb-3 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {title && (
                      <h2 className="text-[15.5px] font-black text-foreground leading-snug">{title}</h2>
                    )}
                    {description && (
                      <p className="text-[12px] text-muted-foreground mt-1 leading-5">{description}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    aria-label={closeLabel}
                    className="grid place-items-center size-8 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <Icon name="x" size={15} />
                  </button>
                </div>
              </div>
            )}
            {(title || description) && <div className="h-px bg-border shrink-0" />}

            {/* محتوا */}
            <div className={cn("overflow-y-auto px-5 py-4 flex-1 no-scrollbar", contentClassName)}>
              {children}
            </div>

            {/* فوتر */}
            {footer && (
              <>
                <div className="h-px bg-border shrink-0" />
                <div className="px-5 py-3.5 shrink-0 bg-card">{footer}</div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
