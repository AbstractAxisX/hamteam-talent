"use client";

/* ═══════════════════════════════════════════════════════════
   همتیم — لایه Atoms (دیزاین سیستم v2)
   قواعد: فقط transform/opacity در انیمیشن · حداقل لمس ۴۸px
   وابستگی: فقط framer-motion + cn
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── فیزیک فنری واحد ( export برای استفاده در کل اپ ) ── */
export const SPRING = {
  tap: { type: "spring", stiffness: 500, damping: 24 } as const,
  pill: { type: "spring", stiffness: 400, damping: 32 } as const,
  sheet: { type: "spring", stiffness: 380, damping: 34 } as const,
  bounce: { type: "spring", stiffness: 480, damping: 20 } as const,
};

/* ═══════════════ Spinner (استاندارد واحد — جایگزین ۶ کپی) ═══════════════ */
export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={cn("animate-spin", className)} role="status" aria-label="در حال بارگذاری"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.22" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ═══════════════ Btn — دکمه با ۶ واریانت ═══════════════ */
type BtnVariant = "grad" | "solid" | "soft" | "outline" | "ghost" | "dark";
type BtnSize = "sm" | "md" | "lg";

const btnVariants: Record<BtnVariant, string> = {
  grad: "grad-brand text-white shadow-grad hover:brightness-105",
  solid: "bg-primary text-primary-foreground shadow-glow hover:brightness-105",
  soft: "bg-secondary text-foreground hover:bg-muted",
  outline: "border-[1.5px] border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  dark: "bg-foreground text-background hover:opacity-90",
};

const btnSizes: Record<BtnSize, string> = {
  sm: "h-9 px-4 text-xs gap-1.5",
  md: "h-11 px-5 text-[13px] gap-2",
  lg: "h-12 px-6 text-sm gap-2",
};

export interface BtnProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: React.ReactNode;
  full?: boolean;
  children?: React.ReactNode;
}

export function Btn({
  variant = "grad", size = "md", loading, icon, full, className, children, disabled, ...rest
}: BtnProps) {
  return (
    <motion.button
      transition={SPRING.tap}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-2xl font-extrabold",
        "transition-[filter,background-color] outline-none min-w-11",
        "disabled:opacity-50 disabled:pointer-events-none",
        btnVariants[variant], btnSizes[size],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === "sm" ? 14 : 16} /> : icon}
      {children}
    </motion.button>
  );
}

/* ═══════════════ IconBtn — دکمه آیکونی (لمس ≥ ۴۴px) ═══════════════ */
type IconVariant = "glass" | "soft" | "grad" | "plain" | "dark-chip";
const iconVariants: Record<IconVariant, string> = {
  glass: "glass-strong border border-border/60 text-foreground shadow-soft",
  soft: "bg-secondary text-muted-foreground hover:bg-muted",
  grad: "grad-brand text-white shadow-grad",
  plain: "text-muted-foreground hover:bg-muted",
  "dark-chip": "glass-dark-chip text-white",
};

export function IconBtn({
  label, variant = "soft", size = 40, className, children, disabled, ...rest
}: Omit<HTMLMotionProps<"button">, "children"> & {
  label: string; variant?: IconVariant; size?: 36 | 40 | 44 | 48; children: React.ReactNode;
}) {
  return (
    <motion.button
      aria-label={label}
      transition={SPRING.tap}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      disabled={disabled}
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex items-center justify-center rounded-full outline-none",
        "disabled:opacity-50 disabled:pointer-events-none",
        iconVariants[variant], className
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

/* ═══════════════ Field — اینپوت قرصی رفرنس ═══════════════ */
export const Field = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode; error?: string | null }
>(function Field({ icon, error, className, ...rest }, ref) {
  return (
    <div className="w-full">
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-11 rounded-full border-[1.5px] border-input bg-muted/60 px-4 text-[13px]",
            "placeholder:text-muted-foreground/70 outline-none",
            "transition-[border-color,background-color] duration-200",
            "focus:border-ring focus:bg-card",
            icon && "pr-11",
            error && "border-destructive focus:border-destructive",
            className
          )}
          {...rest}
        />
      </div>
      {error && <p className="mt-1.5 px-4 text-[11px] font-bold text-destructive">{error}</p>}
    </div>
  );
});

/* ═══════════════ Chip — قرص انتخاب/فیلتر ═══════════════ */
export function Chip({
  active, className, children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "shrink-0 h-9 px-4 rounded-full text-xs font-extrabold",
        "transition-colors duration-200 outline-none min-w-11",
        active
          ? "grad-brand text-white shadow-grad"
          : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ═══════════════ Badge — شمارنده/نقطه ═══════════════ */
export function Badge({
  count, dot, className,
}: { count?: number; dot?: boolean; className?: string }) {
  if (dot) {
    return <span className={cn("block size-2 rounded-full bg-rose ring-2 ring-card", className)} />;
  }
  if (count === undefined) return null;
  return (
    <span
      className={cn(
        "nums-fa inline-flex h-5 min-w-5 items-center justify-center rounded-full",
        "bg-rose px-1.5 text-[10px] font-extrabold text-white ring-2 ring-card",
        className
      )}
    >
      {count > 99 ? "۹۹+" : Number(count).toLocaleString("fa-IR")}
    </span>
  );
}

/* ═══════════════ Sk — اسکلتون شیمر (Closure گشتالت) ═══════════════ */
export function Sk({
  className, circle,
}: { className?: string; circle?: boolean }) {
  return (
    <div className={cn("shimmer", circle ? "rounded-full" : "rounded-xl", className)} aria-hidden />
  );
}

export function SkText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Sk key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/* ═══════════════ Divider ═══════════════ */
export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} aria-hidden />;
}
