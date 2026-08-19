"use client";

import { motion } from "framer-motion";
import { useSettings, FONTS, type ThemeMode } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const MODE_OPTIONS: { id: ThemeMode; label: string; iconName: string }[] = [
  { id: "light", label: "روشن", iconName: "sparkles" },
  { id: "dark", label: "تیره", iconName: "spark" },
  { id: "system", label: "سیستم", iconName: "phone" },
];

export function SettingsView() {
  const { mode, font, setMode, setFont } = useSettings();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ═══ Header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="grid place-items-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0">
            <Icon name="settings" className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">تنظیمات</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-6">ظاهر اپلیکیشن را به سلیقه‌ی خود تنظیم کنید</p>
          </div>
        </div>
      </motion.div>

      {/* ═══ Theme Mode ═══ */}
      <Section title="حالت نمایش" iconName="sparkles" delay={0.05}>
        <div className="grid grid-cols-3 gap-3">
          {MODE_OPTIONS.map((m) => (
            <ModeOption
              key={m.id}
              active={mode === m.id}
              onClick={() => { setMode(m.id); toast({ title: `حالت «${m.label}» اعمال شد` }); }}
              iconName={m.iconName}
              labelTxt={m.label}
            />
          ))}
        </div>
      </Section>

      {/* ═══ Theme Color picker — DISABLED ═══ */}
      <Section title="رنگ پوسته" iconName="spark" delay={0.1}>
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50">
          <div className="grid place-items-center w-12 h-12 rounded-2xl bg-muted text-muted-foreground shrink-0">
            <Icon name="lock" className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">رنگ پیش‌فرض قفل شده</p>
            <p className="text-xs text-muted-foreground mt-1 leading-5">
              پوسته‌ی زمردی تیره (Dark Green) تنها رنگ رسمی همتیم است و قابل تغییر نیست.
            </p>
          </div>
        </div>
      </Section>

      {/* ═══ Font ═══ */}
      <Section title="فونت" iconName="pencil" delay={0.15}>
        <div className="space-y-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFont(f.id); toast({ title: `فونت «${f.name}» اعمال شد` }); }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-right",
                font === f.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-foreground/15"
              )}
            >
              <span
                className="text-lg font-bold"
                style={{ fontFamily: f.stack }}
              >
                همتیم — نمونه‌ی متن
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{f.name}</span>
                {font === f.id && (
                  <span className="grid place-items-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* ═══ About ═══ */}
      <Section title="درباره‌ی همتیم" iconName="info" delay={0.2}>
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-muted/40 text-sm leading-7 text-muted-foreground">
            همتیم شبکه‌ی تخصصی مشاغل و تیم‌سازی فارسی است — پروفایل حرفه‌ای، کشف مهارت، ثبت نیازمندی و چت مستقیم. کاملاً رایگان.
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Card className="glass p-3 rounded-2xl border-border/50 text-center">
              <p className="text-[11px] text-muted-foreground mb-0.5">نسخه</p>
              <p className="font-bold text-sm nums-fa">۱.۰.۰</p>
            </Card>
            <Card className="glass p-3 rounded-2xl border-border/50 text-center">
              <p className="text-[11px] text-muted-foreground mb-0.5">ساخته‌شده با</p>
              <p className="font-bold text-sm">❤ همتیم</p>
            </Card>
          </div>
        </div>
      </Section>

      {/* ═══ Logout shortcut ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="glass p-5 rounded-3xl border-border/50 shadow-soft flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-rose/10 text-rose shrink-0">
            <Icon name="logout02" className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">خروج از حساب</p>
            <p className="text-xs text-muted-foreground mt-0.5">برای خروج از منوی اصلی استفاده کنید.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast({ title: "راهنما", description: "از دکمه‌ی خروج در منوی اصلی استفاده کنید." })}
            className="rounded-xl font-semibold"
          >
            راهنما
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}

function Section({
  title,
  iconName,
  delay,
  children,
}: {
  title: string;
  iconName: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="glass p-5 shadow-card border-border/50 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="grid place-items-center w-8 h-8 rounded-xl bg-primary/10 text-primary">
            <Icon name={iconName} className="w-4 h-4" />
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
  iconName,
  labelTxt,
}: {
  active: boolean;
  onClick: () => void;
  iconName: string;
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
      <Icon name={iconName} className="w-6 h-6" />
      <span className="text-sm font-semibold">{labelTxt}</span>
    </button>
  );
}
