#!/usr/bin/env bun
/* ═══════════════════════════════════════════════════════════════
   scripts/rebrand.ts — ری‌برند «همتیم» → «فرصتینو»
   جایگزینی هوشمند بر اساس کانتکست (تمام src/):
   · هم‌تیم / هم تیم / همتیم (نام برند)          → فرصتینو
   · همتیمی‌های شما/متصل (اعضای شبکه)            → ارتباط‌های شما / ارتباط‌ها
   · «پیشنهاد همتیم»                              → «پیشنهاد فرصتینو»
   گزارش کامل فایل‌ها و تعداد جایگزینی چاپ می‌شود.
   ═══════════════════════════════════════════════════════════════ */

import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..", "src");
const EXT = new Set([".ts", ".tsx", ".css", ".js", ".jsx"]);

/* ترتیب مهم: اول عبارت‌های بلندتر و خاص‌تر */
const REPLACEMENTS: [RegExp, string][] = [
  // ── ترکیب‌های خاص «همتیمی» (شبکهٔ ارتباطی) ──
  [/همتیمی‌های متصل/g, "ارتباط‌های متصل"],
  [/همتیمی‌های شما/g, "ارتباط‌های شما"],
  [/همتیمی‌هایی که با آن‌ها/g, "افرادی که با آن‌ها"],
  [/از همتیمی‌ها/g, "از ارتباط‌ها"],
  [/پست همتیمی‌ها/g, "پست ارتباط‌ها"],
  [/همتیمی‌هایم/g, "ارتباط‌هایم"],
  [/همتیمی‌ها/g, "ارتباط‌ها"],
  [/همتیمی/g, "کاربر فرصتینو"], // باقی موارد منفرد
  // ── نام برند با فاصله/نیم‌فاصله ──
  [/هم‌تیم/g, "فرصتینو"],
  [/هم تیم/g, "فرصتینو"],
  [/همتیم/g, "فرصتینو"],
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (EXT.has(name.slice(name.lastIndexOf(".")))) out.push(p);
  }
  return out;
}

let filesChanged = 0;
let totalRepl = 0;

for (const file of walk(ROOT)) {
  const src = readFileSync(file, "utf8");
  let out = src;
  let count = 0;
  for (const [re, to] of REPLACEMENTS) {
    out = out.replace(re, (m) => {
      count++;
      return to;
    });
  }
  if (count > 0) {
    writeFileSync(file, out);
    filesChanged++;
    totalRepl += count;
    console.log(`✓ ${file.replace(ROOT, "src")} — ${count} جایگزینی`);
  }
}

console.log(`\n═══ فرصتینو ری‌برند کامل شد ═══`);
console.log(`فایل‌های تغییرکرده: ${filesChanged}`);
console.log(`کل جایگزینی‌ها: ${totalRepl}`);
