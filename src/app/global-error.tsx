"use client";

// ─── مرز خطای ریشه (جایگزین root layout می‌شود) ───
// استایل‌ها inline هستند چون globals.css در این سطح لود نمی‌شود.
// همان منطق بازیابی خودکار chunk خطاهای اینجا هم اعمال می‌شود.
import { useEffect } from "react";

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
    /importing a module script failed/i.test(msg)
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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const recoverable = shouldAutoRecover(error);
  const exhausted = retryState() >= MAX_RETRIES;

  useEffect(() => {
    if (recoverable && !exhausted) {
      bumpRetry();
      window.location.reload();
    }
  }, [recoverable, exhausted]);

  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Vazirmatn, Tahoma, sans-serif",
          background: "#ffffff",
          color: "#1a1a1a",
        }}
      >
        <div
          role="alert"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "360px",
              borderRadius: "12px",
              border: "1px solid #e5e5e5",
              padding: "20px",
              textAlign: "right",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
              {recoverable ? "خطای موقت شبکه" : "خطای برنامه"}
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#666",
                lineHeight: 1.8,
              }}
            >
              {recoverable
                ? exhausted
                  ? "اتصال شبکه پس از تلاش‌های خودکار برقرار نشد."
                  : "اتصال هنگام بارگذاری صفحه قطع شد؛ در حال تلاش مجدد خودکار…"
                : "در بارگذاری برنامه خطایی رخ داد."}
            </p>
            {recoverable && exhausted && (
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: "12px",
                  color: "#666",
                  background: "#f5f5f5",
                  borderRadius: "8px",
                  padding: "10px",
                  lineHeight: 1.8,
                }}
              >
                اگر مشکل ادامه دارد، صفحه را با «Ctrl + Shift + R» کامل تازه‌سازی
                کنید.
              </p>
            )}
            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  if (recoverable) {
                    bumpRetry();
                    window.location.reload();
                  } else {
                    reset();
                  }
                }}
                style={{
                  flex: 1,
                  height: "40px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                تلاش مجدد
              </button>
              <a
                href="/"
                style={{
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 16px",
                  borderRadius: "8px",
                  border: "1px solid #e5e5e5",
                  color: "#1a1a1a",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                خانه
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
