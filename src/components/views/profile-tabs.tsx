"use client";

/* ═══════════════════════════════════════════════════════════
   Profile tabs — تب‌های «درباره» و «رزومه» پروفایل
   (جابه‌جایی از profile-view برای رعایت سقف ۳۰۰ خط)
   ═══════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import type { ProfileDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/shared/icon";
import { toFa } from "@/lib/format";

/* ── Color helper: ساخت tint زمردی از hex دسته‌بندی ── */
export function shadeColor(
  color: string,
  lightness: number,
  hue: number,
  alpha: number = 1
): string {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = hue;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = h * 60;
      if (h < 0) h += 360;
    }
    return `oklch(${lightness} 0.04 ${h.toFixed(0)}${alpha < 1 ? ` / ${alpha}` : ""})`;
  }
  return color;
}

/* ─────────── تب درباره ─────────── */

export function AboutTab({
  profile,
  catColorMap,
}: {
  profile: ProfileDetail;
  catColorMap: Map<string, string>;
}) {
  const cats = profile.categories || [];
  if (!profile.bioLong && !profile.bioShort && cats.length === 0) {
    return (
      <EmptyState
        kind="generic"
        title="اطلاعاتی موجود نیست"
        description="این کاربر هنوز درباره خودش ننوشته است."
      />
    );
  }
  return (
    <div className="space-y-5">
      {profile.bioLong && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-muted-foreground">
            <Icon name="info" size={14} />
            درباره من
          </div>
          <p className="text-[14px] leading-8 whitespace-pre-wrap text-foreground/90">
            {profile.bioLong}
          </p>
        </motion.div>
      )}

      {cats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-1">
            <Icon name="award" size={14} />
            حوزه‌های تخصصی
          </div>
          <div className="space-y-3">
            {cats.map((c, i) => {
              const color = catColorMap.get(c.id) || "oklch(0.6 0.15 160)";
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <h3 className="font-bold text-sm flex-1">{c.name}</h3>
                  </div>
                  {c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {c.skills.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border"
                          style={{
                            background: shadeColor(color, 0.18, 165, 0.85),
                            borderColor: shadeColor(color, 0.3, 165),
                            color: shadeColor(color, 0.92, 165, 1),
                          }}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.skills.length === 0 && (
                    <p className="text-xs text-muted-foreground">مهارتی ثبت نشده</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {profile.phone && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
            <Icon name="phone" size={18} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground">شماره تماس</p>
            <p className="text-sm font-bold font-mono" dir="ltr">{profile.phone}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────── تب رزومه ─────────── */

export function ResumeTab({
  profile,
  isSelf,
  userId,
}: {
  profile: ProfileDetail;
  isSelf: boolean;
  userId: string;
}) {
  const exps = profile.experiences || [];
  const edus = profile.educations || [];

  if (exps.length === 0 && edus.length === 0) {
    return (
      <EmptyState
        kind="generic"
        title="رزومه‌ای ثبت نشده"
        description={isSelf ? "برای تکمیل رزومه به ویرایش پروفایل بروید." : ""}
        action={
          isSelf ? (
            <Button
              onClick={() => navigate({ view: "edit-profile" })}
              className="bg-primary text-primary-foreground"
            >
              <Icon name="pencil" size={16} />
              ویرایش پروفایل
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => window.open(`/api/resume/${userId}`, "_blank")}
        className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl glass hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
            <Icon name="briefcase" size={20} />
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">دانلود رزومه PDF</p>
            <p className="text-[11px] text-muted-foreground">نسخه کامل با فرمت چاپ</p>
          </div>
        </div>
        <Icon name="chevronLeft" size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      {exps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Icon name="rocket" size={16} className="text-primary" />
            <h3 className="text-sm font-bold">تجربه‌ها</h3>
            <span className="text-[10px] text-muted-foreground">({toFa(exps.length)})</span>
          </div>
          <div className="relative">
            <div className="absolute top-2 bottom-2 right-[7px] w-0.5 bg-border/60" />
            <div className="space-y-4">
              {exps.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pr-8"
                >
                  <div className="absolute right-0 top-2 w-4 h-4 rounded-full border-2 border-primary bg-background" />
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-sm leading-tight">{e.jobTitle}</h4>
                      {e.categoryName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                          {e.categoryName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Icon name="briefcase" size={11} />
                      {e.organization}
                      {e.skillName && <span className="text-foreground/60"> · {e.skillName}</span>}
                    </p>
                    {(e.startDate || e.endDate) && (
                      <p className="text-[11px] text-muted-foreground/80 mb-2" dir="ltr">
                        {[e.startDate, e.endDate || "تاکنون"].filter(Boolean).join(" — ")}
                      </p>
                    )}
                    {e.description && (
                      <p className="text-xs leading-6 text-foreground/80 mt-2 whitespace-pre-wrap">
                        {e.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {edus.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Icon name="award" size={16} className="text-gold" />
            <h3 className="text-sm font-bold">تحصیلات</h3>
            <span className="text-[10px] text-muted-foreground">({toFa(edus.length)})</span>
          </div>
          <div className="space-y-3">
            {edus.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm">{e.degree}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Icon name="mapPin" size={11} />
                      {e.institution}
                    </p>
                  </div>
                  {e.year && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold/10 text-gold shrink-0">
                      {toFa(e.year)}
                    </span>
                  )}
                </div>
                {e.description && (
                  <p className="text-xs leading-6 text-foreground/80 mt-2 whitespace-pre-wrap">
                    {e.description}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
