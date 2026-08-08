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

### ۲. نصب وابستگی‌ها

```bash
bun install
```

### ۳. تنظیم متغیرهای محیطی

فایل `.env` در ریشه بسازید:

```env
DATABASE_URL="file:./db/custom.db"
SESSION_SECRET="your-random-secret-string-here"
```

### ۴. راه‌اندازی دیتابیس

```bash
bun run db:push
```

### ۵. اجرای seed (داده‌ی نمونه + اکانت ادمین)

```bash
# بعد از اجرای dev server، به این آدرس بروید:
# http://localhost:3000/api/seed
```

یا با curl:

```bash
curl http://localhost:3000/api/seed
```

این کار ۲۰ دسته‌بندی استعداد + مهارت‌ها + اکانت ادمین + کاربران نمونه را می‌سازد.

### ۶. اجرای پروژه

```bash
bun run dev
```

سپس به `http://localhost:3000` بروید.

### ۷. اجرای سرویس چت (real-time)

چت real-time از یک mini-service مجزای socket.io استفاده می‌کند:

```bash
cd mini-services/chat-service
bun install
bun run dev
```

این سرویس روی پورت ۳۰۰۳ اجرا می‌شود.

## 🔑 حساب‌های دمو

| نقش | موبایل | کد تایید |
|---|---|---|
| کاربر | هر شماره موبایل معتبر | `1234` |
| ادمین | (ورود جداگانه در `#/admin`) | نام کاربری: `admin` / رمز: `admin123` |

## 📜 اسکریپت‌ها

```bash
bun run dev        # اجرای dev server (پورت ۳۰۰۰)
bun run lint       # بررسی کد با ESLint
bun run db:push    # اعمال schema به دیتابیس
bun run db:generate # تولید Prisma Client
```

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
└── chat-service/         # socket.io real-time chat (پورت ۳۰۳۳)
prisma/
└── schema.prisma         # مدل‌های دیتابیس
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
