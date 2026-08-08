"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { CategoryWithSkills } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import { PROVINCES } from "@/lib/geo";
import {
  Briefcase,
  Plus,
  X,
  Loader2,
  Paperclip,
  Upload,
  Info,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALL = "all";
const MAX_SKILLS = 10;
const MAX_ATTACHMENTS = 8;

type AttachmentDraft = {
  url: string;
  fileName: string;
  fileSize: number;
};

export function CreateNeedView() {
  const { user, loading: userLoading } = useUser();
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [province, setProvince] = useState<string>(ALL);
  const [city, setCity] = useState<string>(ALL);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => {});
  }, []);

  const currentCat = useMemo(
    () => cats.find((c) => c.id === categoryId),
    [cats, categoryId]
  );
  const currentProvince = useMemo(
    () => PROVINCES.find((p) => p.id === province),
    [province]
  );

  /* ── Auth gate ── */
  if (!userLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 rounded-2xl border-border/60 shadow-sm">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
              <Briefcase className="w-6 h-6" />
            </span>
            <div>
              <p className="font-bold">برای ثبت نیازمندی وارد شوید</p>
              <p className="text-xs text-muted-foreground mt-1">
                هر کاربر می‌تواند پس از ورود، نیازمندی ثبت کند.
              </p>
            </div>
            <Button
              onClick={() => navigate({ view: "auth" })}
              className="gap-1.5 rounded-xl font-bold"
            >
              ورود / ثبت‌نام
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (userLoading || cats.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32 rounded" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) => {
      if (prev.includes(skillId)) return prev.filter((s) => s !== skillId);
      if (prev.length >= MAX_SKILLS) {
        toast({
          title: "حداکثر مهارت انتخاب شده",
          description: `نمی‌توانید بیش از ${toFa(MAX_SKILLS)} مهارت انتخاب کنید.`,
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, skillId];
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset input
    if (!file) return;

    if (attachments.length >= MAX_ATTACHMENTS) {
      toast({
        title: "حداکثر پیوست",
        description: `نمی‌توانید بیش از ${toFa(MAX_ATTACHMENTS)} فایل پیوست کنید.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/needs/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "آپلود ناموفق بود");
      }
      const data = (await res.json()) as {
        ok: boolean;
        url: string;
        fileName: string;
        fileSize: number;
      };
      setAttachments((prev) => [
        ...prev,
        {
          url: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
        },
      ]);
      toast({ title: "فایل آپلود شد ✅" });
    } catch (e) {
      toast({
        title: "خطا در آپلود",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    /* ── Validation ── */
    if (title.trim().length < 3) {
      toast({
        title: "عنوان کوتاه است",
        description: "عنوان باید حداقل ۳ نویسه باشد.",
        variant: "destructive",
      });
      return;
    }
    if (title.trim().length > 120) {
      toast({
        title: "عنوان طولانی است",
        description: "عنوان نباید بیش از ۱۲۰ نویسه باشد.",
        variant: "destructive",
      });
      return;
    }
    if (description.trim().length < 10) {
      toast({
        title: "توضیحات کوتاه است",
        description: "توضیحات باید حداقل ۱۰ نویسه باشد.",
        variant: "destructive",
      });
      return;
    }
    if (description.trim().length > 5000) {
      toast({
        title: "توضیحات طولانی است",
        description: "توضیحات نباید بیش از ۵۰۰۰ نویسه باشد.",
        variant: "destructive",
      });
      return;
    }
    if (!categoryId) {
      toast({
        title: "دسته‌بندی الزامی است",
        description: "یک دسته‌بندی انتخاب کنید.",
        variant: "destructive",
      });
      return;
    }
    if (selectedSkills.length === 0) {
      toast({
        title: "مهارت الزامی است",
        description: "حداقل یک مهارت انتخاب کنید.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        skills: selectedSkills,
        province: province !== ALL ? province : null,
        city: city !== ALL ? city : null,
        attachments,
      };
      const data = await apiPost<{ ok: boolean; id: string }>(
        "/api/needs",
        payload
      );
      toast({ title: "نیازمندی ثبت شد ✅" });
      navigate({ view: "need", id: data.id });
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
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ═══ Header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="grid place-items-center w-11 h-11 rounded-2xl bg-primary text-primary-foreground shadow-md">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold leading-tight">
            ثبت نیازمندی
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            نیاز، همکاری یا فرصت خود را منتشر کنید
          </p>
        </div>
      </motion.div>

      {/* ═══ Info banner ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="p-3 rounded-2xl bg-accent/60 border-accent/40">
          <div className="flex items-start gap-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent-foreground/10 text-accent-foreground shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </span>
            <p className="text-xs text-accent-foreground leading-6">
              هر کاربری می‌تواند نیازمندی ثبت کند. نیازمندی شما برای کاربرانی که
              مهارت‌های انتخاب‌شده را دارند، اعلان ارسال می‌شود.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* ═══ Form ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-5 rounded-2xl border-border/60 shadow-sm space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground">
                عنوان
              </label>
              <span className="text-[10px] text-muted-foreground">
                {toFa(title.length)}/{toFa(120)}
              </span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              placeholder="مثلاً: نیازمند طراح گرافیک برای پروژه..."
              className="rounded-xl h-11 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground">
                توضیحات
              </label>
              <span className="text-[10px] text-muted-foreground">
                {toFa(description.length)}/{toFa(5000)}
              </span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
              placeholder="جزئیات نیازمندی، نوع همکاری، مهارت‌های موردنیاز، مدت‌زمان و..."
              className="min-h-[140px] resize-none rounded-xl text-sm leading-7"
            />
          </div>

          {/* Category + Skill chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">
              دسته‌بندی
            </label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                setSelectedSkills([]);
              }}
            >
              <SelectTrigger className="rounded-xl h-11 w-full">
                <SelectValue placeholder="یک دسته‌بندی انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.iconUrl || "✨"} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentCat && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground">
                  مهارت‌ها
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {toFa(selectedSkills.length)}/{toFa(MAX_SKILLS)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentCat.skills.map((s) => {
                  const active = selectedSkills.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSkill(s.id)}
                      className={cn(
                        "inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-bold transition-all active:scale-95",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      )}
                    >
                      {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Province + City */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">
                استان (اختیاری)
              </label>
              <Select
                value={province}
                onValueChange={(v) => {
                  setProvince(v);
                  setCity(ALL);
                }}
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>همه</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">
                شهر (اختیاری)
              </label>
              <Select
                value={city}
                onValueChange={setCity}
                disabled={province === ALL}
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>همه</SelectItem>
                  {currentProvince?.cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground">
                پیوست‌ها (اختیاری)
              </label>
              <span className="text-[10px] text-muted-foreground">
                {toFa(attachments.length)}/{toFa(MAX_ATTACHMENTS)}
              </span>
            </div>
            <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer text-center min-h-[80px]">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
              />
              {uploading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {uploading
                  ? "در حال آپلود..."
                  : "فایل را اینجا بگذارید یا کلیک کنید"}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                تصویر، PDF، Word، Excel، ZIP — حداکثر ۵ مگابایت
              </span>
            </label>

            <AnimatePresence>
              {attachments.length > 0 && (
                <div className="space-y-1.5 mt-1">
                  {attachments.map((a, idx) => (
                    <motion.div
                      key={a.url}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40"
                    >
                      <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {a.fileName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatBytes(a.fileSize)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="grid place-items-center w-7 h-7 rounded-lg text-muted-foreground hover:bg-rose/10 hover:text-rose transition-colors"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ view: "needs" })}
              className="text-muted-foreground"
            >
              انصراف
            </Button>
            <Button
              onClick={submit}
              disabled={submitting}
              className="gap-1.5 rounded-xl font-bold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  ثبت نیازمندی
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${toFa(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${toFa((bytes / 1024).toFixed(0))} کیلوبایت`;
  return `${toFa((bytes / 1024 / 1024).toFixed(1))} مگابایت`;
}
