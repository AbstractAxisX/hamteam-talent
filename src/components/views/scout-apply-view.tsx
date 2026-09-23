"use client";

/* ═══════════════════════════════════════════════════════════
   ScoutApplyView — ثبت‌نام «چهره‌یاب»
   · مهمان → ریدایرکت auth?mode=scout · چهره‌یاب فعال → کارت موفق
   · pending → کارت وضعیت · rejected → یادداشت ادمین + فرم مجدد
   · فرم: کد ملی (چک‌سام ایرانی) + تصویر کارت ملی (آپلود فوری) + توضیحات
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { toast } from "@/hooks/use-toast";
import { LogoFull } from "@/components/shared/illustrations";
import { BackButton } from "@/components/shared/back-button";
import { Icon } from "@/components/shared/icon";
import { Textarea } from "@/components/ui/textarea";
import { Btn, Field, Spinner, SPRING } from "@/components/ui/atoms";
import { formatFaDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ─── اعتبارسنجی کد ملی (چک‌سام استاندارد ایرانی — سمت کلاینت) ─── */
const FA_TO_EN: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

function normalizeDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => FA_TO_EN[d] ?? d).replace(/\D/g, "");
}

function isValidNationalCode(code: string): boolean {
  const c = normalizeDigits(code);
  if (c.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(c)) return false; // هر ده رقم یکسان
  const digits = c.split("").map(Number);
  const check = digits[9];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  const rem = sum % 11;
  return (rem < 2 ? rem : 11 - rem) === check;
}

/* ─── وضعیت درخواست از سرور ─── */
type ScoutApplication = {
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  description: string;
  nationalCode: string;
  cardImageUrl: string;
  createdAt: string;
  reviewedAt: string | null;
};

const EXPLAIN_TEXT =
  "چهره‌یاب‌ها مثل کمپانی‌های لینکدین هستند — استعداد می‌یابند، نیازمندی ثبت می‌کنند و بهترین‌ها را به ادمین معرفی می‌کنند. پس از تأیید ادمین حساب شما فعال می‌شود.";

export function ScoutApplyView() {
  const { user, loading: userLoading } = useUser();

  const [checking, setChecking] = useState(true);
  const [appStatus, setAppStatus] = useState<"none" | "pending" | "rejected">("none");
  const [application, setApplication] = useState<ScoutApplication | null>(null);

  // فرم
  const [nationalCode, setNationalCode] = useState("");
  const [description, setDescription] = useState("");
  const [cardImageUrl, setCardImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ code?: string; desc?: string; card?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* مهمان → ورود با حالت چهره‌یاب (بعد از پایان لودینگ کاربر) */
  useEffect(() => {
    if (!userLoading && !user) {
      navigate({ view: "auth", params: { mode: "scout" } });
    }
  }, [userLoading, user]);

  /* وضعیت درخواست قبلی */
  useEffect(() => {
    if (!user) return;
    let alive = true;
    api<{ isScout: boolean; application: ScoutApplication | null }>("/api/scout/apply")
      .then((d) => {
        if (!alive) return;
        if (d.application && d.application.status === "pending") {
          setAppStatus("pending");
          setApplication(d.application);
        } else if (d.application && d.application.status === "rejected") {
          setAppStatus("rejected");
          setApplication(d.application);
          // پیش‌پرکردن فرم برای درخواست مجدد
          setNationalCode(normalizeDigits(d.application.nationalCode || ""));
          setDescription(d.application.description || "");
          if (d.application.cardImageUrl) setCardImageUrl(d.application.cardImageUrl);
        }
      })
      .catch(() => {})
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [user]);

  /* آپلود فوری تصویر کارت ملی — FormData + type=scout-card */
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // اجازهٔ انتخاب مجدد همان فایل
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "فقط تصویر مجاز است", description: "تصویر کارت ملی را انتخاب کنید.", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "حجم تصویر زیاد است", description: "حداکثر ۸ مگابایت.", variant: "destructive" });
      return;
    }
    setUploading(true);
    setErrors((er) => ({ ...er, card: undefined }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "scout-card");
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "آپلود تصویر ناموفق بود");
      setCardImageUrl(String(data.url));
      setFileName(file.name);
    } catch (err) {
      toast({ title: "خطا در آپلود", description: (err as Error).message, variant: "destructive" });
      setCardImageUrl("");
      setFileName("");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    const er: typeof errors = {};
    if (!isValidNationalCode(normalizeDigits(nationalCode))) er.code = "کد ملی معتبر نیست";
    if (!cardImageUrl) er.card = "تصویر کارت ملی الزامی است";
    if (description.trim().length < 20) er.desc = "توضیحات حداقل ۲۰ کاراکتر باشد";
    setErrors(er);
    if (Object.keys(er).length > 0) return;

    setSubmitting(true);
    try {
      const data = await apiPost<{ ok: boolean; message: string }>("/api/scout/apply", {
        nationalCode: normalizeDigits(nationalCode),
        cardImageUrl,
        description: description.trim(),
      });
      toast({ title: "درخواست ثبت شد ✅", description: data.message });
      setAppStatus("pending");
      setApplication({
        status: "pending",
        adminNote: "",
        description: description.trim(),
        nationalCode: normalizeDigits(nationalCode),
        cardImageUrl,
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── اسپینر تا مشخص شدن کاربر/وضعیت ── */
  if (userLoading || checking || !user) {
    return (
      <div className="min-h-[60vh] grid place-items-center" aria-busy="true">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner size={30} className="text-primary" />
          <p className="text-sm font-bold">در حال بارگذاری…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[70vh]">
      {/* ═══ Top — بازگشت + لوگو ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between gap-3 mb-6"
      >
        <div className="flex items-center gap-2.5">
          <BackButton fallback={{ view: "feed" }} />
          <LogoFull h={34} className="drop-shadow-sm" />
        </div>
      </motion.div>

      <div className="flex items-start justify-center">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* ═══ حالت ۱ — حساب چهره‌یاب از قبل فعال است ═══ */}
            {user.isScout ? (
              <motion.div key="active" {...cardMotion}>
                <StatusCard
                  tone="emerald"
                  icon={<Icon name="badgeCheck" size={30} className="text-white" />}
                  title="حساب چهره‌یاب شما فعال است"
                  subtitle="شما یک چهره‌یاب تأییدشده هستید — استعدادها را کشف و معرفی کنید."
                >
                  <Btn
                    variant="grad"
                    size="lg"
                    className="mt-6 bg-emerald-600 hover:bg-emerald-600 shadow-[0_10px_30px_rgba(5,150,105,0.35)]"
                    icon={<Icon name="compass" size={18} className="text-white" />}
                    onClick={() => navigate({ view: "scout" })}
                  >
                    ورود به صفحهٔ چهره‌یاب
                  </Btn>
                </StatusCard>
              </motion.div>
            ) : /* ═══ حالت ۲ — در انتظار بررسی ادمین ═══ */
            appStatus === "pending" && application ? (
              <motion.div key="pending" {...cardMotion}>
                <StatusCard
                  tone="amber"
                  icon={<Icon name="clock" size={30} className="text-white" />}
                  title="درخواست شما در انتظار بررسی ادمین است"
                  subtitle={`تاریخ ارسال: ${formatFaDate(application.createdAt)}`}
                >
                  <div className="mt-5 space-y-3 text-start">
                    {application.description && (
                      <div className="p-4 rounded-2xl bg-muted/50 border border-border/60">
                        <p className="text-[11px] font-bold text-muted-foreground mb-1.5">توضیحات شما:</p>
                        <p className="text-[13px] leading-7 text-foreground/90 whitespace-pre-wrap">
                          {application.description}
                        </p>
                      </div>
                    )}
                    <p className="flex items-start gap-2 text-[12px] leading-6 text-muted-foreground">
                      <Icon name="info" size={15} className="shrink-0 mt-0.5 text-muted-foreground" />
                      نتیجهٔ بررسی از طریق اعلان‌ها به شما اعلام می‌شود؛ تا آن زمان می‌توانید از بقیهٔ امکانات فرصتینو استفاده کنید.
                    </p>
                    <Btn variant="soft" size="lg" className="mt-2" onClick={() => navigate({ view: "feed" })}>
                      بازگشت به خانه
                    </Btn>
                  </div>
                </StatusCard>
              </motion.div>
            ) : (
              /* ═══ حالت ۳ — فرم ثبت‌نام (+ رد شده با یادداشت ادمین) ═══ */
              <motion.div key="form" {...cardMotion}>
                <div
                  className="relative rounded-[26px] glass-strong border border-border/60 p-6 md:p-8 overflow-hidden"
                  style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
                >
                  {/* هالهٔ سبز ملایم */}

                  <div className="relative">
                    {/* هدر */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="grid place-items-center w-12 h-12 rounded-2xl bg-emerald-600/12 text-emerald-700 dark:text-emerald-300 border border-emerald-600/20 shrink-0">
                        <Icon name="compass" size={24} strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0">
                        <h1 className="text-2xl font-black tracking-tight leading-tight">ثبت‌نام چهره‌یاب</h1>
                        <p className="text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                          استعدادیاب حرفه‌ای فرصتینو
                        </p>
                      </div>
                    </div>

                    <p className="text-[13px] text-muted-foreground leading-7 mb-6">{EXPLAIN_TEXT}</p>

                    {/* رد شده — یادداشت ادمین */}
                    {appStatus === "rejected" && application?.adminNote && (
                      <div className="mb-5 p-4 rounded-2xl border border-rose-500/25 bg-rose-500/8">
                        <p className="flex items-center gap-1.5 text-[12px] font-black text-rose-600 dark:text-rose-400 mb-1.5">
                          <Icon name="alert" size={15} />
                          درخواست قبلی رد شد{application.reviewedAt ? ` — ${formatFaDate(application.reviewedAt)}` : ""}
                        </p>
                        <p className="text-[12.5px] leading-6 text-foreground/80 whitespace-pre-wrap">
                          {application.adminNote}
                        </p>
                      </div>
                    )}
                    {appStatus === "rejected" && (
                      <p className="mb-5 text-[12px] font-bold text-muted-foreground">
                        می‌توانید اطلاعات را اصلاح و دوباره درخواست بدهید:
                      </p>
                    )}

                    {/* فرم */}
                    <div className="space-y-5">
                      {/* کد ملی */}
                      <div>
                        <label htmlFor="scout-national-code" className="block text-[13px] font-bold mb-2">
                          کد ملی
                        </label>
                        <Field
                          id="scout-national-code"
                          icon={<Icon name="shield" size={17} />}
                          inputMode="numeric"
                          dir="ltr"
                          placeholder="۱۰ رقم بدون خط تیره"
                          value={nationalCode}
                          maxLength={10}
                          className="text-center tracking-[0.18em] font-bold"
                          error={errors.code}
                          onChange={(e) => setNationalCode(normalizeDigits(e.target.value))}
                        />
                        <p className="mt-1.5 px-4 text-[10.5px] text-muted-foreground">
                          صرفاً برای احراز هویت چهره‌یاب — برای سایر کاربران نمایش داده نمی‌شود.
                        </p>
                      </div>

                      {/* تصویر کارت ملی */}
                      <div>
                        <span className="block text-[13px] font-bold mb-2">
                          تصویر کارت ملی <span className="text-rose">*</span>
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onPickFile}
                          aria-hidden
                          tabIndex={-1}
                        />
                        {cardImageUrl ? (
                          <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-emerald-600/25 bg-emerald-600/5">
                            {/* پیش‌نمایش */}
                            <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-border/60 bg-muted shrink-0">
                              <img
                                src={cardImageUrl}
                                alt="پیش‌نمایش کارت ملی"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-start">
                              <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                <Icon name="checkCircle" size={14} />
                                تصویر بارگذاری شد
                              </p>
                              {fileName && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{fileName}</p>
                              )}
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              transition={SPRING.tap}
                              onClick={() => {
                                setCardImageUrl("");
                                setFileName("");
                              }}
                              className="grid place-items-center w-11 h-11 rounded-full text-muted-foreground hover:text-rose hover:bg-rose/10 transition-colors shrink-0"
                              aria-label="حذف تصویر کارت ملی"
                            >
                              <Icon name="trash" size={18} />
                            </motion.button>
                          </div>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            transition={SPRING.tap}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={cn(
                              "w-full min-h-[96px] rounded-2xl border-[1.5px] border-dashed flex flex-col items-center justify-center gap-2",
                              "transition-colors outline-none disabled:opacity-60",
                              errors.card
                                ? "border-destructive/60 bg-destructive/5 hover:bg-destructive/10"
                                : "border-border bg-muted/40 hover:border-emerald-600/40 hover:bg-emerald-600/5"
                            )}
                            aria-label="انتخاب تصویر کارت ملی"
                          >
                            {uploading ? (
                              <>
                                <Spinner size={22} className="text-primary" />
                                <span className="text-[12px] font-bold text-muted-foreground">در حال بارگذاری…</span>
                              </>
                            ) : (
                              <>
                                <span className="grid place-items-center w-11 h-11 rounded-2xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300">
                                  <Icon name="imagePlus" size={21} strokeWidth={2.2} />
                                </span>
                                <span className="text-[12.5px] font-bold">انتخاب تصویر کارت ملی</span>
                                <span className="text-[10.5px] text-muted-foreground">
                                  تصویر واضح · فرمت عکس · حداکثر ۸ مگابایت
                                </span>
                              </>
                            )}
                          </motion.button>
                        )}
                        {errors.card && <p className="mt-1.5 px-1 text-[11px] font-bold text-destructive">{errors.card}</p>}
                      </div>

                      {/* توضیحات */}
                      <div>
                        <label htmlFor="scout-description" className="block text-[13px] font-bold mb-2">
                          توضیحات
                        </label>
                        <Textarea
                          id="scout-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="سابقه، حوزهٔ فعالیت و هدف شما از استعدادیابی — مثلاً: سابقهٔ ۵ سال مدیریت آژانس مدلینگ و هدف کشف استعدادهای استان…"
                          className="min-h-32 rounded-2xl text-[13px] leading-7 bg-muted/60 border-[1.5px] focus-visible:ring-ring"
                        />
                        <div className="flex items-center justify-between mt-1.5 px-1">
                          {errors.desc ? (
                            <p className="text-[11px] font-bold text-destructive">{errors.desc}</p>
                          ) : (
                            <p className="text-[10.5px] text-muted-foreground">حداقل ۲۰ کاراکتر</p>
                          )}
                          <p className={cn("text-[10.5px] font-bold nums-fa", description.trim().length >= 20 ? "text-emerald-600" : "text-muted-foreground")}>
                            {description.trim().length.toLocaleString("fa-IR")}
                          </p>
                        </div>
                      </div>

                      {/* ارسال */}
                      <Btn
                        variant="grad"
                        size="lg"
                        full
                        loading={submitting}
                        disabled={uploading}
                        className="bg-emerald-600 hover:bg-emerald-600 shadow-[0_10px_30px_rgba(5,150,105,0.35)]"
                        icon={<Icon name="send" size={17} className="text-white" />}
                        onClick={submit}
                      >
                        ارسال درخواست چهره‌یابی
                      </Btn>

                      <p className="text-center text-[10.5px] text-muted-foreground leading-5">
                        اطلاعات هویتی شما محفوظ است و فقط برای بررسی ادمین استفاده می‌شود.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── کارت وضعیت مشترک (فعال/در انتظار) ─── */
function StatusCard({
  tone,
  icon,
  title,
  subtitle,
  children,
}: {
  tone: "emerald" | "amber";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  const iconBox =
    tone === "emerald"
      ? "bg-emerald-600 shadow-[0_10px_30px_rgba(5,150,105,0.35)]"
      : "bg-amber-500 shadow-[0_10px_30px_rgba(245,158,11,0.3)]";
  return (
    <div
      className="relative rounded-[26px] glass-strong border border-border/60 p-7 md:p-9 text-center overflow-hidden"
      style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          className={cn("grid place-items-center size-16 rounded-[22px] mb-5", iconBox)}
        >
          {icon}
        </motion.div>
        <h2 className="text-xl md:text-2xl font-black tracking-tight leading-snug">{title}</h2>
        <p className="text-[12.5px] text-muted-foreground mt-2 leading-6 nums-fa">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

const cardMotion = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.97 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};
