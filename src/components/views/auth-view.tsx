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
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { AuthIllustration, LogoMark } from "@/components/shared/illustrations";
import { ArrowLeft, Loader2, Phone, ShieldCheck, Sparkles, Users, Briefcase, Heart } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "نام را کامل وارد کنید"),
  phone: z.string().min(10, "شماره موبایل معتبر نیست"),
  nationalId: z.string().length(10, "کد ملی باید ۱۰ رقم باشد"),
});
type FormData = z.infer<typeof schema>;

export function AuthView() {
  const [step, setStep] = useState<"info" | "otp">("info");
  const [mode, setMode] = useState<"register" | "login" | null>(null);
  const [demoOtp, setDemoOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const fetchUser = useUser((s) => s.fetchUser);
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onInfoSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await apiPost<{ ok: boolean; otp: string; mode: "register" | "login"; error?: string }>(
        "/api/auth/register",
        data
      );
      setDemoOtp(res.otp);
      setMode(res.mode);
      setPhone(data.phone);
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

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left: Brand visual ── */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-gradient p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        {/* floating shapes */}
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

        <p className="relative text-sm text-white/50">© ۱۴۰۳ همتیم — کاملاً رایگان</p>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <LogoMark className="w-10 h-10" />
            <span className="text-2xl font-extrabold">همتیم</span>
          </div>

          <AnimatePresence mode="wait">
            {step === "info" ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold tracking-tight">شروع کنید</h2>
                  <p className="text-muted-foreground mt-2 leading-7">
                    با شماره موبایل و کد ملی وارد شوید. حساب ندارید؟ خودکار ثبت‌نام می‌شود.
                  </p>
                </div>

                <form onSubmit={form.handleSubmit(onInfoSubmit)} className="space-y-5">
                  <Field label="نام و نام خانوادگی" error={form.formState.errors.name?.message}>
                    <Input
                      placeholder="مثلاً: علی رضایی"
                      className="h-12 rounded-xl text-base"
                      {...form.register("name")}
                    />
                  </Field>
                  <Field label="شماره موبایل" error={form.formState.errors.phone?.message}>
                    <div className="relative">
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        inputMode="numeric"
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className="h-12 rounded-xl text-base pr-11"
                        {...form.register("phone")}
                      />
                    </div>
                  </Field>
                  <Field label="کد ملی" error={form.formState.errors.nationalId?.message}>
                    <Input
                      inputMode="numeric"
                      placeholder="۱۰ رقم"
                      maxLength={10}
                      className="h-12 rounded-xl text-base"
                      {...form.register("nationalId")}
                    />
                  </Field>

                  <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={submitting}>
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ادامه"}
                    {!submitting && <ArrowLeft className="w-4 h-4 mr-1" />}
                  </Button>
                </form>

                <div className="mt-6 p-4 rounded-xl bg-muted/60 border border-border">
                  <p className="text-xs text-muted-foreground leading-6">
                    <Sparkles className="w-3.5 h-3.5 inline-block ml-1 text-gold" />
                    کد تایید برای همه <strong className="text-foreground">۱۲۳۴</strong> است (نسخه دمو).
                    ادمین: ۰۹۱۲۰۰۰۰۰۰۰۰ / ۱۱۱۱۱۱۱۱۱۱
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <div className="grid place-items-center w-16 h-16 rounded-2xl bg-brand-gradient-soft mb-4">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight">تایید شماره</h2>
                  <p className="text-muted-foreground mt-2 leading-7">
                    کد ۴ رقمی ارسال شده به <span className="font-semibold text-foreground" dir="ltr">{phone}</span> را وارد کنید.
                  </p>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-gold/8 border border-gold/20 text-center">
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

                <Button onClick={onVerify} className="w-full h-12 rounded-xl text-base font-semibold" disabled={submitting || otp.length < 4}>
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "ورود" : "ثبت‌نام"}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
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
