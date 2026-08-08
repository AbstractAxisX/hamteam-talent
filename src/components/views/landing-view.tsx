"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoMark, AuthIllustration } from "@/components/shared/illustrations";
import type { CategoryWithSkills } from "@/lib/types";
import {
  Sparkles,
  Compass,
  MessageCircle,
  Rocket,
  ArrowLeft,
  Heart,
  BadgeCheck,
  Users,
} from "lucide-react";
import { toFa } from "@/lib/format";

const FEATURES = [
  {
    icon: Sparkles,
    title: "نمایش استعدادت",
    desc: "پروفایل زیبا با گالری، دسته‌بندی و مهارت‌ها.",
    badge: "bg-primary/10 text-primary",
  },
  {
    icon: Compass,
    title: "کشف بر اساس مهارت",
    desc: "فیلترهای زنجیره‌ای: دسته ← مهارت، استان ← شهر.",
    badge: "bg-accent text-accent-foreground",
  },
  {
    icon: MessageCircle,
    title: "ارتباط مستقیم",
    desc: "چت لحظه‌ای با استعدادهای دیگر در یک کلیک.",
    badge: "bg-rose/10 text-rose",
  },
  {
    icon: Rocket,
    title: "رشد و دیده‌شدن",
    desc: "پست‌های محبوب، دنبال‌کنندگان و تیک تأیید.",
    badge: "bg-gold/15 text-gold",
  },
];

export function LandingView() {
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* ══════ Hero — solid petrol-teal, NO gradient ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 sm:p-10 shadow-sm"
      >
        {/* Soft solid circles (NO gradient fills, low opacity) */}
        <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-primary-foreground/10 animate-float" />
        <div
          className="absolute -bottom-16 -right-12 w-52 h-52 rounded-full bg-accent/20 animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 -right-8 w-24 h-24 rounded-full bg-gold/15 animate-float"
          style={{ animationDelay: "1s" }}
        />

        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-primary-foreground/15">
              <LogoMark className="w-8 h-8" />
            </div>
            <span className="text-3xl font-extrabold">همتیم</span>
          </div>

          <h1 className="text-3xl sm:text-[2.5rem] font-extrabold leading-tight">
            استعدادت رو <span className="text-gold">کشف کن</span>
            <br />
            و به دنیا <span className="text-gold">نشون بده</span>
          </h1>

          <p className="text-base sm:text-lg text-primary-foreground/80 leading-8 max-w-xl">
            پلتفرم کشف و نمایش استعداد — هنر، ورزش، آشپزی و مهارت‌های خلاقانه.
            پروفایل بساز، کارهات رو منتشر کن و با استعدادهای دیگر آشنا شو.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              size="lg"
              onClick={() => navigate({ view: "auth" })}
              className="rounded-2xl bg-primary-foreground text-primary font-extrabold px-6 hover:bg-primary-foreground/90 shadow-sm h-12"
            >
              شروع کنید
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate({ view: "discover" })}
              className="rounded-2xl text-primary-foreground hover:bg-primary-foreground/10 px-6 h-12"
            >
              کشف استعدادها
            </Button>
          </div>

          {/* Mini stat row */}
          <div className="flex flex-wrap gap-6 pt-2">
            <Stat value="۱۰۰٪" label="رایگان" />
            <Stat value="بی‌نهایت" label="مهارت" />
            <Stat value="لحظه‌ای" label="چت" />
          </div>
        </div>
      </motion.section>

      {/* ══════ Category quick-access ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">دسته‌بندی‌ها</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ view: "discover" })}
            className="text-primary font-bold"
          >
            همه
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        </div>

        {loadingCats ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : cats.length === 0 ? null : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {cats.slice(0, 8).map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                onClick={() => navigate({ view: "category", id: c.id })}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-sm transition-all active:scale-95"
              >
                <span className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-3xl">
                  {c.iconUrl || "✨"}
                </span>
                <span className="text-xs font-bold text-center line-clamp-2 leading-4">
                  {c.name}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.section>

      {/* ══════ Features ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-4"
      >
        <h2 className="text-lg font-extrabold">چرا همتیم؟</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="p-5 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow"
            >
              <span
                className={`grid place-items-center w-11 h-11 rounded-xl mb-3 ${f.badge}`}
              >
                <f.icon className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-base mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-6">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══════ How it works ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 sm:p-7 rounded-3xl bg-secondary border border-border"
      >
        <h2 className="text-xl font-extrabold mb-5">چطور کار می‌کند؟</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { n: 1, label: "ثبت‌نام با موبایل و کد ملی" },
            { n: 2, label: "تکمیل پروفایل و انتخاب مهارت" },
            { n: 3, label: "پست بگذار و استعدادت رو نشون بده" },
            { n: 4, label: "با دیگران ارتباط بگیر و تیم بساز" },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="flex sm:flex-col items-center gap-3 text-center"
            >
              <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-extrabold shrink-0 shadow-sm">
                {toFa(s.n)}
              </span>
              <p className="text-sm font-medium leading-6">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══════ CTA bottom — solid warm accent ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="relative overflow-hidden rounded-3xl bg-accent text-accent-foreground p-8 sm:p-10 text-center shadow-sm"
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary-foreground/30 animate-float" />
        <div
          className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-primary/10 animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div className="relative space-y-4">
          <div className="flex justify-center">
            <AuthIllustration className="w-32 h-40" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">آماده‌ی شروع هستی؟</h2>
          <p className="max-w-md mx-auto leading-7 font-medium text-accent-foreground/80">
            همین حالا ثبت‌نام کن و به جامعه‌ی استعدادهای ایران بپیوند.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ view: "auth" })}
            className="rounded-2xl bg-primary text-primary-foreground font-extrabold px-8 py-3.5 text-base hover:bg-primary/90 shadow-sm h-12"
          >
            شروع کنید
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs font-bold text-accent-foreground/70">
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="w-4 h-4 text-gold" /> تیک تأیید
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="w-4 h-4 text-rose" /> پست‌های محبوب
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4 text-primary" /> تیم‌سازی
            </span>
          </div>
        </div>
      </motion.section>

      {/* ══════ Dev notice ══════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-center py-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/60 border border-border text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-gold" />
          توسعه‌ی این صفحه ادامه دارد
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xl font-extrabold text-gold">{value}</span>
      <span className="text-[11px] text-primary-foreground/70 font-medium">
        {label}
      </span>
    </div>
  );
}
