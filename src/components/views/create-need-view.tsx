"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { PROVINCES, getCitiesForProvince } from "@/lib/geo";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

type AttachmentDraft = { url: string; fileName: string; fileSize: number };

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function CreateNeedView() {
  const { user, loading: userLoading } = useUser();
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  const currentCat = useMemo(() => cats.find((c) => c.id === categoryId), [cats, categoryId]);

  // If guest, prompt login
  if (!userLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="glass p-8 text-center space-y-3 shadow-card rounded-3xl border-border/50">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
            <Icon name="lock" className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg">برای ثبت نیازمندی وارد شوید</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-6">
            برای انتشار نیازمندی، فرصت شغلی یا همکاری ابتدا باید وارد شوید.
          </p>
          <Button
            onClick={() => navigate({ view: "auth" })}
            className="gap-1.5 rounded-2xl font-bold mx-auto bg-primary text-primary-foreground"
          >
            ورود / ثبت‌نام
          </Button>
        </Card>
      </div>
    );
  }

  function toggleSkill(skillId: string) {
    setSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : prev.length >= 10
        ? (toast({ title: "حداکثر ۱۰ مهارت", description: "نمی‌توانید بیش از ۱۰ مهارت انتخاب کنید.", variant: "destructive" }), prev)
        : [...prev, skillId]
    );
  }

  function addAttachment() {
    if (attachments.length >= 8) {
      toast({ title: "حداکثر ۸ پیوست", description: "نمی‌توانید بیش از ۸ پیوست اضافه کنید.", variant: "destructive" });
      return;
    }
    setAttachments((prev) => [...prev, { url: "", fileName: "", fileSize: 0 }]);
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateAttachment(idx: number, field: keyof AttachmentDraft, val: string | number) {
    setAttachments((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: val } : a))
    );
  }

  async function submit() {
    if (submitting) return;
    // Validation
    if (title.trim().length < 3) {
      toast({ title: "عنوان کوتاه است", description: "عنوان باید حداقل ۳ نویسه باشد.", variant: "destructive" });
      return;
    }
    if (title.trim().length > 120) {
      toast({ title: "عنوان طولانی است", description: "عنوان نباید بیش از ۱۲۰ نویسه باشد.", variant: "destructive" });
      return;
    }
    if (description.trim().length < 10) {
      toast({ title: "توضیحات کوتاه است", description: "توضیحات باید حداقل ۱۰ نویسه باشد.", variant: "destructive" });
      return;
    }
    if (!categoryId) {
      toast({ title: "دسته‌بندی الزامی", description: "یک دسته‌بندی را انتخاب کنید.", variant: "destructive" });
      return;
    }
    if (skillIds.length === 0) {
      toast({ title: "مهارت الزامی", description: "حداقل یک مهارت انتخاب کنید.", variant: "destructive" });
      return;
    }
    // Build valid attachments (skip empty URLs)
    const cleanAttachments = attachments
      .filter((a) => a.url.trim().length > 0)
      .map((a) => ({
        url: a.url.trim(),
        fileName: a.fileName.trim() || "فایل",
        fileSize: a.fileSize || 0,
      }));

    setSubmitting(true);
    try {
      const result = await apiPost<{ ok: boolean; id: string }>("/api/needs", {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        skills: skillIds,
        province: province || null,
        city: city || null,
        attachments: cleanAttachments,
      });
      toast({ title: "ثبت شد", description: "نیازمندی شما منتشر شد." });
      navigate({ view: "need", id: result.id });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ═══ Header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
      >
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-glow shrink-0">
            <Icon name="plus" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">ثبت نیازمندی</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-6">
              نیاز، فرصت یا همکاری خود را منتشر کنید
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ Form ═══ */}
      <Card className="glass p-5 sm:p-6 rounded-3xl border-border/50 shadow-soft space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground">عنوان</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: نیازمندی به طراح رابط کاربری موبایل"
            maxLength={120}
            className="rounded-xl bg-background/40 border-border/50 focus-visible:ring-primary/60 h-11"
          />
          <p className="text-[11px] text-muted-foreground nums-fa text-left">
            {toFa(title.length)} / {toFa(120)}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground">توضیحات</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="جزئیات کامل، الزامات، مهارت‌های لازم، تحویل‌کار و..."
            rows={6}
            maxLength={5000}
            className="resize-none rounded-xl bg-background/40 border-border/50 focus-visible:ring-primary/60 min-h-[160px]"
          />
          <p className="text-[11px] text-muted-foreground nums-fa text-left">
            {toFa(description.length)} / {toFa(5000)}
          </p>
        </div>

        {/* Category */}
        <SearchableSelect
          label="دسته‌بندی"
          options={cats.map((c) => ({ value: c.id, label: `${c.iconUrl || "✨"} ${c.name}` }))}
          value={categoryId}
          onChange={(v) => {
            setCategoryId(v === "all" ? "" : v);
            setSkillIds([]);
          }}
          placeholder="انتخاب دسته‌بندی"
        />

        {/* Skills (chips) */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground">
            مهارت‌ها (حداکثر ۱۰)
          </Label>
          {categoryId && currentCat ? (
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-background/40 border border-border/50 min-h-[60px]">
              {currentCat.skills.length === 0 ? (
                <p className="text-xs text-muted-foreground">مهارتی برای این دسته ثبت نشده.</p>
              ) : (
                currentCat.skills.map((s) => {
                  const active = skillIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSkill(s.id)}
                      className={cn(
                        "inline-flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-bold transition-all active:scale-95",
                        active
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "bg-muted/50 border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {active && <Icon name="check" className="w-3 h-3" />}
                      {s.name}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">ابتدا دسته‌بندی را انتخاب کنید.</p>
          )}
          {skillIds.length > 0 && (
            <p className="text-[11px] text-muted-foreground nums-fa">
              {toFa(skillIds.length)} مهارت انتخاب شده
            </p>
          )}
        </div>

        {/* Province + City grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchableSelect
            label="استان"
            options={PROVINCES.map((p) => ({ value: p.id, label: p.name }))}
            value={province}
            onChange={(v) => {
              setProvince(v === "all" ? "" : v);
              setCity("");
            }}
            allLabel="همه"
            placeholder="اختیاری"
          />
          <SearchableSelect
            label="شهر"
            options={getCitiesForProvince(province).map((c) => ({ value: c, label: c }))}
            value={city}
            onChange={(v) => setCity(v === "all" ? "" : v)}
            allLabel="همه"
            placeholder={province ? "اختیاری" : "ابتدا استان"}
            disabled={!province}
          />
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-muted-foreground">پیوست‌ها (اختیاری)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addAttachment}
              className="gap-1 h-8 text-primary font-bold"
            >
              <Icon name="imagePlus" className="w-4 h-4" />
              افزودن پیوست
            </Button>
          </div>
          {attachments.length === 0 ? (
            <p className="text-xs text-muted-foreground">می‌توانید فایل‌های پروژه یا لینک‌های نمونه‌کار را اضافه کنید.</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-background/40 border border-border/50">
                  <div className="grid place-items-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon name="upload" className="w-4 h-4" />
                  </div>
                  <Input
                    value={a.fileName}
                    onChange={(e) => updateAttachment(idx, "fileName", e.target.value)}
                    placeholder="نام فایل"
                    className="h-9 w-32 text-xs rounded-lg bg-background border-border/50 focus-visible:ring-primary/60"
                  />
                  <Input
                    value={a.url}
                    onChange={(e) => updateAttachment(idx, "url", e.target.value)}
                    placeholder="https://..."
                    className="h-9 flex-1 text-xs rounded-lg bg-background border-border/50 focus-visible:ring-primary/60"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(idx)}
                    className="w-9 h-9 text-rose hover:bg-rose/10"
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
          <Button
            variant="ghost"
            onClick={() => navigate({ view: "needs" })}
            className="rounded-2xl font-semibold"
          >
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="gap-1.5 rounded-2xl font-bold bg-primary text-primary-foreground shadow-glow"
          >
            {submitting ? <Spinner className="w-4 h-4" /> : <Icon name="check" className="w-4 h-4" />}
            ثبت نیازمندی
          </Button>
        </div>
      </Card>
    </div>
  );
}
