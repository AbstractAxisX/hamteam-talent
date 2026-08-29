"use client";

/* ═══════════════════════════════════════════════════════════
   PortfolioTab — تب نمونه کارهای پروفایل
   · گرید مربعی ۳ستونی (سبک اکسپلور) با لایک + نمایش تعداد
   · FAB «افزودن نمونه کار» فقط برای خود کاربر هنگام ورود به تب
   · نمایشگر تمام‌صفحه با پخش‌کننده متناسب نوع فایل
   · کامنت ندارد؛ لایک دارد (کلیک عدد → شیت لایک‌کنندگان)
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { toFa, timeAgoFa } from "@/lib/format";
import { Icon } from "@/components/shared/icon";
import { MediaPlayer, type MediaFile } from "@/components/shared/media-player";
import { LikersSheet, portfolioLikersFetcher } from "@/components/shared/likers-sheet";
import { PortfolioFormSheet } from "@/components/portfolio/portfolio-form";
import { IconBtn, Sk, SPRING } from "@/components/ui/atoms";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PortfolioMediaDto = { id: string; url: string; type: string; fileName?: string | null; fileSize?: number };

export type PortfolioItemDto = {
  id: string;
  title: string;
  description: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  skillName: string | null;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  media: PortfolioMediaDto[];
};

const TYPE_ICON: Record<string, string> = { image: "image", video: "play", audio: "music", doc: "file" };

export function PortfolioTab({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  const { user } = useUser();
  const [items, setItems] = React.useState<PortfolioItemDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [fabOpen, setFabOpen] = React.useState(false);
  const [viewer, setViewer] = React.useState<PortfolioItemDto | null>(null);
  const [likersFor, setLikersFor] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    api<{ items: PortfolioItemDto[] }>(`/api/portfolio?userId=${userId}`)
      .then((d) => setItems(d.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  /* لایک بهینه بدون رفرش کل لیست */
  function toggleLike(item: PortfolioItemDto) {
    if (!user) {
      toast({ title: "برای لایک وارد شو" });
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, likedByMe: !it.likedByMe, likeCount: it.likeCount + (it.likedByMe ? -1 : 1) }
          : it
      )
    );
    setViewer((v) =>
      v && v.id === item.id
        ? { ...v, likedByMe: !v.likedByMe, likeCount: v.likeCount + (v.likedByMe ? -1 : 1) }
        : v
    );
    fetch(`/api/portfolio/${item.id}/like`, { method: "POST", credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.liked === "boolean") {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, likedByMe: d.liked, likeCount: Math.max(0, it.likeCount + (d.liked ? (item.likedByMe ? 0 : 1) : item.likedByMe ? -1 : 0)) }
                : it
            )
          );
        }
      })
      .catch(() => {
        // بازگشت به حالت قبل در خطا
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, likedByMe: item.likedByMe, likeCount: item.likeCount } : it))
        );
        toast({ title: "لایک ناموفق بود", variant: "destructive" });
      });
  }

  async function deleteItem(item: PortfolioItemDto) {
    try {
      const res = await fetch(`/api/portfolio/${item.id}`, { method: "DELETE", credentials: "same-origin" });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || "حذف ناموفق بود");
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      setViewer(null);
      toast({ title: "نمونه کار حذف شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="relative">
      {/* گرید اکسپلوری */}
      {loading ? (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Sk key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="py-10 flex flex-col items-center text-center">
          <Icon name="alert" size={30} className="text-destructive" />
          <p className="mt-3 text-[13px] font-black text-foreground">دریافت نمونه کارها ناموفق بود</p>
          <button
            onClick={load}
            className="mt-4 h-11 px-5 rounded-2xl grad-brand text-white font-extrabold text-sm shadow-grad outline-none"
          >
            تلاش مجدد
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 flex flex-col items-center text-center px-4">
          <div className="grid place-items-center size-20 rounded-[26px] glass-strong shadow-soft">
            <Icon name="image" size={30} className="text-primary" />
          </div>
          <h3 className="mt-4 text-[15px] font-black text-foreground">
            {isSelf ? "هنوز نمونه کاری نداری" : "هنوز نمونه کاری ثبت نشده"}
          </h3>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-6 max-w-[300px]">
            {isSelf
              ? "کارهای برجسته‌ات را با هر نوع فایل (ویدیو، آهنگ، سند و…) اینجا جمع کن تا همه ببینند."
              : "به‌محض ثبت اولین نمونه کار اینجا نمایش داده می‌شود."}
          </p>
          {isSelf && (
            <button
              onClick={() => setFabOpen(true)}
              className="mt-5 h-12 px-6 rounded-2xl grad-brand text-white font-extrabold text-sm shadow-grad
                         inline-flex items-center gap-2 outline-none"
            >
              <Icon name="plus" size={18} />
              افزودن نمونه کار
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {items.map((item, i) => {
            const cover = item.media[0];
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i, 9) * 0.03, ...SPRING.bounce }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewer(item)}
                className="relative aspect-square rounded-xl overflow-hidden bg-muted group outline-none"
                aria-label={`نمونه کار ${item.title}`}
              >
                {cover?.type === "image" ? (
                  <img src={cover.url} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full grid place-items-center"
                    style={{ background: `linear-gradient(150deg, ${item.categoryColor || "#065f46"}33, ${item.categoryColor || "#065f46"}66)` }}
                  >
                    <div className="grid place-items-center size-9 rounded-2xl grad-brand shadow-grad">
                      <Icon name={TYPE_ICON[cover?.type || "doc"] || "file"} size={18} className="text-white" />
                    </div>
                  </div>
                )}
                {/* نشان نوع + تعداد لایک */}
                <span className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/45 backdrop-blur text-white grid place-items-center">
                  <Icon name={TYPE_ICON[cover?.type || "doc"] || "file"} size={12} />
                </span>
                <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/45 backdrop-blur text-white px-2 py-0.5 text-[10px] font-black nums-fa">
                  <Icon name="heart" size={11} className={item.likedByMe ? "text-rose-400 fill-current" : ""} />
                  {toFa(item.likeCount)}
                </span>
                {item.media.length > 1 && (
                  <span className="absolute bottom-1.5 right-1.5 text-white/90 text-[10px] font-black drop-shadow">
                    <Icon name="grid" size={12} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* FAB شناور — فقط خود کاربر، هنگام حضور در این تب */}
      {isSelf && items.length > 0 && (
        <motion.button
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={SPRING.bounce}
          whileTap={{ scale: 0.9 }}
          onClick={() => setFabOpen(true)}
          aria-label="افزودن نمونه کار جدید"
          /* بالای دکمه‌ی چت (۸۰ + ۵۶ + ۱۲) تا روی آن نیفتد */
          className="fixed left-4 z-40 bottom-[calc(env(safe-area-inset-bottom,0px)+148px)] md:bottom-24
                     h-14 pl-4 pr-5 rounded-full grad-brand text-white shadow-glow
                     inline-flex items-center gap-2 font-extrabold text-[13px] outline-none safe-b"
        >
          <Icon name="plus" size={20} />
          نمونه کار جدید
        </motion.button>
      )}

      {/* نمایشگر تمام‌صفحه */}
      <PortfolioViewer
        item={viewer}
        onClose={() => setViewer(null)}
        onToggleLike={() => viewer && toggleLike(viewer)}
        onOpenLikers={(id) => setLikersFor(id)}
        isSelf={isSelf}
        onDelete={() => viewer && deleteItem(viewer)}
      />

      {/* شیت لایک‌کنندگان */}
      <LikersSheet
        open={!!likersFor}
        onClose={() => setLikersFor(null)}
        title="لایک‌کنندگان نمونه کار"
        fetcher={likersFor ? portfolioLikersFetcher(likersFor) : async () => ({ users: [], hasMore: false })}
        emptyTitle="هنوز لایکی ثبت نشده"
        emptyDesc="اولین لایک را تو بزن!"
      />

      {/* فرم افزودن */}
      <PortfolioFormSheet open={fabOpen} onClose={() => setFabOpen(false)} onCreated={load} />
    </div>
  );
}

/* ─────────── نمایشگر تمام‌صفحه ─────────── */

function PortfolioViewer({
  item, onClose, onToggleLike, onOpenLikers, isSelf, onDelete,
}: {
  item: PortfolioItemDto | null;
  onClose: () => void;
  onToggleLike: () => void;
  onOpenLikers: (id: string) => void;
  isSelf: boolean;
  onDelete: () => void;
}) {
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (item) setIdx(0);
  }, [item]);

  React.useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.min(i + 1, (item.media.length || 1) - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
        >
          {/* هدر */}
          <div className="shrink-0 px-3 pt-3 pb-2 flex items-center gap-2.5 text-white">
            <IconBtn label="بستن" variant="dark-chip" size={44} onClick={onClose}>
              <Icon name="x" size={20} />
            </IconBtn>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-black truncate">{item.title}</h3>
              <p className="text-[11px] text-white/60 nums-fa">
                {item.categoryIcon || ""} {item.categoryName}
                {item.skillName ? ` · ${item.skillName}` : ""} · {timeAgoFa(item.createdAt)}
              </p>
            </div>
            {isSelf && (
              <IconBtn label="حذف نمونه کار" variant="dark-chip" size={44} onClick={onDelete}>
                <Icon name="trash" size={19} className="text-rose-400" />
              </IconBtn>
            )}
          </div>

          {/* رسانه */}
          <div className="flex-1 min-h-0 relative flex items-center justify-center px-2">
            <div className="w-full max-w-lg h-full max-h-[70dvh] rounded-[24px] overflow-hidden bg-black/60 border border-white/10">
              <MediaPlayer file={(item.media[idx] || item.media[0]) as MediaFile} />
            </div>

            {/* ناوبری چندرسانه‌ای */}
            {item.media.length > 1 && (
              <>
                <NavArrow dir="right" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))} />
                <NavArrow dir="left" disabled={idx === item.media.length - 1} onClick={() => setIdx((i) => Math.min(item.media.length - 1, i + 1))} />
                <div className="absolute bottom-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2.5 py-1.5">
                  {item.media.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => setIdx(i)}
                      aria-label={`فایل ${toFa(i + 1)}`}
                      className={cn(
                        "size-2 rounded-full transition-colors outline-none",
                        i === idx ? "bg-white scale-110" : "bg-white/35 hover:bg-white/60"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* فوتر: توضیح + لایک */}
          <div className="shrink-0 px-4 pb-4 pt-2 space-y-2.5 max-h-[26dvh] overflow-y-auto">
            {item.description && (
              <p className="text-[13px] leading-7 text-white/85 text-center">{item.description}</p>
            )}
            <div className="flex items-center justify-center gap-2">
              <motion.button
                whileTap={{ scale: 0.88 }}
                transition={SPRING.tap}
                onClick={onToggleLike}
                aria-label={item.likedByMe ? "حذف لایک" : "لایک"}
                className={cn(
                  "h-11 px-5 rounded-full inline-flex items-center gap-2 text-[13px] font-extrabold transition-colors outline-none",
                  item.likedByMe
                    ? "bg-rose text-white shadow-[0_8px_24px_rgba(244,63,94,.4)]"
                    : "bg-white/12 text-white border border-white/20 hover:bg-white/20"
                )}
              >
                <Icon name="heart" size={17} className={item.likedByMe ? "fill-current" : ""} />
                {item.likedByMe ? "لایک شد" : "لایک"}
              </motion.button>
              <button
                onClick={() => onOpenLikers(item.id)}
                className="h-11 px-4 rounded-full bg-white/12 border border-white/20 text-white/90 text-[12.5px]
                           font-bold inline-flex items-center gap-1.5 hover:bg-white/20 transition-colors nums-fa outline-none"
              >
                <Icon name="users" size={15} />
                {toFa(item.likeCount)} لایک‌کننده
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavArrow({ dir, disabled, onClick }: { dir: "left" | "right"; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "بعدی" : "قبلی"}
      className="absolute top-1/2 -translate-y-1/2 size-11 rounded-full bg-black/50 backdrop-blur border border-white/15
                 text-white grid place-items-center hover:bg-black/70 transition-colors outline-none
                 disabled:opacity-25 disabled:pointer-events-none"
      style={dir === "right" ? { right: 8 } : { left: 8 }}
    >
      <Icon name={dir === "left" ? "chevronLeft" : "chevronRight"} size={20} />
    </button>
  );
}
