"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { LogoMark } from "@/components/shared/illustrations";
import { Icon } from "@/components/shared/icon";

export function AuthView() {
  const [step, setStep] = useState<"info" | "otp">("info");
  const [demoOtp, setDemoOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const fetchUser = useUser((s) => s.fetchUser);

  async function submitInfo(data: { name: string; phone: string }) {
    setSubmitting(true);
    try {
      const res = await apiPost<{ ok: boolean; otp: string; mode: "login" | "register"; error?: string }>(
        "/api/auth/register",
        data
      );
      setDemoOtp(res.otp);
      setPhone(data.phone);
      setName(data.name);
      setStep("otp");
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify() {
    if (otp.length < 4) return;
    setSubmitting(true);
    try {
      await apiPost("/api/auth/verify", { phone, otp });
      await fetchUser();
      toast({ title: "خوش آمدید! 🎉" });
      navigate({ view: "feed" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* ═══ Ambient background — solid colored blobs (NO gradient fills) ═══ */}
      <div
        className="absolute -top-32 -right-24 w-[440px] h-[440px] rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{ backgroundColor: "oklch(0.6 0.15 160 / 0.55)" }}
      />
      <div
        className="absolute top-1/4 -left-32 w-[360px] h-[360px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ backgroundColor: "oklch(0.75 0.15 80 / 0.45)" }}
      />
      <div
        className="absolute -bottom-24 right-1/3 w-[300px] h-[300px] rounded-full opacity-12 blur-3xl pointer-events-none"
        style={{ backgroundColor: "oklch(0.65 0.2 15 / 0.45)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ═══ Top — small wordmark ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative pt-6 md:pt-10 px-6 flex items-center justify-between"
      >
        <button
          onClick={() => navigate({ view: "feed" })}
          className="flex items-center gap-2.5"
          aria-label="همتیم"
        >
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15">
            <LogoMark className="w-6 h-6" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-foreground">همتیم</span>
        </button>
        <button
          onClick={() => navigate({ view: "feed" })}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          aria-label="بازگشت به صفحه اصلی"
        >
          <Icon name="arrowLeft" size={15} strokeWidth={2.4} className="rotate-180" />
          بازگشت
        </button>
        {process.env.NODE_ENV !== "production" && (
          <button
            onClick={() => navigate({ view: "admin" })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            ورود ادمین ←
          </button>
        )}
      </motion.div>

      {/* ═══ Centered glass card ═══ */}
      <div className="relative min-h-[calc(100vh-88px)] flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "info" ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.96 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-3xl glass-strong border border-border/60 p-7 md:p-9"
                style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}
              >
                {/* Accent badge */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="grid place-items-center w-10 h-10 rounded-2xl bg-primary/15 text-primary">
                    <Icon name="rocket" size={22} strokeWidth={2.2} className="text-primary" />
                  </span>
                  <p className="text-xs font-bold text-primary tracking-widest">شروع کن</p>
                </div>

                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.15] mb-2">
                  به <span className="text-primary">همتیم</span> خوش اومدی
                </h1>
                <p className="text-sm text-muted-foreground leading-6 mb-6">
                  نام و شماره موبایلت رو وارد کن. اگه حساب نداری خودکار ثبت‌نام می‌شی.
                </p>

                <InfoForm submitting={submitting} onSubmit={submitInfo} />

                {/* Demo OTP hint — فقط در توسعه */}
                {process.env.NODE_ENV !== "production" && (
                  <div className="mt-5 p-3.5 rounded-2xl bg-muted/40">
                    <p className="text-xs text-foreground/70 leading-6 flex items-start gap-1.5">
                      <Icon name="sparkles" size={14} className="text-primary shrink-0 mt-0.5" strokeWidth={2.4} />
                      <span>
                        کد تایید برای همه <strong>۱۲۳۴</strong> است (نسخه دمو).
                      </span>
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.96 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-3xl glass-strong border border-border/60 p-7 md:p-9"
                style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}
              >
                {/* Shield header */}
                <div className="mb-6">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18 }}
                    className="grid place-items-center w-16 h-16 rounded-2xl bg-primary/12 mb-5"
                  >
                    <Icon name="shield" size={32} className="text-primary" strokeWidth={2.2} />
                  </motion.div>
                  <p className="text-xs font-bold text-primary tracking-widest mb-2">تایید شماره</p>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                    کد رو وارد کن
                  </h1>
                  <p className="text-sm text-muted-foreground mt-2 leading-6">
                    کد ۴ رقمی ارسال شده به{" "}
                    <span className="font-semibold text-foreground" dir="ltr">{phone}</span> رو وارد کن.
                  </p>
                </div>

                {/* Demo OTP box — فقط در توسعه */}
                {demoOtp && process.env.NODE_ENV !== "production" && (
                  <div className="mb-6 p-4 rounded-2xl bg-primary/8 text-center border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">کد دمو</p>
                    <p className="font-mono text-3xl tracking-[0.5em] font-extrabold text-primary" dir="ltr">
                      {demoOtp}
                    </p>
                  </div>
                )}

                {/* OTP input */}
                <div className="mb-6">
                  <Label className="mb-3 block text-center">کد تایید</Label>
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-14 h-14 text-xl first:rounded-r-2xl last:rounded-l-2xl" />
                        <InputOTPSlot index={1} className="w-14 h-14 text-xl" />
                        <InputOTPSlot index={2} className="w-14 h-14 text-xl" />
                        <InputOTPSlot index={3} className="w-14 h-14 text-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button
                  onClick={onVerify}
                  className="w-full h-14 rounded-2xl text-base font-bold py-3.5 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  style={{ boxShadow: "0 8px 30px oklch(0.6 0.15 160 / 0.35)" }}
                  disabled={submitting || otp.length < 4}
                >
                  {submitting ? (
                    <Icon name="loader" size={20} className="text-primary-foreground animate-spin" strokeWidth={2.4} />
                  ) : (
                    <Icon name="arrowLeft" size={20} strokeWidth={2.6} className="text-primary-foreground" />
                  )}
                  ورود به همتیم
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  ← بازگشت و ویرایش
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tagline at the bottom */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground/80 font-medium mt-6"
          >
            همتیم — کاملاً رایگان
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function InfoForm({ submitting, onSubmit }: { submitting: boolean; onSubmit: (data: { name: string; phone: string }) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast({ title: "خطا", description: "نام را کامل وارد کنید", variant: "destructive" });
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      toast({ title: "خطا", description: "شماره موبایل معتبر نیست", variant: "destructive" });
      return;
    }
    onSubmit({ name: name.trim(), phone });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-bold">نام و نام خانوادگی</Label>
        <div className="relative">
          <Icon name="user" size={20} className="text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" strokeWidth={2} />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: علی رضایی"
            className="h-13 rounded-2xl text-base py-3.5 pr-11"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-bold">شماره موبایل</Label>
        <div className="relative">
          <Icon name="phone" size={20} className="text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" strokeWidth={2} />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            className="h-13 rounded-2xl text-base py-3.5 pr-11"
            dir="ltr"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-13 rounded-2xl text-base font-bold py-3.5 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        style={{ boxShadow: "0 8px 30px oklch(0.6 0.15 160 / 0.35)" }}
        disabled={submitting}
      >
        {submitting ? (
          <Icon name="loader" size={20} className="text-primary-foreground animate-spin" strokeWidth={2.4} />
        ) : (
          <Icon name="arrowLeft" size={18} strokeWidth={2.6} className="text-primary-foreground" />
        )}
        دریافت کد تایید
      </Button>
    </form>
  );
}
