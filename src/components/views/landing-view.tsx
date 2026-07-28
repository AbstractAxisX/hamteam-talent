"use client";

import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import { Button } from "@/components/ui/button";
import { LogoMark, AuthIllustration } from "@/components/shared/illustrations";
import { Users, Briefcase, Heart, Sparkles, ArrowLeft, Compass, MessageCircle, BadgeCheck, Rocket, ShieldCheck } from "lucide-react";
import { toFa } from "@/lib/format";

export function LandingView() {
  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-brand-gradient text-white p-8 sm:p-12 shadow-float"
      >
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-gold/15 animate-float" />
        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <LogoMark className="w-12 h-12" />
            <span className="text-3xl font-extrabold">همتیم</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-snug">
            شبکه‌ی تخصصی مشاغل<br />و تیم‌سازی فارسی
          </h1>
          <p className="text-lg text-white/80 leading-8 max-w-xl">
            پروفایل حرفه‌ای بساز، مهارت‌هایت را نشان بده، نیازمندی ثبت کن، برای پروژه‌ها رزومه بفرست و تیم بساز. کاملاً رایگان.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" variant="secondary" onClick={() => navigate({ view: "auth" })} className="rounded-xl font-bold px-6">
              شروع کنید <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate({ view: "jobs" })} className="rounded-xl text-white hover:bg-white/10 px-6">
              مرور نیازمندی‌ها
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Users, title: "شبکه‌سازی حرفه‌ای", desc: "پروفایل لینکدین‌مانند، دسته‌بندی و مهارت، رزومه ساختاریافته." },
          { icon: Briefcase, title: "ثبت نیازمندی", desc: "هر کاربری می‌تواند آگهی ثبت کند و مهارت‌های موردنیاز را مشخص کند." },
          { icon: Compass, title: "کشف بر اساس مهارت", desc: "فیلترهای زنجیره‌ای: دسته → مهارت، استان → شهر." },
          { icon: MessageCircle, title: "چت مستقیم", desc: "گفتگوی real-time با همکاران و اعضای تیم در یک کلیک." },
          { icon: BadgeCheck, title: "تیک تأیید", desc: "اعطای تیک آبی توسط ادمین، مستقل از نقش کاربر." },
          { icon: Rocket, title: "کاملاً رایگان", desc: "مدل درآمدی فقط تبلیغات. هیچ پرداختی بین کاربران." },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
            className="p-5 rounded-2xl border border-border/60 bg-card shadow-card hover:shadow-lift transition-shadow"
          >
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-gradient-soft text-primary mb-3">
              <f.icon className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-base mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-6">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* How it works */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 sm:p-8 rounded-3xl bg-muted/40 border border-border/60"
      >
        <h2 className="text-xl font-extrabold mb-5">چطور کار می‌کند؟</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { n: 1, label: "ثبت‌نام با موبایل و کد ملی" },
            { n: 2, label: "تکمیل پروفایل و انتخاب مهارت" },
            { n: 3, label: "پست بگذار یا نیازمندی ثبت کن" },
            { n: 4, label: "تیم بساز و همکاری کن" },
          ].map((s) => (
            <div key={s.n} className="flex sm:flex-col items-center gap-3 text-center sm:text-center">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-extrabold shrink-0">
                {toFa(s.n)}
              </span>
              <p className="text-sm font-medium leading-6">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-4 py-6"
      >
        <div className="flex justify-center">
          <AuthIllustration className="w-44 h-56" />
        </div>
        <h2 className="text-2xl font-extrabold">آماده‌ی شروع هستید؟</h2>
        <p className="text-muted-foreground max-w-md mx-auto leading-7">
          همین حالا ثبت‌نام کنید و به شبکه‌ی حرفه‌ای فارسی بپیوندید.
        </p>
        <Button size="lg" onClick={() => navigate({ view: "auth" })} className="rounded-xl font-bold px-8 py-3.5 text-base">
          شروع کنید <ArrowLeft className="w-4 h-4 mr-1" />
        </Button>
      </motion.section>

      {/* Dev notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center py-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/60 border border-border text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-gold" />
          توسعه‌ی این صفحه ادامه دارد
        </div>
      </motion.div>
    </div>
  );
}
