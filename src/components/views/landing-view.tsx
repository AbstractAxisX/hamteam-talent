"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoMark, AuthIllustration } from "@/components/shared/illustrations";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import type { CategoryWithSkills, TopTalentMyStatus } from "@/lib/types";
import {
  Sparkles,
  Compass,
  MessageCircle,
  Rocket,
  ArrowLeft,
  Heart,
  BadgeCheck,
  Users,
  Crown,
  Upload,
  Loader2,
  ShieldCheck,
  Star,
  ImagePlus,
  X,
  Lock,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "نمایش استعدادت",
    desc: "پروفایل زیبا با گالری، دسته‌بندی و مهارت‌ها.",
    badge: "bg-primary/10 text-primary",
  },
  {
    icon: Compass,
    title: "کشف بر اساس مهارت",
    desc: "فیلترهای زنجیره‌ای: دسته ← مهارت، استان ← شهر.",
    badge: "bg-accent text-accent-foreground",
  },
  {
    icon: MessageCircle,
    title: "ارتباط مستقیم",
    desc: "چت لحظه‌ای با استعدادهای دیگر در یک کلیک.",
    badge: "bg-rose/10 text-rose",
  },
  {
    icon: Rocket,
    title: "رشد و دیده‌شدن",
    desc: "پست‌های محبوب، دنبال‌کنندگان و تیک تأیید.",
    badge: "bg-gold/15 text-gold",
  },
];

const TOP_TALENT_CONDITIONS = [
  {
    icon: Clock,
    title: "فعالیت حداقل ۶ ماه",
    desc: "حداقل ۶ ماه فعالیت مستمر در حوزه‌ی تخصصی خود داشته باشید.",
  },
  {
    icon: ImagePlus,
    title: "حداقل ۱۰ پست با کیفیت",
    desc: "حداقل ۱۰ پست باکیفیت از کارهای خود منتشر کرده باشید.",
  },
  {
    icon: Users,
    title: "دنبال‌کننده‌ی فعال",
    desc: "دنبال‌کنندگان فعال و تعامل واقعی با مخاطبان داشته باشید.",
  },
  {
    icon: ShieldCheck,
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
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* ══════ Hero — solid petrol-teal, NO gradient ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 sm:p-10 shadow-sm"
      >
        {/* Soft solid circles (NO gradient fills, low opacity) */}
        <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-primary-foreground/10 animate-float" />
        <div
          className="absolute -bottom-16 -right-12 w-52 h-52 rounded-full bg-accent/20 animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 -right-8 w-24 h-24 rounded-full bg-gold/15 animate-float"
          style={{ animationDelay: "1s" }}
        />

        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-primary-foreground/15">
              <LogoMark className="w-8 h-8" />
            </div>
            <span className="text-3xl font-extrabold">همتیم</span>
          </div>

          <h1 className="text-3xl sm:text-[2.5rem] font-extrabold leading-tight">
            استعدادت رو <span className="text-gold">کشف کن</span>
            <br />
            و به دنیا <span className="text-gold">نشون بده</span>
          </h1>

          <p className="text-base sm:text-lg text-primary-foreground/80 leading-8 max-w-xl">
            پلتفرم کشف و نمایش استعداد — هنر، ورزش، آشپزی و مهارت‌های خلاقانه.
            پروفایل بساز، کارهات رو منتشر کن و با استعدادهای دیگر آشنا شو.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              size="lg"
              onClick={() => navigate({ view: "auth" })}
              className="rounded-2xl bg-primary-foreground text-primary font-extrabold px-6 hover:bg-primary-foreground/90 shadow-sm h-12"
            >
              شروع کنید
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate({ view: "discover" })}
              className="rounded-2xl text-primary-foreground hover:bg-primary-foreground/10 px-6 h-12"
            >
              کشف استعدادها
            </Button>
          </div>

          {/* Mini stat row */}
          <div className="flex flex-wrap gap-6 pt-2">
            <Stat value="۱۰۰٪" label="رایگان" />
            <Stat value="بی‌نهایت" label="مهارت" />
            <Stat value="لحظه‌ای" label="چت" />
          </div>
        </div>
      </motion.section>

      {/* ══════ Category quick-access ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">دسته‌بندی‌ها</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ view: "discover" })}
            className="text-primary font-bold"
          >
            همه
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        </div>

        {loadingCats ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : cats.length === 0 ? null : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {cats.slice(0, 8).map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                onClick={() => navigate({ view: "category", id: c.id })}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-sm transition-all active:scale-95"
              >
                <span className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-3xl">
                  {c.iconUrl || "✨"}
                </span>
                <span className="text-xs font-bold text-center line-clamp-2 leading-4">
                  {c.name}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.section>

      {/* ══════ Features ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-4"
      >
        <h2 className="text-lg font-extrabold">چرا همتیم؟</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="p-5 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow"
            >
              <span
                className={`grid place-items-center w-11 h-11 rounded-xl mb-3 ${f.badge}`}
              >
                <f.icon className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-base mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-6">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══════ How it works ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 sm:p-7 rounded-3xl bg-secondary border border-border"
      >
        <h2 className="text-xl font-extrabold mb-5">چطور کار می‌کند؟</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { n: 1, label: "ثبت‌نام با موبایل و کد ملی" },
            { n: 2, label: "تکمیل پروفایل و انتخاب مهارت" },
            { n: 3, label: "پست بگذار و استعدادت رو نشون بده" },
            { n: 4, label: "با دیگران ارتباط بگیر و تیم بساز" },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="flex sm:flex-col items-center gap-3 text-center"
            >
              <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-extrabold shrink-0 shadow-sm">
                {toFa(s.n)}
              </span>
              <p className="text-sm font-medium leading-6">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══════ NEW: Top Talent conditions + application form ══════ */}
      <TopTalentSection />

      {/* ══════ CTA bottom — solid warm accent ══════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="relative overflow-hidden rounded-3xl bg-accent text-accent-foreground p-8 sm:p-10 text-center shadow-sm"
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary-foreground/30 animate-float" />
        <div
          className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-primary/10 animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div className="relative space-y-4">
          <div className="flex justify-center">
            <AuthIllustration className="w-32 h-40" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">آماده‌ی شروع هستی؟</h2>
          <p className="max-w-md mx-auto leading-7 font-medium text-accent-foreground/80">
            همین حالا ثبت‌نام کن و به جامعه‌ی استعدادهای ایران بپیوند.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ view: "auth" })}
            className="rounded-2xl bg-primary text-primary-foreground font-extrabold px-8 py-3.5 text-base hover:bg-primary/90 shadow-sm h-12"
          >
            شروع کنید
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs font-bold text-accent-foreground/70">
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="w-4 h-4 text-gold" /> تیک تأیید
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="w-4 h-4 text-rose" /> پست‌های محبوب
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4 text-primary" /> تیم‌سازی
            </span>
          </div>
        </div>
      </motion.section>

      {/* ══════ Dev notice ══════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-center py-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/60 border border-border text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-gold" />
          توسعه‌ی این صفحه ادامه دارد
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xl font-extrabold text-gold">{value}</span>
      <span className="text-[11px] text-primary-foreground/70 font-medium">
        {label}
      </span>
    </div>
  );
}

// ─── Top Talent Section: conditions + application form ─────────────
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32 }}
      className="space-y-5"
      id="top-talent"
    >
      {/* Header banner — solid petrol-teal, calm */}
      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-7 sm:p-8 shadow-sm">
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-gold/15 animate-float" />
        <div
          className="absolute -bottom-12 -right-8 w-28 h-28 rounded-full bg-primary-foreground/10 animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div className="relative space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-gold/20">
              <Crown className="w-6 h-6 text-gold" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              استعداد برتر شوید
            </h2>
          </div>
          <p className="text-sm sm:text-base text-primary-foreground/85 leading-7 max-w-xl">
            کاربران منتخب ما با تیک استعداد برتر نمایش داده می‌شوند. اگر فکر
            می‌کنید شرایط لازم را دارید، درخواست خود را ثبت کنید.
          </p>
        </div>
      </div>

      {/* Conditions list — calm card */}
      <Card className="p-6 sm:p-7 border-border/60 shadow-card rounded-3xl space-y-5">
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            شرایط انتخاب شما به عنوان استعداد برتر
          </h3>
          <p className="text-xs text-muted-foreground leading-5">
            برای بررسی درخواست شما، موارد زیر باید احراز شوند.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {TOP_TALENT_CONDITIONS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.04 }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border/60"
              >
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-5">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-5">
                    {c.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Form / status / login gate */}
      <Card className="p-6 sm:p-7 border-border/60 shadow-card rounded-3xl">
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
            initialRejected={status?.status === "rejected" ? status.rejectReason : null}
            onSubmitted={loadStatus}
          />
        )}
      </Card>
    </motion.section>
  );
}

function LoginGate() {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
        <Lock className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-extrabold">ابتدا وارد شوید</h3>
        <p className="text-sm text-muted-foreground leading-6 max-w-md mx-auto">
          برای ثبت درخواست استعداد برتر، ابتدا وارد حساب کاربری خود شوید.
        </p>
      </div>
      <Button
        onClick={() => navigate({ view: "auth" })}
        className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-bold px-6 h-11"
      >
        ورود / ثبت‌نام
        <ArrowLeft className="w-4 h-4" />
      </Button>
    </div>
  );
}

function StatusMessage({ status }: { status: TopTalentMyStatus }) {
  // status !== "rejected" guaranteed by parent
  if (status.status === "approved") {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gold/15 text-gold mx-auto">
          <Crown className="w-7 h-7" />
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

  // pending
  return (
    <div className="text-center space-y-4 py-4">
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gold/15 text-gold mx-auto">
        <Clock className="w-7 h-7" />
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

  // Revoke object URLs when they change to avoid memory leaks
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

    // Build a local preview immediately
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Upload to the server
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
      // Clear preview on failure
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
      // Reset form
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
          <Star className="w-5 h-5 text-primary" />
          فرم درخواست استعداد برتر
        </h3>
        <p className="text-xs text-muted-foreground leading-5">
          اطلاعات زیر را با دقت وارد کنید. پس از بررسی تیم همتیم، نتیجه اعلام
          خواهد شد.
        </p>
      </div>

      {/* Previously-rejected notice */}
      {initialRejected && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose/8 border border-rose/20">
          <XCircle className="w-4 h-4 text-rose shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose">درخواست قبلی رد شد</p>
            <p className="text-[11px] text-rose/80 mt-0.5 leading-5">
              {initialRejected}
            </p>
          </div>
        </div>
      )}

      {/* National ID photo upload */}
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
          <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-muted/40">
            <img
              src={previewUrl}
              alt="پیش‌نمایش کارت ملی"
              className="w-full max-h-56 object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              disabled={uploading}
              className="absolute top-2 left-2 grid place-items-center w-8 h-8 rounded-full bg-background/95 text-rose hover:bg-background shadow-sm border border-border"
              aria-label="حذف عکس"
            >
              <X className="w-4 h-4" />
            </button>
            {uploading && (
              <div className="absolute inset-0 grid place-items-center bg-background/60">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            )}
            {nationalIdPhotoUrl && !uploading && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> آپلود شد
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
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <ImagePlus className="w-6 h-6" />
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

      {/* Phone number */}
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

      {/* Social media ID */}
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

      {/* Description */}
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
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          اطلاعات شما محرمانه می‌ماند
        </div>
        <Button
          onClick={submit}
          disabled={submitting || uploading || !nationalIdPhotoUrl || !phoneNumber.trim()}
          className="gap-2 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 h-11"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          ثبت درخواست
        </Button>
      </div>
    </div>
  );
}
