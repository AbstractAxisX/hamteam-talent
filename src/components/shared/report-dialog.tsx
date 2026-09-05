"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════
   ReportDialog — گزارش تخلف پست (مدیریت محتوا)
   · دیالوگ وسط‌چین با دلایل آماده + یادداشت اختیاری
   · هر کاربر هر پست را یک‌بار گزارش می‌کند (سمت سرور upsert)
   ═══════════════════════════════════════════════════════════ */

const REASONS: { value: string; label: string; icon: string }[] = [
  { value: "spam", label: "اسپم و تبلیغ", icon: "bell" },
  { value: "inappropriate", label: "محتوای نامناسب", icon: "eye" },
  { value: "insult", label: "توهین و بی‌احترامی", icon: "chat" },
  { value: "illegal", label: "خلاف قوانین", icon: "shield" },
  { value: "other", label: "دلیل دیگر", icon: "more" },
];

export function ReportDialog({
  postId,
  open,
  onClose,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useUser();
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setNote("");
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function submit() {
    if (!reason) {
      toast({ title: "دلیل گزارش را انتخاب کنید" });
      return;
    }
    setBusy(true);
    try {
      await apiPost(`/api/posts/${postId}/report`, { reason, note });
      toast({ title: "گزارش شما ثبت شد", description: "تیم بررسی آن را بررسی می‌کند. متشکریم 🙏" });
      onClose();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="گزارش تخلف"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12, transition: { duration: 0.16 } }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative w-[min(92vw,400px)] bg-card rounded-[26px] border border-border/70 shadow-float overflow-hidden"
          >
            <div className="h-[3px] w-full bg-rose shrink-0" aria-hidden />

            <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-border/60">
              <div className="grid place-items-center size-10 rounded-2xl bg-rose/12 text-rose shrink-0">
                <Icon name="flag" size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-black text-foreground">گزارش تخلف پست</h2>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">کدام مشکل را می‌بینید؟</p>
              </div>
              <button
                onClick={onClose}
                aria-label="بستن"
                className="grid place-items-center size-9 rounded-full bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            {user ? (
              <div className="px-5 py-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={cn(
                        "h-11 rounded-2xl text-[12px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors",
                        reason === r.value
                          ? "bg-rose text-white shadow-[0_6px_18px_rgba(225,29,72,.3)]"
                          : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon name={r.icon as any} size={14} />
                      {r.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="توضیح اختیاری… (حداکثر ۵۰۰ کاراکتر)"
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-2xl bg-muted/60 border border-border/70 px-4 py-2.5 text-[13px]
                             placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-rose/30 resize-none"
                />

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={onClose}
                    className="h-11 px-4 rounded-2xl text-[12.5px] font-extrabold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    انصراف
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={submit}
                    disabled={busy || !reason}
                    className="flex-1 h-11 rounded-2xl bg-rose text-white font-extrabold text-[13px]
                               shadow-[0_8px_22px_rgba(225,29,72,.35)] inline-flex items-center justify-center gap-2
                               disabled:opacity-50 disabled:shadow-none outline-none"
                  >
                    <Icon name={busy ? "loader" : "flag"} size={16} className={busy ? "animate-spin" : ""} />
                    ثبت گزارش
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-6 text-center space-y-3">
                <p className="text-[13px] text-muted-foreground leading-6">
                  برای گزارش تخلف ابتدا وارد حساب کاربری شوید.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    navigate({ view: "auth" });
                  }}
                  className="h-10 px-5 rounded-xl grad-brand text-white font-extrabold text-[13px] shadow-grad"
                >
                  ورود / ثبت‌نام
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
