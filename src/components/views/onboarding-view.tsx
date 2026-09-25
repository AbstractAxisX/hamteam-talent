"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { toFa } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/shared/icon";

/* چک‌لیست تکمیل پروفایل — پس از گام «نام» برای کاربر تازه‌ثبت‌نام‌شده.
   · عضو: ۶ قلم (آواتار، بنر، بیو کوتاه، دسته‌بندی، مهارت، موقعیت)
   · چهره‌یاب فعال: ۴ قلم (آواتار، بنر، بیو، موقعیت) + CTA داشبورد چهره‌یاب
   هر ردیف → ویرایش پروفایل با پرش به سکشن مربوطه (params.section) */

interface MeProfileLite {
  avatarUrl: string | null;
  bannerUrl: string | null;
  bioShort: string;
  province: string | null;
  city: string | null;
  categories: { id: string; name: string; skills: { id: string; name: string }[] }[];
}

type ChecklistItem = {
  key: string;
  label: string;
  hint: string;
  icon: string;
  section: string;
  done: boolean;
};

export function OnboardingView() {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<MeProfileLite | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // مهمان → صفحه ورود
  useEffect(() => {
    if (!userLoading && !user) navigate({ view: "auth" });
  }, [userLoading, user]);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setLoadError(false);
    try {
      const d = await api<MeProfileLite>("/api/profile/me");
      setProfile(d);
    } catch {
      setLoadError(true);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user, loadProfile]);

  const isScout = !!user?.isScout;
  const bioDone = !!(profile?.bioShort || "").trim();
  const hasCats = (profile?.categories?.length ?? 0) > 0;
  const hasSkills = (profile?.categories ?? []).some((c) => c.skills.length > 0);
  const hasLocation = !!(profile?.province && profile?.city);

  const items: ChecklistItem[] = isScout
    ? [
        { key: "avatar", label: "آواتار", hint: "عکس پروفایل", icon: "user", section: "photos", done: !!profile?.avatarUrl },
        { key: "banner", label: "بنر", hint: "تصویر کاور پروفایل", icon: "image", section: "photos", done: !!profile?.bannerUrl },
        { key: "bio", label: "بیو کوتاه", hint: "در یک خط بگو چه‌کاره‌ای", icon: "pencil", section: "photos", done: bioDone },
        { key: "location", label: "موقعیت", hint: "استان و شهر", icon: "mapPin", section: "location", done: hasLocation },
      ]
    : [
        { key: "avatar", label: "آواتار", hint: "عکس پروفایل", icon: "user", section: "photos", done: !!profile?.avatarUrl },
        { key: "banner", label: "بنر", hint: "تصویر کاور پروفایل", icon: "image", section: "photos", done: !!profile?.bannerUrl },
        { key: "bio", label: "بیو کوتاه", hint: "در یک خط بگو چه‌کاره‌ای", icon: "pencil", section: "photos", done: bioDone },
        { key: "cats", label: "دسته‌بندی", hint: "حوزه استعدادت", icon: "grid", section: "categories", done: hasCats },
        { key: "skills", label: "مهارت", hint: "حداقل یک مهارت ثبت کن", icon: "sparkles", section: "categories", done: hasSkills },
        { key: "location", label: "موقعیت", hint: "استان و شهر", icon: "mapPin", section: "location", done: hasLocation },
      ];

  const doneCount = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  // نام جای‌نگهدار (خود شماره) → خوش‌آمد بدون نام
  const displayName =
    user?.name?.trim() && user.name.trim() !== user.phone ? user.name.trim() : "";

  function enterApp() {
    navigate(isScout ? { view: "scout" } : { view: "feed" });
  }

  function gotoSection(section: string) {
    navigate({ view: "edit-profile", params: { section } });
  }

  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5 px-4">
        <Icon name="loader" size={22} className="animate-spin text-muted-foreground" strokeWidth={2.2} />
        <span className="sr-only">در حال بارگذاری</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* خوش‌آمد */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="text-center mb-5"
          >
            <h1 className="text-2xl font-extrabold tracking-tight leading-8">
              {displayName ? `خوش اومدی ${displayName}!` : "خوش اومدی!"}
            </h1>
            <p className="text-sm text-muted-foreground leading-6 mt-2">
              پروفایلت رو کامل کن تا بیشتر دیده بشی
            </p>
          </motion.div>

          {/* پیشرفت */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="bg-card border border-border rounded-2xl shadow-sm p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-muted-foreground">تکمیل پروفایل</span>
              <span className="text-xs font-extrabold text-primary">
                {toFa(doneCount)} از {toFa(items.length)}
              </span>
            </div>
            <div
              className="h-2 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={items.length}
              aria-valuenow={doneCount}
              aria-label="پیشرفت تکمیل پروفایل"
            >
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* ردیف‌های چک‌لیست */}
          {loadingProfile ? (
            <div className="space-y-2.5" aria-busy="true" aria-label="در حال بارگذاری چک‌لیست">
              {items.map((i) => (
                <div key={i.key} className="h-14 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : loadError ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center">
              <p className="text-sm text-muted-foreground leading-6 mb-4">
                چک‌لیست بارگذاری نشد؛ دوباره تلاش کن.
              </p>
              <Button
                onClick={loadProfile}
                variant="outline"
                className="h-11 rounded-xl font-bold"
              >
                تلاش مجدد
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, i) => (
                <motion.button
                  key={item.key}
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.08 + i * 0.05 }}
                  onClick={() => gotoSection(item.section)}
                  className="w-full h-14 flex items-center gap-3 bg-card border border-border rounded-2xl shadow-sm px-4 text-right transition-colors hover:border-primary/40 active:scale-[0.99]"
                  aria-label={`${item.label} — ${item.done ? "انجام شده" : "تکمیل نشده"} — رفتن به ویرایش پروفایل`}
                >
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-muted text-muted-foreground shrink-0">
                    <Icon name={item.icon} size={17} strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-foreground">{item.label}</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">{item.hint}</span>
                  </span>
                  {item.done ? (
                    <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0">
                      <Icon name="check" size={13} strokeWidth={2.4} />
                      انجام شده
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                      <Icon name="plus" size={13} strokeWidth={2.4} />
                      افزودن
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* ورود به اپ — همیشه در دسترس */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.35 }}
            className="mt-6"
          >
            <Button
              onClick={enterApp}
              className="w-full h-12 rounded-xl text-base font-bold grad-brand text-primary-foreground transition-opacity hover:opacity-95"
            >
              {isScout ? "ورود به داشبورد چهره‌یاب" : "ورود به فرصتینو"}
            </Button>
            {!isScout && (
              <button
                type="button"
                onClick={enterApp}
                className="w-full h-11 mt-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                بعداً تکمیل می‌کنم
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
