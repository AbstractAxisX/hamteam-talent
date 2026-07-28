"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { AuthIllustration, LogoMark } from "@/components/shared/illustrations";
import { ArrowLeft, Loader2, Phone, ShieldCheck, Sparkles, Users, Briefcase, Heart, User as UserIcon, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

// Login: phone only
const loginSchema = z.object({
  phone: z.string().min(10, "شماره موبایل معتبر نیست"),
});
// Register: name + phone + nationalId
const registerSchema = z.object({
  name: z.string().min(2, "نام را کامل وارد کنید"),
  phone: z.string().min(10, "شماره موبایل معتبر نیست"),
  nationalId: z.string().length(10, "کد ملی باید ۱۰ رقم باشد"),
});

export function AuthView() {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<"info" | "otp">("info");
  const [demoOtp, setDemoOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const fetchUser = useUser((s) => s.fetchUser);

  const loginForm = useForm({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm({ resolver: zodResolver(registerSchema) });

  async function onLoginSubmit(data: { phone: string }) {
    setSubmitting(true);
    try {
      const res = await apiPost<{ ok: boolean; otp: string; mode: "login" | "register"; error?: string }>(
        "/api/auth/register",
        { name: "—", phone: data.phone, nationalId: "—".padEnd(10, "0") }
      );
      // The backend auto-detects login vs register. If phone doesn't exist, it'll require register.
      setDemoOtp(res.otp);
      setPhone(data.phone);
      setStep("otp");
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function onRegisterSubmit(data: { name: string; phone: string; nationalId: string }) {
    setSubmitting(true);
    try {
      const res = await apiPost<{ ok: boolean; otp: string; mode: "login" | "register"; error?: string }>(
        "/api/auth/register",
        data
      );
      setDemoOtp(res.otp);
      setPhone(data.phone);
      setName(data.name);
      setNationalId(data.nationalId);
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
      toast({ title: "خوش آمدید! 👋" });
      navigate({ view: "feed" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setStep("info");
    setOtp("");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left: Brand visual (desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-gradient p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-white/5 animate-float" />
        <div className="absolute bottom-32 left-16 w-24 h-24 rounded-full bg-gold/10 animate-float" style={{ animationDelay: "1.5s" }} />

        <div className="relative flex items-center gap-3">
          <LogoMark className="w-11 h-11" />
          <span className="text-2xl font-extrabold">همتیم</span>
        </div>

        <div className="relative space-y-6">
          <AuthIllustration className="w-64 h-80 mx-auto" />
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold leading-tight">
              شبکه تخصصی مشاغل<br />و تیم‌سازی فارسی
            </h1>
            <p className="text-lg text-white/75 max-w-md leading-8">
              پروفایل حرفه‌ای بساز، مهارت‌هایت را نشان بده، روی پروژه‌ها همکاری کن و تیم بساز.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: Users, label: "شبکه‌سازی" },
              { icon: Briefcase, label: "تیم‌سازی" },
              { icon: Heart, label: "کشف مهارت" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/8 backdrop-blur-sm">
                <f.icon className="w-5 h-5 text-gold" />
                <span className="text-xs font-medium text-white/80">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/50">همتیم — کاملاً رایگان</p>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-6">
            <LogoMark className="w-10 h-10" />
            <span className="text-2xl font-extrabold">همتیم</span>
          </div>

          <AnimatePresence mode="wait">
            {step === "info" ? (
              <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                {/* Mode toggle */}
                <div className="flex p-1 mb-6 rounded-2xl bg-muted/60 border border-border">
                  <button
                    onClick={() => switchMode("login")}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                      mode === "login" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"
                    )}
                  >
                    ورود
                  </button>
                  <button
                    onClick={() => switchMode("register")}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                      mode === "register" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"
                    )}
                  >
                    ثبت‌نام
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    {mode === "login" ? "ورود به همتیم" : "حساب جدید بسازید"}
                  </h2>
                  <p className="text-muted-foreground mt-1.5 leading-6 text-sm">
                    {mode === "login"
                      ? "شماره موبایل خود را وارد کنید تا کد تایید ارسال شود."
                      : "نام، شماره موبایل و کد ملی خود را وارد کنید."}
                  </p>
                </div>

                {mode === "login" ? (
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                    <Field label="شماره موبایل" error={(loginForm.formState.errors.phone as any)?.message}>
                      <div className="relative">
                        <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          inputMode="numeric"
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          className="h-13 rounded-xl text-base py-3.5 pr-11"
                          {...loginForm.register("phone")}
                        />
                      </div>
                    </Field>
                    <Button type="submit" className="w-full h-13 rounded-xl text-base font-semibold py-3.5" disabled={submitting}>
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "دریافت کد تایید"}
                      {!submitting && <ArrowLeft className="w-4 h-4 mr-1" />}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <Field label="نام و نام خانوادگی" error={(registerForm.formState.errors.name as any)?.message}>
                      <div className="relative">
                        <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input placeholder="مثلاً: علی رضایی" className="h-13 rounded-xl text-base py-3.5 pr-11" {...registerForm.register("name")} />
                      </div>
                    </Field>
                    <Field label="شماره موبایل" error={(registerForm.formState.errors.phone as any)?.message}>
                      <div className="relative">
                        <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input inputMode="numeric" placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="h-13 rounded-xl text-base py-3.5 pr-11" {...registerForm.register("phone")} />
                      </div>
                    </Field>
                    <Field label="کد ملی" error={(registerForm.formState.errors.nationalId as any)?.message}>
                      <div className="relative">
                        <Hash className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input inputMode="numeric" placeholder="۱۰ رقم" maxLength={10} className="h-13 rounded-xl text-base py-3.5 pr-11" {...registerForm.register("nationalId")} />
                      </div>
                    </Field>
                    <Button type="submit" className="w-full h-13 rounded-xl text-base font-semibold py-3.5" disabled={submitting}>
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ثبت‌نام و دریافت کد"}
                      {!submitting && <ArrowLeft className="w-4 h-4 mr-1" />}
                    </Button>
                  </form>
                )}

                <div className="mt-5 p-3.5 rounded-xl bg-muted/60 border border-border">
                  <p className="text-xs text-muted-foreground leading-6">
                    <Sparkles className="w-3.5 h-3.5 inline-block ml-1 text-gold" />
                    کد تایید برای همه <strong className="text-foreground">۱۲۳۴</strong> است (نسخه دمو). ادمین: ۰۹۱۲۰۰۰۰۰۰۰۰ / ۱۱۱۱۱۱۱۱۱۱
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="mb-7">
                  <div className="grid place-items-center w-16 h-16 rounded-2xl bg-brand-gradient-soft mb-4">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight">تایید شماره</h2>
                  <p className="text-muted-foreground mt-1.5 leading-6 text-sm">
                    کد ۴ رقمی ارسال شده به <span className="font-semibold text-foreground" dir="ltr">{phone}</span> را وارد کنید.
                  </p>
                </div>

                <div className="mb-6 p-4 rounded-2xl bg-gold/8 border border-gold/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">کد دمو</p>
                  <p className="font-mono text-2xl tracking-[0.5em] font-bold text-gold" dir="ltr">{demoOtp}</p>
                </div>

                <div className="mb-6">
                  <Label className="mb-3 block text-center">کد تایید</Label>
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-14 h-14 text-xl first:rounded-r-xl last:rounded-l-xl" />
                        <InputOTPSlot index={1} className="w-14 h-14 text-xl" />
                        <InputOTPSlot index={2} className="w-14 h-14 text-xl" />
                        <InputOTPSlot index={3} className="w-14 h-14 text-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button onClick={onVerify} className="w-full h-13 rounded-xl text-base font-semibold py-3.5" disabled={submitting || otp.length < 4}>
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "تایید و ورود"}
                </Button>

                <button type="button" onClick={() => setStep("info")} className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← بازگشت و ویرایش
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
