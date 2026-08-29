"use client";

/* ═══════════════════════════════════════════════════════════
   DiscoverFilter — دکمه شناور فیلتر کشف + پنل انیمیشنی
   · FAB گرادیانی با نشان تعداد فیلترهای فعال
   · پنل با انیمیشن transform-origin از مختصات خود دکمه باز می‌شود
   · ثبت → فرم بسته و محتوا با state فیلتر در URL بازخوانی می‌شود
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/shared/icon";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { SPRING } from "@/components/ui/atoms";
import { PROVINCES, getCitiesForProvince, getProvinceName } from "@/lib/geo";
import type { CategoryWithSkills } from "@/lib/types";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DiscoverFilters = {
  categoryId: string;
  skillId: string;
  province: string;
  city: string;
  postSort: "recent" | "popular";
  userSort: "recent" | "followers";
};

export const EMPTY_FILTERS: DiscoverFilters = {
  categoryId: "",
  skillId: "",
  province: "",
  city: "",
  postSort: "recent",
  userSort: "followers",
};

export function countActive(f: DiscoverFilters): number {
  return [f.categoryId, f.skillId, f.province, f.city].filter(Boolean).length;
}

export function DiscoverFilterFab({
  cats, filters, onApply,
}: {
  cats: CategoryWithSkills[];
  filters: DiscoverFilters;
  onApply: (f: DiscoverFilters) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const fabRef = React.useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = React.useState<{ x: number; y: number }>({ x: 24, y: 0 });

  // پیش‌نویس محلی — تا ثبت اعمال نمی‌شود
  const [draft, setDraft] = React.useState<DiscoverFilters>(filters);
  React.useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openPanel() {
    // مبدأ انیمیشن: مختصات واقعی دکمه در صفحه
    const r = fabRef.current?.getBoundingClientRect();
    if (r) setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setOpen(true);
  }

  const active = countActive(draft);
  const currentCat = cats.find((c) => c.id === draft.categoryId);

  return (
    <>
      {/* ═══ FAB شناور ═══ */}
      <motion.button
        ref={fabRef}
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={SPRING.bounce}
        whileTap={{ scale: 0.9 }}
        onClick={openPanel}
        aria-label="فیلترهای کشف"
        className="fixed bottom-24 left-4 z-40 h-14 pl-4 pr-5 rounded-full grad-brand text-white shadow-glow
                   inline-flex items-center gap-2 font-extrabold text-[13px] outline-none safe-b"
      >
        <Icon name="filter" size={19} />
        فیلترها
        {active > 0 && (
          <span className="grid place-items-center size-6 rounded-full bg-white text-primary text-[11px] font-black nums-fa">
            {toFa(active)}
          </span>
        )}
      </motion.button>

      {/* ═══ پنل — باز شدن از مختصات دکمه ═══ */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="فیلترهای کشف">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
            />

            {/* کارت پنل با مبدأ transform روی دکمه — فقط transform/opacity (۶۰fps) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.12 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.15, transition: { duration: 0.2, ease: [0.3, 0, 0.8, 0.2] } }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              style={{
                position: "fixed",
                left: Math.min(origin.x, typeof window !== "undefined" ? window.innerWidth - 190 : 300),
                top: Math.max(60, origin.y - 300),
                transformOrigin: "0 300px",
              }}
              className="w-[min(92vw,420px)] max-h-[78dvh] flex flex-col bg-card rounded-[28px]
                         border border-border/70 shadow-float overflow-hidden"
            >
              <div className="h-[3px] w-full grad-brand shrink-0" aria-hidden />

              {/* هدر */}
              <div className="shrink-0 px-4 pt-3 pb-3 flex items-center gap-3 border-b border-border/60 bg-card/95 backdrop-blur">
                <div className="grid place-items-center size-10 rounded-2xl grad-brand shadow-grad shrink-0">
                  <Icon name="filter" size={19} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-black text-foreground leading-tight">فیلترهای دقیق</h2>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">نتایج را دقیق‌تر کن</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="بستن"
                  className="grid place-items-center size-10 rounded-full bg-secondary text-muted-foreground
                             hover:bg-muted hover:text-foreground transition-colors outline-none"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>

              {/* بدنه */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
                <SearchableSelect
                  label="دسته‌بندی"
                  options={cats.map((c) => ({ value: c.id, label: `${c.iconUrl || "✨"} ${c.name}` }))}
                  value={draft.categoryId}
                  onChange={(v) => {
                    setDraft((d) => ({ ...d, categoryId: v === "all" ? "" : v, skillId: "" }));
                  }}
                  allLabel="همه"
                  placeholder="انتخاب دسته‌بندی"
                />

                <SearchableSelect
                  label="مهارت"
                  options={(currentCat?.skills || []).map((s) => ({ value: s.id, label: s.name }))}
                  value={draft.skillId}
                  onChange={(v) => setDraft((d) => ({ ...d, skillId: v === "all" ? "" : v }))}
                  allLabel={draft.categoryId ? "همه" : undefined}
                  placeholder={draft.categoryId ? "انتخاب مهارت" : "ابتدا دسته‌بندی را انتخاب کنید"}
                  disabled={!draft.categoryId}
                />

                <SearchableSelect
                  label="استان"
                  options={PROVINCES.map((p) => ({ value: p.id, label: p.name }))}
                  value={draft.province}
                  onChange={(v) => setDraft((d) => ({ ...d, province: v === "all" ? "" : v, city: "" }))}
                  allLabel="همه"
                  placeholder="انتخاب استان"
                />

                <SearchableSelect
                  label="شهر"
                  options={getCitiesForProvince(draft.province).map((c) => ({ value: c, label: c }))}
                  value={draft.city}
                  onChange={(v) => setDraft((d) => ({ ...d, city: v === "all" ? "" : v }))}
                  allLabel="همه"
                  placeholder="انتخاب شهر"
                  disabled={!draft.province}
                />

                {/* مرتب‌سازی داخل پنل — صفحه تمیزتر */}
                <div className="space-y-2">
                  <p className="text-[12.5px] font-black text-foreground flex items-center gap-1.5">
                    <Icon name="clock" size={15} className="text-primary" />
                    مرتب‌سازی
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <SortOption
                      active={draft.postSort === "recent" && draft.userSort === "recent"}
                      label="جدیدترین"
                      onClick={() => setDraft((d) => ({ ...d, postSort: "recent", userSort: "recent" }))}
                    />
                    <SortOption
                      active={draft.postSort === "popular" && draft.userSort === "followers"}
                      label="محبوب‌ترین"
                      onClick={() => setDraft((d) => ({ ...d, postSort: "popular", userSort: "followers" }))}
                    />
                  </div>
                </div>

                {/* چیپ‌های فعال */}
                {active > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {draft.categoryId && currentCat && (
                      <Chip label={currentCat.name} onRemove={() => setDraft((d) => ({ ...d, categoryId: "", skillId: "" }))} />
                    )}
                    {draft.skillId && currentCat && (
                      <Chip
                        label={currentCat.skills.find((s) => s.id === draft.skillId)?.name || "مهارت"}
                        onRemove={() => setDraft((d) => ({ ...d, skillId: "" }))}
                      />
                    )}
                    {draft.province && (
                      <Chip label={getProvinceName(draft.province) || "استان"} onRemove={() => setDraft((d) => ({ ...d, province: "", city: "" }))} />
                    )}
                    {draft.city && <Chip label={draft.city} onRemove={() => setDraft((d) => ({ ...d, city: "" }))} />}
                  </div>
                )}
              </div>

              {/* فوتر */}
              <div className="shrink-0 px-4 py-3 border-t border-border/60 bg-card/95 backdrop-blur flex items-center gap-2.5 safe-b">
                <button
                  onClick={() => setDraft(EMPTY_FILTERS)}
                  className="h-12 px-4 rounded-2xl text-[13px] font-extrabold text-muted-foreground
                             hover:text-rose hover:bg-rose/5 transition-colors outline-none"
                >
                  حذف همه
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING.tap}
                  onClick={() => {
                    setOpen(false);
                    onApply(draft);
                  }}
                  className="flex-1 h-12 rounded-2xl grad-brand text-white font-extrabold text-[13.5px] shadow-grad
                             inline-flex items-center justify-center gap-2 outline-none"
                >
                  <Icon name="check" size={18} />
                  ثبت و نمایش نتایج
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SortOption({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-11 rounded-2xl text-[12.5px] font-extrabold transition-colors outline-none",
        active ? "grad-brand text-white shadow-grad" : "bg-secondary text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11.5px] font-bold">
      <span className="max-w-[110px] truncate">{label}</span>
      <button onClick={onRemove} aria-label={`حذف ${label}`} className="grid place-items-center size-5 rounded-full hover:bg-primary/15 transition-colors outline-none">
        <Icon name="x" size={11} />
      </button>
    </span>
  );
}
