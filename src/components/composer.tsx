"use client";

/* ═══════════════════════════════════════════════════════════
   همتیم — کامپوزر ساخت پست (فاز ۵)
   · ComposerTrigger — کارت شیشه‌ای بالای فید (رفرنس)
   · ComposerSheet — شیت تمام‌صفحه: متن + دسته/مهارت + رسانه
   · آپلود با پیشرفت واقعی (XHR) · فقط transform/opacity (۶۰fps)
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { toFa } from "@/lib/format";
import { Icon } from "@/components/shared/icon";
import { GradAvatar, VerifiedMark } from "@/components/ui/grad-avatar";
import { GoldCheckMark } from "@/components/ui/elite";
import { Btn, IconBtn, Chip, Sk, SPRING } from "@/components/ui/atoms";
import {
  uploadWithProgress, validateAndWrap, MediaTile,
  KIND_LIMITS, MAX_FILES, type MediaItem, type MediaKind,
} from "@/components/shared/upload-engine";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type ComposerTab = MediaKind;

type MyCategory = {
  id: string;
  name: string;
  iconUrl: string | null;
  skills: { id: string; name: string }[];
};

const MAX_LEN = 2000;

/* ═══════════════ ComposerTrigger — کارت شروع بالای فید ═══════════════ */

export function ComposerTrigger({
  onOpen, onOpenTab,
}: {
  onOpen: () => void;
  onOpenTab: (tab: ComposerTab) => void;
}) {
  const { user } = useUser();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.02 }}
      className="glass rounded-[24px] p-3.5 shadow-card relative overflow-hidden"
    >
      {/* رگه برند */}
      <span className="absolute inset-y-0 right-0 w-[3px] grad-brand rounded-full" aria-hidden />

      <div className="flex items-center gap-3">
        <GradAvatar
          name={user?.name || "مهمان"}
          src={user?.profile?.avatarUrl ?? null}
          size="lg"
          verified={user?.isVerifiedBadge}
          topTalent={user?.isTopTalent}
        />
        <button
          onClick={onOpen}
          className="flex-1 min-w-0 h-12 rounded-2xl bg-muted/70 border-[1.5px] border-border/70 px-4 text-right
                     text-[13px] font-bold text-muted-foreground hover:border-primary/50 hover:bg-muted
                     transition-colors outline-none"
        >
          استعدادت رو با دنیا به اشتراک بذار…
        </button>
      </div>

      {/* اکشن‌های سریع رسانه */}
      <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-1.5">
        {(Object.keys(KIND_LIMITS) as MediaKind[]).map((k) => (
          <motion.button
            key={k}
            onClick={() => onOpenTab(k)}
            whileTap={{ scale: 0.92 }}
            transition={SPRING.tap}
            aria-label={`افزودن ${KIND_LIMITS[k].label}`}
            className="h-10 px-3.5 rounded-full inline-flex items-center gap-1.5 text-[12px] font-extrabold
                       text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none"
          >
            <Icon name={KIND_LIMITS[k].icon} size={18} className="text-primary" />
            {KIND_LIMITS[k].label}
          </motion.button>
        ))}
        <span className="flex-1" />
        <motion.button
          onClick={onOpen}
          whileTap={{ scale: 0.92 }}
          transition={SPRING.tap}
          className="h-10 px-5 rounded-full grad-brand text-white text-[12.5px] font-extrabold shadow-grad
                     inline-flex items-center gap-1.5 outline-none"
        >
          <Icon name="sparkles" size={17} />
          ثبت استعداد
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ═══════════════ ComposerSheet — شیت ساخت پست ═══════════════ */

export function ComposerSheet({
  open, onClose, onPosted, initialTab,
}: {
  open: boolean;
  onClose: () => void;
  onPosted?: () => void;
  initialTab?: ComposerTab;
}) {
  const { user, loading: userLoading } = useUser();

  // داده‌ها
  const [myCats, setMyCats] = React.useState<MyCategory[]>([]);
  const [catsLoading, setCatsLoading] = React.useState(false);

  // فرم
  const [content, setContent] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [skillId, setSkillId] = React.useState("");
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = React.useState<MediaKind>("image");

  // وضعیت انتشار
  const [phase, setPhase] = React.useState<"idle" | "creating" | "uploading" | "success">("idle");
  const [stepText, setStepText] = React.useState("");
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragStart = React.useRef<number | null>(null);
  const busy = phase === "creating" || phase === "uploading";

  const currentCat = myCats.find((c) => c.id === categoryId);
  const skills = currentCat?.skills || [];

  /* ── بارگذاری مهارت‌های کاربر هنگام باز شدن ── */
  React.useEffect(() => {
    if (!open || !user) return;
    let cancel = false;
    setCatsLoading(true);
    api<{ categories: MyCategory[] }>("/api/me/skills")
      .then((d) => {
        if (cancel) return;
        setMyCats(d.categories || []);
      })
      .catch(() => {})
      .finally(() => !cancel && setCatsLoading(false));
    return () => {
      cancel = true;
    };
  }, [open, user]);

  /* ── ریست هنگام باز/بسته ── */
  React.useEffect(() => {
    if (open) {
      setPhase("idle");
      setStepText("");
      setDragY(0);
      if (initialTab) setActiveTab(initialTab);
      setTimeout(() => taRef.current?.focus(), 350);
    } else {
      if (phase === "success" || phase === "idle") {
        setContent("");
        setCategoryId("");
        setSkillId("");
        setItems((prev) => {
          prev.forEach((m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl));
          return [];
        });
        setActiveTab("image");
      }
    }
  }, [open]);

  /* ── قفل اسکرول بدنه + Escape ── */
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  /* ── رشد خودکار متن ── */
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(280, Math.max(96, ta.scrollHeight)) + "px";
  }, [content]);

  /* ── افزودن رسانه ── */
  function addFiles(files: FileList | null) {
    if (!files || busy) return;
    const incoming = Array.from(files);
    const next: MediaItem[] = [];
    for (const f of incoming) {
      if (items.length + next.length >= MAX_FILES) {
        toast({ title: "حداکثر ۶ فایل", description: "برای هر پست حداکثر ۶ رسانه می‌توانید بفرستید.", variant: "destructive" });
        break;
      }
      const res = validateAndWrap(f);
      if (res.error) {
        toast({ title: "فایل نامعتبر", description: res.error, variant: "destructive" });
        continue;
      }
      next.push(res.item!);
    }
    if (next.length) {
      setItems((prev) => [...prev, ...next]);
      setActiveTab(next[0].kind);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeItem(key: string) {
    setItems((prev) => {
      const it = prev.find((m) => m.key === key);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((m) => m.key !== key);
    });
  }

  /* ── انتشار ── */
  async function publish() {
    if (busy) return;
    const text = content.trim();
    if (!text) {
      toast({ title: "متن خالی است", description: "یه توضیح درباره استعدادت بنویس.", variant: "destructive" });
      taRef.current?.focus();
      return;
    }
    if (!categoryId || !skillId) {
      toast({ title: "دسته‌بندی و مهارت", description: "برای پست، دسته‌بندی و مهارت مرتبط را انتخاب کن.", variant: "destructive" });
      return;
    }

    setPhase("creating");
    setStepText("در حال ثبت پست…");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ content: text, categoryId, skillId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "ثبت پست ناموفق بود");
      const postId: string = data.id;

      const pending = items;
      if (pending.length === 0) {
        setPhase("success");
        return;
      }

      setPhase("uploading");
      let failed = 0;
      for (let i = 0; i < pending.length; i++) {
        const m = pending[i];
        setStepText(`آپلود رسانه ${toFa(i + 1)} از ${toFa(pending.length)}…`);
        setItems((prev) => prev.map((x) => (x.key === m.key ? { ...x, status: "uploading", progress: 0 } : x)));
        const fd = new FormData();
        fd.append("file", m.file);
        fd.append("postId", postId);
        fd.append("type", m.kind);
        const up = await uploadWithProgress("/api/posts/upload-media", fd, (pct) => {
          setItems((prev) => prev.map((x) => (x.key === m.key ? { ...x, progress: pct } : x)));
        });
        setItems((prev) =>
          prev.map((x) => (x.key === m.key ? { ...x, status: up.ok ? "done" : "error", progress: up.ok ? 100 : x.progress } : x))
        );
        if (!up.ok) failed++;
      }
      if (failed > 0 && failed === pending.length) {
        throw new Error("آپلود همه رسانه‌ها ناموفق بود");
      }
      if (failed > 0) {
        toast({ title: "بخشی از رسانه‌ها آپلود نشد", description: `${toFa(failed)} فایل ناموفق بود؛ بقیه پست منتشر شد.` });
      }
      setPhase("success");
    } catch (e) {
      setPhase("idle");
      setStepText("");
      toast({ title: "خطا در انتشار", description: (e as Error).message, variant: "destructive" });
    }
  }

  function finish() {
    onClose();
    onPosted?.();
  }

  function goProfile() {
    onClose();
    onPosted?.();
    navigate({ view: "my-profile" });
  }

  const remaining = MAX_LEN - content.length;

  /* ═══ رندر ═══ */

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="ساخت پست جدید">
          {/* پس‌زمینه */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => !busy && onClose()}
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
          />

          {/* شیت */}
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
                       bg-card rounded-t-[30px] sm:rounded-[30px] border border-border/70
                       shadow-float overflow-hidden"
          >
            {/* نوار گرادیانی بالای شیت */}
            <div className="h-[3px] w-full grad-brand shrink-0" aria-hidden />

            {/* ── هدر (قابل درگ) ── */}
            <div
              className="shrink-0 px-4 pt-2 pb-3 flex items-center gap-3 border-b border-border/60 bg-card/95 backdrop-blur"
              style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
            >
              <span className="sm:hidden mx-auto w-11 h-1.5 rounded-full bg-border absolute left-1/2 -translate-x-1/2 top-1.5" aria-hidden />
              <div className="grid place-items-center size-10 rounded-2xl grad-brand shadow-grad shrink-0">
                <Icon name="sparkles" size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-black text-foreground leading-tight">ثبت استعداد تازه</h2>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">کارِ خودت را با جامعه همتیم به اشتراک بگذار</p>
              </div>
              <IconBtn label="بستن" variant="soft" size={40} onClick={() => !busy && onClose()} disabled={busy}>
                <Icon name="x" size={18} />
              </IconBtn>
            </div>

            {/* ── بدنه ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
              {phase === "success" ? (
                <SuccessBurst onProfile={goProfile} onClose={finish} />
              ) : userLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Sk circle className="size-11" />
                    <div className="flex-1 space-y-2"><Sk className="h-3.5 w-28" /><Sk className="h-3 w-20" /></div>
                  </div>
                  <Sk className="h-24 w-full" />
                  <Sk className="h-9 w-full" />
                </div>
              ) : !user ? (
                <LoginGate />
              ) : catsLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Sk circle className="size-11" />
                    <div className="flex-1 space-y-2"><Sk className="h-3.5 w-28" /><Sk className="h-3 w-20" /></div>
                  </div>
                  <Sk className="h-24 w-full" />
                  <Sk className="h-9 w-full" />
                  <Sk className="h-9 w-2/3" />
                </div>
              ) : myCats.length === 0 ? (
                <NoSkillsGate />
              ) : (
                <>
                  {/* ردیف کاربر */}
                  <div className="flex items-center gap-3">
                    <GradAvatar
                      name={user.name}
                      src={user.profile?.avatarUrl ?? null}
                      size="lg"
                      verified={user.isVerifiedBadge}
                      topTalent={user.isTopTalent}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-black text-foreground truncate">{user.name}</span>
                        {user.isVerifiedBadge && <VerifiedMark size={15} />}
                        {user.isTopTalent && <GoldCheckMark size={15} />}
                      </div>
                      <span className="text-[11.5px] text-muted-foreground">انتشار عمومی در همتیم</span>
                    </div>
                  </div>

                  {/* متن */}
                  <div className="relative">
                    <textarea
                      ref={taRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
                      maxLength={MAX_LEN}
                      placeholder="چه استعدادی داری؟ از آخرین کارت بگو…"
                      className="w-full min-h-24 rounded-[22px] bg-muted/60 border-[1.5px] border-border/70 p-4
                                 text-[14px] leading-7 font-medium text-foreground placeholder:text-muted-foreground/70
                                 outline-none transition-colors focus:border-primary/60 focus:bg-card resize-none"
                    />
                  </div>

                  {/* دسته‌بندی */}
                  <div>
                    <SectionTitle icon="grid" label="دسته‌بندی" required />
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

                  {/* مهارت */}
                  <div>
                    <SectionTitle icon="spark" label="مهارت" required />
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

                  {/* رسانه */}
                  <div>
                    <SectionTitle icon="image" label="رسانه‌ها" hint={`تا ${toFa(MAX_FILES)} فایل`} />
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
                        افزودن فایل
                      </motion.button>
                      {(Object.keys(KIND_LIMITS) as MediaKind[]).map((k) => (
                        <Chip key={k} active={activeTab === k} onClick={() => setActiveTab(k)}>
                          <span className="inline-flex items-center gap-1">
                            <Icon name={KIND_LIMITS[k].icon} size={14} className={activeTab === k ? "text-white" : "text-primary"} />
                            {KIND_LIMITS[k].label}
                          </span>
                        </Chip>
                      ))}
                    </div>

                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept={Object.values(KIND_LIMITS).map((k) => k.accept).join(",")}
                      className="hidden"
                      onChange={(e) => addFiles(e.target.files)}
                    />

                    {/* پیش‌نمایش‌ها */}
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

            {/* ── فوتر ── */}
            {user && phase !== "success" && myCats.length > 0 && (
              <div className="shrink-0 px-4 py-3 border-t border-border/60 bg-card/95 backdrop-blur
                              flex items-center gap-3 safe-b">
                <span
                  className={cn(
                    "text-[11px] font-extrabold nums-fa shrink-0",
                    remaining <= 50 ? "text-destructive" : remaining <= 200 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                  )}
                >
                  {toFa(remaining)}
                </span>
                <Btn
                  variant="grad"
                  size="lg"
                  className="flex-1"
                  loading={busy}
                  onClick={publish}
                  disabled={busy}
                >
                  {busy ? stepText || "در حال انتشار…" : "انتشار استعداد"}
                </Btn>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─────────── اجزای کوچک ─────────── */

function SectionTitle({ icon, label, required, hint }: { icon: string; label: string; required?: boolean; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon name={icon} size={15} className="text-primary" />
      <span className="text-[12.5px] font-black text-foreground">{label}</span>
      {required && <span className="text-rose text-[13px] font-black">*</span>}
      {hint && <span className="text-[10.5px] text-muted-foreground font-bold">({hint})</span>}
    </div>
  );
}

function SuccessBurst({ onProfile, onClose }: { onProfile: () => void; onClose: () => void }) {
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

      <h3 className="mt-5 text-lg font-black text-foreground">استعدادت منتشر شد!</h3>
      <p className="mt-2 text-[13px] text-muted-foreground leading-6 max-w-[300px]">
        پست تو هم‌اکنون در پروفایلت قابل مشاهده است و پس از تأیید مدیر، در
        <span className="font-black text-primary"> «استعدادهای برتر» </span>
        نیز به نمایش درمی‌آید.
      </p>
      <div className="mt-6 flex items-center gap-2.5 w-full max-w-xs">
        <Btn variant="grad" size="md" className="flex-1" onClick={onProfile}>
          <Icon name="user" size={17} />
          مشاهده پروفایل
        </Btn>
        <Btn variant="outline" size="md" onClick={onClose}>
          باشه
        </Btn>
      </div>
    </motion.div>
  );
}

function LoginGate() {
  return (
    <div className="py-8 flex flex-col items-center text-center">
      <div className="grid place-items-center size-20 rounded-[26px] glass-strong shadow-soft">
        <Icon name="lock" size={34} className="text-primary" />
      </div>
      <h3 className="mt-4 text-[15px] font-black text-foreground">برای اشتراک‌گذاری استعداد وارد شو</h3>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-6">
        با ورود، می‌توانی کارهای خودت را با جامعه همتیم به اشتراک بگذاری.
      </p>
      <Btn variant="grad" size="lg" className="mt-5" onClick={() => navigate({ view: "auth" })}>
        ورود / ثبت‌نام
      </Btn>
    </div>
  );
}

function NoSkillsGate() {
  return (
    <div className="py-8 flex flex-col items-center text-center">
      <div className="grid place-items-center size-20 rounded-[26px] glass-strong shadow-soft">
        <Icon name="pencil" size={32} className="text-primary" />
      </div>
      <h3 className="mt-4 text-[15px] font-black text-foreground">هنوز مهارتی ثبت نکرده‌ای</h3>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-6 max-w-[300px]">
        برای انتشار استعداد، ابتدا حداقل یک دسته‌بندی و مهارت به پروفایلت اضافه کن تا پست‌ها در مسیر درست دیده شوند.
      </p>
      <Btn variant="grad" size="lg" className="mt-5" onClick={() => navigate({ view: "edit-profile" })}>
        <Icon name="plus" size={18} />
        افزودن مهارت به پروفایل
      </Btn>
    </div>
  );
}
