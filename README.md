# همتیم — پلتفرم استعدادیابی

شبکه‌ی اجتماعی تخصصی برای کشف و نمایش استعداد در حوزه‌های هنر، ورزش، آشپزی، موسیقی، طراحی و...

ترکیبی از لینکدین (پروفایل حرفه‌ای) و دیوار (ثبت نیازمندی) با تمرکز بر **استعدادیابی**.

## ✨ ویژگی‌ها

- **پروفایل استعداد**: بیو، دسته/مهارت، رزومه (سوابق + تحصیلات)، بنر و آواتار
- **پست‌گذاری**: نمایش استعداد با دسته/مهارت مرتبط + لایک
- **کشف**: فیلترهای زنجیره‌ای (دسته ← مهارت، استان ← شهر) برای پست‌ها و کاربران
- **نیازمندی‌ها**: ثبت آگهی نیازمندی با پیوست + درخواست متنی + نوتیفیکیشن تطبیق مهارت
- **چت real-time**: پیام مستقیم با درخواست پیام برای غیر-متصلین
- **ارتباطات**: فالو دوطرفه با درخواست/تایید
- **اعلان‌ها**: دسته‌بندی‌شده (نیازمندی، ارتباط، چت، سراسری)
- **پنل ادمین**: مدیریت کاربران، دسته‌ها/مهارت‌ها، محتوا، اعلان سراسری

## 🛠 پیشنیازها

- **Node.js** 18.17 یا بالاتر
- **Bun** (runtime و package manager) — [نصب](https://bun.sh/)
- **Git**

## 🚀 نصب و اجرا

### ۱. کلون پروژه

```bash
git clone https://github.com/AbstractAxisX/hamteam-talent.git
cd hamteam-talent
```

> ⚠️ **مهم**: حتماً ترمینال را **داخل پوشه `hamteam-talent`** باز کنید، نه پوشه والد (مثلاً `Documents\GitHub`). اجرای دستورات از پوشه والد باعث خطاهای عجیب و غریب بیلد می‌شود.

### ۲. نصب وابستگی‌ها

```bash
bun install
```

> اگر از `npm` استفاده می‌کنید: `npm install` (ولی bun توصیه می‌شود)

### ۳. تنظیم متغیرهای محیطی

فایل `.env` از قبل در ریپازیتوری کامیت شده و **مسیر نسبی قابل حمل** دارد:

```env
DATABASE_URL="file:../db/custom.db"
SESSION_SECRET="hamteam-dev-secret-change-me-in-production"
```

> 💡 مسیر `file:../db/custom.db` نسبت به پوشه `prisma/` resolve می‌شود و به `db/custom.db` در ریشه پروژه اشاره می‌کند. این دیتابیس شامل داده‌ی نمونه (کاربران، پست‌ها، دسته‌بندی‌ها و اکانت ادمین) است و روی **همه سیستم‌عامل‌ها** (ویندوز / مک / لینوکس) بدون تغییر کار می‌کند.

### ۴. اجرای پروژه

```bash
bun run dev
```

این دستور اول schema را با دیتابیس sync می‌کند (`prisma db push`) و بعد سرور را روی پورت ۳۰۰۰ بالا می‌آورد.

سپس به `http://localhost:3000` بروید.

### ۵. (اختیاری) اجرای seed برای داده‌ی نمونه بیشتر

اگر دیتابیس خالی است (یا داده‌ی نمونه نمی‌بینید):

```bash
# بعد از اجرای dev server:
curl http://localhost:3000/api/seed
```

یا در مرورگر آدرس `http://localhost:3000/api/seed` را باز کنید.

### ۶. اجرای سرویس چت (real-time)

چت real-time از یک mini-service مجزای socket.io استفاده می‌کند:

```bash
cd mini-services/chat-service
bun install
bun run dev
```

این سرویس روی پورت ۳۰۰۳ اجرا می‌شود.

## 🔑 ورود به پنل ادمین

1. ابتدا پروژه را اجرا کنید: `bun run dev`
2. در مرورگر به آدرس زیر بروید: **`http://localhost:3000/#/admin`**
3. وارد کنید:

| فیلد | مقدار |
|---|---|
| نام کاربری | `admin` |
| رمز عبور | `admin123` |

> 💡 اگر دیتابیس خالی باشد، هنگام اولین ورود، اکانت ادمین **به‌صورت خودکار** ساخته می‌شود — پس ورود به پنل ادمین همیشه ممکن است.

### حساب‌های دموی کاربران

| نقش | موبایل | کد تایید |
|---|---|---|
| کاربر | هر شماره موبایل معتبر | `1234` |

## 🔧 رفع اشکال (Troubleshooting)

### خطا: `Can't resolve 'tailwindcss'` (ویندوز)

این خطا یعنی ویندوز نمی‌تواند پکیج tailwindcss را پیدا کند. **سه علت رایج:**

#### علت ۱: وجود فایل `package.json` اضافی در پوشه کاربر (شایع‌ترین علت!)

اگر در لاگ خطا این پیام را می‌بینید:

```
using description file: C:\Users\<نام‌کاربری>\package.json
```

یعنی یک فایل `package.json` سرگردان در پوشه کاربری ویندوز شما وجود دارد که resolver را گمراه می‌کند.

**راه‌حل (PowerShell):**

```powershell
# اول محتوایش را ببینید (اطمینان حاصل کنید مهم نیست):
type C:\Users\<نام‌کاربری>\package.json

# بعد پاکش کنید:
del C:\Users\<نام‌کاربری>\package.json
```

#### علت ۲: اجرای دستور از پوشه اشتباه

همیشه مطمئن شوید داخل پوشه پروژه هستید:

```powershell
cd C:\Users\<نام‌کاربری>\Documents\GitHub\hamteam-talent
bun run dev
```

نه داخل `Documents\GitHub` و نه پوشه‌ی دیگر.

#### علت ۳: نصب ناقص وابستگی‌ها (node_modules خراب)

نصب تمیز انجام دهید — **PowerShell (ویندوز):**

```powershell
cd C:\Users\<نام‌کاربری>\Documents\GitHub\hamteam-talent
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
bun install
bun run dev
```

**macOS / Linux:**

```bash
cd hamteam-talent
rm -rf node_modules package-lock.json
bun install
bun run dev
```

### خطا: دیتابیس یا Prisma

- اگر خطای `P2021` یا `unable to open database file` گرفتید، فایل `.env` را چک کنید — باید `DATABASE_URL="file:../db/custom.db"` باشد (مسیر نسبی، نه مطلق).
- برای sync دستی schema: `bun run db:push`

### اسکریپت‌ها

```bash
bun run dev        # اجرای dev server (sync دیتابیس + پورت ۳۰۰۰)
bun run lint       # بررسی کد با ESLint
bun run db:push    # اعمال schema به دیتابیس
bun run db:generate # تولید Prisma Client
```

> 💡 توجه: دستور `bun run dev` روی همه پکیج‌منیجرها (npm و bun) کار می‌کند، چون sync دیتابیس داخل خود اسکریپت dev انجام می‌شود (bun اسکریپت‌های `pre`/`post` را اجرا نمی‌کند).

## 🏗 ساختار پروژه

```
src/
├── app/                  # Next.js App Router (API routes + pages)
│   ├── api/              # API routes
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # ورودی (hash-routed)
├── components/
│   ├── views/            # صفحه‌ها (feed, profile, chat, ...)
│   ├── shared/           # کامپوننت‌های مشترک
│   └── ui/               # shadcn/ui components
├── lib/                  # auth, db, nav, utils
mini-services/
└── chat-service/         # socket.io real-time chat (پورت ۳۰۰۳)
prisma/
└── schema.prisma         # مدل‌های دیتابیس
db/
└── custom.db             # دیتابیس SQLite (با داده‌ی نمونه + اکانت ادمین)
```

## 🎨 تکنولوژی‌ها

- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui**
- **Prisma ORM** + SQLite
- **Framer Motion** (انیمیشن‌ها)
- **Socket.io** (چت real-time)
- **Zustand** (state management)

## 📱 توجه

این پروژه **موبایل-اول** طراحی شده است. تجربه‌ی کاربری برای موبایل بهینه شده و در دسکتاپ نیز قابل استفاده است.

---

© ۱۴۰۳ همتیم
