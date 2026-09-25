"use client";

/* ═════════════════════════════════════════════════════════════
   Elite Design System — «چهره برتر» (Silver / Gold)
   زبان بصری نخبگان: قاب نقره‌ای چندلایه (۵۰۰۰ ستاره) و
   قاب طلایی (۱۰۰۰۰ ستاره)، تیک متال، برگ غار (Laurel)،
   بنر نخبگی. بدون انیمیشن بی‌نهایت (کارایی).
   ═════════════════════════════════════════════════════════════ */

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── پالت متال طلایی (۱۰۰۰۰+ ستاره — بالاترین سطح) ── */
const GOLD_METAL =
  "conic-gradient(from 210deg, #fef9e7 0deg, #f5c84c 50deg, #92610e 105deg, #fde68a 165deg, #d97706 225deg, #fff3c4 285deg, #9a6b0a 330deg, #fef9e7 360deg)";
const GOLD_CHANNEL = "linear-gradient(135deg, #7c4a0c, #59330a 50%, #7c4a0c)";
const GLOW_GOLD = "0 6px 22px rgba(217,119,6,.4), 0 0 0 1px rgba(180,83,9,.28)";

/* ── پالت متال نقره‌ای (۵۰۰۰+ ستاره) ──
   نقرهٔ کلاسیک: سفید سرد → نقره روشن → خاکستری فولادی.
   #f8fafc → #cbd5e1 → #94a3b8 → #64748b و تکرار. */
const SILVER_METAL =
  "conic-gradient(from 210deg, #ffffff 0deg, #d8dee6 50deg, #6b7684 105deg, #eef2f6 165deg, #aab4c0 225deg, #f8fafc 285deg, #59626e 330deg, #ffffff 360deg)";
const SILVER_CHANNEL = "linear-gradient(135deg, #64748b, #3f4a57 50%, #64748b)";
const GLOW_SILVER = "0 6px 22px rgba(100,116,139,.38), 0 0 0 1px rgba(71,85,105,.3)";

/* ═══════════════════════════════════════════
   EliteCheckMark — تیک قاب چهره برتر
   متال با ریم تیره و درخشش گوشه؛ tint نقره یا طلایی.
   ═══════════════════════════════════════════ */
export function EliteCheckMark({
  size = 16,
  tint = "gold",
  className,
}: {
  size?: number;
  tint?: "gold" | "silver";
  className?: string;
}) {
  const uid = React.useId();
  const gold = tint === "gold";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={gold ? "چهره برتر طلایی" : "چهره برتر نقره‌ای"}
      className={cn(
        "shrink-0",
        gold ? "drop-shadow-[0_1px_2px_rgba(146,97,14,.45)]" : "drop-shadow-[0_1px_2px_rgba(71,85,105,.4)]",
        className
      )}
    >
      <defs>
        <linearGradient id={`ecm${uid}`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          {gold ? (
            <>
              <stop offset="0" stopColor="#fef3c7" />
              <stop offset=".45" stopColor="#f5c84c" />
              <stop offset="1" stopColor="#b45309" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#f8fafc" />
              <stop offset=".45" stopColor="#cbd5e1" />
              <stop offset="1" stopColor="#475569" />
            </>
          )}
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill={`url(#ecm${uid})`} />
      <circle
        cx="12" cy="12" r="8.9" fill="none"
        stroke={gold ? "rgba(124,45,10,.5)" : "rgba(51,65,85,.5)"}
        strokeWidth="1.2"
      />
      <path
        d="M7.6 12.4l2.9 2.9 5.9-6.4"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M6.2 7.2q1.8-1.6 4-1.9"
        stroke="rgba(255,255,255,.75)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** سازگاری با کدهای قدیمی — تیک طلایی */
export const GoldCheckMark = (props: Omit<Parameters<typeof EliteCheckMark>[0], "tint">) => (
  <EliteCheckMark tint="gold" {...props} />
);
/** تیک نقره‌ای */
export const SilverCheckMark = (props: Omit<Parameters<typeof EliteCheckMark>[0], "tint">) => (
  <EliteCheckMark tint="silver" {...props} />
);

/* ═══════════════════════════════════════════
   EliteAvatar — آواتار با قاب چندلایهٔ متال
   variant="silver" (۵۰۰۰+ ستاره) یا "gold" (۱۰۰۰۰+).
   square=true → قاب مربعی (چهره‌یاب‌ها — سبک لینکدین کمپانی).
   ═══════════════════════════════════════════ */
export function EliteAvatar({
  name,
  src,
  box = 44,
  className,
  onClick,
  variant = "gold",
  square = false,
}: {
  name: string;
  src?: string | null;
  /** قطر/ضلع کامل قاب بر حسب پیکسل */
  box?: number;
  className?: string;
  onClick?: () => void;
  /** نوع متال قاب — طلایی کمیاب‌تر (۱۰۰۰۰) و نقره‌ای (۵۰۰۰) */
  variant?: "gold" | "silver";
  /** قاب مربعی برای چهره‌یاب‌ها (سبک کمپانی‌های لینکدین) */
  square?: boolean;
}) {
  const [broken, setBroken] = React.useState(false);
  const showImg = src && !broken;
  const initial = (name || "؟").trim().replace(/\u200c/g, " ").charAt(0) || "؟";
  const Tag = (onClick ? "button" : "span") as "button" | "span";
  const radius = square ? "rounded-[22%]" : "rounded-full";

  const gold = variant === "gold";
  const metal = gold ? GOLD_METAL : SILVER_METAL;
  const channel = gold ? GOLD_CHANNEL : SILVER_CHANNEL;
  const glow = gold ? GLOW_GOLD : GLOW_SILVER;
  const dotColor = gold ? "#fde68a" : "#e2e8f0";
  const innerRing = gold ? "rgba(253,230,138,.85)" : "rgba(226,232,240,.9)";
  const fallbackBg = gold
    ? "linear-gradient(135deg, #92610e, #5c3a08 55%, #b45309)"
    : "linear-gradient(135deg, #64748b, #334155 55%, #94a3b8)";

  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: box, height: box }}
    >
      <Tag
        onClick={onClick}
        aria-label={onClick ? `پروفایل ${name}` : undefined}
        className={cn(
          "block h-full w-full outline-none",
          radius,
          onClick && "cursor-pointer active:scale-95 transition-transform"
        )}
        style={{ boxShadow: glow }}
      >
        {/* ۱ — حلقه متال بیولی */}
        <span className={cn("absolute inset-0", radius)} style={{ background: metal }} />
        <span
          className={cn("absolute inset-0", radius)}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,.38), transparent 45%, rgba(0,0,0,.22))",
          }}
        />
        {/* ۲ — کانال تیره */}
        <span className={cn("absolute", radius)} style={{ inset: "7%", background: channel }} />
        {/* ۳ — نقطه‌های پرچی روی کانال */}
        <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
          <circle
            cx="50" cy="50" r="40.8" fill="none"
            stroke={dotColor} strokeWidth="2.4" strokeLinecap="round"
            strokeDasharray="0.1 5.5" opacity=".75"
          />
        </svg>
        {/* ۴ — حلقه داخلی روشن */}
        <span
          className={cn("absolute", radius)}
          style={{ inset: "11.5%", boxShadow: `inset 0 0 0 1.4px ${innerRing}` }}
        />
        {/* ۵ — چهره */}
        <span
          className={cn("absolute overflow-hidden grid place-items-center", radius)}
          style={{ inset: "13.5%" }}
        >
          {showImg ? (
            <img
              src={src!} alt={name} loading="lazy" decoding="async"
              onError={() => setBroken(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="h-full w-full grid place-items-center font-extrabold text-white"
              style={{
                background: fallbackBg,
                fontSize: Math.round(box * 0.32),
              }}
            >
              {initial}
            </span>
          )}
        </span>
      </Tag>
    </span>
  );
}

/** قاب نقره‌ای (۵۰۰۰+ ستاره) */
export function SilverAvatar(props: Omit<Parameters<typeof EliteAvatar>[0], "variant">) {
  return <EliteAvatar {...props} variant="silver" />;
}

/* ═══════════════════════════════════════════
   Laurel — برگ غار (نشان پیروزی کلاسیک)
   تولید رویه‌ای برگ‌ها روی منحنی بزیه.
   ═══════════════════════════════════════════ */
export function Laurel({
  size = 56,
  flip = false,
  tint = "gold",
  className,
}: {
  size?: number;
  flip?: boolean;
  /** رنگ برگ‌ها — gold یا silver */
  tint?: "gold" | "silver";
  className?: string;
}) {
  const uid = React.useId();
  const gold = tint === "gold";
  const P0 = { x: 5, y: 43 };
  const P1 = { x: 11, y: 12 };
  const P2 = { x: 43, y: 5 };
  const bez = (t: number) => ({
    x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t ** 2 * P2.x,
    y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t ** 2 * P2.y,
  });
  const leaves: React.ReactNode[] = [];
  for (let i = 0; i <= 7; i++) {
    const t = 0.12 + i * 0.115;
    const p = bez(t);
    const p2 = bez(Math.min(t + 0.02, 1));
    const ang = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI;
    const side = i % 2 === 0 ? -58 : 46;
    leaves.push(
      <path
        key={i}
        d="M0 0 Q 2.6 -2.2 8 0 Q 2.6 2.2 0 0 Z"
        fill={`url(#lf${uid})`}
        opacity={i % 2 ? 0.72 : 0.92}
        transform={`translate(${p.x} ${p.y}) rotate(${ang + side})`}
      />
    );
  }
  return (
    <svg
      width={size} height={size} viewBox="0 0 48 48" aria-hidden
      className={cn("shrink-0 pointer-events-none", flip && "-scale-x-100", className)}
    >
      <defs>
        <linearGradient id={`lf${uid}`} x1="0" y1="0" x2="8" y2="0" gradientUnits="userSpaceOnUse">
          {gold ? (
            <>
              <stop offset="0" stopColor="#b45309" />
              <stop offset=".55" stopColor="#f5c84c" />
              <stop offset="1" stopColor="#fef3c7" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#475569" />
              <stop offset=".55" stopColor="#cbd5e1" />
              <stop offset="1" stopColor="#f8fafc" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        d={`M${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
        fill="none" stroke={gold ? "#d97706" : "#94a3b8"} strokeWidth="1.1" strokeLinecap="round" opacity=".8"
      />
      {leaves}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   TopTalentBanner — بنر چهره برتر پروفایل
   silver (۵۰۰۰ ستاره) / gold (۱۰۰۰۰ ستاره)
   ═══════════════════════════════════════════ */
export function TopTalentBanner({ className, variant = "gold" }: { className?: string; variant?: "gold" | "silver" }) {
  const gold = variant === "gold";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl h-14 flex items-center justify-center gap-3 px-5",
        className
      )}
      style={
        gold
          ? {
              background: "linear-gradient(120deg, #2a1a04 0%, #171005 45%, #241604 100%)",
              boxShadow: "inset 0 0 0 1px rgba(245,200,76,.35), 0 8px 24px rgba(146,97,14,.28)",
            }
          : {
              background: "linear-gradient(120deg, #1e293b 0%, #0f172a 45%, #1a2433 100%)",
              boxShadow: "inset 0 0 0 1px rgba(203,213,225,.35), 0 8px 24px rgba(51,65,85,.28)",
            }
      }
    >
      {/* بافت نقطه‌ای */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: `radial-gradient(${gold ? "rgba(245,200,76,.8)" : "rgba(203,213,225,.8)"} 1px, transparent 1px)`,
          backgroundSize: "14px 14px",
        }}
      />
      <Laurel size={34} tint={gold ? "gold" : "silver"} />
      <EliteCheckMark size={22} tint={gold ? "gold" : "silver"} />
      <div className="relative z-10 text-center leading-tight">
        <p
          className={gold ? "text-gold-grad text-[15px] font-black" : "text-[15px] font-black"}
          style={
            gold
              ? undefined
              : {
                  background: "linear-gradient(135deg,#f8fafc 5%,#cbd5e1 32%,#475569 66%,#e2e8f0 100%)",
                  WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                }
          }
        >
          {gold ? "چهره برتر طلایی" : "چهره برتر نقره‌ای"}
        </p>
        <p className={cn("text-[9.5px] font-bold mt-0.5", gold ? "text-amber-200/60" : "text-slate-300/60")}>
          {gold ? "۱۰۰۰۰+ ستاره — کمیاب‌ترین سطح فرصتینو" : "۵۰۰۰+ ستاره — منتخب جامعهٔ فرصتینو"}
        </p>
      </div>
      <Laurel size={34} flip tint={gold ? "gold" : "silver"} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   GoldSparkle — ستارهٔ تزئینی (ایستا)
   ═══════════════════════════════════════════ */
export function GoldSparkle({
  size = 14,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden
      width={size} height={size} viewBox="0 0 24 24"
      className={cn("absolute pointer-events-none", className)}
      style={style}
    >
      <path
        d="M12 0c.9 6.2 4.9 10.2 12 12-7.1 1.8-11.1 5.8-12 12-.9-6.2-4.9-10.2-12-12C7.1 10.2 11.1 6.2 12 0z"
        fill="#fde68a"
      />
    </svg>
  );
}
