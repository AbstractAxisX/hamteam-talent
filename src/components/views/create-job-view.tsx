"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";

const MAX_SKILLS = 10;
const MAX_TITLE = 120;
const MAX_DESC = 5000;

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

  // If user is loaded and not logged in, prompt
  if (!userLoading && !user) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ view: "jobs" })}
          className="gap-1.5 -mr-2 text-muted-foreground"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت
        </Button>
        <Card className="p-8 text-center space-y-3">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg">برای ثبت نیازمندی وارد شوید</h2>
          <p className="text-sm text-muted-foreground">
            ثبت نیازمندی به حساب کاربری نیاز دارد.
          </p>
          <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5">
            ورود / ثبت‌نام
          </Button>
        </Card>
      </div>
    );
  }

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) => {
      if (prev.includes(skillId)) {
        return prev.filter((s) => s !== skillId);
      }
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
      toast({
        title: "خطا",
        description: "عنوان حداقل ۳ نویسه باشد",
        variant: "destructive",
      });
      return;
    }
    if (d.length < 10) {
      toast({
        title: "خطا",
        description: "توضیحات حداقل ۱۰ نویسه باشد",
        variant: "destructive",
      });
      return;
    }
    if (!categoryId) {
      toast({
        title: "خطا",
        description: "دسته‌بندی را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }
    if (selectedSkills.length === 0) {
      toast({
        title: "خطا",
        description: "حداقل یک مهارت انتخاب کنید",
        variant: "destructive",
      });
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
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-32" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: "jobs" })}
        className="gap-1.5 -mr-2 text-muted-foreground"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به نیازمندی‌ها
      </Button>

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
          <Plus className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">ثبت نیازمندی</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            نیاز، همکاری یا فرصت خود را منتشر کنید
          </p>
        </div>
      </div>

      {/* Info banner: any category allowed */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/80 leading-6">
            برخلاف پست‌ها، برای ثبت نیازمندی می‌توانید از <b>تمام دسته‌ها و مهارت‌ها</b>{" "}
            انتخاب کنید — لازم نیست حتماً در پروفایل خودتان داشته باشید. کاربرانی که
            این مهارت‌ها را در پروفایل دارند به‌صورت خودکار اعلان دریافت می‌کنند.
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card className="p-6 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="job-title" className="text-sm font-medium">
            عنوان نیازمندی <span className="text-destructive">*</span>
          </Label>
          <Input
            id="job-title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
            placeholder="مثال: نیاز به برنامه‌نویس فرانت‌اند با React"
            maxLength={MAX_TITLE}
          />
          <p className="text-[10px] text-muted-foreground text-left">
            {toFa(title.length)}/{toFa(MAX_TITLE)}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="job-desc" className="text-sm font-medium">
            توضیحات <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="job-desc"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, MAX_DESC))
            }
            placeholder="شرح نیازمندی، مهارت‌های لازم، نوع همکاری، مدت زمان و هر توضیحات مفید دیگر..."
            rows={6}
            maxLength={MAX_DESC}
            className="resize-y min-h-32"
          />
          <p className="text-[10px] text-muted-foreground text-left">
            {toFa(description.length)}/{toFa(MAX_DESC)}
          </p>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            دسته‌بندی <span className="text-destructive">*</span>
          </Label>
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              setSelectedSkills([]);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="یک دسته‌بندی انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skills multi-select */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              مهارت‌ها <span className="text-destructive">*</span>
            </Label>
            <span className="text-[10px] text-muted-foreground">
              {toFa(selectedSkills.length)}/{toFa(MAX_SKILLS)} انتخاب شده
            </span>
          </div>
          {!categoryId ? (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 text-center">
              ابتدا یک دسته‌بندی انتخاب کنید تا مهارت‌های آن نمایش داده شود.
            </div>
          ) : currentCategory && currentCategory.skills.length === 0 ? (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 text-center">
              مهارتی برای این دسته ثبت نشده است.
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap p-3 rounded-lg border border-border bg-card">
              {currentCategory?.skills.map((s) => {
                const active = selectedSkills.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    className={
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors border " +
                      (active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted")
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">استان</Label>
            <Select
              value={province || "NONE"}
              onValueChange={(v) => {
                setProvince(v === "NONE" ? "" : v);
                setCity("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب استان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">— نامشخص —</SelectItem>
                {PROVINCES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">شهر</Label>
            <Select
              value={city || "NONE"}
              onValueChange={(v) => setCity(v === "NONE" ? "" : v)}
              disabled={!province}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">— نامشخص —</SelectItem>
                {currentProvince?.cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => navigate({ view: "jobs" })}
            disabled={submitting}
          >
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="gap-1.5"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                در حال ثبت...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                ثبت نیازمندی
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Selected skills summary */}
      {selectedSkills.length > 0 && (
        <Card className="p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            مهارت‌های انتخاب‌شده
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedSkills.map((sid) => {
              const skill = currentCategory?.skills.find((s) => s.id === sid);
              if (!skill) return null;
              return (
                <Badge
                  key={sid}
                  variant="outline"
                  className="border-primary/30 text-primary"
                >
                  {skill.name}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
