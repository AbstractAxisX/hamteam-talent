// Seed «چهره‌یاب» — سیستم استعدادیابی (دموی کامل)
// اجرا: bun scripts/seed-scouts.ts
//
// 1) دو چهره‌یاب تأییدشده (آژانس آرتا + کانون نگین) با پروفایل + درخواست approved
// 2) یک درخواست چهره‌یابی در انتظار (استعدادیاب پارس)
// 3) نیازمندی‌های استعدادیابی از چهره‌یاب‌ها
// 4) درخواست مستقیم چهره برتر (سارا — source=user)
// 5) معرفی چهره‌یاب (آرتا → علی شریفی — source=scout)
import { db } from "../src/lib/db";

const SCOUTS: {
  phone: string;
  name: string;
  bio: string;
  province: string;
  city: string;
  nationalCode: string;
  description: string;
  cardUrl: string;
}[] = [
  {
    phone: "09121110021",
    name: "آژانس استعدادیابی آرتا",
    bio: "آژانس کشف و پرورش استعداد در حوزهٔ موسیقی، اجرا و رسانه — ۱۲ سال سابقه",
    province: "تهران",
    city: "تهران",
    nationalCode: "0076451236",
    description:
      "آژانس آرتا از سال ۱۳۹۲ در حوزهٔ کشف استعدادهای موسیقی و اجرا فعال است. تاکنون بیش از ۴۰ هنرمند جوان را به بازار حرفه‌ای معرفی کرده‌ایم و به دنبال چهره‌های تازه برای پروژه‌های امسال هستیم.",
    cardUrl: "/uploads/demo-scout-card-1.svg",
  },
  {
    phone: "09121110022",
    name: "کانون فرهنگی و هنری نگین",
    bio: "کانون استعدادیابی هنرهای نمایشی و سینما — برگزارکنندهٔ جشنوارهٔ استعداد نو",
    province: "اصفهان",
    city: "اصفهان",
    nationalCode: "1082345671",
    description:
      "کانون نگین با تمرکز روی هنرهای نمایشی، گویندگی و سینما هر سال جشنوارهٔ «استعداد نو» را برگزار می‌کند. از طریق فرصتینو به دنبال کشف چهره‌های برتر برای تولیدات جدید کانون هستیم.",
    cardUrl: "/uploads/demo-scout-card-2.svg",
  },
];

const PENDING_SCOUT = {
  phone: "09121110023",
  name: "استعدادیاب پارس",
  bio: "مرکز معرفی استعداد به شبکه‌های تلویزیونی",
  province: "فارس",
  city: "شیراز",
  nationalCode: "2940175836",
  description:
    "استعدادیاب پارس با همکاری تولیدات تلویزیونی جنوب کشور، برای برنامه‌های استعدادیابی آینده به دنبال چهره‌های محلی و ملی است. سابقهٔ ما همکاری با سه فصل مسابقه استعدادیاب بوده است.",
  cardUrl: "/uploads/demo-scout-card-3.svg",
};

const SCOUT_NEEDS: {
  phone: string;
  title: string;
  description: string;
  cat: string;
  province: string;
  city: string;
  skills: string[];
  minutesAgo: number;
}[] = [
  {
    phone: "09121110021",
    title: "جستجوی خوانندهٔ تازه برای آلبوم پاپ — قراردادی",
    description:
      "برای آلبوم پاپ سال آینده دنبال صدای جوان و تازه هستیم (مرد یا زن، ۱۸ تا ۲۸ سال). دمو صوتی خود را در پروفایل فرصتینو منتشر کنید تا بررسی کنیم. قرارداد رسمی + پیش‌پرداخت.",
    cat: "موسیقی",
    province: "تهران",
    city: "تهران",
    skills: ["خوانندگی", "ترانه‌سرایی"],
    minutesAgo: 320,
  },
  {
    phone: "09121110021",
    title: "نوازندهٔ تار و سه‌تار برای گروه سنتی",
    description:
      "گروه سنتی آرتا برای کنسرت‌های بهار به نوازندهٔ مسلط به تار یا سه‌تار نیاز دارد. سابقهٔ اجرای زنده حتماً در پروفایل باشد. تمرین‌ها در تهران برگزار می‌شود.",
    cat: "موسیقی",
    province: "تهران",
    city: "تهران",
    skills: ["نوازندگی تار"],
    minutesAgo: 1450,
  },
  {
    phone: "09121110022",
    title: "گویندهٔ مستند — صدای روایتگر (زن)",
    description:
      "برای مستند ۱۲ قسمتی فرهنگی به صدای روایتگر زن با لحن آرام و رسمی نیاز داریم. دموی صوتی کوتاه (یک دقیقه روایت) در پست‌های خود بگذارید و به این نیازمندی اعلام آمادگی کنید.",
    cat: "گویندگی و دوبله",
    province: "اصفهان",
    city: "اصفهان",
    skills: ["گویندگی"],
    minutesAgo: 760,
  },
];

async function run() {
  console.log("── seed-scouts ──");

  // ── 1) چهره‌یاب‌های تأییدشده ──
  for (const s of SCOUTS) {
    const user = await db.user.upsert({
      where: { phone: s.phone },
      create: {
        phone: s.phone,
        name: s.name,
        isScout: true,
        scoutStatus: "approved",
      },
      update: { isScout: true, scoutStatus: "approved", name: s.name },
    });
    await db.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bioShort: s.bio,
        province: s.province,
        city: s.city,
      },
      update: { bioShort: s.bio, province: s.province, city: s.city },
    });
    await db.scoutApplication.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        nationalCode: s.nationalCode,
        cardImageUrl: s.cardUrl,
        description: s.description,
        status: "approved",
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      update: { status: "approved", nationalCode: s.nationalCode, cardImageUrl: s.cardUrl, description: s.description },
    });
    console.log(`✓ چهره‌یاب فعال: ${s.name}`);
  }

  // ── 2) درخواست در انتظار ──
  {
    const user = await db.user.upsert({
      where: { phone: PENDING_SCOUT.phone },
      create: { phone: PENDING_SCOUT.phone, name: PENDING_SCOUT.name, scoutStatus: "pending" },
      update: { scoutStatus: "pending", name: PENDING_SCOUT.name },
    });
    await db.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, bioShort: PENDING_SCOUT.bio, province: PENDING_SCOUT.province, city: PENDING_SCOUT.city },
      update: { bioShort: PENDING_SCOUT.bio },
    });
    await db.scoutApplication.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        nationalCode: PENDING_SCOUT.nationalCode,
        cardImageUrl: PENDING_SCOUT.cardUrl,
        description: PENDING_SCOUT.description,
        status: "pending",
      },
      update: { status: "pending", description: PENDING_SCOUT.description, cardImageUrl: PENDING_SCOUT.cardUrl },
    });
    console.log(`✓ درخواست چهره‌یابی (در انتظار): ${PENDING_SCOUT.name}`);
  }

  // ── 3) نیازمندی‌های چهره‌یاب‌ها ──
  const needCount = await db.jobPost.count();
  if (needCount === 0 || true) {
    for (const n of SCOUT_NEEDS) {
      const exists = await db.jobPost.findFirst({ where: { title: n.title } });
      if (exists) continue;
      const user = await db.user.findUnique({ where: { phone: n.phone } });
      if (!user) continue;
      const cat = await db.category.findFirst({ where: { name: n.cat } });
      const need = await db.jobPost.create({
        data: {
          userId: user.id,
          title: n.title,
          description: n.description,
          categoryId: cat?.id || null,
          province: n.province,
          city: n.city,
          status: "open",
          createdAt: new Date(Date.now() - n.minutesAgo * 60 * 1000),
        },
      });
      for (const sname of n.skills) {
        const skill = await db.skill.findFirst({ where: { name: sname } });
        if (skill) {
          await db.jobPostSkill.create({ data: { jobPostId: need.id, skillId: skill.id } }).catch(() => {});
        }
      }
      console.log(`✓ نیازمندی چهره‌یاب: ${n.title.slice(0, 44)}…`);
    }
  }

  // ── 4) درخواست مستقیم چهره برتر (خودِ کاربر) ──
  {
    const sara = await db.user.findUnique({ where: { phone: "09121110002" } });
    if (sara) {
      const exists = await db.eliteRequest.findFirst({ where: { userId: sara.id, source: "user" } });
      if (!exists) {
        await db.eliteRequest.create({
          data: {
            userId: sara.id,
            source: "user",
            reason:
              "سالیان سال نقاشی و تصویرسازی کار کرده‌ام؛ دو نمایشگاه انفرادی و پنج نمایشگاه گروهی داشته‌ام و طرح جلد چند کتاب منتشرشده از من است. با توجه به سابقه و افتخاراتم، خواهشمندم مسیر مستقیم چهره برتر بررسی شود.",
            status: "pending",
          },
        });
        console.log("✓ درخواست مستقیم چهره برتر: سارا محمدی");
      }
    }
  }

  // ── 5) معرفی چهره‌یاب (آرتا → علی شریفی) ──
  {
    const scout = await db.user.findUnique({ where: { phone: "09121110021" } });
    const ali = await db.user.findUnique({ where: { phone: "09121110008" } });
    if (scout && ali) {
      const exists = await db.eliteRequest.findFirst({ where: { userId: ali.id, source: "scout" } });
      if (!exists) {
        await db.eliteRequest.create({
          data: {
            userId: ali.id,
            source: "scout",
            nominatorId: scout.id,
            reason:
              "پورتفولیوی عکاسی علی شریفی را بررسی کردیم — تسلط فنی و نگاه بصری بالغی دارد. آژانس آرتا او را برای دریافت قاب چهره برتر و همکاری در پروژهٔ آینده معرفی می‌کند.",
            status: "pending",
          },
        });
        console.log("✓ معرفی چهره‌یاب: آرتا → علی شریفی");
      }
    }
  }

  const scouts = await db.user.count({ where: { isScout: true } });
  const pendingApps = await db.scoutApplication.count({ where: { status: "pending" } });
  const eliteReqs = await db.eliteRequest.count();
  console.log(`\n✅ چهره‌یاب فعال: ${scouts} · درخواست در انتظار: ${pendingApps} · درخواست چهره برتر: ${eliteReqs}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
