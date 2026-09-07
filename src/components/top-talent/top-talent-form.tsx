"use client";

/* ═══════════════════════════════════════════════════════════
   TopTalentWizard — فرم ۳ مرحله‌ای درخواست استعداد برتر
   · گام ۱: اطلاعات تماس (موبایل + شبکه اجتماعی)
   · گام ۲: مدارک هویتی (عکس کارت ملی — آپلود واقعی با پیش‌نمایش)
   · گام ۳: توضیحات + مرور نهایی + ارسال
   · زبان بصری: طلایی/ابیسیدین نخبگان
   ═══════════════════════════════════════════════════════════ */

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoldCheckMark } from "@/components/ui/elite";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const MAX_FILE = 2 * 1024 * 1024; // ۲ مگابایت
const STEPS = [
  { n: 1, label: "اطلاعات تماس" },
  { n: 2, label: "مدارک هویتی" },
  { n: 3, label: "توضیحات و ارسال" },
];

export function TopTalentWizard({
  initialRejected,
  onSubmitted,
}: {
  initialRejected: string | null;
  onSubmitted: () => void;
}) {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [socialMediaId, setSocialMediaId] = useState("");
  const [nationalIdUrl, setNationalIdUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  /* ── گام ۱ ── */
  function validateStep1(): boolean {
    const p = phoneNumber.trim();
    if (!/^09\d{9}$/.test(p)) {
      toast({ title: "شماره موبایل معتبر نیست", description: "نمونه: ۰۹۱۲۱۲۳۴۵۶۷", variant: "destructive" });
      return false;
    }
    return true;
  }

  /* ── آپلود کارت ملی ── */
  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "خطا", description: "فقط فایل تصویری مجاز است", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE) {
      toast({ title: "خطا", description: "حجم فایل باید کمتر از ۲ مگابایت باشد", variant: "destructive" });
      return;
    }
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const local = URL.createObjectURL(file);
    setPreviewUrl(local);
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
      if (!res.ok || !data.ok) throw new Error(data.error || "آپلود ناموفق بود");
      setNationalIdUrl(data.url);
      toast({ title: "عکس کارت ملی آپلود شد ✅" });
    } catch (e) {
      toast({ title: "خطا در آپلود", description: (e as Error).message, variant: "destructive" });
      URL.revokeObjectURL(local);
      setPreviewUrl("");
      setNationalIdUrl("");
    } finally {
      setUploading(false);
    }
  }

  function clearPhoto() {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setNationalIdUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  /* ── ارسال نهایی ── */
  async function submit() {
    if (!nationalIdUrl) {
      toast({ title: "خطا", description: "عکس کارت ملی الزامی است", variant: "destructive" });
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/top-talent/request", {
        nationalIdPhotoUrl: nationalIdUrl,
        phoneNumber: phoneNumber.trim(),
        socialMediaId: socialMediaId.trim(),
        description: description.trim(),
      });
      setDone(true);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── موفقیت ── */
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative py-10 text-center space-y-5"
      >
        {/* حلقه پالس موفقیت */}
        <span aria-hidden className="absolute left-1/2 top-6 -translate-x-1/2 -translate-y-1/2 size-24 rounded-full animate-elite-shine opacity-70"
          style={{ background: "radial-gradient(circle, rgba(245,200,76,.35), transparent 70%)" }} />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
          className="relative mx-auto grid place-items-center size-20 rounded-full"
          style={{
            background: "linear-gradient(135deg,#fef3c7,#f5c84c 45%,#b45309)",
            boxShadow: "0 10px 30px rgba(217,119,6,.4)",
          }}
        >
          <GoldCheckMark size={38} />
        </motion.div>
        <h3 className="text-xl font-black text-gold-grad">درخواست شما ثبت شد</h3>
        <p className="text-sm text-muted-foreground leading-7 max-w-sm mx-auto">
          درخواست استعداد برتر شما در نوبت بررسی است. نتیجه از طریق اعلان‌ها و همین صفحه اعلام
          می‌شود.
        </p>
        <button onClick={onSubmitted} className="text-sm font-bold text-primary underline underline-offset-4">
          بروزرسانی وضعیت
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رد شده قبلاً؟ */}
      {initialRejected && step === 1 && (
        <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-rose/10 border border-rose/25">
          <Icon name="alert" size={16} className="text-rose shrink-0 mt-0.5" strokeWidth={2.2} />
          <div>
            <p className="text-xs font-bold text-rose">درخواست قبلی رد شد</p>
            <p className="text-[11px] text-rose/80 mt-0.5 leading-5">{initialRejected}</p>
          </div>
        </div>
      )}

      {/* نشانگر مراحل */}
      <ol className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const state = step > s.n ? "done" : step === s.n ? "active" : "todo";
          return (
            <li key={s.n} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
              <div className="flex flex-col items-center gap-1.5">
                <motion.span
                  layout
                  className={cn(
                    "grid place-items-center size-10 rounded-full font-extrabold text-sm transition-colors",
                    state === "active" && "text-amber-950 ring-4 ring-gold/25",
                    state === "done" && "text-white"
                  )}
                  style={
                    state === "todo"
                      ? { background: "rgba(120,113,108,.16)", color: "rgba(120,113,108,.8)" }
                      : state === "active"
                        ? { background: "linear-gradient(135deg,#fde68a,#f5c84c 50%,#d97706)" }
                        : { background: "linear-gradient(135deg,#a16207,#854d0e)" }
                  }
                >
                  {state === "done" ? <Icon name="check" size={16} strokeWidth={3} /> : s.n}
                </motion.span>
                <span
                  className={cn(
                    "text-[10px] font-bold whitespace-nowrap",
                    state === "active" ? "text-gold" : state === "done" ? "text-amber-700" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="flex-1 h-0.5 mx-2 rounded-full"
                  style={{
                    background: step > s.n ? "linear-gradient(90deg,#b45309,#f5c84c)" : "rgba(120,113,108,.2)",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* بدنه مراحل */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {/* ═══ گام ۱: تماس ═══ */}
          {step === 1 && (
            <div className="space-y-4">
              <FieldWrap
                icon="phone"
                label="شماره موبایل اصلی *"
                hint="برای تأیید هویت و ارتباط تیم بررسی با شما"
              >
                <input
                  dir="ltr"
                  inputMode="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="09121234567"
                  maxLength={11}
                  className="w-full bg-transparent outline-none text-sm font-bold tracking-wider placeholder:font-normal placeholder:text-muted-foreground/60"
                />
              </FieldWrap>
              <FieldWrap
                icon="userIdentifier"
                label="آیدی شبکه اجتماعی (اختیاری)"
                hint="اینستاگرام، تلگرام یا هر پلتفرمی که کارهایتان را منتشر می‌کنید"
              >
                <input
                  dir="ltr"
                  value={socialMediaId}
                  onChange={(e) => setSocialMediaId(e.target.value)}
                  placeholder="@your_id"
                  maxLength={60}
                  className="w-full bg-transparent outline-none text-sm font-bold tracking-wide placeholder:font-normal placeholder:text-muted-foreground/60"
                />
              </FieldWrap>
            </div>
          )}

          {/* ═══ گام ۲: کارت ملی ═══ */}
          {step === 2 && (
            <div className="space-y-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              {!previewUrl ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-3xl border-2 border-dashed border-gold/40 hover:border-gold/70 transition-colors p-8 md:p-10 flex flex-col items-center gap-3 text-center group"
                  style={{ background: "rgba(245,158,11,.05)" }}
                >
                  <span className="grid place-items-center size-16 rounded-2xl bg-gold/12 text-gold group-hover:scale-105 transition-transform">
                    <Icon name="imagePlus" size={30} strokeWidth={2} />
                  </span>
                  <span className="font-extrabold text-sm">آپلود عکس کارت ملی</span>
                  <span className="text-xs text-muted-foreground leading-6 max-w-xs">
                    تصویر واضح از روی کارت ملی — JPG یا PNG، حداکثر ۲ مگابایت.
                    <br />
                    اطلاعات فقط برای تأیید هویت تیم بررسی است.
                  </span>
                </button>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-gold/35">
                  <img src={previewUrl} alt="پیش‌نمایش کارت ملی" className="w-full max-h-56 object-cover" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
                  {uploading ? (
                    <div className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]">
                      <span className="flex items-center gap-2 text-white text-xs font-bold">
                        <Icon name="loader" size={16} className="animate-spin" />
                        در حال آپلود…
                      </span>
                    </div>
                  ) : nationalIdUrl ? (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5">
                      <Icon name="check" size={13} strokeWidth={3} />
                      آپلود شد
                    </span>
                  ) : null}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="grid place-items-center size-9 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/65"
                      aria-label="تغییر تصویر"
                    >
                      <Icon name="pencil" size={15} strokeWidth={2.2} />
                    </button>
                    <button
                      onClick={clearPhoto}
                      className="grid place-items-center size-9 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-rose-600/80"
                      aria-label="حذف تصویر"
                    >
                      <Icon name="trash" size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              )}
              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-5">
                <Icon name="lock" size={13} className="shrink-0 mt-0.5" strokeWidth={2.2} />
                مدارک شما محرمانه است و صرفاً برای تأیید هویت استفاده می‌شود؛ در پروفایل نمایش
                داده نمی‌شود.
              </p>
            </div>
          )}

          {/* ═══ گام ۳: توضیحات و مرور ═══ */}
          {step === 3 && (
            <div className="space-y-4">
              <FieldWrap icon="comment" label="توضیحات (اختیاری)" hint="چرا شایستهٔ نشان استعداد برتری؟ سوابق و دستاوردهایتان را بنویسید">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="مثلاً: ۳ سال است موسیقی سنتی کار می‌کنم، ۲۰ اجرای عمومی داشته‌ام و…"
                  rows={4}
                  className="w-full bg-transparent outline-none text-sm leading-7 placeholder:text-muted-foreground/60 resize-none"
                />
              </FieldWrap>
              {/* مرور نهایی */}
              <div className="rounded-2xl border border-border/60 bg-muted/30 divide-y divide-border/60 text-xs">
                <ReviewRow label="موبایل" value={phoneNumber.trim() || "—"} />
                <ReviewRow label="شبکه اجتماعی" value={socialMediaId.trim() || "—"} />
                <ReviewRow
                  label="کارت ملی"
                  value={nationalIdUrl ? "پیوست شد ✓" : "پیوست نشد ✗"}
                  danger={!nationalIdUrl}
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ناوبری پایین فرم */}
      <div className="flex items-center gap-3 pt-1">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1.5 h-12 px-5 rounded-2xl glass font-bold text-sm hover:bg-muted/60 transition-colors"
          >
            <Icon name="arrowLeft" size={16} strokeWidth={2.4} className="rotate-180" />
            قبلی
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={() => {
              if (step === 1 && !validateStep1()) return;
              setStep((s) => s + 1);
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl text-white font-extrabold text-sm shadow-glow-gold hover:opacity-95 transition-opacity"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
          >
            مرحله بعد
            <Icon name="arrowLeft" size={16} strokeWidth={2.6} className="text-white" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl text-white font-extrabold text-sm shadow-glow-gold hover:opacity-95 transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706 60%,#b45309)" }}
          >
            {submitting ? <Icon name="loader" size={18} className="animate-spin" /> : <GoldCheckMark size={20} />}
            {submitting ? "در حال ثبت…" : "ثبت درخواست نهایی"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── قاب فیلد فرم نخبگان ── */
function FieldWrap({
  icon,
  label,
  hint,
  children,
}: {
  icon: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-3xl border border-border/60 bg-card p-4 md:p-5 space-y-2.5 transition-colors focus-within:border-gold/50">
      <span className="flex items-center gap-2">
        <span className="grid place-items-center size-8 rounded-xl bg-gold/12 text-gold">
          <Icon name={icon as any} size={16} strokeWidth={2.2} />
        </span>
        <span className="font-extrabold text-[13px]">{label}</span>
      </span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground leading-5">{hint}</span>}
    </label>
  );
}

function ReviewRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-muted-foreground font-bold">{label}</span>
      <span dir="auto" className={cn("font-bold", danger ? "text-rose" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
