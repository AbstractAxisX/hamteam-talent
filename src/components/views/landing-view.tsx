"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoMark } from "@/components/shared/illustrations";
import { Icon } from "@/components/shared/icon";
import { BannerSlider } from "@/components/shared/banner-slider";
import { GoldCheckMark, Laurel, GoldSparkle } from "@/components/ui/elite";
import { toFa } from "@/lib/format";
import type { CategoryWithSkills } from "@/lib/types";

/* hex + آلفا → رنگ شفاف برای ته‌رنگ کارت‌های دسته‌بندی */
function hexA(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
    <div className="relative -mt-4">
      {/* ══════ FULL-SCREEN DARK GREEN HERO ══════ */}
      <section className="relative min-h-[88vh] md:min-h-[80vh] -mx-4 md:-mx-8 px-4 md:px-8 overflow-hidden">
        {/* Ambient blobs — pure solid colors at low opacity, no gradient */}
        <div
          className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl pointer-events-none animate-float"
          style={{ backgroundColor: "oklch(0.6 0.15 160 / 0.6)" }}
        />
        <div
          className="absolute top-1/3 -left-24 w-[360px] h-[360px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.75 0.15 80 / 0.5)" }}
        />
        <div
          className="absolute -bottom-24 right-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.65 0.2 15 / 0.5)" }}
        />
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content overlay */}
        <div className="relative min-h-[88vh] md:min-h-[80vh] flex flex-col">
          {/* Top — small wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-6 md:pt-10 flex items-center gap-2.5"
          >
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15">
              <LogoMark className="w-6 h-6" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-foreground/90">همتیم</span>
          </motion.div>

          {/* Center — big dramatic headline */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-sm md:text-base font-bold text-primary tracking-widest mb-4 md:mb-6"
            >
              ✦ شبکه‌ی کشف استعداد ✦
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight text-foreground"
            >
              استعدادت
              <br />
              <span className="grad-text">رو به دنیا</span>
              <br />
              <span className="text-gold">نشون بده.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 md:mt-8 text-base md:text-lg text-muted-foreground leading-8 max-w-xl"
            >
              پلتفرم کشف و نمایش استعداد — هنر، ورزش، آشپزی و مهارت‌های خلاقانه.
              پروفایل بساز، کارهات رو منتشر کن و با استعدادهای دیگر آشنا شو.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="mt-8 md:mt-10 flex flex-wrap gap-3"
            >
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate({ view: "auth" })}
                className="inline-flex items-center gap-2 h-12 md:h-14 px-6 md:px-8 rounded-2xl grad-brand text-white font-extrabold text-base shadow-glow hover:opacity-95 transition-opacity"
              >
                شروع کنید
                <Icon name="arrowLeft" size={18} strokeWidth={2.6} className="text-white" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate({ view: "discover" })}
                className="inline-flex items-center gap-2 h-12 md:h-14 px-6 md:px-8 rounded-2xl glass text-foreground font-bold text-base hover:bg-muted/60 transition-colors"
              >
                <Icon name="compass" size={18} strokeWidth={2.4} className="text-primary" />
                کشف استعدادها
              </motion.button>
              {/* CTA طلایی — صفحهٔ مستقل درخواست استعداد برتر */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate({ view: "top-talent" })}
                className="inline-flex items-center gap-2 h-12 md:h-14 px-6 md:px-7 rounded-2xl text-white font-extrabold text-base shadow-glow-gold hover:opacity-95 transition-opacity"
                style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
              >
                <GoldCheckMark size={20} />
                درخواست استعداد برتر
              </motion.button>
            </motion.div>
          </div>

          {/* Bottom — minimal stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="pb-6 md:pb-10 flex flex-wrap items-end gap-x-8 gap-y-3"
          >
            <HeroStat value="۱۰۰٪" label="رایگان" tone="primary" />
            <div className="hidden md:block w-px h-12 bg-border/60" />
            <HeroStat value="بی‌نهایت" label="مهارت" tone="gold" />
            <div className="hidden md:block w-px h-12 bg-border/60" />
            <HeroStat value="لحظه‌ای" label="چت" tone="rose" />
          </motion.div>
        </div>
      </section>

      {/* ══════ بنرها و تبلیغات — اسلایدر پایین هیرو ══════ */}
      <BannerSlider className="mt-4" />

      {/* ══════ CATEGORY GRID — کارت‌های مربعی شبکه‌ای ══════ */}
      <section className="py-8 md:py-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-bold text-primary tracking-widest mb-1.5">دسته‌بندی‌ها</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">دنبالِ چی هستی؟</h2>
          </div>
          <button
            onClick={() => navigate({ view: "discover" })}
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:gap-1.5 transition-all"
          >
            همه
            <Icon name="arrowLeft" size={14} strokeWidth={2.6} className="text-primary" />
          </button>
        </div>

        {loadingCats ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 md:gap-3.5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-3xl" />
            ))}
          </div>
        ) : cats.length === 0 ? null : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 md:gap-3.5">
            {cats.slice(0, 12).map((c, i) => {
              const tint = c.color || "#067647";
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 14, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.045, 0.45), ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -3 }}
                  onClick={() => navigate({ view: "category", id: c.id })}
                  className="group aspect-square rounded-3xl glass border border-border/60
                             flex flex-col items-center justify-center gap-1.5 px-1.5 text-center
                             hover:border-primary/45 hover:shadow-soft transition-[border-color,box-shadow] duration-200"
                  style={{ ["--cat-tint" as string]: tint }}
                >
                  {/* کاشی ایموجی با ته‌رنگِ دسته */}
                  <span
                    className="grid place-items-center size-12 md:size-14 rounded-2xl text-2xl md:text-[26px]
                               transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: hexA(tint, 0.14), boxShadow: `inset 0 0 0 1px ${hexA(tint, 0.22)}` }}
                    aria-hidden
                  >
                    {c.iconUrl || "✨"}
                  </span>
                  <span className="text-[12.5px] md:text-[13.5px] font-black text-foreground leading-tight line-clamp-2">
                    {c.name}
                  </span>
                  <span className="text-[10.5px] md:text-[11px] font-bold text-muted-foreground nums-fa leading-none">
                    {toFa(c.skills.length)} مهارت
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════ FEATURED VALUE PROPS — big stat trio ══════ */}
      <section className="py-8 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <FeatureBlock
          icon="sparkles"
          title="نمایش استعداد"
          desc="پروفایل زیبا با گالری، دسته‌بندی و مهارت‌ها."
          tone="primary"
        />
        <FeatureBlock
          icon="compass"
          title="کشف بر اساس مهارت"
          desc="فیلترهای زنجیره‌ای: دسته ← مهارت، استان ← شهر."
          tone="gold"
        />
        <FeatureBlock
          icon="chat"
          title="ارتباط مستقیم"
          desc="چت لحظه‌ای با استعدادهای دیگر در یک کلیک."
          tone="rose"
        />
      </section>

      {/* ══════ HOW IT WORKS — vertical timeline ══════ */}
      <section className="py-8 md:py-12">
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-bold text-primary tracking-widest mb-1.5">چطور کار می‌کند</p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">چهار قدم تا دیده‌شدن</h2>
        </div>
        <div className="relative">
          {/* Vertical line (RTL: right side) */}
          <div className="absolute top-2 bottom-2 right-[19px] w-px bg-border/60" aria-hidden />
          <div className="space-y-5 md:space-y-6">
            {[
              { n: 1, label: "ثبت‌نام با شماره موبایل", desc: "ورود با شماره موبایل و کد تأیید به‌سادگی و سریع." },
              { n: 2, label: "تکمیل پروفایل و انتخاب مهارت", desc: "اطلاعات، عکس و مهارت‌های خود را اضافه کنید." },
              { n: 3, label: "پست بگذار و استعدادت رو نشون بده", desc: "گالری بساز، کارهایت را منتشر کن و دیده شو." },
              { n: 4, label: "با دیگران ارتباط بگیر و تیم بساز", desc: "چت کن، دنبال کن و تیم حرفه‌ای تشکیل بده." },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-4"
              >
                <div className="shrink-0 relative">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-extrabold text-sm ring-4 ring-background">
                    {toFa(s.n)}
                  </span>
                </div>
                <div className="pt-1">
                  <p className="text-base md:text-lg font-extrabold leading-tight">{s.label}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-6">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ TOP TALENT ══════ */}
      <TopTalentSection />

      {/* ══════ Final CTA — minimal ══════ */}
      <section className="py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl glass border border-border/60 p-8 md:p-12 text-center"
        >
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-25 blur-3xl pointer-events-none"
            style={{ backgroundColor: "oklch(0.6 0.15 160 / 0.6)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ backgroundColor: "oklch(0.75 0.15 80 / 0.5)" }}
          />
          <div className="relative space-y-4">
            <div className="flex justify-center">
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/15 text-primary">
                <Icon name="rocket" size={28} strokeWidth={2.2} className="text-primary" />
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
              آماده‌ی شروع هستی؟
            </h2>
            <p className="max-w-md mx-auto text-sm md:text-base text-muted-foreground leading-7">
              همین حالا ثبت‌نام کن و به جامعه‌ی استعدادهای ایران بپیوند.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate({ view: "auth" })}
              className="inline-flex items-center gap-2 h-12 md:h-14 px-8 rounded-2xl grad-brand text-white font-extrabold text-base shadow-glow hover:opacity-95 transition-opacity"
            >
              شروع کنید
              <Icon name="arrowLeft" size={18} strokeWidth={2.6} className="text-white" />
            </motion.button>
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-5 pt-3 text-xs font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="badgeCheck" size={16} className="text-gold" strokeWidth={2.2} />
                تیک تأیید
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="heart" size={16} className="text-rose" strokeWidth={2.2} />
                پست‌های محبوب
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="users" size={16} className="text-primary" strokeWidth={2.2} />
                تیم‌سازی
              </span>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

// ─── Hero Stat ─────────────────────────────────────────────────
function HeroStat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "primary" | "gold" | "rose";
}) {
  const colorClass = {
    primary: "text-primary",
    gold: "text-gold",
    rose: "text-rose",
  }[tone];
  return (
    <div className="flex flex-col">
      <span className={`text-2xl md:text-3xl font-black tabular-nums ${colorClass}`}>{value}</span>
      <span className="text-xs text-muted-foreground font-medium mt-0.5">{label}</span>
    </div>
  );
}

// ─── Feature Block ─────────────────────────────────────────────
function FeatureBlock({
  icon,
  title,
  desc,
  tone,
}: {
  icon: string;
  title: string;
  desc: string;
  tone: "primary" | "gold" | "rose";
}) {
  const tint = {
    primary: "bg-primary/12 text-primary",
    gold: "bg-gold/15 text-gold",
    rose: "bg-rose/12 text-rose",
  }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -3 }}
      className="p-6 md:p-7 rounded-3xl glass border border-border/60"
    >
      <span className={`grid place-items-center w-12 h-12 rounded-2xl mb-4 ${tint}`}>
        <Icon name={icon} size={22} strokeWidth={2.2} />
      </span>
      <h3 className="font-extrabold text-lg mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-6">{desc}</p>
    </motion.div>
  );
}

// ─── Top Talent Section: redesigned banner + conditions + form ─────────
/* ─── Top Talent CTA — مسیریابی به صفحهٔ مستقل درخواست (#/top-talent) ───────── */
function TopTalentSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-8 md:py-12"
      id="top-talent"
    >
      <div
        className="relative overflow-hidden rounded-3xl p-7 md:p-10"
        style={{
          background: "linear-gradient(120deg,#2a1a04 0%,#171005 45%,#241604 100%)",
          boxShadow: "inset 0 0 0 1px rgba(245,200,76,.32), 0 10px 30px rgba(146,97,14,.22)",
        }}
      >
        {/* ستاره‌های چشمک‌زن */}
        <GoldSparkle size={12} delay={0.2} style={{ top: "16%", left: "18%" }} />
        <GoldSparkle size={9} delay={1.1} style={{ top: "60%", left: "7%" }} />
        <GoldSparkle size={13} delay={0.6} style={{ top: "12%", right: "24%" }} />
        <GoldSparkle size={8} delay={1.7} style={{ bottom: "22%", right: "10%" }} />

        {/* غارها دو طرف */}
        <span aria-hidden className="absolute -top-3 -right-3 opacity-90 pointer-events-none">
          <Laurel size={72} />
        </span>
        <span aria-hidden className="absolute -bottom-3 -left-3 opacity-90 pointer-events-none rotate-180">
          <Laurel size={72} />
        </span>

        <div className="relative z-10 space-y-5 text-center">
          <span
            className="mx-auto grid place-items-center size-16 rounded-full"
            style={{
              background: "linear-gradient(135deg,#fef3c7,#f5c84c 45%,#b45309)",
              boxShadow: "0 8px 28px rgba(217,119,6,.45), inset 0 2px 8px rgba(255,255,255,.5)",
            }}
          >
            <GoldCheckMark size={30} />
          </span>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-[1.15] text-gold-grad">
            دنبال‌کنندگان بیشتر،
            <br />
            نشان تأیید طلایی بگیر.
          </h2>
          <p className="text-sm md:text-base text-amber-100/70 leading-7 max-w-xl mx-auto">
            کاربران منتخب با نشان استعداد برتر نمایش داده می‌شوند — قاب طلایی سلطنتی، تیک طلایی و
            جایگاه ویژه در صفحهٔ برترین‌ها. شرایط داری؟ درخواستت را ثبت کن.
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate({ view: "top-talent" })}
            className="inline-flex items-center gap-2.5 h-12 md:h-13 px-8 rounded-2xl text-white font-extrabold text-base shadow-glow-gold hover:opacity-95 transition-opacity"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
          >
            <GoldCheckMark size={22} />
            ثبت درخواست استعداد برتر
            <Icon name="arrowLeft" size={17} strokeWidth={2.6} className="text-white" />
          </motion.button>
          <p className="text-[11px] text-amber-100/45 font-bold">
            بررسی رسمی توسط تیم همتیم · اعلام نتیجه از طریق اعلان‌ها
          </p>
        </div>
      </div>
    </motion.section>
  );
}
