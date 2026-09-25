"use client";

/* ═══════════════════════════════════════════════════════════
   ScoutBadge — چیپ هویتی «چهره‌یاب» (emerald + قطب‌نما)
   کنار نام کاربر در کارت‌ها/پروفایل/چت/نیازمندی‌ها
   ═══════════════════════════════════════════════════════════ */

import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

export function ScoutBadge({
  size = "md",
  className,
  title = "چهره‌یاب (استعدادیاب تأییدشده)",
}: {
  size?: "sm" | "md";
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-black",
        "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-600/20",
        size === "sm" ? "h-5 px-1.5 text-[9.5px]" : "h-6 px-2 text-[10.5px]"
      )}
    >
      <Icon name="compass" size={size === "sm" ? 10 : 11} strokeWidth={2.4} />
      چهره‌یاب
    </span>
  );
}
