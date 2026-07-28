"use client";

import { motion } from "framer-motion";
import { useSettings, THEME_COLORS, FONTS, type ThemeMode, type ThemeColor, type FontFamily } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun, Monitor, Palette, Type, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function SettingsView() {
  const { mode, color, font, setMode, setColor, setFont } = useSettings();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold tracking-tight">تنظیمات</h1>
        <p className="text-sm text-muted-foreground mt-1">ظاهر اپلیکیشن را به سلیقه‌ی خود تغییر دهید.</p>
      </motion.div>

      {/* Theme Mode */}
      <Section title="حالت نمایش" icon={Sun} delay={0.05}>
        <div className="grid grid-cols-3 gap-3">
          <ModeOption active={mode === "light"} onClick={() => setMode("light")} icon={Sun} labelTxt="روشن" />
          <ModeOption active={mode === "dark"} onClick={() => setMode("dark")} icon={Moon} labelTxt="تیره" />
          <ModeOption active={mode === "system"} onClick={() => setMode("system")} icon={Monitor} labelTxt="سیستم" />
        </div>
      </Section>

      {/* Theme Color */}
      <Section title="رنگ اصلی" icon={Palette} delay={0.1}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {THEME_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setColor(c.id); toast({ title: `رنگ «${c.name}» اعمال شد` }); }}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                color === c.id ? "border-foreground/30 bg-muted/40" : "border-border hover:border-foreground/15"
              )}
            >
              <span
                className="w-10 h-10 rounded-full shadow-soft"
                style={{ background: c.swatch }}
              />
              <span className="text-xs font-semibold">{c.name}</span>
              {color === c.id && (
                <span className="absolute top-1.5 right-1.5 grid place-items-center w-5 h-5 rounded-full bg-primary text-primary-foreground">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* Font */}
      <Section title="فونت" icon={Type} delay={0.15}>
        <div className="space-y-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFont(f.id); toast({ title: `فونت «${f.name}» اعمال شد` }); }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-right",
                font === f.id ? "border-foreground/30 bg-muted/40" : "border-border hover:border-foreground/15"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: f.stack }}
                >
                  همتیم — نمونه‌ی متن
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{f.name}</span>
                {font === f.id && (
                  <span className="grid place-items-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* About */}
      <Section title="درباره‌ی همتیم" icon={Monitor} delay={0.2}>
        <div className="p-4 rounded-2xl bg-muted/40 text-sm leading-7 text-muted-foreground">
          همتیم شبکه‌ی تخصصی مشاغل و تیم‌سازی فارسی است — پروفایل حرفه‌ای، کشف مهارت، ثبت نیازمندی و چت مستقیم. کاملاً رایگان.
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  delay,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="p-5 shadow-card border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <span className="grid place-items-center w-8 h-8 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-4 h-4" />
          </span>
          <h2 className="font-bold">{title}</h2>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function ModeOption({
  active,
  onClick,
  icon: Icon,
  labelTxt,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  labelTxt: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
        active ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-foreground/15"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-semibold">{labelTxt}</span>
    </button>
  );
}
