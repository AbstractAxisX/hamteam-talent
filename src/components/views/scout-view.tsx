"use client";

/* ═══════════════════════════════════════════════════════════
   ScoutView — صفحهٔ «چهره‌یاب» (ابزار کامل کشف استعداد)
   · فقط چهره‌یاب‌های فعال (وگرنه ریدایرکت فید)
   · جست‌وجوی استعداد: همه/دسته/مهارت + جست‌وجوی متنی
     + جدول جایگاه بر پایهٔ مجموع ستاره‌ها (برای تیم، آژانس،
     اسپانسر یا هر کسی که دنبال استعداد می‌گردد)
   · چهره‌های برتر + استعدادهای در حال رشد + نیازمندی‌های من
   · معرفی مستقیم استعداد به ادمین → NominateDialog (بات‌شیت)
   · دیزاین کلاسیک: bg-card + border + rounded-2xl، بدون شیشه،
     فِید ≤ ۰٫۲s بدون stagger — emerald فقط روی نشان چهره‌یاب
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { toast } from "@/hooks/use-toast";
import { Icon } from "@/components/shared/icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ScoutBadge } from "@/components/shared/scout-badge";
import { Sheet } from "@/components/shared/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Btn, Sk, Spinner } from "@/components/ui/atoms";
import { timeAgoFa, toFa, formatCount, formatFaDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FrameLevel } from "@/lib/stars";
import type { NeedListItem } from "@/lib/types";

/* ─── تایپ قراردادها ─── */

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
  stats: {
    eliteCount: number;
    featuredCount: number;
    risingCount: number;
    showcaseAvg: number;
    myNeedsCount: number;
  };
  thresholds: { silver: number; gold: number; silverVotes: number; goldVotes: number };
  elite: ScoutTalent[];
  rising: ScoutTalent[];
  myNeeds: NeedListItem[];
};

/* GET /api/scout/talents → یک صفحهٔ جدول جایگاه */
type SearchTalent = {
  id: string;
  name: string;
  rank: number;
  totalStars: number;
  frame: FrameLevel;
  avatarUrl: string | null;
  gender: string | null;
  bioShort: string;
  mainCategoryName: string | null;
};
type SearchPage = { total: number; page: number; talents: SearchTalent[] };

/* POST /api/scout/talents → دسته‌ها/مهارت‌های در دسترس */
type TalentCategory = {
  id: string;
  name: string;
  iconUrl: string | null;
  color: string | null;
  skills: { id: string; name: string }[];
};

const PAGE_SIZE = 20;

/** عدد فارسی با جداکنندهٔ هزارگان — ۵٬۰۰۰ */
function faSep(n: number): string {
  return toFa(n.toLocaleString("en-US")).replace(/,/g, "٬");
}

/** رنگ مدال جایگاه — ۱ طلایی/۲ نقره‌ای/۳ برنزی */
function medalClass(rank: number): string {
  if (rank === 1) return "bg-amber-500/15 text-amber-500 dark:text-amber-400";
  if (rank === 2) return "bg-slate-400/15 text-slate-500 dark:text-slate-300";
  if (rank === 3) return "bg-amber-700/10 text-amber-700 dark:text-amber-500";
  return "bg-muted text-muted-foreground";
}

/** کوئری‌استرینگ جست‌وجوی استعداد */
function searchParams(page: number, categoryId: string | null, skillId: string | null, q: string): string {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (categoryId) params.set("categoryId", categoryId);
  if (skillId) params.set("skillId", skillId);
  if (q) params.set("q", q);
  return params.toString();
}

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

  /* ── گیت ورود ── */
  if (userLoading || !user?.isScout) {
    return (
      <div className="min-h-[60vh] grid place-items-center" aria-busy="true">
        <Spinner size={30} className="text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats;
  const thresholds = data?.thresholds ?? { silver: 5000, gold: 10000, silverVotes: 500, goldVotes: 1000 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto space-y-4 pb-4"
    >
      {/* ═══ ۱. هدر — کلاسیک فشرده + آواتار مربعی چهره‌یاب ═══ */}
      <header className="rounded-2xl border border-border bg-card p-4" aria-label="سربرگ چهره‌یاب">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate({ view: "my-profile" })}
            className="shrink-0 hover:opacity-90 transition-opacity"
            aria-label="پروفایل من"
          >
            <UserAvatar
              name={user.name}
              avatarUrl={user.profile?.avatarUrl || null}
              verified={user.isVerifiedBadge}
              gender={user.profile?.gender}
              size="lg"
              square
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight leading-none">چهره‌یاب</h1>
              <ScoutBadge size="sm" />
            </div>
            <p className="text-[13px] font-extrabold truncate mt-1.5 leading-none">{user.name}</p>
            <p className="text-[11px] font-bold text-muted-foreground mt-1 leading-none">ابزار کشف استعداد</p>
          </div>
        </div>
      </header>

      {/* ═══ ۲. ردیف آمار ═══ */}
      <section aria-label="آمار چهره‌یاب" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats ? (
          <>
            <MiniStat icon="crown" label="چهره برتر" value={toFa(stats.eliteCount)} />
            <MiniStat icon="sparkles" label="پست ویترین" value={toFa(stats.featuredCount)} />
            <MiniStat
              icon="star"
              label="میانگین ویترین"
              value={`${toFa(String(stats.showcaseAvg)).replace(".", "٫")} از ۱۰`}
            />
            <MiniStat icon="briefcase" label="نیازمندی فعال من" value={toFa(stats.myNeedsCount)} />
          </>
        ) : (
          [...Array(4)].map((_, i) => <Sk key={i} className="h-16 rounded-xl" />)
        )}
      </section>

      {loadError && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl border border-destructive/30 bg-destructive/5 text-[13px] font-bold text-destructive"
        >
          {loadError}
        </div>
      )}

      {/* ═══ ۳. جست‌وجوی استعداد — ابزار اصلی چهره‌یاب ═══ */}
      <TalentSearch />

      {/* ═══ ۴. چهره‌های برتر ═══ */}
      <section aria-label="چهره‌های برتر" className="space-y-2.5">
        <SectionHeader icon="crown" title="چهره‌های برتر" count={data?.elite.length} />
        {!data ? (
          <TalentSkeleton />
        ) : data.elite.length === 0 ? (
          <InlineEmpty
            icon="crown"
            text="هنوز چهره برتری ثبت نشده — با معرفی استعدادها توسط خودتان این لیست شکل می‌گیرد."
          />
        ) : (
          <div className="space-y-2">
            {data.elite.map((t) => (
              <TalentRow key={t.id} talent={t} kind="elite" />
            ))}
          </div>
        )}
      </section>

      {/* ═══ ۵. استعدادهای در حال رشد ═══ */}
      <section aria-label="استعدادهای در حال رشد" className="space-y-2.5">
        <SectionHeader icon="rocket" title="استعدادهای در حال رشد" count={rising.length} />
        {!data ? (
          <TalentSkeleton />
        ) : rising.length === 0 ? (
          <InlineEmpty
            icon="rocket"
            text="فعلاً استعدادی در صف رشد نیست — از بخش جست‌وجوی استعداد بالا دنبالش بگردید."
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {rising.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <TalentRow talent={t} kind="rising" onNominate={() => setNominating(t)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ═══ ۶. نیازمندی‌های من ═══ */}
      <section aria-label="نیازمندی‌های من" className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <SectionHeader icon="briefcase" title="نیازمندی‌های من" count={data?.myNeeds.length} />
          <Btn
            variant="solid"
            size="sm"
            icon={<Icon name="plus" size={14} />}
            onClick={() => navigate({ view: "create-need" })}
          >
            ثبت نیازمندی
          </Btn>
        </div>
        {!data ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Sk key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : data.myNeeds.length === 0 ? (
          <InlineEmpty
            icon="briefcase"
            text="هنوز نیازمندی‌ای ثبت نکرده‌ای — فرصت همکاری‌ات را منتشر کن تا استعدادها درخواست بفرستند."
            action={
              <Btn
                variant="solid"
                size="sm"
                icon={<Icon name="plus" size={14} />}
                onClick={() => navigate({ view: "create-need" })}
              >
                ثبت نیازمندی جدید
              </Btn>
            }
          />
        ) : (
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {data.myNeeds.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate({ view: "need", id: n.id })}
                className="w-full flex items-center gap-3 p-3 text-right hover:bg-muted/50 transition-colors min-h-14"
                aria-label={`نیازمندی ${n.title}`}
              >
                <span className="grid place-items-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon name="briefcase" size={16} strokeWidth={2.2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate">{n.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-muted-foreground">
                    {n.categoryName && (
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <Icon name="sparkles" size={10} className="shrink-0" />
                        <span className="truncate">{n.categoryName}</span>
                      </span>
                    )}
                    {n.status === "open" && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold shrink-0">
                        <Icon name="checkCircle" size={10} />
                        فعال
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0 text-[10.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 nums-fa font-bold">
                    <Icon name="users" size={11} />
                    {formatCount(n.applicationCount)}
                  </span>
                  <span className="nums-fa" title={formatFaDate(n.createdAt)}>
                    {timeAgoFa(n.createdAt)}
                  </span>
                </div>
                <Icon name="chevronLeft" size={14} className="text-muted-foreground/60 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ═══ ۷. آستانه‌های چهره برتر — کارت اطلاع کلاسیک ═══ */}
      <section aria-label="آستانه‌های چهره برتر">
        <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-card p-3.5">
          <Icon name="info" size={15} className="shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-[11.5px] text-muted-foreground leading-6 font-bold">
            آستانه‌های چهره برتر: {faSep(thresholds.silver)} ستاره یا {faSep(thresholds.silverVotes)} رأی →{" "}
            <span className="text-slate-600 dark:text-slate-300 font-black">نقره‌ای</span> · {faSep(thresholds.gold)} ستاره یا{" "}
            {faSep(thresholds.goldVotes)} رأی → <span className="text-amber-700 dark:text-amber-400 font-black">طلایی</span>
          </p>
        </div>
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
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TalentSearch — جست‌وجوی استعداد (هستهٔ چهره‌یاب)
   فیلتر دسته/مهارت + جست‌وجوی متنی (debounce ۴۰۰ms) + جدول
   جایگاه بر پایهٔ مجموع ستاره‌ها + صفحه‌بندی «نمایش بیشتر»
   ═══════════════════════════════════════════════════════════ */
function TalentSearch() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [skillId, setSkillId] = useState<string | null>(null);
  const [cats, setCats] = useState<TalentCategory[] | null>(null);
  const [rows, setRows] = useState<SearchTalent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentCat = cats?.find((c) => c.id === categoryId) ?? null;

  /* دسته‌ها/مهارت‌ها — یک‌بار در mount */
  useEffect(() => {
    let alive = true;
    apiPost<{ categories: TalentCategory[] }>("/api/scout/talents")
      .then((d) => {
        if (alive) setCats(d.categories);
      })
      .catch(() => {
        if (alive) setCats([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  /* جست‌وجوی متنی — debounce ۴۰۰ms */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  /* کوئری استعداد با فیلترهای فعلی — همیشه صفحهٔ ۱ */
  useEffect(() => {
    let alive = true;
    setSearching(true);
    api<SearchPage>(`/api/scout/talents?${searchParams(1, categoryId, skillId, debouncedQ)}`)
      .then((d) => {
        if (!alive) return;
        setRows(d.talents);
        setTotal(d.total);
        setPage(1);
        setError(null);
      })
      .catch((e) => {
        if (alive) setError((e as Error).message);
      })
      .finally(() => {
        if (alive) setSearching(false);
      });
    return () => {
      alive = false;
    };
  }, [categoryId, skillId, debouncedQ]);

  function pickCategory(id: string | null) {
    setCategoryId(id);
    setSkillId(null);
  }

  async function loadMore() {
    if (loadingMore || searching) return;
    setLoadingMore(true);
    try {
      const d = await api<SearchPage>(`/api/scout/talents?${searchParams(page + 1, categoryId, skillId, debouncedQ)}`);
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...d.talents.filter((t) => !seen.has(t.id))];
      });
      setTotal(d.total);
      setPage((p) => p + 1);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section aria-label="جست‌وجوی استعداد" className="space-y-3">
      <div className="px-1">
        <SectionHeader icon="search" title="جست‌وجوی استعداد" />
        <p className="text-[11px] font-bold text-muted-foreground mt-1.5 pr-10 leading-4">
          برای تیم، آژانس یا همکاری — در هر دسته و مهارتی
        </p>
      </div>

      {/* نوار فیلتر */}
      <div className="rounded-2xl border border-border bg-card p-3 space-y-2.5">
        {/* جست‌وجوی متنی */}
        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            dir="auto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی نام یا مهارت…"
            aria-label="جست‌وجوی نام یا مهارت"
            className="w-full h-11 rounded-xl border-[1.5px] border-input bg-muted/60 pr-10 pl-10 text-[13px]
                       placeholder:text-muted-foreground/70 outline-none
                       focus:border-ring focus:bg-card transition-[border-color,background-color]"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="پاک کردن جست‌وجو"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 grid place-items-center size-6 rounded-full
                         text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none"
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        {/* ریل دسته‌ها */}
        {cats === null ? (
          <div className="flex gap-1.5">
            {[...Array(4)].map((_, i) => (
              <Sk key={i} className="h-8 w-16 rounded-full shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="دسته‌بندی">
            <FilterChip active={!categoryId} onClick={() => pickCategory(null)}>
              همه
            </FilterChip>
            {cats.map((c) => (
              <FilterChip key={c.id} active={categoryId === c.id} onClick={() => pickCategory(c.id)}>
                {c.iconUrl && <span aria-hidden>{c.iconUrl}</span>}
                {c.name}
              </FilterChip>
            ))}
          </div>
        )}

        {/* ریل مهارت‌ها — بعد از انتخاب دسته */}
        {categoryId && currentCat && currentCat.skills.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-2.5 border-t border-border/60" role="group" aria-label="مهارت‌ها">
            <FilterChip active={!skillId} onClick={() => setSkillId(null)}>
              همهٔ مهارت‌ها
            </FilterChip>
            {currentCat.skills.map((s) => (
              <FilterChip key={s.id} active={skillId === s.id} onClick={() => setSkillId(s.id)}>
                {s.name}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {/* سربرگ جدول جایگاه */}
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-[11.5px] font-bold text-muted-foreground inline-flex items-center gap-1.5 min-w-0">
          <Icon name="trophy" size={13} className="text-primary shrink-0" />
          <span className="truncate">جایگاه‌ها بر پایهٔ مجموع ستاره‌ها</span>
        </p>
        {searching ? (
          <Spinner size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <span className="inline-flex items-center h-6 px-2 rounded-full bg-muted text-[10px] font-bold text-muted-foreground nums-fa shrink-0">
            {toFa(total)} نفر
          </span>
        )}
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-[12px] font-bold text-destructive">
          {error}
        </div>
      )}

      {/* لیست نتایج */}
      {searching && rows.length === 0 ? (
        <div className="grid place-items-center py-8" role="status" aria-label="در حال جست‌وجو">
          <Spinner size={24} className="text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <span className="grid place-items-center size-10 rounded-xl bg-muted text-muted-foreground mx-auto">
            <Icon name="search" size={18} />
          </span>
          <p className="text-[12.5px] font-bold text-muted-foreground mt-2">استعدادی پیدا نشد</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1 leading-5">
            عبارت دیگری را جست‌وجو کنید یا فیلتر دسته/مهارت را تغییر دهید.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
            <SearchRow key={t.id} t={t} />
          ))}
          {total > rows.length && !searching && (
            <Btn
              variant="outline"
              size="sm"
              full
              loading={loadingMore}
              onClick={loadMore}
              icon={<Icon name="chevronDown" size={14} />}
            >
              نمایش بیشتر
            </Btn>
          )}
        </div>
      )}
    </section>
  );
}

/* ═══════════════ ردیف جدول جایگاه (جست‌وجوی استعداد) ═══════════════ */
function SearchRow({ t }: { t: SearchTalent }) {
  const { busy, start } = useStartChat();

  return (
    <article className="rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/30">
      <div className="flex items-center gap-2.5">
        {/* جایگاه */}
        <span
          className={cn("grid place-items-center size-8 rounded-lg text-[12.5px] font-black nums-fa shrink-0", medalClass(t.rank))}
          title={`جایگاه ${toFa(t.rank)}`}
          aria-label={`جایگاه ${toFa(t.rank)}`}
        >
          <span className="sr-only">جایگاه </span>
          {toFa(t.rank)}
        </span>
        {/* آواتار گرد (با قاب) */}
        <button
          onClick={() => navigate({ view: "profile", id: t.id })}
          className="shrink-0 hover:opacity-90 transition-opacity"
          aria-label={`پروفایل ${t.name}`}
        >
          <UserAvatar name={t.name} avatarUrl={t.avatarUrl} gender={t.gender} size="md" frame={t.frame} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => navigate({ view: "profile", id: t.id })}
              className="font-bold text-[14px] truncate min-w-0 flex-1 text-right hover:text-primary transition-colors"
            >
              {t.name}
            </button>
            <StarsChip frame={t.frame} stars={t.totalStars} />
          </div>
          <div className="flex items-center gap-1.5 min-w-0 mt-1">
            {t.mainCategoryName && (
              <span className="inline-flex items-center h-6 px-2 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                {t.mainCategoryName}
              </span>
            )}
            {t.bioShort && (
              <p className="text-[11px] text-muted-foreground truncate flex-1 min-w-0">{t.bioShort}</p>
            )}
          </div>
        </div>
      </div>
      {/* اکشن‌ها */}
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/60">
        <Btn
          variant="outline"
          size="sm"
          icon={<Icon name="user" size={13} />}
          onClick={() => navigate({ view: "profile", id: t.id })}
        >
          پروفایل
        </Btn>
        <Btn variant="soft" size="sm" loading={busy} icon={<Icon name="chat" size={13} />} onClick={() => start(t.id)}>
          گفتگو
        </Btn>
      </div>
    </article>
  );
}

/* ═══════════════ ردیف چهره برتر / استعداد در حال رشد ═══════════════ */
function TalentRow({ talent, kind, onNominate }: { talent: ScoutTalent; kind: "elite" | "rising"; onNominate?: () => void }) {
  const { busy, start } = useStartChat();
  const location =
    talent.province || talent.city ? [talent.city, talent.province].filter(Boolean).join("، ") : null;

  return (
    <article className="rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-3">
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
            frame={talent.frame}
            topTalent={talent.isTopTalent}
            ringColor={talent.isTopTalent ? null : talent.mainCategoryColor || "var(--primary)"}
          />
        </button>

        <div className="flex-1 min-w-0">
          {/* نام + چیپ قاب چهره برتر */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <button
              onClick={() => navigate({ view: "profile", id: talent.id })}
              className="font-bold text-[14.5px] truncate min-w-0 hover:text-primary transition-colors"
            >
              {talent.name}
            </button>
            {talent.isVerifiedBadge && <Icon name="badgeCheck" className="w-4 h-4 text-gold shrink-0" />}
            {kind === "elite" && talent.frame && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-black border shrink-0",
                  talent.frame === "gold"
                    ? "bg-amber-600/10 border-amber-500/25 text-amber-700 dark:text-amber-400"
                    : "bg-slate-600/10 border-slate-500/25 text-slate-600 dark:text-slate-300"
                )}
                title={talent.frame === "gold" ? "چهره برتر طلایی" : "چهره برتر نقره‌ای"}
              >
                <Icon name="crown" size={11} />
                {talent.frame === "gold" ? "چهره برتر طلایی" : "چهره برتر نقره‌ای"}
              </span>
            )}
          </div>

          {/* ستاره (+ رأی برای در حال رشد) */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <StarsChip frame={talent.frame} stars={talent.totalStars ?? 0} />
            {kind === "rising" && (
              <span className="inline-flex items-center h-6 px-2 rounded-full bg-muted text-muted-foreground text-[10px] font-bold nums-fa shrink-0">
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
            <p className="text-[11.5px] text-muted-foreground truncate leading-5 mt-1.5">{talent.bioShort}</p>
          )}

          {/* مکان */}
          {location && (
            <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
              <Icon name="mapPin" className="w-3 h-3" />
              {location}
            </p>
          )}
        </div>
      </div>

      {/* اکشن‌ها */}
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/60">
        <Btn
          variant="outline"
          size="sm"
          icon={<Icon name="user" size={13} />}
          onClick={() => navigate({ view: "profile", id: talent.id })}
        >
          پروفایل
        </Btn>
        {kind === "elite" ? (
          <Btn variant="soft" size="sm" loading={busy} icon={<Icon name="chat" size={13} />} onClick={() => start(talent.id)}>
            گفتگو
          </Btn>
        ) : (
          <Btn
            variant="outline"
            size="sm"
            className="border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/15 shadow-none"
            icon={<Icon name="award" size={13} />}
            onClick={onNominate}
          >
            معرفی به ادمین
          </Btn>
        )}
        <span className="ms-auto inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground nums-fa shrink-0">
          <Icon name="users" className="w-3 h-3" />
          {formatCount(talent.followersCount)} دنبال‌کننده
        </span>
      </div>
    </article>
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

/** شروع گفتگو با استعداد → POST /api/chat/start */
function useStartChat() {
  const [busy, setBusy] = useState(false);
  async function start(userId: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await apiPost<{ conversationId: string; status: string }>("/api/chat/start", { userId });
      navigate({ view: "chat", conversationId: res.conversationId });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }
  return { busy, start };
}

/** چیپ ستاره — رنگ‌بندی بر پایهٔ قاب (طلایی/نقره‌ای/ساده) */
function StarsChip({ frame, stars }: { frame: FrameLevel; stars: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-black border shrink-0 nums-fa",
        frame === "gold"
          ? "bg-amber-600/10 border-amber-500/25 text-amber-700 dark:text-amber-400"
          : frame === "silver"
          ? "bg-slate-600/10 border-slate-500/25 text-slate-600 dark:text-slate-300"
          : "bg-muted border-transparent text-muted-foreground"
      )}
      title={`${toFa(stars)} ستاره`}
    >
      <Icon name="star" size={11} />
      {formatCount(stars)} ستاره
    </span>
  );
}

/** چیپ فیلتر فشرده — دسته/مهارت */
function FilterChip({
  active,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "shrink-0 h-8 px-3 rounded-full text-[11.5px] font-extrabold min-w-11 inline-flex items-center gap-1",
        "transition-colors duration-200 outline-none",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="h-16 rounded-xl border border-border bg-card flex items-center gap-2 px-2.5">
      <span className="grid place-items-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon name={icon} size={15} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-black nums-fa leading-none">{value}</p>
        <p className="text-[9.5px] font-bold text-muted-foreground truncate mt-1 leading-none">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center size-8 rounded-xl bg-primary/10 text-primary shrink-0">
        <Icon name={icon} size={15} strokeWidth={2.2} />
      </span>
      <h2 className="text-[15px] font-black tracking-tight">{title}</h2>
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
    <div className="flex flex-col items-center text-center gap-2.5 p-7 rounded-2xl border border-dashed border-border bg-card">
      <span className="grid place-items-center size-11 rounded-xl bg-muted text-muted-foreground">
        <Icon name={icon} size={20} strokeWidth={2} />
      </span>
      <p className="text-[12px] text-muted-foreground leading-6 max-w-sm font-bold">{text}</p>
      {action}
    </div>
  );
}

function TalentSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="در حال بارگذاری">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-start gap-3">
            <Sk circle className="w-14 h-14" />
            <div className="flex-1 space-y-2">
              <Sk className="h-4 w-36 rounded" />
              <Sk className="h-3 w-24 rounded" />
              <Sk className="h-3 w-2/3 rounded" />
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-border/60 flex gap-2">
            <Sk className="h-9 w-24 rounded-2xl" />
            <Sk className="h-9 w-24 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
