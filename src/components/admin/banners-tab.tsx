"use client";

/* ═══════════════════════════════════════════════════════════
   BannersTab (ادمین) — مدیریت بنرها و تبلیغات صفحه اصلی
   · لیست بنرها: تصویر، متن، لینک، فعال/غیرفعال، ترتیب، آمار، حذف
   · ساخت بنر جدید: آپلود تصویر (/api/upload) + فرم اعتبارسنجی‌شده
   · هم‌سبک با پنل ادمین (کارت‌های شیشه‌ای، آیکون‌های lucide)
   ═══════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  MousePointerClick,
  Loader2,
  Megaphone,
  Link2,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { api, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { toFa } from "@/lib/format";
import type { BannerAdmin } from "@/lib/types";

export function BannersTab() {
  const [banners, setBanners] = useState<BannerAdmin[] | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    try {
      const d = await api<{ banners: BannerAdmin[] }>("/api/admin/banners");
      setBanners(d.banners);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
      setBanners([]);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await api<{ banners: BannerAdmin[] }>("/api/admin/banners");
        if (alive) setBanners(d.banners);
      } catch (e) {
        toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
        if (alive) setBanners([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function toggleActive(b: BannerAdmin) {
    setBanners((prev) =>
      prev ? prev.map((x) => (x.id === b.id ? { ...x, isActive: !x.isActive } : x)) : prev
    );
    try {
      await apiPut(`/api/admin/banners/${b.id}`, { isActive: !b.isActive });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
      load();
    }
  }

  async function move(b: BannerAdmin, dir: -1 | 1) {
    const list = banners || [];
    const sorted = [...list].sort((a, c) => a.order - c.order);
    const idx = sorted.findIndex((x) => x.id === b.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const target = sorted[swapIdx];
    const newOrder = target.order;
    try {
      await Promise.all([
        apiPut(`/api/admin/banners/${b.id}`, { order: newOrder }),
        apiPut(`/api/admin/banners/${target.id}`, { order: b.order }),
      ]);
      setBanners((prev) =>
        prev
          ? prev.map((x) =>
              x.id === b.id ? { ...x, order: newOrder } : x.id === target.id ? { ...x, order: b.order } : x
            )
          : prev
      );
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function remove(b: BannerAdmin) {
    if (!window.confirm(`بنر «${b.title}» حذف شود؟`)) return;
    try {
      await apiDelete(`/api/admin/banners/${b.id}`);
      setBanners((prev) => (prev ? prev.filter((x) => x.id !== b.id) : prev));
      toast({ title: "بنر حذف شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  const sorted = (banners || []).slice().sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-3xl">
      {/* هدر صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">بنرها و تبلیغات</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            اسلایدر بنرهای صفحه اصلی — ترتیب، فعال‌سازی و آمار کلیک
          </p>
        </div>
        <Button
          onClick={() => setCreating((v) => !v)}
          className="gap-1.5 text-white font-bold rounded-lg"
          style={{ backgroundColor: "oklch(0.5 0.15 250)" }}
        >
          {creating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {creating ? "بستن فرم" : "بنر جدید"}
        </Button>
      </div>

      {/* فرم ساخت */}
      {creating && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <CreateBannerForm
            onCreated={() => {
              setCreating(false);
              load();
            }}
          />
        </motion.div>
      )}

      {/* لیست */}
      {banners === null ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <Card className="p-10 border-gray-200 shadow-sm rounded-xl text-center">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gray-100 mx-auto mb-3">
            <Megaphone className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-bold text-sm text-gray-900">هنوز بنری ثبت نشده</h3>
          <p className="text-xs text-gray-500 mt-1 leading-6">
            اولین بنر را بسازید تا در اسلایدر صفحه اصلی نمایش داده شود.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((b) => (
            <BannerRow
              key={b.id}
              b={b}
              onToggle={toggleActive}
              onMove={move}
              onDelete={remove}
              onSaved={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ردیف بنر ── */
function BannerRow({
  b,
  onToggle,
  onMove,
  onDelete,
  onSaved,
}: {
  b: BannerAdmin;
  onToggle: (b: BannerAdmin) => void;
  onMove: (b: BannerAdmin, dir: -1 | 1) => void;
  onDelete: (b: BannerAdmin) => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(b.title);
  const [subtitle, setSubtitle] = useState(b.subtitle);
  const [linkUrl, setLinkUrl] = useState(b.linkUrl || "");
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    setSaving(true);
    try {
      await apiPut(`/api/admin/banners/${b.id}`, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        linkUrl: linkUrl.trim(),
      });
      toast({ title: "بنر بروزرسانی شد" });
      setEditing(false);
      onSaved();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        {/* تصویر */}
        <div className="relative w-32 h-[70px] rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
          <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" loading="lazy" />
          {!b.isActive && (
            <span className="absolute inset-0 bg-white/70 backdrop-blur-[1px] grid place-items-center">
              <EyeOff className="w-4 h-4 text-gray-500" />
            </span>
          )}
        </div>
        {/* متن */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{b.title}</p>
          {b.subtitle && <p className="text-[11px] text-gray-500 truncate mt-0.5">{b.subtitle}</p>}
          {b.linkUrl && (
            <p className="text-[10.5px] text-blue-600 truncate mt-1 flex items-center gap-1" dir="ltr">
              <Link2 className="w-3 h-3 shrink-0" />
              {b.linkUrl}
            </p>
          )}
        </div>
        {/* آمار */}
        <div className="hidden sm:flex flex-col gap-1 text-[10.5px] text-gray-500 shrink-0 items-end">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {toFa(b.views)} بازدید
          </span>
          <span className="flex items-center gap-1">
            <MousePointerClick className="w-3 h-3" />
            {toFa(b.clicks)} کلیک
          </span>
        </div>
      </div>

      {/* اکشن‌ها */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggle(b)}
          className="gap-1.5 h-8 text-xs font-bold rounded-lg"
        >
          {b.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {b.isActive ? "غیرفعال" : "فعال"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onMove(b, -1)} className="h-8 w-8 p-0 rounded-lg" aria-label="انتقال به بالا">
          <ChevronUp className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onMove(b, 1)} className="h-8 w-8 p-0 rounded-lg" aria-label="انتقال به پایین">
          <ChevronDown className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing((v) => !v);
            setTitle(b.title);
            setSubtitle(b.subtitle);
            setLinkUrl(b.linkUrl || "");
          }}
          className="gap-1.5 h-8 text-xs font-bold rounded-lg"
        >
          <Pencil className="w-3.5 h-3.5" />
          ویرایش
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(b)}
          className="gap-1.5 h-8 text-xs font-bold rounded-lg text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          حذف
        </Button>
        <span className="ms-auto text-[10px] text-gray-400 font-bold">
          ترتیب: {toFa(b.order + 1)}
        </span>
      </div>

      {/* ویرایش درجا */}
      {editing && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2.5 pt-2 border-t border-gray-100">
          <div>
            <Label className="text-xs font-bold text-gray-700">عنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-bold text-gray-700">زیرعنوان</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={140} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-bold text-gray-700">لینک (http/https یا #/ داخلی)</Label>
            <Input dir="ltr" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="#/explore" className="mt-1 text-sm" />
          </div>
          <Button
            onClick={saveEdit}
            disabled={saving || !title.trim()}
            className="gap-1.5 text-white font-bold rounded-lg h-9"
            style={{ backgroundColor: "oklch(0.5 0.15 250)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            ذخیره
          </Button>
        </motion.div>
      )}
    </Card>
  );
}

/* ── فرم ساخت بنر ── */
function CreateBannerForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "خطا", description: "فقط فایل تصویری مجاز است", variant: "destructive" });
      return;
    }
    const local = URL.createObjectURL(file);
    setPreview(local);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "admin-banner");
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "آپلود ناموفق بود");
      setImageUrl(data.url);
    } catch (e) {
      toast({ title: "خطا در آپلود", description: (e as Error).message, variant: "destructive" });
      URL.revokeObjectURL(local);
      setPreview("");
      setImageUrl("");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!title.trim()) {
      toast({ title: "عنوان بنر الزامی است", variant: "destructive" });
      return;
    }
    if (!imageUrl) {
      toast({ title: "تصویر بنر الزامی است", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/admin/banners", {
        title: title.trim(),
        subtitle: subtitle.trim(),
        imageUrl,
        linkUrl: linkUrl.trim(),
        placement: "hero",
        order: 0,
        isActive: true,
      });
      toast({ title: "بنر ساخته شد ✅", description: "در اسلایدر صفحه اصلی نمایش داده می‌شود." });
      setTitle("");
      setSubtitle("");
      setLinkUrl("");
      setImageUrl("");
      setPreview("");
      onCreated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 border-gray-200 shadow-sm rounded-xl space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="grid place-items-center w-9 h-9 rounded-lg text-white" style={{ backgroundColor: "oklch(0.5 0.15 250)" }}>
          <ImageIcon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-900">بنر جدید</h3>
          <p className="text-[10px] text-gray-500">در اسلایدر پایین هیروی صفحه اصلی نمایش داده می‌شود</p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadImage(f);
          e.target.value = "";
        }}
      />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={preview} alt="پیش‌نمایش بنر" className="w-full h-32 object-cover" />
          {uploading && (
            <span className="absolute inset-0 grid place-items-center bg-white/60">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 p-6 flex flex-col items-center gap-2 text-gray-500 transition-colors"
        >
          <ImageIcon className="w-7 h-7" />
          <span className="text-xs font-bold">انتخاب تصویر بنر (JPG/PNG — حداکثر ۵MB)</span>
        </button>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-bold text-gray-700">
            عنوان <span className="text-red-500">*</span>
          </Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="مثلاً: مسابقه استعدادیابی تابستان" className="mt-1 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-bold text-gray-700">زیرعنوان</Label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={140} placeholder="مثلاً: ثبت‌نام تا پایان مرداد" className="mt-1 text-sm" />
        </div>
      </div>
      <div>
        <Label className="text-xs font-bold text-gray-700">لینک مقصد (اختیاری)</Label>
        <Input dir="ltr" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com یا #/explore" className="mt-1 text-sm" />
        <p className="text-[10px] text-gray-400 mt-1">لینک داخلی با #/ شروع شود (مثل #/top-talent)؛ خارجی با http</p>
      </div>

      <Button
        onClick={submit}
        disabled={submitting || uploading || !imageUrl || !title.trim()}
        className="gap-1.5 text-white font-bold rounded-lg"
        style={{ backgroundColor: "oklch(0.5 0.15 250)" }}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        ساخت بنر
      </Button>
    </Card>
  );
}
