"use client";

/* ═══════════════════════════════════════════════════════════
   CropDialog — دیالوگ حرفه‌ای برش تصویر (react-easy-crop)
   · آواتار: قاب دایره‌ای ۱:۱ · بنر: قاب مستطیل ۳:۱ (۱۵۰۰×۵۰۰)
   · بزرگنمایی با اسلایدر + پَن/پینچ لمسی (موبایل‌دوست)
   · بات‌شیت پایین صفحه در موبایل (درگ-هندل) / کارت وسط در دسکتاپ
   · خروجی JPEG کیفیت ۰.۹۲ با سقف عرض (۱۰۲۴ آواتار / ۱۵۰۰ بنر)
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import { Btn, IconBtn, SPRING } from "@/components/ui/atoms";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ناحیه برش بر حسب پیکسل طبیعی تصویر (خروجی react-easy-crop) */
type CropArea = { x: number; y: number; width: number; height: number };

/* ── بارگذاری تصویر با createImageBitmap + fallback به <img> ── */
async function loadImage(src: string): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      const blob = await (await fetch(src)).blob();
      return await createImageBitmap(blob);
    } catch {
      /* fallback پایین */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("تصویر قابل خواندن نیست"));
    img.src = src;
  });
}

export function CropDialog({
  open,
  onClose,
  imageFile,
  mode,
  onCropped,
}: {
  open: boolean;
  onClose: () => void;
  imageFile: File;
  mode: "avatar" | "banner";
  /** حاصل برش — JPEG با کیفیت ۰.۹۲ */
  onCropped: (blob: Blob) => void;
}) {
  const isAvatar = mode === "avatar";

  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState(true);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<CropArea | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  /* بستن با پخش انیمیشن خروج — onClose والد پس از ۲۸۰ms صدا زده می‌شود */
  function requestClose(force = false) {
    if ((busy && !force) || !visible) return;
    setVisible(false);
    window.setTimeout(onClose, 280);
  }

  /* ── چرخه حیات ObjectURL + ریست وضعیت هر بار باز شدن ── */
  React.useEffect(() => {
    if (open) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      setVisible(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setBusy(false);
      setDragY(0);
      return () => URL.revokeObjectURL(url);
    }
    setImageUrl(null);
    setVisible(false);
  }, [open, imageFile]);

  /* ── قفل اسکرول بدن + Escape ── */
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  /* ── تولید بلاب برش‌خورده (دستور استاندارد canvas) ── */
  async function generateCroppedBlob(): Promise<Blob> {
    if (!imageUrl || !croppedAreaPixels) throw new Error("ناحیه برش آماده نیست");
    const image = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    /* خروجی با رزولوشن کامل ناحیه برش؛ سقف عرض برای حجم بهینه */
    const maxWidth = isAvatar ? 1024 : 1500;
    const scale = Math.min(1, maxWidth / croppedAreaPixels.width);
    canvas.width = Math.max(1, Math.round(croppedAreaPixels.width * scale));
    canvas.height = Math.max(1, Math.round(croppedAreaPixels.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("امکان پردازش تصویر وجود ندارد");
    /* پس‌زمینه سفید — شفافیت PNG در JPEG سیاه نمی‌شود */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("ساخت تصویر برش‌خورده ناموفق بود"))),
        "image/jpeg",
        0.92
      );
    });
  }

  async function handleConfirm() {
    if (busy || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await generateCroppedBlob();
      onCropped(blob);
      requestClose(true);
    } catch (e) {
      toast({ title: "خطا در برش تصویر", description: (e as Error).message, variant: "destructive" });
      setBusy(false);
    }
  }

  const title = isAvatar ? "برش عکس پروفایل" : "برش بنر پروفایل";
  const hint = isAvatar
    ? "قاب دایره‌ای — مربع ۱:۱"
    : "نسبت ۳:۱ — استاندارد حرفه‌ای (۱۵۰۰×۵۰۰)";
  const maxZoom = isAvatar ? 4 : 3;
  const zoomPercent = Math.round(((zoom - 1) / (maxZoom - 1)) * 100); /* برای گرادیان پر شدن اسلایدر */

  return (
    <AnimatePresence>
      {visible && imageUrl && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* پس‌زمینه */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => requestClose()}
            className="absolute inset-0 bg-black/55"
          />

          {/* شیت پایین (موبایل) / کارت وسط (دسکتاپ) */}
          <motion.div
            initial={{ y: "100%", opacity: 0.6, scale: 0.98 }}
            animate={{ y: dragging ? Math.max(0, dragY) : 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0.4, transition: { duration: 0.24, ease: [0.3, 0, 0.8, 0.15] } }}
            transition={SPRING.sheet}
            className="relative w-full sm:max-w-md max-h-[92dvh] flex flex-col
                       bg-card rounded-t-[28px] sm:rounded-[28px] border border-border/70 shadow-float overflow-hidden"
          >
            <div className="h-[3px] w-full grad-brand shrink-0" aria-hidden />

            {/* هدر قابل درگ (فقط لمس هدر شیت را می‌کشد — پَن کراپر دست‌نخورده می‌ماند) */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragStart={() => setDragging(true)}
              onDrag={(_, info) => setDragY(Math.max(0, info.offset.y))}
              onDragEnd={(_, info) => {
                setDragging(false);
                setDragY(0);
                if (info.offset.y > 90 || info.velocity.y > 600) requestClose();
              }}
              className="shrink-0 relative px-4 pt-2.5 pb-3 flex items-center gap-3 border-b border-border/60 bg-card/95 backdrop-blur"
              style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
            >
              {/* درگ-هندل (موبایل) */}
              <span
                className="sm:hidden absolute left-1/2 -translate-x-1/2 top-1.5 w-11 h-1.5 rounded-full bg-border"
                aria-hidden
              />
              <div className="grid place-items-center size-10 rounded-2xl grad-brand shadow-grad shrink-0">
                <Icon name={isAvatar ? "user" : "image"} size={19} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-black text-foreground leading-tight truncate">{title}</h2>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">{hint}</p>
              </div>
              <IconBtn label="بستن" variant="soft" size={44} onClick={() => requestClose()}>
                <Icon name="x" size={18} />
              </IconBtn>
            </motion.div>

            {/* صحنه برش — پس‌زمینه تیره مثل ادیتورهای حرفه‌ای */}
            <div className="relative bg-black/90 shrink-0 overflow-hidden">
              <div className={cn("relative", isAvatar ? "h-72 sm:h-80" : "h-44 sm:h-52")}>
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  rotation={0}
                  aspect={isAvatar ? 1 : 3}
                  minZoom={1}
                  maxZoom={maxZoom}
                  cropShape={isAvatar ? "round" : "rect"}
                  objectFit="cover"
                  showGrid
                  zoomSpeed={0.35}
                  zoomWithScroll
                  restrictPosition
                  keyboardStep={1}
                  style={{}}
                  classes={{}}
                  mediaProps={{}}
                  cropperProps={{}}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              </div>
              {/* نشان نسبت روی صحنه */}
              <span
                className="absolute bottom-2.5 left-1/2 -translate-x-1/2 h-7 px-3 grid place-items-center rounded-full
                           bg-black/55 backdrop-blur text-white/90 text-[10.5px] font-bold pointer-events-none whitespace-nowrap"
                dir="ltr"
                aria-hidden
              >
                {isAvatar ? "1:1" : "3:1"}
              </span>
            </div>

            {/* بزرگنمایی */}
            <div className="shrink-0 px-4 pt-3 pb-1">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="crop-zoom" className="text-[12px] font-black text-foreground flex items-center gap-1.5">
                  <Icon name="search" size={14} className="text-primary" />
                  بزرگنمایی
                </label>
                <span className="text-[11px] font-bold text-muted-foreground nums-fa tabular-nums">
                  {toFa(zoom.toFixed(1)).replace(".", "٫")}×
                </span>
              </div>
              {/* اسلایدر LTR — راست = بزرگ‌تر (غریزه جهانی زوم) · هدف لمسی ۴۴px */}
              <input
                id="crop-zoom"
                type="range"
                dir="ltr"
                min={1}
                max={maxZoom}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="بزرگنمایی"
                disabled={busy}
                style={{
                  background: `linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary) ${zoomPercent}%, var(--color-muted) ${zoomPercent}%, var(--color-muted) 100%)`,
                  backgroundSize: "100% 6px",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
                className="w-full h-11 appearance-none bg-transparent cursor-pointer touch-none outline-none
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                  [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-card
                  [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:active:scale-110
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-[3px]
                  [&::-moz-range-thumb]:border-card [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-track]:bg-transparent"
              />
            </div>

            {/* فوتر — انصراف / اعمال */}
            <div className="shrink-0 px-4 pt-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))] flex items-center gap-2.5">
              <Btn variant="ghost" size="md" onClick={() => requestClose()} disabled={busy} className="shrink-0">
                انصراف
              </Btn>
              <Btn
                variant="grad"
                size="md"
                loading={busy}
                disabled={!croppedAreaPixels}
                onClick={handleConfirm}
                className="flex-1"
                icon={!busy ? <Icon name="check" size={16} /> : undefined}
              >
                اعمال برش
              </Btn>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
