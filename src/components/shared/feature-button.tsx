"use client";

/* ═══════════════════════════════════════════════════════════════
   FeatureButton — ارسال/برداشتن پست خود به ویترین «چهره برتر»
   شرط سرور: قاب چهره برتر (۵۰۰۰ ستاره یا ۵۰۰ رأی یا تأیید ادمین)
   سقف: هفته‌ای فقط ۱ پست + حداکثر ۵ پست هم‌زمان
   فقط روی پست خودِ کاربرِ دارای قاب رندر می‌شود (canFeature).
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion } from "framer-motion";
import { apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function FeatureButton({
  postId,
  isFeatured,
  canFeature,
  onChanged,
  className,
}: {
  postId: string;
  isFeatured: boolean;
  canFeature: boolean;
  onChanged?: (featured: boolean) => void;
  className?: string;
}) {
  const { user } = useUser();
  const [featured, setFeatured] = useState(isFeatured);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) {
      toast({ title: "برای ارسال پست به چهره برتر وارد شوید" });
      navigate({ view: "auth" });
      return;
    }
    const next = !featured;
    setBusy(true);
    setFeatured(next); // آپدیت خوش‌بینانه — در خطا برمی‌گردیم
    try {
      await apiPost<{ ok: boolean; isFeatured: boolean; totalStars: number; frame: string }>(
        `/api/posts/${postId}/feature`,
        { featured: next }
      );
      toast({
        title: next
          ? "پست به چهره برتر رفت ⭐"
          : "پست از چهره برتر برداشته شد",
      });
      onChanged?.(next);
    } catch (e) {
      setFeatured(!next);
      toast({
        title: "ارسال به چهره برتر ممکن نشد",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  // فقط برای پست خودِ کاربرِ دارای قاب — دیگران دکمه نمی‌بینند
  if (!canFeature) return null;

  return (
    <div className={cn("px-3 pb-3", className)}>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => void toggle()}
        disabled={busy}
        className={cn(
          "w-full h-10 rounded-full flex items-center justify-center gap-2 text-[12px] font-extrabold border transition-colors disabled:opacity-60",
          featured
            ? "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/35 hover:bg-amber-500/20"
            : "text-white border-transparent shadow-glow-gold"
        )}
        style={
          featured
            ? undefined
            : { background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }
        }
        aria-label={featured ? "برداشتن از چهره برتر" : "ارسال به چهره برتر"}
      >
        {busy ? (
          <Icon name="loader" size={16} className="animate-spin" />
        ) : featured ? (
          <Icon name="check" size={16} />
        ) : (
          <Icon name="sparkles" size={16} />
        )}
        <span>{featured ? "در چهره برتر است ✓ — برداشتن" : "به چهره برتر بفرست (هفته‌ای ۱ پست)"}</span>
      </motion.button>
    </div>
  );
}
