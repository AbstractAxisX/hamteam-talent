"use client";

/* ═══════════════════════════════════════════════════════════
   MediaPlayer — رندرکننده چندرسانه‌ای بر اساس نوع فایل
   image → تصویر تنبل · video → پلیر بومی · audio → پلیر فشرده
   doc → کارت سند (PDF داخل iframe) — بدون کتابخانه سنگین
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

export type MediaFile = {
  url: string;
  type: string; // image | video | audio | doc
  fileName?: string | null;
};

function fmtName(name?: string | null) {
  return name || "فایل";
}

/* ─────────── تصویر ─────────── */

function ImagePlayer({ url, fileName }: { url: string; fileName?: string | null }) {
  return (
    <img
      src={url}
      alt={fmtName(fileName)}
      loading="lazy"
      decoding="async"
      className="w-full h-full object-cover"
    />
  );
}

/* ─────────── ویدیو — پلیر بومی با پوسته ─────────── */

function VideoPlayer({ url, fileName }: { url: string; fileName?: string | null }) {
  return (
    <div className="relative w-full h-full bg-black/90">
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        aria-label={fmtName(fileName)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

/* ─────────── صدا — پلیر فشردهٔ سفارشی ─────────── */

function AudioPlayer({ url, fileName }: { url: string; fileName?: string | null }) {
  const ref = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnd = () => setPlaying(false);
    el.addEventListener("ended", onEnd);
    el.addEventListener("pause", () => setPlaying(false));
    el.addEventListener("play", () => setPlaying(true));
    return () => el.removeEventListener("ended", onEnd);
  }, []);

  return (
    <div
      className="w-full h-full flex items-center gap-3 p-4"
      style={{ background: "linear-gradient(135deg,#065f46 0%,#0f766e 60%,#14b8a6 100%)" }}
    >
      <button
        onClick={() => ref.current?.paused ? ref.current.play() : ref.current?.pause()}
        aria-label={playing ? "توقف" : "پخش"}
        className="grid place-items-center size-12 rounded-full bg-white/20 backdrop-blur border border-white/30
                   text-white shrink-0 hover:bg-white/30 transition-colors outline-none"
      >
        <Icon name={playing ? "pause" : "play"} size={22} />
      </button>
      <div className="flex-1 min-w-0 text-white">
        <p className="text-[12.5px] font-black truncate">{fmtName(fileName)}</p>
        <p className="text-[10.5px] text-emerald-100/80 font-bold mt-0.5">فایل صوتی</p>
      </div>
      <audio ref={ref} src={url} preload="metadata" className="hidden" />
    </div>
  );
}

/* ─────────── سند — PDF داخل iframe، بقیه کارت دانلود ─────────── */

function DocPlayer({ url, fileName }: { url: string; fileName?: string | null }) {
  const isPdf = url.toLowerCase().includes(".pdf");
  const [preview, setPreview] = React.useState(false);

  if (isPdf && preview) {
    return (
      <div className="relative w-full h-full bg-muted">
        <iframe src={url} title={fmtName(fileName)} className="w-full h-full border-0" />
        <button
          onClick={() => setPreview(false)}
          className="absolute top-2 left-2 z-10 h-9 px-3 rounded-full glass-strong text-foreground
                     text-[11px] font-black shadow-soft outline-none"
        >
          بستن پیش‌نمایش
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full grid place-items-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="grid place-items-center size-14 rounded-[20px] grad-brand shadow-grad">
          <Icon name="file" size={26} className="text-white" />
        </div>
        <p className="text-[11.5px] font-black text-foreground max-w-[160px] truncate" dir="ltr">
          {fmtName(fileName)}
        </p>
        <div className="flex items-center gap-1.5">
          {isPdf && (
            <button
              onClick={() => setPreview(true)}
              className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-[10.5px] font-black
                         hover:brightness-110 transition-[filter] outline-none"
            >
              پیش‌نمایش
            </button>
          )}
          <a
            href={url}
            download={fmtName(fileName)}
            className="h-8 px-3 rounded-full border-[1.5px] border-border bg-card text-foreground
                       text-[10.5px] font-black inline-flex items-center gap-1 hover:bg-muted transition-colors"
          >
            <Icon name="download" size={13} />
            دانلود
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────── دیسپچر ─────────── */

export function MediaPlayer({ file, className }: { file: MediaFile; className?: string }) {
  let inner: React.ReactNode;
  switch (file.type) {
    case "image":
      inner = <ImagePlayer url={file.url} fileName={file.fileName} />;
      break;
    case "video":
      inner = <VideoPlayer url={file.url} fileName={file.fileName} />;
      break;
    case "audio":
      inner = <AudioPlayer url={file.url} fileName={file.fileName} />;
      break;
    default:
      inner = <DocPlayer url={file.url} fileName={file.fileName} />;
  }
  return <div className={cn("w-full h-full overflow-hidden", className)}>{inner}</div>;
}
