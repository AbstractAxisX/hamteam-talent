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
import { LogoMark, AuthIllustration } from "@/components/shared/illustrations";
import { ArrowLeft, Loader2, Phone, ShieldCheck, Sparkles, User as UserIcon } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Brand visual (solid color, no gradient) */}
        <div className="relative bg-primary text-primary-foreground p-6 pt-16 pb-8 lg:p-12 lg:flex lg:flex-col lg:justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="absolute top-10 left-6 w-24 h-24 rounded-full bg-white/5 animate-float" />
          <div className="absolute bottom-10 right-6 w-32 h-32 rounded-full bg-white/3 animate-float" style={{ animationDelay: "1.5s" }} />

          <div className="relative flex items-center gap-2.5">
            <LogoMark className="w-10 h-10" />
            <span className="text-xl lg:text-2xl font-extrabold">همتیم</span>
          </div>

          <div className="relative mt-6 lg:mt-0 lg:space-y-6">
            <div className="hidden lg:block">
              <AuthIllustration className="w-64 h-80 mx-auto" />
            </div>
            <div className="space-y-2 lg:space-y-3">
              <h1 className="text-2xl lg:text-4xl font-extrabold leading-snug">
                استعدادت رو<br />کشف کن و نشان بده
              </h1>
              <p className="text-sm lg:text-lg text-primary-foreground/75 leading-7 lg:leading-8 max-w-md">
                پروفایل استعدادت رو بساز، مهارت‌هات رو نشان بده و با افراد مستعد ارتباط بگیر.
              </p>
            </div>
          </div>

          <p className="relative text-xs lg:text-sm text-primary-foreground/50 mt-6 lg:mt-0">همتیم — کاملاً رایگان</p>
        </div>

        {/* Right: Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {step === "info" ? (
                <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold tracking-tight">شروع کنید</h2>
                    <p className="text-muted-foreground mt-1.5 leading-6 text-sm">
                      نام و شماره موبایلت رو وارد کن. اگه حساب نداری خودکار ثبت‌نام می‌شی.
                    </p>
                  </div>

                  <InfoForm submitting={submitting} onSubmit={submitInfo} />

                  <div className="mt-5 p-3.5 rounded-2xl bg-muted border border-border">
                    <p className="text-xs text-foreground/70 leading-6">
                      <Sparkles className="w-3.5 h-3.5 inline-block ml-1 text-primary" />
                      کد تایید برای همه <strong>۱۲۳۴</strong> است (نسخه دمو).
                    </p>
                  </div>

                  <div className="mt-5 text-center">
                    <button
                      onClick={() => navigate({ view: "admin" })}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ورود ادمین ←
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <div className="mb-7">
                    <div className="grid place-items-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                      <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight">تایید شماره</h2>
                    <p className="text-muted-foreground mt-1.5 leading-6 text-sm">
                      کد ۴ رقمی ارسال شده به <span className="font-semibold text-foreground" dir="ltr">{phone}</span> رو وارد کن.
                    </p>
                  </div>

                  <div className="mb-6 p-4 rounded-2xl bg-primary/8 border border-primary/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">کد دمو</p>
                    <p className="font-mono text-2xl tracking-[0.5em] font-extrabold text-primary" dir="ltr">{demoOtp}</p>
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

                  {/* BIG clear login button */}
                  <Button
                    onClick={onVerify}
                    className="w-full h-14 rounded-2xl text-base font-bold py-3.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={submitting || otp.length < 4}
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ورود به همتیم"}
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
          <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
          <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            className="h-13 rounded-2xl text-base py-3.5 pr-11"
          />
        </div>
      </div>
      <Button type="submit" className="w-full h-13 rounded-2xl text-base font-bold py-3.5" disabled={submitting}>
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "دریافت کد تایید"}
        {!submitting && <ArrowLeft className="w-4 h-4 mr-1" />}
      </Button>
    </form>
  );
}
