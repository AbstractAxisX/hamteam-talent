"use client";

/* ═══════════════════════════════════════════════════════════
   Elite Design System — «چهره برتر» (Gold / Rose Gold / Obsidian)
   زبان بصری نخبگان: قاب طلایی چندلایه (۵۰۰۰ ستاره) و
   رزگلد کمیاب (۱۰۰۰۰ ستاره)، تیک متال، برگ غار (Laurel)،
   بنر نخبگی — کالاف/پابجی vibes.
   انیمیشن‌ها فقط transform/opacity (GPU-safe).
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── پالت متال طلایی (رفرنس: شامپاینی → طلایی → برنز) ── */
const GOLD_METAL =
  "conic-gradient(from 210deg, #fef9e7 0deg, #f5c84c 50deg, #92610e 105deg, #fde68a 165deg, #d97706 225deg, #fff3c4 285deg, #9a6b0a 330deg, #fef9e7 360deg)";
const GOLD_CHANNEL = "linear-gradient(135deg, #7c4a0c, #59330a 50%, #7c4a0c)";
const GLOW_GOLD = "0 6px 22px rgba(217,119,6,.4), 0 0 0 1px rgba(180,83,9,.28)";

/* ── پالت متال رزگلد (۵۰۰۰ → ۱۰۰۰۰ ستاره؛ کمیاب و لاکچری) ──
   رزگلد واقعی: رز گرم + نقره کثیف — سویچ‌های نرم
   #f43f5e → #fb7185 → #fda4af → #e11d48 و تکرار. */
const ROSE_METAL =
  "conic-gradient(from 210deg, #fff1f2 0deg, #fb7185 50deg, #881337 105deg, #fecdd3 165deg, #e11d48 225deg, #ffe4e6 285deg, #9f1239 330deg, #fff1f2 360deg)";
const ROSE_CHANNEL = "linear-gradient(135deg, #9f1239, #4c0519 50%, #9f1239)";
const GLOW_ROSE_GOLD = "0 6px 22px rgba(225,29,72,.42), 0 0 0 1px rgba(190,18,60,.3)";

/* ═══════════════════════════════════════════
   GoldCheckMark — تیک طلایی چهره برتر
   جایگزین تاج (درخواست کارفرما)؛ متال با ریم
   تیره و درخشش گوشه.
   ═══════════════════════════════════════════ */
export function GoldCheckMark({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const uid = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="چهره برتر"
      className={cn("shrink-0 drop-shadow-[0_1px_2px_rgba(146,97,14,.45)]", className)}
    >
      <defs>
        <linearGradient id={`gcm${uid}`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset=".45" stopColor="#f5c84c" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill={`url(#gcm${uid})`} />
      <circle cx="12" cy="12" r="8.9" fill="none" stroke="rgba(124,45,10,.5)" strokeWidth="1.2" />
      <path
        d="M7.6 12.4l2.9 2.9 5.9-6.4"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M6.2 7.2q1.8-1.6 4-1.9" stroke="rgba(255,255,255,.75)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   RoseGoldCheckMark — تیک رزگلد (۱۰۰۰۰+ ستاره)
   نسخهٔ کمیاب‌تر و لاکچری‌تر از تیک طلایی؛
   پالت رزگلد: #f43f5e → #fb7185 → #fda4af → #e11d48.
   ═══════════════════════════════════════════ */
export function RoseGoldCheckMark({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const uid = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="چهره برتر رزگلد"
      className={cn("shrink-0 drop-shadow-[0_1px_2px_rgba(159,18,57,.45)]", className)}
    >
      <defs>
        <linearGradient id={`rgcm${uid}`} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff1f2" />
          <stop offset=".45" stopColor="#fb7185" />
          <stop offset="1" stopColor="#be123c" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill={`url(#rgcm${uid})`} />
      <circle cx="12" cy="12" r="8.9" fill="none" stroke="rgba(136,19,55,.5)" strokeWidth="1.2" />
      <path
        d="M7.6 12.4l2.9 2.9 5.9-6.4"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M6.2 7.2q1.8-1.6 4-1.9" stroke="rgba(255,255,255,.78)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   EliteAvatar — آواتار با قاب چندلایهٔ متال
   (بورت رفرنس: بِوِل متال + کانال تیره +
   نقطه‌های پرچی + حلقه داخلی + درخشش چرخان)
   variant="gold" (۵۰۰۰+ ستاره) یا "rosegold" (۱۰۰۰۰+).
   ═══════════════════════════════════════════ */
export function EliteAvatar({
  name,
  src,
  box = 44,
  className,
  onClick,
  variant = "gold",
}: {
  name: string;
  src?: string | null;
  /** قطر کامل قاب بر حسب پیکسل */
  box?: number;
  className?: string;
  onClick?: () => void;
  /** نوع متال قاب — رزگلد کمیاب‌تر و لاکچری‌تر است */
  variant?: "gold" | "rosegold";
}) {
  const [broken, setBroken] = React.useState(false);
  const showImg = src && !broken;
  const initial = (name || "؟").trim().replace(/\u200c/g, " ").charAt(0) || "؟";
  const Tag = (onClick ? "button" : "span") as "button" | "span";

  const rose = variant === "rosegold";
  const metal = rose ? ROSE_METAL : GOLD_METAL;
  const channel = rose ? ROSE_CHANNEL : GOLD_CHANNEL;
  const glow = rose ? GLOW_ROSE_GOLD : GLOW_GOLD;
  const dotColor = rose ? "#fecdd3" : "#fde68a";
  const innerRing = rose ? "rgba(254,205,211,.85)" : "rgba(253,230,138,.85)";
  const fallbackBg = rose
    ? "linear-gradient(135deg, #e11d48, #650f22 55%, #be123c)"
    : "linear-gradient(135deg, #92610e, #5c3a08 55%, #b45309)";

  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: box, height: box }}
    >
      <Tag
        onClick={onClick}
        aria-label={onClick ? `پروفایل ${name}` : undefined}
        className={cn(
          "block h-full w-full rounded-full outline-none",
          onClick && "cursor-pointer active:scale-95 transition-transform"
        )}
        style={{ boxShadow: glow }}
      >
        {/* ۱ — حلقه متال بیولی */}
        <span className="absolute inset-0 rounded-full" style={{ background: metal }} />
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,.38), transparent 45%, rgba(0,0,0,.22))",
          }}
        />
        {/* ۲ — درخشش چرخان (فقط transform) */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full animate-elite-spin pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,.95) 16deg, transparent 52deg, transparent 178deg, rgba(255,251,215,.4) 196deg, transparent 232deg)",
            WebkitMaskImage: "radial-gradient(closest-side circle, transparent 80%, #000 86%)",
            maskImage: "radial-gradient(closest-side circle, transparent 80%, #000 86%)",
          }}
        />
        {/* ۳ — کانال تیره */}
        <span className="absolute rounded-full" style={{ inset: "7%", background: channel }} />
        {/* ۴ — نقطه‌های پرچی روی کانال */}
        <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none">
          <circle
            cx="50" cy="50" r="40.8" fill="none"
            stroke={dotColor} strokeWidth="2.4" strokeLinecap="round"
            strokeDasharray="0.1 5.5" opacity=".75"
          />
        </svg>
        {/* ۵ — حلقه داخلی روشن */}
        <span
          className="absolute rounded-full"
          style={{ inset: "11.5%", boxShadow: `inset 0 0 0 1.4px ${innerRing}` }}
        />
        {/* ۶ — چهره */}
        <span
          className="absolute rounded-full overflow-hidden grid place-items-center"
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

/* ═══════════════════════════════════════════
   RoseGoldAvatar — قاب رزگلد (۱۰۰۰۰+ ستاره)
   همان هندسهٔ EliteAvatar با متال رزِ گرم؛
   درخشش نرم‌تر + پرچ‌های صورتی — کمیاب‌ترین سطح.
   ═══════════════════════════════════════════ */
export function RoseGoldAvatar(props: Omit<Parameters<typeof EliteAvatar>[0], "variant">) {
  return <EliteAvatar {...props} variant="rosegold" />;
}

/* ═══════════════════════════════════════════
   Laurel — برگ غار طلایی (نشان پیروزی کلاسیک)
   تولید رویه‌ای برگ‌ها روی منحنی بزیه.
   ═══════════════════════════════════════════ */
export function Laurel({
  size = 56,
  flip = false,
  className,
}: {
  size?: number;
  flip?: boolean;
  className?: string;
}) {
  const uid = React.useId();
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
          <stop offset="0" stopColor="#b45309" />
          <stop offset=".55" stopColor="#f5c84c" />
          <stop offset="1" stopColor="#fef3c7" />
        </linearGradient>
      </defs>
      <path
        d={`M${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
        fill="none" stroke="#d97706" strokeWidth="1.1" strokeLinecap="round" opacity=".8"
      />
      {leaves}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   TopTalentBanner — بنر نخبگی پروفایل
   ابیسیدین + دو غار + تیک طلایی + درخشش
   ═══════════════════════════════════════════ */
export function TopTalentBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl h-14 flex items-center justify-center gap-3 px-5",
        className
      )}
      style={{
        background: "linear-gradient(120deg, #2a1a04 0%, #171005 45%, #241604 100%)",
        boxShadow: "inset 0 0 0 1px rgba(245,200,76,.35), 0 8px 24px rgba(146,97,14,.28)",
      }}
    >
      {/* بافت نقطه‌ای طلایی */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: "radial-gradient(rgba(245,200,76,.8) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      <Laurel size={34} />
      <GoldCheckMark size={22} />
      <div className="relative z-10 text-center leading-tight">
        <p className="text-gold-grad text-[15px] font-black">چهره برتر</p>
        <p className="text-[9.5px] font-bold text-amber-200/60 mt-0.5">
          ۵۰۰۰+ ستاره — منتخب جامعهٔ فرصتینو
        </p>
      </div>
      <Laurel size={34} flip />
      {/* درخشش عبوری */}
      <div
        aria-hidden
        className="absolute top-0 bottom-0 w-14 -skew-x-12 animate-elite-shine pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,251,215,.35), transparent)",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   GoldSparkle — ستارهٔ چشمک‌زن تزئینی
   ═══════════════════════════════════════════ */
export function GoldSparkle({
  size = 14,
  delay = 0,
  className,
  style,
}: {
  size?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden
      width={size} height={size} viewBox="0 0 24 24"
      className={cn("absolute pointer-events-none animate-elite-twinkle", className)}
      style={{ ...style, animationDelay: `${delay}s` }}
    >
      <path
        d="M12 0c.9 6.2 4.9 10.2 12 12-7.1 1.8-11.1 5.8-12 12-.9-6.2-4.9-10.2-12-12C7.1 10.2 11.1 6.2 12 0z"
        fill="#fde68a"
      />
    </svg>
  );
}
