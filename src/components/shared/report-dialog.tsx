"use client";

import * as React from "react";
import { apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Icon } from "@/components/shared/icon";
import { Sheet } from "@/components/shared/sheet";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════
   ReportDialog — گزارش تخلف پست (Sheet کلاسیک)
   · دلایل آماده + یادداشت اختیاری
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
    <Sheet
      open={open}
      onClose={onClose}
      title="گزارش تخلف پست"
      description="کدام مشکل را می‌بینید؟"
      footer={
        user ? (
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="h-12 px-5 rounded-2xl border border-border text-muted-foreground font-bold text-sm hover:bg-muted transition-colors outline-none"
            >
              انصراف
            </button>
            <button
              onClick={submit}
              disabled={busy || !reason}
              className="flex-1 h-12 rounded-2xl bg-rose text-white font-extrabold text-sm
                         inline-flex items-center justify-center gap-2
                         disabled:opacity-50 outline-none transition-[filter] hover:brightness-105"
            >
              <Icon name={busy ? "loader" : "flag"} size={16} className={busy ? "animate-spin" : ""} />
              ثبت گزارش
            </button>
          </div>
        ) : undefined
      }
    >
      {user ? (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={cn(
                  "h-11 rounded-xl text-[12px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors outline-none border",
                  reason === r.value
                    ? "bg-rose text-white border-rose"
                    : "bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground"
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
            className="w-full rounded-xl bg-muted/60 border border-border px-4 py-2.5 text-[13px]
                       placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-rose/30 resize-none"
          />
        </div>
      ) : (
        <div className="py-4 text-center space-y-3">
          <p className="text-[13px] text-muted-foreground leading-6">
            برای گزارش تخلف ابتدا وارد حساب کاربری شوید.
          </p>
          <button
            onClick={() => {
              onClose();
              navigate({ view: "auth" });
            }}
            className="h-11 px-5 rounded-xl bg-primary text-white font-extrabold text-[13px]"
          >
            ورود / ثبت‌نام
          </button>
        </div>
      )}
    </Sheet>
  );
}
