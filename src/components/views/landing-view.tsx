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
} from "lucide-react";
import { toFa } from "@/lib/format";

const FEATURES = [
  {
    icon: Sparkles,
    title: "نمایش استعدادت",
    desc: "پروفایل زیبا با گالری، دسته‌بندی و مهارت‌ها.",
    badge: "bg-lime/25 text-forest",
  },
  {
    icon: Compass,
    title: "کشف بر اساس مهارت",
    desc: "فیلترهای زنجیره‌ای: دسته ← مهارت، استان ← شهر.",
    badge: "bg-forest/10 text-forest",
  },
  {
    icon: MessageCircle,
    title: "ارتباط مستقیم",
    desc: "چت لحظه‌ای با استعدادهای دیگر در یک کلیک.",
    badge: "bg-rose/15 text-rose",
  },
  {
    icon: Rocket,
    title: "رشد و دیده‌شدن",
    desc: "پست‌های محبوب، دنبال‌کنندگان و تیک تأیید.",
    badge: "bg-gold/20 text-gold",
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
      {/* ══════ Hero ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-forest-gradient text-white p-8 sm:p-10 shadow-xl"
      >
        {/* Floating lime/gold shapes */}
        <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-lime/20 animate-float" />
        <div
          className="absolute -bottom-16 -right-12 w-52 h-52 rounded-full bg-lime/10 animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 -right-8 w-24 h-24 rounded-full bg-gold/20 animate-float"
          style={{ animationDelay: "1s" }}
        />
        {/* Dotted overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-lime shadow-lg">
              <LogoMark className="w-8 h-8" />
            </div>
            <span className="text-3xl font-extrabold">همتیم</span>
          </div>

          <h1 className="text-3xl sm:text-[2.5rem] font-extrabold leading-tight">
            استعدادت رو <span className="text-lime">کشف کن</span>
            <br />
            و به دنیا <span className="text-lime">نشون بده</span>
          </h1>

          <p className="text-base sm:text-lg text-white/80 leading-8 max-w-xl">
            پلتفرم کشف و نمایش استعداد — هنر، ورزش، آشپزی و مهارت‌های خلاقانه.
            پروفایل بساز، کارهات رو منتشر کن و با استعدادهای دیگر آشنا شو.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              size="lg"
              onClick={() => navigate({ view: "auth" })}
              className="rounded-2xl bg-lime text-forest font-extrabold px-6 hover:bg-lime/90 shadow-lg h-12"
            >
              شروع کنید
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate({ view: "discover" })}
              className="rounded-2xl text-white hover:bg-white/10 px-6 h-12"
            >
              کشف استعدادها
            </Button>
          </div>

          {/* Mini stat row */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Stat value="۱۰۰٪" label="رایگان" />
            <Stat value="بی‌نهایت" label="مهارت" />
            <Stat value="Real-time" label="چت" />
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
            className="text-forest font-bold"
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
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/60 hover:border-lime hover:shadow-md transition-all active:scale-95"
              >
                <span className="grid place-items-center w-14 h-14 rounded-2xl bg-lime/20 text-3xl">
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
              className="p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-shadow"
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
        className="p-6 sm:p-7 rounded-3xl bg-cream-gradient border border-border/60"
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
              <span className="grid place-items-center w-10 h-10 rounded-full bg-forest text-lime font-extrabold shrink-0 shadow-sm">
                {toFa(s.n)}
              </span>
              <p className="text-sm font-medium leading-6">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══════ CTA bottom ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="relative overflow-hidden rounded-3xl bg-lime-gradient p-8 sm:p-10 text-center shadow-xl"
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/20 animate-float" />
        <div
          className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-forest/10 animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div className="relative space-y-4">
          <div className="flex justify-center">
            <AuthIllustration className="w-32 h-40" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-forest">
            آماده‌ی شروع هستی؟
          </h2>
          <p className="text-forest/70 max-w-md mx-auto leading-7 font-medium">
            همین حالا ثبت‌نام کن و به جامعه‌ی استعدادهای ایران بپیوند.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ view: "auth" })}
            className="rounded-2xl bg-forest text-lime font-extrabold px-8 py-3.5 text-base hover:bg-forest/90 shadow-lg h-12"
          >
            شروع کنید
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs font-bold text-forest/70">
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="w-4 h-4 text-forest" /> تیک تأیید
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="w-4 h-4 text-rose" /> پست‌های محبوب
            </span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-gold" /> کاملاً رایگان
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
      <span className="text-xl font-extrabold text-lime">{value}</span>
      <span className="text-[11px] text-white/70 font-medium">{label}</span>
    </div>
  );
}
