"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiPost, apiPut } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate, useNav } from "@/lib/nav";
import { toFa } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { LogoFull } from "@/components/shared/illustrations";
import { Icon } from "@/components/shared/icon";

/* ورود/ثبت‌نام فقط با شماره موبایل — سه گام داخل یک کارت کلاسیک:
   ۱) شماره  ۲) کد تأیید  ۳) نام (فقط کاربر جدید — پس از ثبت‌نام، اجباری)
   · کاربر قبلی با نام واقعی → مستقیم فید (یا scout-apply در حالت چهره‌یاب)
   · mode=scout از #/auth?mode=scout در کل مسیر حفظ می‌شود
   · بک‌اند ثبت‌نام «نام» می‌خواهد → جای‌نگهدار = خود شماره؛
     نام واقعی بلافاصله بعد از تأیید پرسیده و ذخیره می‌شود */

type Step = "phone" | "otp" | "name";

// تبدیل ارقام فارسی/عربی به لاتین (ورودیِ شماره)
function toEnDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function AuthView() {
  const route = useNav((s) => s.route);
  // حالت چهره‌یاب — فقط از لینک (#/auth?mode=scout)، بدون سوییچ در UI
  const scoutMode = route.params?.mode === "scout";

  const { user, loading, fetchUser } = useUser();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isNewSignup, setIsNewSignup] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const initialChecked = useRef(false);

  // ورود خودکار کاربرِ از قبل لاگین‌شده — فقط بررسی اولیهٔ مونت
  // (بعد از تأیید OTP نباید این مسیر دوباره فعال شود؛ پس ریدایرکت با گارد ref جدا است)
  useEffect(() => {
    if (loading) return;
    if (!initialChecked.current) {
      initialChecked.current = true;
      if (user) setRedirecting(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (!redirecting) return;
    const t = setTimeout(() => {
      navigate(scoutMode ? { view: "scout-apply" } : { view: "feed" });
    }, 350);
    return () => clearTimeout(t);
  }, [redirecting, scoutMode]);

  /* ── گام ۱: شماره موبایل ── */
  async function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    const p = toEnDigits(phone).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(p)) {
      toast({
        title: "شماره موبایل معتبر نیست",
        description: "شماره را با فرمت ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost<{
        ok: boolean;
        otp?: string;
        mode: "login" | "register";
      }>("/api/auth/register", { phone: p, name: p });
      setPhone(p);
      setIsNewSignup(res.mode === "register");
      setDemoOtp(res.otp || "1234");
      setStep("otp");
    } catch (err) {
      toast({ title: "خطا", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── گام ۲: کد تأیید ── */
  async function onVerify() {
    if (otp.length < 4 || submitting) return;
    setSubmitting(true);
    try {
      await apiPost("/api/auth/verify", { phone, otp });
      await fetchUser();
      const u = useUser.getState().user;
      // کاربر جدید (ثبت‌نام تازه) یا نامِ خالی/جای‌نگهدار → گام نام
      const hasRealName =
        !!u?.name?.trim() && u.name.trim() !== u.phone && u.name.trim() !== phone;
      if (isNewSignup || !hasRealName) {
        setStep("name");
      } else {
        toast({ title: "خوش اومدی!", description: "ورود با موفقیت انجام شد." });
        // چهره‌یاب → پس از تأیید شماره مستقیم به فرم استعدادیابی (رفتار قبلی)
        navigate(scoutMode ? { view: "scout-apply" } : { view: "feed" });
      }
    } catch (err) {
      toast({ title: "خطا", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── گام ۳: نام (اجباری، فقط ثبت‌نام جدید) ── */
  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2 || n.length > 40 || n === phone) {
      toast({
        title: "نام معتبر نیست",
        description: "نام باید ۲ تا ۴۰ نویسه باشد.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiPut("/api/auth/profile", { name: n });
      await fetchUser();
      // عضو جدید → چک‌لیست تکمیل پروفایل؛ چهره‌یاب → فرم استعدادیابی
      if (scoutMode) navigate({ view: "scout-apply" });
      else navigate({ view: "onboarding" });
    } catch (err) {
      toast({ title: "خطا", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  // اسپینر کوچک — هنگام بررسی ورود یا انتقال خودکار
  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5 px-4">
        <LogoFull h={44} />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="loader" size={18} className="animate-spin" strokeWidth={2.2} />
          {redirecting ? "در حال ورود…" : "در حال بررسی…"}
          <span className="sr-only">لطفاً صبر کنید</span>
        </div>
      </div>
    );
  }

  const otpSlotClass =
    "h-12 w-12 rounded-xl text-lg font-bold border first:rounded-l-xl last:rounded-r-xl";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* لوگو */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-center mb-6"
          >
            <LogoFull h={44} />
          </motion.div>

          {/* کارت اصلی — کلاسیک solid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-2xl shadow-sm p-6"
          >
            <AnimatePresence mode="wait">
              {step === "phone" && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-6">
                    <p className="text-[11px] font-bold text-primary tracking-wide mb-2">
                      {scoutMode ? "ثبت‌نام چهره‌یاب" : "ورود / ثبت‌نام"}
                    </p>
                    <h1 className="text-2xl font-extrabold leading-8 tracking-tight">
                      {scoutMode ? "چهره‌یاب شو" : "به فرصتینو خوش اومدی"}
                    </h1>
                    <p className="text-sm text-muted-foreground leading-6 mt-2">
                      {scoutMode
                        ? "با شماره موبایل شروع کن؛ بعد از تأیید، فرم استعدادیابی را تکمیل می‌کنی."
                        : "فقط شماره موبایلت را وارد کن؛ اگر حساب نداشته باشی، ثبت‌نام خودکار انجام می‌شود."}
                    </p>
                  </div>

                  <form onSubmit={submitPhone} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="auth-phone" className="text-sm font-bold">
                        شماره موبایل
                      </Label>
                      <div className="relative">
                        <Icon
                          name="phone"
                          size={18}
                          strokeWidth={2}
                          className="text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                        <Input
                          id="auth-phone"
                          value={phone}
                          onChange={(e) =>
                            setPhone(toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 11))
                          }
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          dir="ltr"
                          autoFocus
                          className="h-12 rounded-xl text-base tracking-wide pr-10 pl-4"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-xl text-base font-bold grad-brand text-primary-foreground transition-opacity hover:opacity-95"
                    >
                      {submitting ? (
                        <Icon name="loader" size={18} className="animate-spin" strokeWidth={2.4} />
                      ) : (
                        "ادامه"
                      )}
                    </Button>
                  </form>

                  {process.env.NODE_ENV !== "production" && (
                    <p className="mt-4 text-[11px] text-muted-foreground text-center leading-5">
                      نسخه دمو — کد تأیید برای همه ۱۲۳۴ است.
                    </p>
                  )}
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-6">
                    <span className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                      <Icon name="shield" size={22} strokeWidth={2} />
                    </span>
                    <h1 className="text-2xl font-extrabold leading-8 tracking-tight">
                      کد تأیید را وارد کن
                    </h1>
                    <p className="text-sm text-muted-foreground leading-6 mt-2">
                      کد ۴ رقمی ارسال‌شده به{" "}
                      <span className="font-bold text-foreground">{toFa(phone)}</span> را وارد کن.
                    </p>
                  </div>

                  {process.env.NODE_ENV !== "production" && (
                    <div className="mb-5 h-10 rounded-xl bg-muted border border-border flex items-center justify-center gap-2">
                      <Icon name="sparkles" size={14} strokeWidth={2} className="text-primary" />
                      <span className="text-xs text-muted-foreground">کد نمایشی:</span>
                      <span className="text-sm font-extrabold text-primary tracking-[0.3em]">
                        {toFa(demoOtp)}
                      </span>
                    </div>
                  )}

                  <div dir="ltr" className="flex justify-center mb-6">
                    <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                      <InputOTPGroup className="gap-2.5">
                        <InputOTPSlot index={0} className={otpSlotClass} />
                        <InputOTPSlot index={1} className={otpSlotClass} />
                        <InputOTPSlot index={2} className={otpSlotClass} />
                        <InputOTPSlot index={3} className={otpSlotClass} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    onClick={onVerify}
                    disabled={submitting || otp.length < 4}
                    className="w-full h-12 rounded-xl text-base font-bold grad-brand text-primary-foreground transition-opacity hover:opacity-95"
                  >
                    {submitting ? (
                      <Icon name="loader" size={18} className="animate-spin" strokeWidth={2.4} />
                    ) : (
                      "تأیید"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                    }}
                    className="w-full h-11 mt-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ویرایش شماره
                  </button>
                </motion.div>
              )}

              {step === "name" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-6">
                    <span className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                      <Icon name="user" size={22} strokeWidth={2} />
                    </span>
                    <h1 className="text-2xl font-extrabold leading-8 tracking-tight">اسمت چیه؟</h1>
                    <p className="text-sm text-muted-foreground leading-6 mt-2">
                      {scoutMode
                        ? "نامت در فرم استعدادیابی و پروفایل چهره‌یاب نمایش داده می‌شود."
                        : "نامت روی پروفایل فرصتینو نمایش داده می‌شود."}
                    </p>
                  </div>

                  <form onSubmit={submitName} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="auth-name" className="text-sm font-bold">
                        نام و نام خانوادگی
                      </Label>
                      <Input
                        id="auth-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثلاً: علی رضایی"
                        maxLength={40}
                        autoComplete="name"
                        autoFocus
                        className="h-12 rounded-xl text-base px-4"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-xl text-base font-bold grad-brand text-primary-foreground transition-opacity hover:opacity-95"
                    >
                      {submitting ? (
                        <Icon name="loader" size={18} className="animate-spin" strokeWidth={2.4} />
                      ) : (
                        "شروع"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* پایین کارت */}
          <div className="mt-5 flex flex-col items-center gap-2">
            {step === "phone" && (
              <button
                type="button"
                onClick={() => navigate({ view: "feed" })}
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                بازگشت به فرصتینو
              </button>
            )}
            <p className="text-xs text-muted-foreground/80">فرصتینو — کاملاً رایگان</p>
            {process.env.NODE_ENV !== "production" && (
              <button
                type="button"
                onClick={() => navigate({ view: "admin" })}
                className="text-[11px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                ورود ادمین (دمو)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
