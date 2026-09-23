"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoFull } from "@/components/shared/illustrations";
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
    <div className="relative">
      {/* ══════ HERO — کلاسیک، تمیز، سریع (بدون بلور/انیمیشن سنگین) ══════ */}
      <section className="relative -mx-4 md:-mx-8 px-4 md:px-8">
        <div className="relative min-h-[78vh] md:min-h-[70vh] flex flex-col rounded-b-[28px] overflow-hidden"
             style={{ background: "linear-gradient(165deg, #162a4b 0%, #101835 55%, #0d1426 100%)" }}>
          {/* هالهٔ نور ایستا — بدون انیمیشن */}
          <div
            aria-hidden
            className="absolute -top-24 -right-16 w-[380px] h-[380px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(61,124,190,.4) 0%, transparent 70%)", opacity: .6 }}
          />
          <div
            aria-hidden
            className="absolute -bottom-28 -left-16 w-[320px] h-[320px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(164,232,109,.22) 0%, transparent 70%)" }}
          />

          {/* Content overlay */}
          <div className="relative min-h-[78vh] md:min-h-[70vh] flex flex-col">
            {/* Top — wordmark بزرگ‌تر */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="pt-5 md:pt-8 flex items-center gap-2.5"
            >
              <LogoFull h={48} />
            </motion.div>

          {/* Center — big dramatic headline */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-sm md:text-base font-bold text-secondary tracking-widest mb-4 md:mb-6"
            >
              ✦ شبکه‌ی کشف استعداد ✦
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-[42px] md:text-7xl font-black leading-[1.08] tracking-tight text-white"
            >
              استعدادت
              <br />
              <span className="text-secondary">رو به دنیا</span>
              <br />
              <span className="text-gold">نشون بده.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 md:mt-8 text-base md:text-lg text-slate-300 leading-8 max-w-xl"
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
                className="inline-flex items-center gap-2 h-12 md:h-14 px-6 md:px-8 rounded-2xl text-white font-extrabold text-base hover:opacity-95 transition-opacity"
                style={{ background: "linear-gradient(135deg,#1268bb,#0f569e 60%,#0d4680)", boxShadow: "0 8px 24px rgba(15,86,158,.45)" }}
              >
                شروع کنید
                <Icon name="arrowLeft" size={18} strokeWidth={2.6} className="text-white" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate({ view: "discover" })}
                className="inline-flex items-center gap-2 h-12 md:h-14 px-6 md:px-8 rounded-2xl bg-white text-foreground font-bold text-base hover:bg-slate-50 transition-colors"
              >
                <Icon name="compass" size={18} strokeWidth={2.4} className="text-primary" />
                کشف استعدادها
              </motion.button>
              {/* CTA طلایی — سیستم ستارهٔ چهره برتر */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate({ view: "explore" })}
                className="inline-flex items-center gap-2 h-12 md:h-14 px-6 md:px-7 rounded-2xl text-white font-extrabold text-base hover:opacity-95 transition-opacity"
                style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)", boxShadow: "0 8px 24px rgba(217,119,6,.4)" }}
              >
                <GoldCheckMark size={20} />
                چهره‌های برتر
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
            <div className="hidden md:block w-px h-12 bg-white/20" />
            <HeroStat value="بی‌نهایت" label="مهارت" tone="gold" />
            <div className="hidden md:block w-px h-12 bg-white/20" />
            <HeroStat value="لحظه‌ای" label="چت" tone="rose" />
          </motion.div>
        </div>
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
            {cats.slice(0, 12).map((c) => {
              const tint = c.color || "#067647";
              return (
                <button
                  key={c.id}
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
                </button>
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

      {/* ══════ TOP TALENT — سیستم ستارهٔ چهره برتر ══════ */}
      <StarSystemSection />

      {/* ══════ SCOUT — پنل چهره‌یاب (استعدادیاب‌ها) ══════ */}
      <ScoutSection />

      {/* ══════ Final CTA — minimal ══════ */}
      <section className="py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl glass border border-border/60 p-8 md:p-12 text-center"
        >
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
  /* هیرو تیره است — رنگ‌های روشن مخصوص پس‌زمینهٔ سرمه‌ای */
  const colorClass = {
    primary: "text-[#7db6ea]",
    gold: "text-gold",
    rose: "text-[#fb7185]",
  }[tone];
  return (
    <div className="flex flex-col">
      <span className={`text-2xl md:text-3xl font-black tabular-nums ${colorClass}`}>{value}</span>
      <span className="text-xs text-slate-400 font-medium mt-0.5">{label}</span>
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

// ─── Star System Section — چهره برتر (۵۰۰۰ طلایی / ۱۰۰۰۰ رزگلد) ─────────
/* ─── پنل طلایی سیستم ستاره — CTA به صفحهٔ چهره برتر (#/explore) ───────── */
function StarSystemSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-8 md:py-12"
      id="chehre-bartar"
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
            ستاره بگیر،
            <br />
            چهره برتر شو.
          </h2>
          <p className="text-sm md:text-base text-amber-100/70 leading-7 max-w-xl mx-auto">
            هر پست توسط کاربران ۱ تا ۱۰ ستاره می‌گیرد. با ۵۰۰۰ ستاره یا ۵۰۰ رأی قاب طلایی می‌گیری و می‌توانی هفته‌ای یک پست دلخواه را
            به صفحهٔ چهره برتر بفرستی؛ با ۱۰۰۰۰ ستاره قاب کمیاب رزگلد از آنِ تو می‌شود.
          </p>

          {/* دو سطح قاب */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12px] font-black"
              style={{ background: "linear-gradient(135deg,#fef3c7,#f5c84c 45%,#e08a00)", color: "#3a2405" }}
            >
              <GoldCheckMark size={15} />
              ۵۰۰۰ ستاره یا ۵۰۰ رأی → قاب طلایی
            </span>
            <span
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12px] font-black shadow-[0_6px_18px_rgba(225,29,72,.25)]"
              style={{ background: "linear-gradient(135deg,#ffe4e6,#fb7185 45%,#be123c)", color: "#4c0519" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M7.6 12.4l2.9 2.9 5.9-6.4" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
              </svg>
              ۱۰۰۰۰ ستاره → قاب رزگلد
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate({ view: "explore" })}
            className="inline-flex items-center gap-2.5 h-12 md:h-13 px-8 rounded-2xl text-white font-extrabold text-base shadow-glow-gold hover:opacity-95 transition-opacity"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
          >
            <GoldCheckMark size={22} />
            مشاهده چهره برتر
            <Icon name="arrowLeft" size={17} strokeWidth={2.6} className="text-white" />
          </motion.button>
          <p className="text-[11px] text-amber-100/45 font-bold">
            رأی مستقیم کاربران · هفته‌ای یک پست در ویترین · مسیر جایگزین با تأیید ادمین
          </p>
        </div>
      </div>
    </motion.section>
  );
}

// ─── Scout Section — پنل سبز چهره‌یاب (آژانس/کانون/مرکز استعدادیابی) ───────
function ScoutSection() {
  function goScout() {
    const u = useUser.getState().user;
    navigate(
      u
        ? u.isScout
          ? { view: "scout" }
          : { view: "scout-apply" }
        : { view: "auth", params: { mode: "scout" } }
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-8 md:py-12"
      id="chehreyab"
    >
      <div
        className="relative overflow-hidden rounded-3xl glass border border-emerald-600/25 p-7 md:p-10"
        style={{ boxShadow: "0 10px 30px rgba(16,185,129,0.12)" }}
      >
        <div className="relative space-y-5 text-center">
          <span className="mx-auto grid place-items-center size-16 rounded-full bg-emerald-600/12 text-emerald-700 dark:text-emerald-300 border border-emerald-600/25">
            <Icon name="compass" size={30} strokeWidth={2.2} />
          </span>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 tracking-widest">
            برای استعدادیاب‌ها
          </p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-[1.15]">
            چهره‌یاب هستی؟ استعدادها را تو کشف کن.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-7 max-w-2xl mx-auto">
            آژانس، کانون یا مرکز استعدادیابی؟ به‌عنوان چهره‌یاب ثبت‌نام کن: چهره‌های برتر و استعدادهای در حال
            رشد را ببین، نیازمندی ثبت کن و بهترین‌ها را مستقیم به ادمین معرفی کن.
          </p>

          {/* سه قابلیت کلیدی */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-start max-w-3xl mx-auto">
            {[
              { icon: "badgeCheck", label: "دیده‌شدن نیازمندی‌ها با نشان چهره‌یاب" },
              { icon: "search", label: "جستجوی استعدادها بر اساس دسته و شهر" },
              { icon: "award", label: "معرفی مستقیم به ادمین برای قاب چهره برتر" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-600/6 border border-emerald-600/15"
              >
                <span className="grid place-items-center size-8 rounded-xl bg-emerald-600/12 text-emerald-700 dark:text-emerald-300 shrink-0">
                  <Icon name={f.icon} size={15} strokeWidth={2.2} />
                </span>
                <p className="text-[12px] font-bold leading-5">{f.label}</p>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={goScout}
            className="inline-flex items-center gap-2.5 h-12 md:h-13 px-8 rounded-2xl bg-emerald-600 text-white font-extrabold text-base shadow-[0_10px_30px_rgba(5,150,105,0.35)] hover:opacity-95 transition-opacity"
          >
            <Icon name="compass" size={19} strokeWidth={2.4} className="text-white" />
            ثبت‌نام چهره‌یاب
            <Icon name="arrowLeft" size={17} strokeWidth={2.6} className="text-white" />
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
