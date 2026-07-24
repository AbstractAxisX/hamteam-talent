"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, Phone, ShieldCheck, Sparkles } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "نام را کامل وارد کنید"),
  phone: z.string().min(10, "شماره موبایل معتبر نیست"),
  nationalId: z.string().length(10, "کد ملی باید ۱۰ رقم باشد"),
});
type FormData = z.infer<typeof schema>;

export function AuthView() {
  const [step, setStep] = useState<"info" | "otp">("info");
  const [mode, setMode] = useState<"register" | "login" | null>(null);
  const [demoOtp, setDemoOtp] = useState<string>("");
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
      toast({ title: "کد تایید ارسال شد", description: "نسخه دمو — کد نمایش داده می‌شود" });
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
      toast({ title: "خوش آمدید! 👋", description: "ورود موفقیت‌آمیز بود" });
      navigate({ view: "feed" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left visual panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-emerald p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative">
          <div className="flex items-center gap-2 text-2xl font-extrabold">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/20">
              <Sparkles className="w-6 h-6" />
            </span>
            همتیم
          </div>
        </div>
        <div className="relative space-y-4">
          <h1 className="text-4xl font-extrabold leading-tight">
            شبکه تخصصی مشاغل<br />و تیم‌سازی فارسی
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            پروفایل حرفه‌ای بساز، مهارت‌هایت را نشان بده، روی پروژه‌ها همکاری کن و تیم بساز.
          </p>
          <ul className="space-y-2 text-primary-foreground/90">
            <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> بدون نقش جدا — همه برابرند</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> کشف بر اساس مهارت و دسته‌بندی</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> کاملاً رایگان — مدل درآمدی فقط تبلیغات</li>
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/60">© ۱۴۰۳ همتیم</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="lg:hidden flex items-center gap-2 mb-2">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-emerald text-primary-foreground">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-xl font-extrabold">همتیم</span>
            </div>
            <CardTitle className="text-2xl">
              {step === "info" ? "ورود / ثبت‌نام" : "تایید شماره"}
            </CardTitle>
            <CardDescription>
              {step === "info"
                ? "با شماره موبایل و کد ملی وارد شوید. ادمین نیز از همین فرم وارد می‌شود."
                : `کد ۴ رقمی ارسال شده به ${phone} را وارد کنید`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "info" ? (
              <form onSubmit={form.handleSubmit(onInfoSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <Input id="name" placeholder="مثلاً: علی رضایی" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">شماره موبایل</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" inputMode="numeric" placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="pr-9" {...form.register("phone")} />
                  </div>
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nationalId">کد ملی</Label>
                  <Input id="nationalId" inputMode="numeric" placeholder="۱۰ رقم" maxLength={10} {...form.register("nationalId")} />
                  {form.formState.errors.nationalId && (
                    <p className="text-xs text-destructive">{form.formState.errors.nationalId.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "ادامه"}
                  {!submitting && <ArrowRight className="w-4 h-4 mr-1 rotate-180" />}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  حساب ادمین دمو: ۰۹۱۲۰۰۰۰۰۰۰۰ / کد ملی ۱۱۱۱۱۱۱۱۱۱
                </p>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm">
                  <span className="font-medium text-warning">کد دمو: </span>
                  <span className="font-mono text-lg tracking-widest" dir="ltr">{demoOtp}</span>
                </div>
                <div className="space-y-1.5">
                  <Label>کد تایید</Label>
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button onClick={onVerify} className="w-full" disabled={submitting || otp.length < 4}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? "ورود" : "ثبت‌نام"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  بازگشت و ویرایش اطلاعات
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
