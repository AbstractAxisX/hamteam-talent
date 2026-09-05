"use client";

/* ═══════════════════════════════════════════════════════════
   BannerSlider — اسلایدر بنرها و تبلیغات صفحه اصلی
   · embla + پخش خودکار ۴ ثانیه (توقف هنگام هاور)
   · 🔧 ریشه‌ی «فقط یک اسلاید»: اسلایدها بعد از fetch رندر می‌شوند و
     موتور embla باید reInit شود — وگرنه نه autoplay روشن می‌شود نه درگ
   · سایز پیشنهادی بنر: ۱۶۰۰×۵۰۰ پیکسل (نسبت ۳.۲:۱، محتوا در مرکز)
   ═══════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { apiPost, api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";
import type { BannerPublic } from "@/lib/types";

export function BannerSlider({ className }: { className?: string }) {
  const [banners, setBanners] = useState<BannerPublic[] | null>(null);
  const [index, setIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", direction: "rtl", containScroll: "trimSnaps" },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  useEffect(() => {
    api<{ banners: BannerPublic[] }>("/api/banners?placement=hero")
      .then((d) => setBanners(d.banners || []))
      .catch(() => setBanners([]));
  }, []);

  // 🔧 بنرها async لود می‌شوند → ویوپورت embla بعد از mount اولیه ساخته می‌شود؛
  // بدون reInit موتور خالی می‌ماند (باقی اسلایدها هیچ‌وقت نمایش داده نمی‌شوند)
  useEffect(() => {
    if (!emblaApi || !banners || banners.length === 0) return;
    emblaApi.reInit();
    setIndex(0);
  }, [emblaApi, banners]);

  // sync active dot
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const onBannerClick = useCallback(
    async (b: BannerPublic) => {
      try {
        // ثبت کلیک؛ ناوبری را منتظر نمی‌مانیم که UX سریع بماند
        apiPost(`/api/banners/${b.id}/click`).catch(() => {});
      } catch { /* ignore */ }
      if (!b.linkUrl) return;
      if (b.linkUrl.startsWith("#/")) {
        // مسیر داخلی — از روتر هش استفاده کن
        window.location.hash = b.linkUrl.slice(1);
        // sync دستی zustand (hashchange خودش fire می‌شود)
      } else if (/^https?:\/\//.test(b.linkUrl)) {
        window.open(b.linkUrl, "_blank", "noopener,noreferrer");
      }
    },
    []
  );

  if (banners === null || banners.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <div
        className="relative overflow-hidden rounded-3xl border border-border/60 shadow-soft bg-muted/30"
        role="region"
        aria-label="بنرها و تبلیغات"
      >
        {/* embla v8 = ساختار دو لایه: ویوپورت (ref) > کانتینر (transform) > اسلایدها */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
          {banners.map((b) => (
            <button
              key={b.id}
              onClick={() => onBannerClick(b)}
              className="relative shrink-0 w-full h-40 sm:h-48 md:h-56 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-3xl"
              aria-label={b.title}
            >
              {/* تصویر — ۱۶۰۰×۵۰۰ توصیه می‌شود، محتوای مهم در مرکز */}
              <img
                src={b.imageUrl}
                alt={b.title}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] rounded-3xl"
              />
              {/* گرادیان خوانایی */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-3xl"
                style={{
                  background:
                    "linear-gradient(80deg, rgba(4,18,12,.78) 0%, rgba(4,18,12,.42) 45%, rgba(4,18,12,.05) 100%)",
                }}
              />
              {/* متن */}
              <span className="absolute inset-y-0 right-0 flex flex-col justify-center gap-1.5 pr-5 md:pr-7 max-w-[75%] text-right">
                {b.subtitle && (
                  <span className="text-[10.5px] md:text-[11px] font-bold text-emerald-300/90 tracking-wide">
                    {b.subtitle}
                  </span>
                )}
                <span className="text-base md:text-xl font-black text-white leading-tight line-clamp-2 drop-shadow-sm">
                  {b.title}
                </span>
                {b.linkUrl && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] md:text-xs font-bold text-white/85 bg-white/12 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
                    مشاهده
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.6}>
                      <path d="M14 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </span>
            </button>
          ))}
          </div>
        </div>

        {/* دات‌ها — فقط وقتی بیش از یک بنر */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={(e) => {
                  e.stopPropagation();
                  emblaApi?.scrollTo(i);
                }}
                aria-label={`بنر ${toFa(i + 1)}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index
                    ? "w-6 bg-white shadow-sm"
                    : "w-1.5 bg-white/45 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
