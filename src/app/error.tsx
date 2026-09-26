"use client";

// ─── مرز خطای اپ ───
// خطاهای «بارگذاری chunk» (شبکه‌ی ناپایدار/ری‌استارت لحظه‌ای سرور) به‌صورت
// خودکار با یک reload بازیابی می‌شوند (حداکثر ۲ بار در ۱۰ دقیقه — بدون حلقه).
// بقیهٔ خطاها: کارت خطای کلاسیک با «تلاش مجدد» و «بازگشت به خانه».
import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

const RELOAD_KEY = "frs-chunk-retry";
const WINDOW_MS = 10 * 60 * 1000;
const MAX_RETRIES = 2;

function shouldAutoRecover(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null | undefined;
  const name = String(e?.name || "");
  const msg = String(e?.message || "");
  return (
    name === "ChunkLoadError" ||
    /failed to load chunk/i.test(msg) ||
    /loading (css )?chunk .*(failed|error)/i.test(msg) ||
    /dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg) ||
    (/networkerror/i.test(name) && /chunk|module|import/i.test(msg))
  );
}

function retryState(): number {
  try {
    const raw = sessionStorage.getItem(RELOAD_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { count: number; at: number };
    if (!Number.isFinite(parsed.count) || Date.now() - parsed.at > WINDOW_MS) return 0;
    return parsed.count;
  } catch {
    return 0;
  }
}

function bumpRetry() {
  try {
    sessionStorage.setItem(
      RELOAD_KEY,
      JSON.stringify({ count: retryState() + 1, at: Date.now() })
    );
  } catch {
    /* private mode — ignore */
  }
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const recoverable = shouldAutoRecover(error);
  const exhausted = retryState() >= MAX_RETRIES;
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (recoverable && !exhausted) {
      bumpRetry();
      window.location.reload();
    }
  }, [recoverable, exhausted]);

  const handleRetry = () => {
    if (recoverable) {
      bumpRetry();
      setRetrying(true);
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div
      dir="rtl"
      className="flex min-h-[60vh] items-center justify-center p-4"
      role="alert"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-xl border bg-background p-5 text-right shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-5 w-5 text-foreground/70" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-bold">
              {recoverable ? "خطای موقت شبکه" : "مشکلی پیش آمد"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {recoverable
                ? exhausted
                  ? "اتصال شبکه پس از تلاش‌های خودکار برقرار نشد."
                  : "اتصال هنگام بارگذاری صفحه قطع شد؛ در حال تلاش مجدد خودکار…"
                : "در نمایش این بخش خطایی رخ داد."}
            </p>
          </div>
        </div>

        {recoverable && exhausted && (
          <p className="mt-3 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
            اگر مشکل ادامه دارد، یک‌بار صفحه را با «Ctrl + Shift + R» به‌طور کامل
            تازه‌سازی کنید.
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {retrying ? (
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            تلاش مجدد
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Home className="h-4 w-4" aria-hidden />
            خانه
          </a>
        </div>
      </div>
    </div>
  );
}
