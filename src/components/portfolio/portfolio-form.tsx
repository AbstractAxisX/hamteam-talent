"use client";

/* ═══════════════════════════════════════════════════════════
   PortfolioFormSheet — فرم افزودن نمونه کار جدید
   · عنوان/توضیح + دسته/زیردسته از مهارت‌های پروفایل کاربر
   · هر نوع فایل: عکس/ویدیو/صدا/سند با پیشرفت زنده + تلاش مجدد
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { toFa } from "@/lib/format";
import { Icon } from "@/components/shared/icon";
import {
  uploadWithProgress, validateAndWrap, MediaTile, KIND_LIMITS,
  MAX_FILES, type MediaItem, type MediaKind,
} from "@/components/shared/upload-engine";
import { Btn, IconBtn, Chip, Sk, SPRING } from "@/components/ui/atoms";
import { toast } from "@/hooks/use-toast";

type MyCategory = {
  id: string;
  name: string;
  iconUrl: string | null;
  skills: { id: string; name: string }[];
};

export function PortfolioFormSheet({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const { user, loading: userLoading } = useUser();
  const [myCats, setMyCats] = React.useState<MyCategory[]>([]);
  const [catsLoading, setCatsLoading] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [skillId, setSkillId] = React.useState("");
  const [items, setItems] = React.useState<MediaItem[]>([]);

  const [phase, setPhase] = React.useState<"idle" | "creating" | "uploading" | "success">("idle");
  const [stepText, setStepText] = React.useState("");
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const busy = phase === "creating" || phase === "uploading";
  const currentCat = myCats.find((c) => c.id === categoryId);
  const skills = currentCat?.skills || [];

  React.useEffect(() => {
    if (!open || !user) return;
    let cancel = false;
    setCatsLoading(true);
    api<{ categories: MyCategory[] }>("/api/me/skills")
      .then((d) => !cancel && setMyCats(d.categories || []))
      .catch(() => {})
      .finally(() => !cancel && setCatsLoading(false));
    return () => { cancel = true; };
  }, [open, user]);

  React.useEffect(() => {
    if (open) {
      setPhase("idle");
      setStepText("");
      setDragY(0);
    } else if (phase === "success" || phase === "idle") {
      setTitle("");
      setDescription("");
      setCategoryId("");
      setSkillId("");
      setItems((prev) => {
        prev.forEach((m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl));
        return [];
      });
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  function addFiles(files: FileList | null) {
    if (!files || busy) return;
    const next: MediaItem[] = [];
    for (const f of Array.from(files)) {
      if (items.length + next.length >= MAX_FILES) {
        toast({ title: "حداکثر ۶ فایل", description: "برای هر نمونه کار حداکثر ۶ فایل می‌توانید بفرستید.", variant: "destructive" });
        break;
      }
      const res = validateAndWrap(f);
      if (res.error) {
        toast({ title: "فایل نامعتبر", description: res.error, variant: "destructive" });
        continue;
      }
      next.push(res.item!);
    }
    if (next.length) setItems((prev) => [...prev, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeItem(key: string) {
    setItems((prev) => {
      const it = prev.find((m) => m.key === key);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((m) => m.key !== key);
    });
  }

  async function publish() {
    if (busy) return;
    const t = title.trim();
    if (t.length < 2) {
      toast({ title: "عنوان کوتاه است", description: "عنوان نمونه کار حداقل ۲ حرف باشد.", variant: "destructive" });
      return;
    }
    if (!categoryId || !skillId) {
      toast({ title: "دسته‌بندی و مهارت", description: "دسته و زیردستهٔ مرتبط را انتخاب کن.", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "فایلی انتخاب نشده", description: "حداقل یک فایل به نمونه کار اضافه کن.", variant: "destructive" });
      return;
    }

    setPhase("creating");
    setStepText("در حال ثبت نمونه کار…");
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ title: t, description: description.trim(), categoryId, skillId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ثبت ناموفق بود");
      const itemId: string = data.id;

      setPhase("uploading");
      let failed = 0;
      for (let i = 0; i < items.length; i++) {
        const m = items[i];
        setStepText(`آپلود فایل ${toFa(i + 1)} از ${toFa(items.length)}…`);
        setItems((prev) => prev.map((x) => (x.key === m.key ? { ...x, status: "uploading", progress: 0 } : x)));
        const fd = new FormData();
        fd.append("file", m.file);
        fd.append("itemId", itemId);
        fd.append("type", m.kind);
        const up = await uploadWithProgress("/api/portfolio/upload-media", fd, (pct) => {
          setItems((prev) => prev.map((x) => (x.key === m.key ? { ...x, progress: pct } : x)));
        });
        setItems((prev) =>
          prev.map((x) => (x.key === m.key ? { ...x, status: up.ok ? "done" : "error", progress: up.ok ? 100 : x.progress } : x))
        );
        if (!up.ok) failed++;
      }
      if (failed === items.length) throw new Error("آپلود همه فایل‌ها ناموفق بود");
      if (failed > 0) toast({ title: "بخشی از فایل‌ها آپلود نشد", description: `${toFa(failed)} فایل ناموفق بود.` });
      setPhase("success");
    } catch (e) {
      setPhase("idle");
      setStepText("");
      toast({ title: "خطا در ثبت", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="افزودن نمونه کار">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
            onClick={() => !busy && onClose()}
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0.6, scale: 0.98 }}
            animate={{ y: dragging ? dragY : 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0.4, transition: { duration: 0.24, ease: [0.3, 0, 0.8, 0.15] } }}
            transition={SPRING.sheet}
            drag={busy || phase === "success" ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragStart={() => setDragging(true)}
            onDrag={(_, info) => setDragY(Math.max(0, info.offset.y))}
            onDragEnd={(_, info) => {
              setDragging(false);
              setDragY(0);
              if (info.offset.y > 110 || info.velocity.y > 700) onClose();
            }}
            className="relative w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[86dvh] flex flex-col
                       bg-card rounded-t-[30px] sm:rounded-[30px] border border-border/70 shadow-float overflow-hidden"
          >
            <div className="h-[3px] w-full grad-brand shrink-0" aria-hidden />

            <div
              className="shrink-0 px-4 pt-2 pb-3 flex items-center gap-3 border-b border-border/60 bg-card/95 backdrop-blur"
              style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
            >
              <span className="sm:hidden mx-auto w-11 h-1.5 rounded-full bg-border absolute left-1/2 -translate-x-1/2 top-1.5" aria-hidden />
              <div className="grid place-items-center size-10 rounded-2xl grad-brand shadow-grad shrink-0">
                <Icon name="imagePlus" size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-black text-foreground leading-tight">افزودن نمونه کار</h2>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">بهترین کارهایت را اینجا نمایش بده</p>
              </div>
              <IconBtn label="بستن" variant="soft" size={40} onClick={() => !busy && onClose()} disabled={busy}>
                <Icon name="x" size={18} />
              </IconBtn>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
              {phase === "success" ? (
                <SuccessPane onClose={() => { onClose(); onCreated?.(); }} />
              ) : userLoading || catsLoading ? (
                <div className="space-y-4">
                  <Sk className="h-11 w-full" />
                  <Sk className="h-24 w-full" />
                  <Sk className="h-9 w-2/3" />
                  <Sk className="h-9 w-full" />
                </div>
              ) : !user ? (
                <GatePane
                  icon="lock"
                  title="برای افزودن نمونه کار وارد شو"
                  desc="با ورود می‌توانی کارهای خودت را نمایش بدهی."
                  cta="ورود / ثبت‌نام"
                  onCta={() => { onClose(); navigate({ view: "auth" }); }}
                />
              ) : myCats.length === 0 ? (
                <GatePane
                  icon="pencil"
                  title="هنوز مهارتی ثبت نکرده‌ای"
                  desc="برای نمونه کار، ابتدا یک دسته‌بندی و مهارت به پروفایلت اضافه کن."
                  cta="افزودن مهارت"
                  onCta={() => { onClose(); navigate({ view: "edit-profile" }); }}
                />
              ) : (
                <>
                  <div>
                    <Label icon="pencil" text="عنوان" required />
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                      placeholder="مثلاً: پوستر جشنواره موسیقی"
                      className="w-full h-12 rounded-2xl bg-muted/60 border-[1.5px] border-border/70 px-4 text-[14px]
                                 font-bold text-foreground placeholder:text-muted-foreground/70 placeholder:font-medium
                                 outline-none transition-colors focus:border-primary/60 focus:bg-card"
                    />
                  </div>

                  <div>
                    <Label icon="info" text="توضیح" />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                      placeholder="درباره این کار، ابزار یا فرایند ساختش بنویس…"
                      className="w-full min-h-20 rounded-[20px] bg-muted/60 border-[1.5px] border-border/70 p-4
                                 text-[13.5px] leading-7 text-foreground placeholder:text-muted-foreground/70
                                 outline-none transition-colors focus:border-primary/60 focus:bg-card resize-none"
                    />
                  </div>

                  <div>
                    <Label icon="grid" text="دسته‌بندی" required />
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 py-1">
                      {myCats.map((c) => (
                        <Chip
                          key={c.id}
                          active={categoryId === c.id}
                          onClick={() => {
                            setCategoryId(c.id);
                            if (skillId && !c.skills.some((s) => s.id === skillId)) setSkillId("");
                          }}
                        >
                          <span className="ml-1">{c.iconUrl || "✨"}</span>
                          {c.name}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label icon="spark" text="زیردسته (مهارت)" required />
                    {skills.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground py-2">
                        {categoryId ? "در این دسته مهارتی ثبت نکرده‌ای." : "ابتدا دسته‌بندی را انتخاب کن."}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 py-1">
                        {skills.map((s) => (
                          <Chip key={s.id} active={skillId === s.id} onClick={() => setSkillId(s.id)}>
                            {s.name}
                          </Chip>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label icon="upload" text="فایل‌ها" required hint={`تا ${toFa(MAX_FILES)} فایل — هر نوعی`} />
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 py-1">
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        transition={SPRING.tap}
                        onClick={() => inputRef.current?.click()}
                        className="shrink-0 h-12 px-4 rounded-2xl border-[1.5px] border-dashed border-primary/45
                                   text-primary text-[12.5px] font-extrabold inline-flex items-center gap-1.5
                                   hover:bg-primary/5 transition-colors outline-none"
                      >
                        <Icon name="plus" size={17} />
                        انتخاب فایل
                      </motion.button>
                      {(Object.keys(KIND_LIMITS) as MediaKind[]).map((k) => (
                        <span key={k} className="shrink-0 h-12 px-3.5 rounded-2xl bg-secondary text-muted-foreground
                                                text-[11px] font-bold inline-flex items-center gap-1">
                          <Icon name={KIND_LIMITS[k].icon} size={14} className="text-primary" />
                          {KIND_LIMITS[k].label} تا {toFa(KIND_LIMITS[k].mb)}م
                        </span>
                      ))}
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv"
                      className="hidden"
                      onChange={(e) => addFiles(e.target.files)}
                    />
                    <AnimatePresence>
                      {items.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-3 gap-2 pt-2 overflow-hidden"
                        >
                          {items.map((m) => (
                            <MediaTile key={m.key} item={m} onRemove={() => removeItem(m.key)} />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>

            {user && phase !== "success" && myCats.length > 0 && (
              <div className="shrink-0 px-4 py-3 border-t border-border/60 bg-card/95 backdrop-blur flex items-center gap-3 safe-b">
                <Btn variant="grad" size="lg" className="flex-1" loading={busy} onClick={publish} disabled={busy}>
                  {busy ? stepText || "در حال ثبت…" : "ثبت نمونه کار"}
                </Btn>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Label({ icon, text, required, hint }: { icon: string; text: string; required?: boolean; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon name={icon} size={15} className="text-primary" />
      <span className="text-[12.5px] font-black text-foreground">{text}</span>
      {required && <span className="text-rose text-[13px] font-black">*</span>}
      {hint && <span className="text-[10.5px] text-muted-foreground font-bold">({hint})</span>}
    </div>
  );
}

function GatePane({ icon, title, desc, cta, onCta }: { icon: string; title: string; desc: string; cta: string; onCta: () => void }) {
  return (
    <div className="py-8 flex flex-col items-center text-center">
      <div className="grid place-items-center size-20 rounded-[26px] glass-strong shadow-soft">
        <Icon name={icon} size={32} className="text-primary" />
      </div>
      <h3 className="mt-4 text-[15px] font-black text-foreground">{title}</h3>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-6 max-w-[300px]">{desc}</p>
      <Btn variant="grad" size="lg" className="mt-5" onClick={onCta}>{cta}</Btn>
    </div>
  );
}

function SuccessPane({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING.bounce}
      className="py-8 flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...SPRING.bounce, delay: 0.05 }}
        className="relative grid place-items-center size-24 rounded-full grad-brand shadow-glow"
      >
        <Icon name="check" size={46} className="text-white" />
        <motion.span
          className="absolute -inset-3 rounded-full border-2 border-emerald-400/50"
          initial={{ scale: 0.7, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
          aria-hidden
        />
      </motion.div>
      <h3 className="mt-5 text-lg font-black text-foreground">نمونه کار ثبت شد!</h3>
      <p className="mt-2 text-[13px] text-muted-foreground leading-6 max-w-[300px]">
        همین حالا در تب «نمونه کارها»ی پروفایلت قابل مشاهده است.
      </p>
      <Btn variant="grad" size="md" className="mt-5" onClick={onClose}>عالیه</Btn>
    </motion.div>
  );
}
