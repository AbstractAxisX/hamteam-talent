"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { CategoryWithSkills } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import { PROVINCES } from "@/lib/geo";
import {
  ArrowRight,
  Briefcase,
  Check,
  Send,
  Info,
  Plus,
  Loader2,
  Type,
  FileText,
  Tag,
  MapPin,
} from "lucide-react";

const MAX_SKILLS = 10;
const MAX_TITLE = 120;
const MAX_DESC = 5000;
const NONE = "__none__";

export function CreateJobView() {
  const { user, loading: userLoading } = useUser();
  const [categories, setCategories] = useState<CategoryWithSkills[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => {
        setCategories(d.categories);
        setLoadingCats(false);
      })
      .catch(() => setLoadingCats(false));
  }, []);

  const currentCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );
  const currentProvince = useMemo(
    () => PROVINCES.find((p) => p.id === province),
    [province]
  );

  // Not logged in
  if (!userLoading && !user) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ view: "jobs" })}
          className="gap-1.5 -mr-2 text-muted-foreground hover:text-foreground rounded-xl h-9"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت
        </Button>
        <Card className="p-8 text-center space-y-3 border-border/60 shadow-card rounded-2xl">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-lg">برای ثبت نیازمندی وارد شوید</h2>
          <p className="text-sm text-muted-foreground leading-7">
            ثبت نیازمندی به حساب کاربری نیاز دارد.
          </p>
          <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5 rounded-xl h-10 font-semibold">
            ورود / ثبت‌نام
          </Button>
        </Card>
      </div>
    );
  }

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) => {
      if (prev.includes(skillId)) return prev.filter((s) => s !== skillId);
      if (prev.length >= MAX_SKILLS) {
        toast({
          title: "حداکثر مهارت انتخاب شده",
          description: `نمی‌توانید بیشتر از ${toFa(MAX_SKILLS)} مهارت انتخاب کنید.`,
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, skillId];
    });
  }

  async function submit() {
    if (submitting) return;
    const t = title.trim();
    const d = description.trim();
    if (t.length < 3) {
      toast({ title: "خطا", description: "عنوان حداقل ۳ نویسه باشد", variant: "destructive" });
      return;
    }
    if (d.length < 10) {
      toast({ title: "خطا", description: "توضیحات حداقل ۱۰ نویسه باشد", variant: "destructive" });
      return;
    }
    if (!categoryId) {
      toast({ title: "خطا", description: "دسته‌بندی را انتخاب کنید", variant: "destructive" });
      return;
    }
    if (selectedSkills.length === 0) {
      toast({ title: "خطا", description: "حداقل یک مهارت انتخاب کنید", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost<{ ok: boolean; id: string }>("/api/jobs", {
        title: t,
        description: d,
        categoryId,
        skills: selectedSkills,
        province: province || null,
        city: city || null,
      });
      toast({ title: "نیازمندی ثبت شد ✅" });
      navigate({ view: "job", id: res.id });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCats) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Card className="p-6 space-y-4 border-border/60 rounded-2xl">
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-24 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: "jobs" })}
        className="gap-1.5 -mr-2 text-muted-foreground hover:text-foreground rounded-xl h-9"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به نیازمندی‌ها
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3"
      >
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-brand-gradient text-white shadow-card shrink-0">
          <Plus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">ثبت نیازمندی</h1>
          <p className="text-sm text-muted-foreground mt-0.5 leading-6">
            نیاز، همکاری یا فرصت خود را منتشر کنید
          </p>
        </div>
      </motion.div>

      {/* Info banner: any category allowed */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-4 bg-primary/5 border-primary/20 rounded-2xl shadow-card">
          <div className="flex items-start gap-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-xl bg-primary/10 text-primary shrink-0">
              <Info className="w-4 h-4" />
            </span>
            <div className="text-[13px] text-foreground/80 leading-7">
              هر کاربری می‌تواند آگهی ثبت کند. برخلاف پست‌ها، برای ثبت نیازمندی می‌توانید
              از <b>تمام دسته‌ها و مهارت‌ها</b> انتخاب کنید — لازم نیست حتماً در پروفایل
              خودتان داشته باشید. کاربرانی که این مهارت‌ها را در پروفایل دارند به‌صورت
              خودکار اعلان دریافت می‌کنند.
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══ Form ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-6 space-y-6 border-border/60 shadow-card rounded-2xl">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="job-title" className="text-sm font-bold flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-muted-foreground" />
              عنوان نیازمندی <span className="text-rose">*</span>
            </Label>
            <Input
              id="job-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
              placeholder="مثال: نیاز به برنامه‌نویس فرانت‌اند با React"
              maxLength={MAX_TITLE}
              className="rounded-xl h-11 text-[15px]"
            />
            <p className="text-[10px] text-muted-foreground text-left nums-fa">
              {toFa(title.length)}/{toFa(MAX_TITLE)}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="job-desc" className="text-sm font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              توضیحات <span className="text-rose">*</span>
            </Label>
            <Textarea
              id="job-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="شرح نیازمندی، مهارت‌های لازم، نوع همکاری، مدت زمان و هر توضیحات مفید دیگر..."
              rows={6}
              maxLength={MAX_DESC}
              className="resize-y min-h-32 rounded-xl text-[15px] leading-7"
            />
            <p className="text-[10px] text-muted-foreground text-left nums-fa">
              {toFa(description.length)}/{toFa(MAX_DESC)}
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-bold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              دسته‌بندی <span className="text-rose">*</span>
            </Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                setSelectedSkills([]);
              }}
            >
              <SelectTrigger className="w-full rounded-xl h-11"><SelectValue placeholder="یک دسته‌بندی انتخاب کنید" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skills multi-select chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                مهارت‌ها <span className="text-rose">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground nums-fa">
                {toFa(selectedSkills.length)}/{toFa(MAX_SKILLS)} انتخاب شده
              </span>
            </div>
            {!categoryId ? (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-4 text-center leading-6">
                ابتدا یک دسته‌بندی انتخاب کنید تا مهارت‌های آن نمایش داده شود.
              </div>
            ) : currentCategory && currentCategory.skills.length === 0 ? (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-4 text-center leading-6">
                مهارتی برای این دسته ثبت نشده است.
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl border border-border/60 bg-card">
                {currentCategory?.skills.map((s) => {
                  const active = selectedSkills.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSkill(s.id)}
                      className={
                        "inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all " +
                        (active
                          ? "bg-primary text-primary-foreground shadow-card"
                          : "bg-background text-foreground border border-border hover:border-primary/40 hover:bg-muted")
                      }
                    >
                      {active && <Check className="w-3 h-3" />}
                      {s.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Province + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                استان
              </Label>
              <Select
                value={province || NONE}
                onValueChange={(v) => {
                  setProvince(v === NONE ? "" : v);
                  setCity("");
                }}
              >
                <SelectTrigger className="w-full rounded-xl h-11"><SelectValue placeholder="انتخاب استان" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— نامشخص —</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                شهر
              </Label>
              <Select
                value={city || NONE}
                onValueChange={(v) => setCity(v === NONE ? "" : v)}
                disabled={!province}
              >
                <SelectTrigger className="w-full rounded-xl h-11">
                  <SelectValue placeholder={province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— نامشخص —</SelectItem>
                  {currentProvince?.cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit (full width) */}
          <div className="pt-2 border-t border-border/60">
            <Button
              onClick={submit}
              disabled={submitting}
              className="w-full h-12 rounded-xl font-semibold gap-2 text-[15px] shadow-card"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ثبت نیازمندی
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate({ view: "jobs" })}
              disabled={submitting}
              className="w-full mt-2 h-10 rounded-xl text-muted-foreground"
            >
              انصراف
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Selected skills summary */}
      {selectedSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4 space-y-2 border-border/60 shadow-card rounded-2xl">
            <p className="text-xs font-bold text-muted-foreground">مهارت‌های انتخاب‌شده</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedSkills.map((sid) => {
                const skill = currentCategory?.skills.find((s) => s.id === sid);
                if (!skill) return null;
                return (
                  <Badge
                    key={sid}
                    variant="outline"
                    className="border-primary/30 text-primary rounded-md h-6"
                  >
                    {skill.name}
                  </Badge>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
