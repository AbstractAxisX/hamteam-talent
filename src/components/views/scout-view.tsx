"use client";

/* ═══════════════════════════════════════════════════════════
   ScoutView — صفحهٔ «چهره‌یاب» (استعدادیاب حرفه‌ای)
   · فقط چهره‌یاب‌های فعال (وگرنه ریدایرکت فید)
   · چهره‌های برتر (قاب‌دار) + استعدادهای در حال رشد + نیازمندی‌های من
   · معرفی مستقیم استعداد به ادمین → NominateDialog (bottom-sheet)
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@/components/shared/icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Sheet } from "@/components/shared/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Btn, IconBtn, Sk, SPRING, Spinner } from "@/components/ui/atoms";
import { timeAgoFa, toFa, formatCount, formatFaDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FrameLevel } from "@/lib/stars";
import type { NeedListItem } from "@/lib/types";

/* ─── تایپ قرارداد GET /api/scout/dashboard ─── */
type ScoutTalent = {
  id: string;
  name: string;
  isVerifiedBadge: boolean;
  isAdminElite: boolean;
  isScout: boolean;
  isTopTalent: boolean;
  frame: FrameLevel;
  totalStars: number | null;
  votes: number | null;
  bioShort: string;
  avatarUrl: string | null;
  gender: string | null;
  province: string | null;
  city: string | null;
  categories: { id: string; name: string; iconUrl: string | null; color: string | null }[];
  followersCount: number;
  featuredPosts: number;
  mainCategoryColor: string | null;
};

type ScoutDashboard = {
  me: { id: string; name: string };
  stats: {
    eliteCount: number;
    featuredCount: number;
    risingCount: number;
    showcaseAvg: number;
    myNeedsCount: number;
  };
  thresholds: { stars: number; votes: number };
  elite: ScoutTalent[];
  rising: ScoutTalent[];
  myNeeds: NeedListItem[];
};

export function ScoutView() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<ScoutDashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nominating, setNominating] = useState<ScoutTalent | null>(null);
  const [rising, setRising] = useState<ScoutTalent[]>([]);

  /* غیر چهره‌یاب/مهمان → فید (بعد از مشخص شدن کاربر) */
  useEffect(() => {
    if (!userLoading && !user?.isScout) {
      navigate({ view: "feed" });
    }
  }, [userLoading, user]);

  /* داشبورد */
  useEffect(() => {
    if (!user?.isScout) return;
    let alive = true;
    api<ScoutDashboard>("/api/scout/dashboard")
      .then((d) => {
        if (!alive) return;
        setData(d);
        setRising(d.rising);
        setLoadError(null);
      })
      .catch((e) => alive && setLoadError((e as Error).message));
    return () => {
      alive = false;
    };
  }, [user?.isScout]);

  /* ── گیت‌های ورود ── */
  if (userLoading || !user?.isScout) {
    // در انتظار لود کاربر یا ریدایرکت غیر چهره‌یاب
    return (
      <div className="min-h-[60vh] grid place-items-center" aria-busy="true">
        <Spinner size={30} className="text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats;
  const thresholds = data?.thresholds ?? { stars: 5000, votes: 500 };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ═══ هدر — هویت سبز چهره‌یاب ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
      >
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-600/20 text-[11px] font-black">
            <Icon name="compass" size={12} strokeWidth={2.4} />
            چهره‌یاب
          </span>
          <h1 className="text-3xl font-black tracking-tight leading-none mt-3">چهره‌یاب</h1>
          <p className="text-[13px] text-muted-foreground mt-2 leading-6">
            استعدادیابی حرفه‌ای — چهره‌های برتر و استعدادهای در حال رشد
          </p>
        </div>
      </motion.header>

      {/* ═══ ردیف آمار ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stats ? (
          <>
            <MiniStat icon="crown" label="چهره برتر" value={toFa(stats.eliteCount)} />
            <MiniStat icon="sparkles" label="پست ویترین" value={toFa(stats.featuredCount)} />
            <MiniStat
              icon="star"
              label="میانگین امتیاز ویترین"
              value={`${toFa(String(stats.showcaseAvg)).replace(".", "٫")}/۱۰`}
            />
            <MiniStat icon="briefcase" label="نیازمندی فعال من" value={toFa(stats.myNeedsCount)} />
          </>
        ) : (
          [...Array(4)].map((_, i) => <Sk key={i} className="h-16 rounded-2xl" />)
        )}
      </div>

      {/* ═══ بنر آستانه‌ها — ملایم و کم‌رنگ ═══ */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-muted/50 border border-border/60 text-muted-foreground">
        <Icon name="info" size={16} className="shrink-0 mt-0.5" />
        <p className="text-[12px] leading-6">
          قاب چهره برتر: {thresholds.stars.toLocaleString("fa-IR")} ستاره یا{" "}
          {thresholds.votes.toLocaleString("fa-IR")} رأی — یا معرفی توسط شما و تأیید ادمین.
        </p>
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-[13px] font-bold text-destructive">
          {loadError}
        </div>
      )}

      {/* ═══ سکشن ۱ — چهره‌های برتر ═══ */}
      <section aria-label="چهره‌های برتر" className="space-y-3">
        <SectionHeader icon="crown" title="چهره‌های برتر" count={data?.elite.length} />
        {!data ? (
          <TalentCardSkeleton />
        ) : data.elite.length === 0 ? (
          <InlineEmpty
            icon="crown"
            text="هنوز چهره برتری ثبت نشده — با معرفی استعدادها توسط خودتان این لیست شکل می‌گیرد."
          />
        ) : (
          data.elite.map((t, i) => (
            <TalentRow key={t.id} talent={t} index={i} kind="elite" onNominate={() => setNominating(t)} />
          ))
        )}
      </section>

      {/* ═══ سکشن ۲ — استعدادهای در حال رشد ═══ */}
      <section aria-label="استعدادهای در حال رشد" className="space-y-3">
        <SectionHeader icon="rocket" title="استعدادهای در حال رشد" count={rising.length} />
        {!data ? (
          <TalentCardSkeleton />
        ) : rising.length === 0 ? (
          <InlineEmpty
            icon="rocket"
            text="فعلاً استعدادی در صف رشد نیست — بعداً سر بزنید یا از صفحهٔ کشف دنبال استعدادها بگردید."
            action={
              <Btn variant="outline" size="sm" icon={<Icon name="search" size={15} />} onClick={() => navigate({ view: "discover" })}>
                رفتن به کشف
              </Btn>
            }
          />
        ) : (
          <AnimatePresence initial={false}>
            {rising.map((t, i) => (
              <TalentRow
                key={t.id}
                talent={t}
                index={i}
                kind="rising"
                onNominate={() => setNominating(t)}
              />
            ))}
          </AnimatePresence>
        )}
      </section>

      {/* ═══ سکشن ۳ — نیازمندی‌های من ═══ */}
      <section aria-label="نیازمندی‌های من" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader icon="briefcase" title="نیازمندی‌های من" count={data?.myNeeds.length} />
          <Btn
            size="sm"
            icon={<Icon name="plus" size={15} className="text-white" />}
            onClick={() => navigate({ view: "create-need" })}
          >
            ثبت نیازمندی
          </Btn>
        </div>
        {!data ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Sk key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : data.myNeeds.length === 0 ? (
          <InlineEmpty
            icon="briefcase"
            text="هنوز نیازمندی‌ای ثبت نکرده‌ای — فرصت همکاری‌ات را منتشر کن تا استعدادها درخواست بفرستند."
            action={
              <Btn variant="grad" size="sm" icon={<Icon name="plus" size={15} className="text-white" />} onClick={() => navigate({ view: "create-need" })}>
                ثبت نیازمندی جدید
              </Btn>
            }
          />
        ) : (
          <div className="rounded-3xl glass border border-border/50 divide-y divide-border/40 overflow-hidden">
            {data.myNeeds.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate({ view: "need", id: n.id })}
                className="w-full flex items-center gap-3 p-4 text-right hover:bg-muted/40 transition-colors min-h-[64px]"
                aria-label={`نیازمندی ${n.title}`}
              >
                <span className="grid place-items-center size-10 rounded-2xl bg-primary/10 text-primary shrink-0">
                  <Icon name="briefcase" size={19} strokeWidth={2.2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold truncate">{n.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    {n.categoryName && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="sparkles" size={11} />
                        {n.categoryName}
                      </span>
                    )}
                    {n.status === "open" && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <Icon name="checkCircle" size={11} />
                        فعال
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 nums-fa font-bold">
                    <Icon name="users" size={12} />
                    {formatCount(n.applicationCount)}
                  </span>
                  <span className="nums-fa" title={formatFaDate(n.createdAt)}>
                    {timeAgoFa(n.createdAt)}
                  </span>
                </div>
                <Icon name="chevronLeft" size={15} className="text-muted-foreground/60 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ═══ دیالوگ معرفی به ادمین ═══ */}
      <NominateDialog
        talent={nominating}
        onClose={() => setNominating(null)}
        onDone={(id) => {
          setRising((list) => list.filter((t) => t.id !== id));
          setNominating(null);
        }}
      />
    </div>
  );
}

/* ═══════════════ ردیف کارت استعداد (لیست — نه گرید) ═══════════════ */
function TalentRow({
  talent,
  index = 0,
  kind,
  onNominate,
}: {
  talent: ScoutTalent;
  index?: number;
  kind: "elite" | "rising";
  onNominate: () => void;
}) {
  const [chatBusy, setChatBusy] = useState(false);
  const location = talent.province || talent.city
    ? [talent.city, talent.province].filter(Boolean).join("، ")
    : null;

  async function startChat() {
    setChatBusy(true);
    try {
      const res = await apiPost<{ conversationId: string; status: string }>("/api/chat/start", {
        userId: talent.id,
      });
      navigate({ view: "chat", conversationId: res.conversationId });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl glass border border-border/60 p-4 hover:border-primary/30 hover:shadow-lift transition-[border-color,box-shadow]"
    >
      <div className="flex items-start gap-3.5">
        {/* آواتار — قاب طلایی/رزگلد محترم */}
        <button
          onClick={() => navigate({ view: "profile", id: talent.id })}
          className="shrink-0"
          aria-label={`پروفایل ${talent.name}`}
        >
          <UserAvatar
            name={talent.name}
            avatarUrl={talent.avatarUrl}
            verified={talent.isVerifiedBadge}
            gender={talent.gender}
            size="lg"
            frame={talent.frame ?? undefined}
            topTalent={talent.isTopTalent}
            ringColor={talent.isTopTalent ? null : talent.mainCategoryColor || "var(--primary)"}
          />
        </button>

        <div className="flex-1 min-w-0">
          {/* نام + چیپ ستاره */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => navigate({ view: "profile", id: talent.id })}
              className="font-black text-[15px] hover:text-primary transition-colors truncate"
            >
              {talent.name}
            </button>
            {talent.isVerifiedBadge && <Icon name="badgeCheck" className="w-4 h-4 text-gold shrink-0" />}
            {kind === "elite" ? (
              (talent.totalStars ?? 0) > 0 && (
                <span
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-black nums-fa shrink-0"
                  style={
                    talent.frame === "rosegold"
                      ? { background: "linear-gradient(135deg,#ffe4e6,#fb7185 45%,#be123c)", color: "#4c0519" }
                      : { background: "linear-gradient(135deg,#fef3c7,#f5c84c 45%,#e08a00)", color: "#3a2405" }
                  }
                  title={talent.frame === "rosegold" ? "چهره برتر رزگلد" : "چهره برتر طلایی"}
                >
                  <Icon name="star" className="w-3 h-3" />
                  {formatCount(talent.totalStars ?? 0)}
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-black bg-secondary text-muted-foreground nums-fa shrink-0">
                <Icon name="star" className="w-3 h-3" />
                {formatCount(talent.totalStars ?? 0)}
                <span className="text-muted-foreground/60">·</span>
                {formatCount(talent.votes ?? 0)} رأی
              </span>
            )}
          </div>

          {/* دسته‌ها (حداکثر ۳) */}
          {talent.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {talent.categories.slice(0, 3).map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-bold bg-primary/10 text-primary"
                  style={c.color ? { backgroundColor: `${c.color}1f`, color: c.color } : undefined}
                >
                  {c.iconUrl && <span aria-hidden>{c.iconUrl}</span>}
                  {c.name}
                </span>
              ))}
            </div>
          )}

          {/* بایو یک‌خطی */}
          {talent.bioShort && (
            <p className="text-[12px] text-muted-foreground truncate leading-6 mt-1.5">{talent.bioShort}</p>
          )}

          {/* مکان */}
          {location && (
            <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
              <Icon name="mapPin" className="w-3 h-3" />
              {location}
            </p>
          )}
        </div>
      </div>

      {/* اکشن‌ها */}
      <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-border/40">
        <Btn
          variant="outline"
          size="sm"
          icon={<Icon name="user" size={14} />}
          onClick={() => navigate({ view: "profile", id: talent.id })}
        >
          پروفایل
        </Btn>
        {kind === "elite" ? (
          <Btn variant="soft" size="sm" loading={chatBusy} icon={<Icon name="chat" size={14} />} onClick={startChat}>
            گفتگو
          </Btn>
        ) : (
          <Btn
            variant="outline"
            size="sm"
            className="border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/15 shadow-none"
            icon={<Icon name="award" size={14} />}
            onClick={onNominate}
          >
            معرفی به ادمین
          </Btn>
        )}
        <span className="ms-auto inline-flex items-center gap-1 text-[10.5px] font-bold text-muted-foreground nums-fa">
          <Icon name="users" className="w-3 h-3" />
          {formatCount(talent.followersCount)} دنبال‌کننده
        </span>
      </div>
    </motion.article>
  );
}

/* ═══════════════ دیالوگ «معرفی به ادمین» — بات‌شیت ═══════════════ */
function NominateDialog({
  talent,
  onClose,
  onDone,
}: {
  talent: ScoutTalent | null;
  onClose: () => void;
  onDone: (talentId: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ریست در هر باز شدن */
  useEffect(() => {
    if (talent) {
      setReason("");
      setError(null);
      setSubmitting(false);
    }
  }, [talent]);

  /* قفل اسکرول + Esc */
  useEffect(() => {
    if (!talent) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [talent, onClose, submitting]);

  async function submit() {
    if (!talent || submitting) return;
    if (reason.trim().length < 10) {
      setError("دلیل معرفی حداقل ۱۰ کاراکتر باشد");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<{ ok: boolean; message: string }>("/api/scout/nominate", {
        userId: talent.id,
        reason: reason.trim(),
      });
      toast({ title: "معرفی شد ✅", description: res.message });
      onDone(talent.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={!!talent}
      onClose={() => !submitting && onClose()}
      title={talent ? `معرفی «${talent.name}» به ادمین` : undefined}
      description="با تأیید ادمین، این استعداد قاب «چهره برتر» می‌گیرد."
      footer={
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="h-12 px-5 rounded-2xl border border-border text-muted-foreground font-bold text-sm hover:bg-muted transition-colors outline-none"
          >
            انصراف
          </button>
          <button
            onClick={submit}
            disabled={reason.trim().length < 10 || submitting}
            className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm
                       inline-flex items-center justify-center gap-2 disabled:opacity-50
                       outline-none transition-[filter] hover:brightness-105"
          >
            {submitting ? (
              <Icon name="loader" size={17} className="animate-spin" />
            ) : (
              <Icon name="award" size={17} />
            )}
            ارسال معرفی
          </button>
        </div>
      }
    >
      <div>
        <label htmlFor="nominate-reason" className="block text-[13px] font-bold mb-2">
          دلیل معرفی
        </label>
        <Textarea
          id="nominate-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="مثلاً: پرفروش‌ترین کارهایش امتیاز ۹+ گرفته و در حوزهٔ موسیقی استان کم‌نظیر است…"
          className="min-h-28 rounded-2xl text-[13px] leading-7 bg-muted/60 border-[1.5px]"
          disabled={submitting}
        />
        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className={cn("text-[11px] font-bold", error ? "text-destructive" : "text-muted-foreground")}>
            {error || "حداقل ۱۰ کاراکتر"}
          </p>
          <p
            className={cn(
              "text-[10.5px] font-bold nums-fa",
              reason.trim().length >= 10 ? "text-emerald-600" : "text-muted-foreground"
            )}
          >
            {reason.trim().length.toLocaleString("fa-IR")}
          </p>
        </div>
      </div>
    </Sheet>
  );
}

/* ═══════════════ اجزای کوچک ═══════════════ */

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2.5 p-3.5 rounded-2xl glass border border-border/60"
    >
      <span className="grid place-items-center size-9 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 shrink-0">
        <Icon name={icon} size={17} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-black nums-fa leading-none">{value}</p>
        <p className="text-[10px] font-bold text-muted-foreground truncate mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function SectionHeader({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center size-9 rounded-2xl bg-primary/10 text-primary shrink-0">
        <Icon name={icon} size={17} strokeWidth={2.2} />
      </span>
      <h2 className="text-lg font-black tracking-tight">{title}</h2>
      {typeof count === "number" && count > 0 && (
        <span className="text-[11px] font-bold text-muted-foreground nums-fa">{toFa(count)}</span>
      )}
    </div>
  );
}

function InlineEmpty({
  icon,
  text,
  action,
}: {
  icon: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center gap-3 p-8 rounded-3xl glass border border-dashed border-border/70"
    >
      <span className="grid place-items-center size-12 rounded-2xl bg-muted text-muted-foreground">
        <Icon name={icon} size={22} strokeWidth={2} />
      </span>
      <p className="text-[12.5px] text-muted-foreground leading-6 max-w-sm">{text}</p>
      {action}
    </motion.div>
  );
}

function TalentCardSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="در حال بارگذاری">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-3xl glass border border-border/60 p-4">
          <div className="flex items-start gap-3.5">
            <Sk circle className="w-14 h-14" />
            <div className="flex-1 space-y-2">
              <Sk className="h-4 w-36 rounded" />
              <Sk className="h-3 w-24 rounded" />
              <Sk className="h-3 w-2/3 rounded" />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border/40 flex gap-2">
            <Sk className="h-9 w-24 rounded-full" />
            <Sk className="h-9 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
