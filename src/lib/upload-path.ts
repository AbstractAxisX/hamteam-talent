import path from "path";

/* مسیر پایدار ذخیرهٔ فایل‌های آپلود — تاب‌پذیری استقرار standalone
   · در حالت standalone، server.js ابتدا process.chdir(__dirname) می‌کند
     (cwd = .next/standalone)؛ آن پوشه با هر build نو می‌شود، پس نوشتن
     آنجا یعنی گم‌شدن همهٔ آپلودهای کاربران بعد از هر استقرار.
   · این تابع همیشه به public/uploads «ریشهٔ پروژه» اشاره می‌کند:
       dev        → <project>/public/uploads
       standalone → <project>/public/uploads   (دو سطح بالاتر از cwd)
   · با env UPLOAD_DIR هم قابل‌تنظیم است. */

export function uploadDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  const cwd = process.cwd();
  if (cwd.endsWith(path.join(".next", "standalone"))) {
    return path.resolve(cwd, "..", "..", "public", "uploads");
  }
  return path.join(cwd, "public", "uploads");
}

/* مسیرهای کاندید برای «خواندن» (سرو کردن) فایل — برای سازگاری با
   فایل‌های قدیمی و محیط‌های مختلف، به‌ترتیب امتحان می‌شوند. */
export function uploadReadCandidates(): string[] {
  const cwd = process.cwd();
  const dirs = [
    path.join(cwd, "public", "uploads"),
    path.join(cwd, "uploads"),
    path.resolve(cwd, "..", "public", "uploads"),
    path.resolve(cwd, "..", "..", "public", "uploads"), // standalone → ریشهٔ پروژه
  ];
  return [...new Set(dirs)];
}
