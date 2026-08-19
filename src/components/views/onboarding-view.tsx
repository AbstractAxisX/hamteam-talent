"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@/components/shared/icon";
import type { CategoryWithSkills } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Step = "username" | "categories" | "mainCategory" | "welcome";

export function OnboardingView() {
  const { user, fetchUser } = useUser();
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameError, setUsernameError] = useState("");
  const [categories, setCategories] = useState<CategoryWithSkills[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [mainCategory, setMainCategory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Load categories
  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories").then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  // Username live check
  useEffect(() => {
    if (!username.trim()) { setUsernameStatus("idle"); return; }
    const t = setTimeout(async () => {
      const val = username.trim().toLowerCase();
      if (val.length < 3) { setUsernameStatus("invalid"); setUsernameError("حداقل ۳ کاراکتر"); return; }
      if (!/^[a-z0-9_]+$/.test(val)) { setUsernameStatus("invalid"); setUsernameError("فقط حروف انگلیسی، اعداد و _"); return; }
      setUsernameStatus("checking");
      try {
        const res = await apiPost<{ available: boolean; error?: string }>("/api/username/check", { username: val });
        if (res.available) { setUsernameStatus("available"); setUsernameError(""); }
        else { setUsernameStatus("taken"); setUsernameError(res.error || "قبلاً گرفته شده"); }
      } catch { setUsernameStatus("taken"); }
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  async function submitUsername() {
    if (usernameStatus !== "available") return;
    setSubmitting(true);
    try {
      await apiPost("/api/username/set", { username: username.trim().toLowerCase() });
      await fetchUser();
      setStep("categories");
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  }

  function toggleCategory(id: string) {
    setSelectedCats((prev) => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    // Clear main category if it was deselected
    if (mainCategory === id) setMainCategory("");
  }

  function toggleSkill(id: string) {
    setSelectedSkills((prev) => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  function submitCategories() {
    if (selectedCats.length === 0) { toast({ title: "حداقل یک دسته‌بندی انتخاب کنید" }); return; }
    if (selectedCats.length === 1) { setMainCategory(selectedCats[0]); setStep("welcome"); }
    else setStep("mainCategory");
  }

  async function submitMainCategory() {
    setSubmitting(true);
    try {
      if (mainCategory) {
        await apiPut("/api/profile/me", { mainCategoryId: mainCategory });
      }
      setStep("welcome");
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  }

  async function finish() {
    await fetchUser();
    navigate({ view: "feed" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="h-1.5 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: step === "username" ? "25%" : step === "categories" ? "50%" : step === "mainCategory" ? "75%" : "100%" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* Step 1: Username */}
            {step === "username" && (
              <motion.div key="username" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-8">
                  <div className="grid place-items-center w-20 h-20 rounded-3xl bg-primary mx-auto mb-4">
                    <Icon name="user" className="text-primary-foreground" size={36} />
                  </div>
                  <h1 className="text-2xl font-extrabold">نام کاربری خود را بسازید</h1>
                  <p className="text-sm text-muted-foreground mt-2">این نام منحصربه‌فرد شما در همتیم خواهد بود</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold">نام کاربری</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="h-13 pl-7 rounded-2xl text-base"
                      dir="ltr"
                      autoFocus
                    />
                    {usernameStatus === "checking" && <span className="absolute left-9 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">بررسی...</span>}
                    {usernameStatus === "available" && <Check className="absolute left-9 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />}
                  </div>
                  {usernameError && <p className={cn("text-xs", usernameStatus === "available" ? "text-success" : "text-destructive")}>{usernameError}</p>}
                </div>

                <Button
                  onClick={submitUsername}
                  className="w-full h-13 mt-6 rounded-2xl text-base font-bold"
                  disabled={usernameStatus !== "available" || submitting}
                >
                  ادامه
                </Button>
              </motion.div>
            )}

            {/* Step 2: Categories */}
            {step === "categories" && (
              <motion.div key="categories" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-6">
                  <div className="grid place-items-center w-20 h-20 rounded-3xl bg-primary mx-auto mb-4">
                    <Icon name="sparkles" className="text-primary-foreground" size={36} />
                  </div>
                  <h1 className="text-2xl font-extrabold">حوزه‌ی فعالیت خود را انتخاب کنید</h1>
                  <p className="text-sm text-muted-foreground mt-2">دسته‌بندی و مهارت‌هایت رو انتخاب کن</p>
                </div>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto slim-scroll pr-1">
                  {categories.map((cat) => {
                    const selected = selectedCats.includes(cat.id);
                    return (
                      <div key={cat.id} className={cn("rounded-2xl border-2 transition-all overflow-hidden", selected ? "border-primary bg-accent" : "border-border")}>
                        <button onClick={() => toggleCategory(cat.id)} className="w-full p-3 flex items-center gap-3 text-right">
                          <span className="text-2xl">{cat.iconUrl || "📁"}</span>
                          <span className="flex-1 font-bold text-sm">{cat.name}</span>
                          {selected && <Check className="w-5 h-5 text-primary" />}
                        </button>
                        <AnimatePresence>
                          {selected && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="p-3 pt-0 flex flex-wrap gap-1.5">
                                {cat.skills.map((skill) => {
                                  const sel = selectedSkills.includes(skill.id);
                                  return (
                                    <button key={skill.id} onClick={() => toggleSkill(skill.id)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all", sel ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                                      {skill.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <Button onClick={submitCategories} className="w-full h-13 mt-6 rounded-2xl text-base font-bold" disabled={selectedCats.length === 0}>
                  ادامه ({selectedCats.length} دسته)
                </Button>
              </motion.div>
            )}

            {/* Step 3: Main Category */}
            {step === "mainCategory" && (
              <motion.div key="mainCategory" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-6">
                  <div className="grid place-items-center w-20 h-20 rounded-3xl bg-primary mx-auto mb-4">
                    <Icon name="star" className="text-primary-foreground" size={36} />
                  </div>
                  <h1 className="text-2xl font-extrabold">دسته‌ی اصلی خود را مشخص کنید</h1>
                  <p className="text-sm text-muted-foreground mt-2">رنگ این دسته دور آواتار شما می‌افتد</p>
                </div>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto slim-scroll pr-1">
                  {selectedCats.map((catId) => {
                    const cat = categories.find(c => c.id === catId);
                    if (!cat) return null;
                    const color = cat.color || "#6366f1";
                    const selected = mainCategory === catId;
                    return (
                      <button key={catId} onClick={() => setMainCategory(catId)} className={cn("w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-right", selected ? "border-primary bg-accent" : "border-border hover:border-foreground/15")}>
                        <span className="w-10 h-10 rounded-full grid place-items-center" style={{ backgroundColor: color }}>
                          <span className="text-xl">{cat.iconUrl || "📁"}</span>
                        </span>
                        <span className="flex-1 font-bold text-sm">{cat.name}</span>
                        {selected && <Check className="w-5 h-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>

                <Button onClick={submitMainCategory} className="w-full h-13 mt-6 rounded-2xl text-base font-bold" disabled={!mainCategory || submitting}>
                  ادامه
                </Button>
              </motion.div>
            )}

            {/* Step 4: Welcome */}
            {step === "welcome" && (
              <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 15 }} className="grid place-items-center w-24 h-24 rounded-3xl bg-primary mx-auto mb-6">
                    <Icon name="check" className="text-primary-foreground" size={48} />
                  </motion.div>
                  <h1 className="text-3xl font-extrabold">خوش آمدید! 🎉</h1>
                  <p className="text-base text-muted-foreground mt-3 leading-7">
                    {user?.name} عزیز، حساب شما آماده شد.<br />
                    حالا می‌توانید استعدادهایتان را نشان بدهید و با افراد مستعد ارتباط بگیرید.
                  </p>
                  <div className="mt-4 text-sm text-muted-foreground">
                    نام کاربری شما: <span className="font-bold text-primary" dir="ltr">@{username.toLowerCase()}</span>
                  </div>
                </div>
                <Button onClick={finish} className="w-full h-13 mt-8 rounded-2xl text-base font-bold">
                  ورود به همتیم
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
