"use client";

/* ═══════════════════════════════════════════════════════════
   TopTalentView — صفحهٔ مستقل درخواست استعداد برتر (#/top-talent)
   · هدر سلطنتی ابیسیدین‌وطلا (غار + مدال + ستاره)
   · شرایط + مزایای نشان
   · ویزارد ۳ مرحله‌ای / وضعیت درخواست / گیت ورود
   ═══════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { api } from "@/lib/api-client";
import { BackButton } from "@/components/shared/back-button";
import { GoldCheckMark, GoldSparkle, Laurel } from "@/components/ui/elite";
import { Icon } from "@/components/shared/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { TopTalentWizard } from "@/components/top-talent/top-talent-form";
import type { TopTalentMyStatus } from "@/lib/types";

const CONDITIONS = [
  { icon: "clock", title: "فعالیت حداقل ۶ ماه", desc: "فعالیت مستمر در حوزهٔ تخصصی خود" },
  { icon: "image", title: "حداقل ۱۰ پست باکیفیت", desc: "نمایش واقعی کار و مهارت در همتیم" },
  { icon: "users", title: "دنبال‌کنندهٔ فعال", desc: "تعامل واقعی با مخاطبان" },
  { icon: "shield", title: "اثبات هویت", desc: "ارسال تصویر کارت ملی برای تأیید" },
];

const PERKS = [
  "نشان تیک طلایی روی پروفایل و پست‌ها",
  "نمایش در صفحهٔ استعدادهای برتر",
  "قاب طلایی سلطنتی دور آواتار",
  "اولویت دیده‌شدن در کشف و جستجو",
];

export function TopTalentView() {
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
    if (!userLoading) loadStatus();
  }, [user, userLoading, loadStatus]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-5 pb-20 md:pb-2">
      {/* ═══ هدر سلطنتی ═══ */}
      <div
        className="relative overflow-hidden rounded-[28px] elite-panel"
        role="banner"
      >
        {/* غارها */}
        <motion.div
          initial={{ opacity: 0, x: 14, rotate: -8 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute -top-2 -right-3 opacity-90 pointer-events-none"
        >
          <Laurel size={58} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -14, rotate: 8 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-2 -left-3 opacity-90 pointer-events-none"
        >
          <Laurel size={58} flip />
        </motion.div>
        <GoldSparkle size={13} delay={0} style={{ top: "16%", left: "22%" }} />
        <GoldSparkle size={9} delay={0.8} style={{ top: "60%", left: "8%" }} />
        <GoldSparkle size={11} delay={1.5} style={{ top: "20%", right: "26%" }} />
        <GoldSparkle size={8} delay={0.4} style={{ bottom: "20%", right: "10%" }} />

        {/* بازگشت + مدال */}
        <div className="relative z-10 pt-4 px-4 flex items-center justify-between">
          <BackButton label="بازگشت" />
          <span className="text-[10px] font-bold text-amber-100/60 tracking-widest">
            صفحهٔ رسمی ارزیابی
          </span>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center pb-7 pt-2 px-6">
          <motion.span
            initial={{ scale: 0, rotate: -14 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.15 }}
            className="grid place-items-center size-[74px] rounded-full mb-3.5"
            style={{
              background: "linear-gradient(135deg,#fef3c7,#f5c84c 45%,#b45309)",
              boxShadow: "0 10px 32px rgba(217,119,6,.45), inset 0 2px 8px rgba(255,255,255,.55)",
            }}
          >
            <GoldCheckMark size={40} />
          </motion.span>
          <h1 className="text-[22px] sm:text-2xl font-black tracking-tight text-gold-grad">
            درخواست استعداد برتر
          </h1>
          <p className="text-[12.5px] text-amber-100/70 mt-1.5 leading-6 max-w-sm">
            مسیر رسمی دریافت نشان نخبگی همتیم — بررسی توسط تیم، اعلام نتیجه از طریق اعلان‌ها
          </p>
        </div>
      </div>

      {/* ═══ بدنه ═══ */}
      {userLoading || statusLoading ? (
        <div className="rounded-3xl glass border border-border/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      ) : !user ? (
        <LoginGate />
      ) : status && status.hasRequest && status.status !== "rejected" ? (
        <StatusPanel status={status} />
      ) : (
        <div className="rounded-3xl glass border border-gold/30 p-5 md:p-7">
          <TopTalentWizard
            initialRejected={status?.status === "rejected" ? (status.rejectReason ?? null) : null}
            onSubmitted={loadStatus}
          />
        </div>
      )}

      {/* ═══ شرایط ═══ */}
      <section className="rounded-3xl glass border border-border/60 p-5 md:p-7 space-y-4">
        <h2 className="text-base font-extrabold flex items-center gap-2">
          <Icon name="sparkles" size={18} className="text-primary" strokeWidth={2.4} />
          شرایط لازم
        </h2>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {CONDITIONS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i }}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/40"
            >
              <span className="grid place-items-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
                <Icon name={c.icon as any} size={17} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[13px] leading-5">{c.title}</p>
                <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-5">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ مزایا ═══ */}
      <section
        className="relative overflow-hidden rounded-3xl p-5 md:p-7"
        style={{
          background: "linear-gradient(120deg,#2a1a04,#171005 45%,#241604)",
          boxShadow: "inset 0 0 0 1px rgba(245,200,76,.3), 0 8px 24px rgba(146,97,14,.25)",
        }}
        aria-label="مزایای نشان"
      >
        <GoldSparkle size={10} delay={0.3} style={{ top: "18%", right: "12%" }} />
        <GoldSparkle size={8} delay={1.2} style={{ bottom: "24%", left: "16%" }} />
        <h2 className="relative z-10 text-base font-black text-gold-grad flex items-center gap-2 mb-3.5">
          <Laurel size={22} />
          مزایای نشان نخبگی
        </h2>
        <ul className="relative z-10 space-y-2.5">
          {PERKS.map((p, i) => (
            <motion.li
              key={p}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
              className="flex items-center gap-2.5 text-[13px] font-bold text-amber-100/90"
            >
              <GoldCheckMark size={16} />
              {p}
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ── گیت ورود ── */
function LoginGate() {
  return (
    <div className="rounded-3xl glass border border-border/60 p-8 text-center space-y-4">
      <div className="grid place-items-center size-14 rounded-2xl bg-primary/10 text-primary mx-auto">
        <Icon name="lock" size={26} strokeWidth={2.2} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-extrabold">ابتدا وارد شوید</h3>
        <p className="text-sm text-muted-foreground leading-6 max-w-sm mx-auto">
          برای ثبت درخواست استعداد برتر، ابتدا وارد حساب کاربری خود شوید.
        </p>
      </div>
      <button
        onClick={() => navigate({ view: "auth" })}
        className="inline-flex items-center gap-2 h-12 px-7 rounded-2xl grad-brand text-white font-extrabold text-sm shadow-glow hover:opacity-95 transition-opacity"
      >
        ورود / ثبت‌نام
        <Icon name="arrowLeft" size={16} strokeWidth={2.6} className="text-white" />
      </button>
    </div>
  );
}

/* ── وضعیت درخواست ── */
function StatusPanel({ status }: { status: TopTalentMyStatus }) {
  if (status.status === "approved") {
    return (
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-center space-y-4"
        style={{
          background: "linear-gradient(120deg,#2a1a04,#171005 45%,#241604)",
          boxShadow: "inset 0 0 0 1px rgba(245,200,76,.35)",
        }}
      >
        <Laurel size={40} />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="mx-auto grid place-items-center size-16 rounded-full"
          style={{ background: "linear-gradient(135deg,#fef3c7,#f5c84c 50%,#b45309)" }}
        >
          <GoldCheckMark size={30} />
        </motion.div>
        <Laurel size={40} flip className="absolute top-8 left-5" />
        <h3 className="text-xl font-black text-gold-grad">شما استعداد برتر هستید</h3>
        <p className="text-sm text-amber-100/70 leading-7">
          نشان نخبگی روی پروفایل شما فعال است — قاب طلایی، تیک طلایی و نمایش در صفحهٔ برترین‌ها.
        </p>
        <button
          onClick={() => navigate({ view: "explore" })}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-2xl text-white font-extrabold text-sm shadow-glow-gold hover:opacity-95 transition-opacity"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
        >
          مشاهدهٔ استعدادهای برتر
          <Icon name="arrowLeft" size={15} strokeWidth={2.6} className="text-white" />
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-3xl glass border border-gold/30 p-8 text-center space-y-4">
      <div className="grid place-items-center size-14 rounded-2xl bg-gold/12 text-gold mx-auto">
        <Icon name="clock" size={26} strokeWidth={2.2} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-extrabold">درخواست شما در حال بررسی است</h3>
        <p className="text-sm text-muted-foreground leading-6 max-w-sm mx-auto">
          تیم همتیم مدارک شما را بررسی می‌کند. نتیجه از طریق اعلان‌ها و همین صفحه اعلام می‌شود.
        </p>
      </div>
      <button onClick={() => navigate({ view: "feed" })} className="text-sm font-bold text-primary underline underline-offset-4">
        بازگشت به صفحهٔ اصلی
      </button>
    </div>
  );
}
