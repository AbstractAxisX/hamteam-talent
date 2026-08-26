"use client";

/* ═══════════════════════════════════════════════════════════
   GradAvatar — آواتار گرادیانی حرف‌محور (رفرنس طراحی)
  · گرادیان قطعی از نام (۸ پالت رفرنس)
  · پشتیبانی تصویر + fallback خودکار به حرف
  · تیک تأیید آبی (رفرنس) · تاج استعداد برتر (طلایی)
  · رینگ رنگ دسته‌بندی
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { cn } from "@/lib/utils";

/* پالت گرادیان‌های رفرنس */
const GRADS = [
  "linear-gradient(135deg,#059669,#0d9488)",
  "linear-gradient(135deg,#0d9488,#14b8a6)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#065f46,#059669)",
  "linear-gradient(135deg,#e11d48,#f97316)",
  "linear-gradient(135deg,#65a30d,#059669)",
  "linear-gradient(135deg,#0f766e,#065f46)",
  "linear-gradient(135deg,#14b8a6,#f59e0b)",
];

export function gradFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}

type AvSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZES: Record<AvSize, { box: number; font: number; badge: number }> = {
  xs: { box: 24, font: 10, badge: 12 },
  sm: { box: 28, font: 11, badge: 13 },
  md: { box: 36, font: 14, badge: 15 },
  lg: { box: 44, font: 17, badge: 17 },
  xl: { box: 56, font: 21, badge: 20 },
  "2xl": { box: 72, font: 27, badge: 24 },
};

/* حرف اول نام فارسی (پشتیبانی از نیم‌فاصله) */
export function initialOf(name: string): string {
  const n = (name || "").trim().replace(/\u200c/g, " ");
  return (n.charAt(0) || "؟");
}

/* ── نشان تیک تأیید (دایره آبی رفرنس) ── */
export function VerifiedMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="حساب تأییدشده" role="img" className="shrink-0">
      <circle cx="12" cy="12" r="11" fill="#059669" />
      <path d="M8 12.5l2.6 2.6L16.5 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ── تاج استعداد برتر ── */
export function CrownMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="استعداد برتر" role="img" className="shrink-0">
      <path d="M3 8l4 4 5-6 5 6 4-4v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" fill="#f59e0b" />
      <circle cx="12" cy="13" r="1.6" fill="#fff7ed" />
    </svg>
  );
}

export interface GradAvatarProps {
  name: string;
  src?: string | null;
  size?: AvSize;
  /** رنگ رینگ دسته‌بندی (hex) */
  ring?: string | null;
  verified?: boolean;
  topTalent?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GradAvatar({
  name, src, size = "md", ring, verified, topTalent, className, onClick,
}: GradAvatarProps) {
  const [broken, setBroken] = React.useState(false);
  const s = SIZES[size];
  const showImg = src && !broken;
  const Tag = onClick ? "button" : "span";

  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: s.box, height: s.box }}>
      <Tag
        onClick={onClick}
        aria-label={onClick ? `پروفایل ${name}` : undefined}
        className={cn(
          "flex h-full w-full items-center justify-center overflow-hidden font-extrabold text-white",
          ring ? "rounded-[calc(50%+2px)] p-[2.5px]" : "rounded-full",
          onClick && "cursor-pointer active:scale-95 transition-transform"
        )}
        style={ring ? { background: ring } : undefined}
      >
        <span
          className={cn("flex h-full w-full items-center justify-center overflow-hidden", ring && "rounded-full bg-card")}
          style={showImg ? undefined : { background: gradFor(name), fontSize: s.font }}
        >
          {showImg ? (
            <img
              src={src!} alt={name} loading="lazy" decoding="async"
              onError={() => setBroken(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            initialOf(name)
          )}
        </span>
      </Tag>

      {(verified || topTalent) && (
        <span
          className="absolute -bottom-0.5 -left-0.5 flex items-center justify-center rounded-full bg-card p-[2px]"
          style={{ width: s.badge + 4, height: s.badge + 4 }}
        >
          {topTalent ? <CrownMark size={s.badge} /> : <VerifiedMark size={s.badge - 2} />}
        </span>
      )}
    </span>
  );
}
