"use client";

/* ═══════════════════════════════════════════════════════════
   همتیم — موتور آپلود مشترک (کامپوزر پست + فرم نمونه کار)
   · آپلود با پیشرفت واقعی (XHR)
   · انواع رسانه + محدودیت‌ها (هماهنگ با API)
   · MediaTile — کاشی پیش‌نمایش با حلقه پیشرفت/تلاش مجدد
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion } from "framer-motion";
import { toFa } from "@/lib/format";
import { Icon } from "@/components/shared/icon";
import { SPRING } from "@/components/ui/atoms";

/* ─────────── انواع و محدودیت‌ها ─────────── */

export type MediaKind = "image" | "video" | "audio" | "doc";

export type MediaItem = {
  key: string;
  file: File;
  kind: MediaKind;
  previewUrl: string | null;
  progress: number; // 0..100
  status: "pending" | "uploading" | "done" | "error";
};

export const MAX_FILES = 6;

export const KIND_LIMITS: Record<MediaKind, { mb: number; accept: string; label: string; icon: string }> = {
  image: { mb: 10, accept: "image/jpeg,image/png,image/webp,image/gif", label: "عکس", icon: "image" },
  video: { mb: 100, accept: "video/mp4,video/webm,video/quicktime", label: "ویدیو", icon: "play" },
  audio: { mb: 30, accept: "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a", label: "صدا", icon: "music" },
  doc: { mb: 20, accept: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv", label: "سند", icon: "file" },
};

export const ACCEPT_ALL = Object.values(KIND_LIMITS).map((k) => k.accept).join(",");

export function inferKind(file: File): MediaKind | null {
  const t = file.type || "";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (
    t.startsWith("text/") ||
    t.includes("pdf") ||
    t.includes("document") ||
    t.includes("sheet") ||
    t.includes("presentation") ||
    t.includes("msword") ||
    t.includes("ms-excel") ||
    t.includes("ms-powerpoint")
  )
    return "doc";
  return null;
}

export function fmtMB(bytes: number) {
  return toFa(Math.max(1, Math.round(bytes / (1024 * 1024)))) + " مگابایت";
}

/* ─────────── اعتبارسنجی + ساخت آیتم ─────────── */

export type ValidationResult = { item?: MediaItem; error?: string };

export function validateAndWrap(file: File): ValidationResult {
  const kind = inferKind(file);
  if (!kind) return { error: `فرمت «${file.name}» پشتیبانی نمی‌شود` };
  const limit = KIND_LIMITS[kind];
  if (file.size > limit.mb * 1024 * 1024) {
    return { error: `حجم «${file.name}» بیشتر از ${toFa(limit.mb)} مگابایت است` };
  }
  return {
    item: {
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      kind,
      previewUrl: kind === "image" ? URL.createObjectURL(file) : null,
      progress: 0,
      status: "pending",
    },
  };
}

/* ─────────── آپلود با پیشرفت واقعی (XHR) ─────────── */

export function uploadWithProgress(
  url: string,
  fd: FormData,
  onProgress: (pct: number) => void
): Promise<{ ok: boolean; url?: string; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.ok) resolve({ ok: true, url: data.url });
        else resolve({ ok: false, error: data.error || "آپلود ناموفق بود" });
      } catch {
        resolve({ ok: false, error: "پاسخ سرور نامعتبر بود" });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "خطای شبکه" });
    xhr.send(fd);
  });
}

/* ─────────── MediaTile — کاشی پیش‌نمایش ─────────── */

export function MediaTile({
  item, onRemove, onRetry,
}: {
  item: MediaItem;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const meta = KIND_LIMITS[item.kind];
  const uploading = item.status === "uploading";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={SPRING.bounce}
      className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border/70"
    >
      {item.previewUrl ? (
        <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full grid place-items-center p-2 text-center">
          <div className="grid place-items-center size-10 rounded-xl grad-brand shadow-grad">
            <Icon name={meta.icon} size={20} className="text-white" />
          </div>
          <p className="text-[9.5px] font-bold text-muted-foreground mt-1.5 truncate w-full" dir="ltr">
            {item.file.name}
          </p>
          <p className="text-[9px] font-bold text-muted-foreground/70 nums-fa">{fmtMB(item.file.size)}</p>
        </div>
      )}

      {/* وضعیت آپلود */}
      {uploading && (
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] grid place-items-center">
          <div className="relative w-11 h-11">
            <svg viewBox="0 0 44 44" className="w-11 h-11 -rotate-90">
              <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,.25)" strokeWidth="4" fill="none" />
              <circle
                cx="22" cy="22" r="18" stroke="#34d399" strokeWidth="4" fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - item.progress / 100)}
                style={{ transition: "stroke-dashoffset .25s linear" }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-white text-[10px] font-black nums-fa">
              {toFa(item.progress)}
            </span>
          </div>
        </div>
      )}
      {item.status === "done" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={SPRING.bounce}
          className="absolute top-1.5 right-1.5 size-6 rounded-full bg-emerald-600 grid place-items-center shadow-glow"
        >
          <Icon name="check" size={13} className="text-white" />
        </motion.div>
      )}
      {item.status === "error" && (
        <button
          onClick={onRetry}
          className="absolute inset-x-0 bottom-0 bg-rose text-white text-[9.5px] font-black text-center py-1
                     hover:brightness-110 transition-[filter] outline-none"
        >
          ناموفق — تلاش مجدد
        </button>
      )}

      {/* حذف */}
      {!uploading && (
        <button
          onClick={onRemove}
          aria-label={`حذف ${item.file.name}`}
          className="absolute top-1.5 left-1.5 size-6 rounded-full bg-black/60 text-white backdrop-blur
                     grid place-items-center hover:bg-rose transition-colors outline-none"
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </motion.div>
  );
}
