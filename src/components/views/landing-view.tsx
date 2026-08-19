"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoMark } from "@/components/shared/illustrations";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import type { CategoryWithSkills, TopTalentMyStatus } from "@/lib/types";

const TOP_TALENT_CONDITIONS = [
  {
    icon: "clock" as const,
    title: "فعالیت حداقل ۶ ماه",
    desc: "حداقل ۶ ماه فعالیت مستمر در حوزه‌ی تخصصی خود داشته باشید.",
  },
  {
    icon: "image" as const,
    title: "حداقل ۱۰ پست با کیفیت",
    desc: "حداقل ۱۰ پست باکیفیت از کارهای خود منتشر کرده باشید.",
  },
  {
    icon: "users" as const,
    title: "دنبال‌کننده‌ی فعال",
    desc: "دنبال‌کنندگان فعال و تعامل واقعی با مخاطبان داشته باشید.",
  },
  {
    icon: "shield" as const,
    title: "اثبات هویت",
    desc: "برای اثبات مدارک هویتی، لطفاً کارت ملی تونو عکس شو وارد کنین.",
  },
];

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

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
          className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl pointer-events-none"
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
              <span className="text-primary">رو به دنیا</span>
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
                className="inline-flex items-center gap-2 h-12 md:h-14 px-6 md:px-8 rounded-2xl bg-primary text-primary-foreground font-extrabold text-base hover:bg-primary/90 transition-colors"
                style={{ boxShadow: "0 8px 30px oklch(0.6 0.15 160 / 0.35)" }}
              >
                شروع کنید
                <Icon name="arrowLeft" size={18} strokeWidth={2.6} className="text-primary-foreground" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate({ view: "discover" })}
                className="inline-flex items-center gap-2 h-12 md:h-14 px-6 md:px-8 rounded-2xl glass text-foreground font-bold text-base hover:bg-muted/60 transition-colors"
              >
                <Icon name="compass" size={18} strokeWidth={2.4} className="text-primary" />
                کشف استعدادها
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

      {/* ══════ CATEGORY PILLS — horizontal chip row ══════ */}
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
          <div className="flex gap-2.5 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="shrink-0 w-28 h-11 rounded-full" />
            ))}
          </div>
        ) : cats.length === 0 ? null : (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
            {cats.slice(0, 12).map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate({ view: "category", id: c.id })}
                className="shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-full glass border border-border/60 hover:border-primary/50 hover:bg-primary/8 transition-colors"
              >
                <span className="text-xl leading-none">{c.iconUrl || "✨"}</span>
                <span className="text-sm font-bold text-foreground whitespace-nowrap">{c.name}</span>
              </motion.button>
            ))}
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
              { n: 1, label: "ثبت‌نام با موبایل و کد ملی", desc: "ورود با شماره موبایل و کد ملی به‌سادگی و سریع." },
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
              className="inline-flex items-center gap-2 h-12 md:h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-extrabold text-base hover:bg-primary/90 transition-colors"
              style={{ boxShadow: "0 8px 30px oklch(0.6 0.15 160 / 0.35)" }}
            >
              شروع کنید
              <Icon name="arrowLeft" size={18} strokeWidth={2.6} className="text-primary-foreground" />
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

      {/* ══════ Dev notice ══════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="flex justify-center pb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/50 text-sm text-muted-foreground font-medium">
          <Icon name="sparkles" size={14} className="text-gold" strokeWidth={2.4} />
          توسعه‌ی این صفحه ادامه دارد
        </div>
      </motion.div>
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
function TopTalentSection() {
  const { user, loading: userLoading } = useUser();
  const [status, setStatus] = useState<TopTalentMyStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setStatusLoading(false);
      return;
    }
    setStatusLoading(true);
    try {
      const s = await api<TopTalentMyStatus>("/api/top-talent/my-status");
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (userLoading) return;
    loadStatus();
  }, [user, userLoading, loadStatus]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-8 md:py-12 space-y-4 md:space-y-5"
      id="top-talent"
    >
      {/* Header — glass with gold accent */}
      <div className="relative overflow-hidden rounded-3xl glass border border-gold/30 p-7 md:p-10">
        <div
          className="absolute -top-16 -right-12 w-56 h-56 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.75 0.15 80 / 0.6)" }}
        />
        <div
          className="absolute -bottom-16 -left-12 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.6 0.15 160 / 0.5)" }}
        />
        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-gold/15">
              <Icon name="crown" size={26} className="text-gold" strokeWidth={2.2} />
            </div>
            <p className="text-xs font-bold text-gold tracking-widest">استعداد برتر</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
            دنبال‌کنندگان بیشتری بگیر،
            <br />
            <span className="text-gold">تیک تأیید بگیر.</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-7 max-w-xl">
            کاربران منتخب ما با تیک استعداد برتر نمایش داده می‌شوند. اگر فکر می‌کنید
            شرایط لازم را دارید، درخواست خود را ثبت کنید.
          </p>
        </div>
      </div>

      {/* Conditions — minimal list */}
      <div className="rounded-3xl glass border border-border/60 p-6 md:p-8 space-y-4">
        <h3 className="text-lg md:text-xl font-extrabold flex items-center gap-2">
          <Icon name="sparkles" size={20} className="text-primary" strokeWidth={2.4} />
          شرایط لازم
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {TOP_TALENT_CONDITIONS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40"
            >
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                <Icon name={c.icon} size={20} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-5">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-5">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Form / status / login gate */}
      <div className="rounded-3xl glass border border-border/60 p-6 md:p-8">
        {userLoading || statusLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-48 rounded-xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        ) : !user ? (
          <LoginGate />
        ) : status && status.hasRequest && status.status !== "rejected" ? (
          <StatusMessage status={status} />
        ) : (
          <TopTalentForm
            initialRejected={status?.status === "rejected" ? (status.rejectReason ?? null) : null}
            onSubmitted={loadStatus}
          />
        )}
      </div>
    </motion.section>
  );
}

function LoginGate() {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
        <Icon name="lock" size={28} className="text-primary" strokeWidth={2.2} />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-extrabold">ابتدا وارد شوید</h3>
        <p className="text-sm text-muted-foreground leading-6 max-w-md mx-auto">
          برای ثبت درخواست استعداد برتر، ابتدا وارد حساب کاربری خود شوید.
        </p>
      </div>
      <Button
        onClick={() => navigate({ view: "auth" })}
        className="gap-2 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-11"
      >
        ورود / ثبت‌نام
        <Icon name="arrowLeft" size={16} strokeWidth={2.6} className="text-primary-foreground" />
      </Button>
    </div>
  );
}

function StatusMessage({ status }: { status: TopTalentMyStatus }) {
  if (status.status === "approved") {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gold/15 text-gold mx-auto">
          <Icon name="crown" size={28} className="text-gold" strokeWidth={2.2} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold">شما استعداد برتر هستید ✅</h3>
          <p className="text-sm text-muted-foreground leading-6 max-w-md mx-auto">
            تیک استعداد برتر روی پروفایل شما نمایش داده می‌شود.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="text-center space-y-4 py-4">
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gold/15 text-gold mx-auto">
        <Icon name="clock" size={28} className="text-gold" strokeWidth={2.2} />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-extrabold">درخواست شما در حال بررسی است</h3>
        <p className="text-sm text-muted-foreground leading-6 max-w-md mx-auto">
          درخواست شما ثبت شده و در انتظار بررسی تیم همتیم است. پس از تأیید، تیک
          استعداد برتر روی پروفایل شما نمایش داده خواهد شد.
        </p>
      </div>
    </div>
  );
}

function TopTalentForm({
  initialRejected,
  onSubmitted,
}: {
  initialRejected: string | null;
  onSubmitted: () => void;
}) {
  const [nationalIdPhotoUrl, setNationalIdPhotoUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [socialMediaId, setSocialMediaId] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function validateFile(file: File): string | null {
    if (!file.type.startsWith("image/")) {
      return "فقط فایل تصویری مجاز است";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "حجم فایل باید کمتر از ۱ مگابایت باشد";
    }
    return null;
  }

  async function handleFileSelect(file: File) {
    const err = validateFile(file);
    if (err) {
      toast({ title: "خطا", description: err, variant: "destructive" });
      return;
    }
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/top-talent/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "آپلود ناموفق بود");
      }
      setNationalIdPhotoUrl(data.url);
      toast({ title: "عکس کارت ملی آپلود شد ✅" });
    } catch (e) {
      toast({
        title: "خطا در آپلود",
        description: (e as Error).message,
        variant: "destructive",
      });
      if (localUrl.startsWith("blob:")) URL.revokeObjectURL(localUrl);
      setPreviewUrl("");
      setNationalIdPhotoUrl("");
    } finally {
      setUploading(false);
    }
  }

  function clearPhoto() {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setNationalIdPhotoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    if (!nationalIdPhotoUrl) {
      toast({
        title: "خطا",
        description: "عکس کارت ملی الزامی است",
        variant: "destructive",
      });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({
        title: "خطا",
        description: "شماره تلفن اصلی الزامی است",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost<{ ok: boolean; id: string }>("/api/top-talent/request", {
        nationalIdPhotoUrl,
        phoneNumber: phoneNumber.trim(),
        socialMediaId: socialMediaId.trim(),
        description: description.trim(),
      });
      toast({
        title: "درخواست ثبت شد ✅",
        description: "درخواست شما در حال بررسی است.",
      });
      clearPhoto();
      setPhoneNumber("");
      setSocialMediaId("");
      setDescription("");
      onSubmitted();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="text-lg font-extrabold flex items-center gap-2">
          <Icon name="spark" size={20} className="text-primary" strokeWidth={2.4} />
          فرم درخواست استعداد برتر
        </h3>
        <p className="text-xs text-muted-foreground leading-5">
          اطلاعات زیر را با دقت وارد کنید. پس از بررسی تیم همتیم، نتیجه اعلام
          خواهد شد.
        </p>
      </div>

      {initialRejected && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose/10">
          <Icon name="alert" size={16} className="text-rose shrink-0 mt-0.5" strokeWidth={2.2} />
          <div>
            <p className="text-xs font-bold text-rose">درخواست قبلی رد شد</p>
            <p className="text-[11px] text-rose/80 mt-0.5 leading-5">{initialRejected}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>عکس کارت ملی *</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
            e.target.value = "";
          }}
        />
        {previewUrl ? (
          <div className="relative rounded-2xl overflow-hidden bg-muted/40">
            <img
              src={previewUrl}
              alt="پیش‌نمایش کارت ملی"
              className="w-full max-h-56 object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              disabled={uploading}
              className="absolute top-2 left-2 grid place-items-center w-8 h-8 rounded-full bg-card text-rose"
              aria-label="حذف عکس"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
            >
              <Icon name="x" size={16} className="text-rose" strokeWidth={2.4} />
            </button>
            {uploading && (
              <div className="absolute inset-0 grid place-items-center bg-background/60">
                <Icon name="loader" size={28} className="text-primary animate-spin" strokeWidth={2.4} />
              </div>
            )}
            {nationalIdPhotoUrl && !uploading && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1">
                <Icon name="check" size={12} className="text-primary-foreground" strokeWidth={2.6} />
                آپلود شد
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            {uploading ? (
              <Icon name="loader" size={24} className="text-primary animate-spin" strokeWidth={2.4} />
            ) : (
              <Icon name="imagePlus" size={24} className="text-muted-foreground" strokeWidth={2.2} />
            )}
            <span className="text-xs font-semibold">
              {uploading ? "در حال آپلود..." : "انتخاب عکس کارت ملی"}
            </span>
            <span className="text-[10px] text-muted-foreground/80">
              فقط تصویر، حداکثر ۱ مگابایت
            </span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tt-phone">شماره تلفن اصلی *</Label>
        <Input
          id="tt-phone"
          placeholder="مثلاً: ۰۹۱۲۳۴۵۶۷۸۹"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          dir="ltr"
          className="rounded-2xl text-right"
          inputMode="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tt-social">آیدی شبکه‌های اجتماعی</Label>
        <Input
          id="tt-social"
          placeholder="مثلاً: @ali_art یا instagram.com/ali_art"
          value={socialMediaId}
          onChange={(e) => setSocialMediaId(e.target.value)}
          dir="ltr"
          className="rounded-2xl text-right"
        />
        <p className="text-[11px] text-muted-foreground leading-5">
          آیدی یا لینک شبکه‌های اجتماعی (اینستاگرام، تلگرام و...) خود را وارد
          کنید. متن آزاد است.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tt-desc">متن توضیح (اختیاری)</Label>
        <Textarea
          id="tt-desc"
          rows={4}
          placeholder="درباره‌ی فعالیت، دستاوردها و دلیل مناسب بودن شما برای استعداد برتر..."
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
          maxLength={1000}
          className="rounded-2xl resize-none leading-7"
        />
        <p className="text-[11px] text-muted-foreground text-left">
          {toFa(description.length)}/{toFa(1000)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Icon name="shield" size={14} className="text-primary" strokeWidth={2.2} />
          اطلاعات شما محرمانه می‌ماند
        </div>
        <Button
          onClick={submit}
          disabled={submitting || uploading || !nationalIdPhotoUrl || !phoneNumber.trim()}
          className="gap-2 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-11"
        >
          {submitting ? (
            <Icon name="loader" size={16} className="text-primary-foreground animate-spin" strokeWidth={2.4} />
          ) : (
            <Icon name="upload" size={16} className="text-primary-foreground" strokeWidth={2.4} />
          )}
          ثبت درخواست
        </Button>
      </div>
    </div>
  );
}
