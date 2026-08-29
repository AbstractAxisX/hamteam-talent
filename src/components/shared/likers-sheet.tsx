"use client";

/* ═══════════════════════════════════════════════════════════
   LikersSheet — مودال مشترک لیست لایک‌کنندگان (سرتاسر سایت)
   قرارداد Open-Closed: فقط fetcher پاس داده می‌شود؛
   برای هر موجودیت جدید (پست/کامنت/نمونه کار/...) بدون ویرایش همین فایل.
   fetcher(page) => { users: LikerUser[]; hasMore: boolean }
   ═══════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { navigate } from "@/lib/nav";
import { toFa } from "@/lib/format";
import { Icon } from "@/components/shared/icon";
import { GradAvatar } from "@/components/ui/grad-avatar";
import { Btn, IconBtn, Sk, SPRING } from "@/components/ui/atoms";

export type LikerUser = {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  isVerifiedBadge?: boolean;
  isTopTalent?: boolean;
};

export type LikersFetcher = (page: number) => Promise<{ users: LikerUser[]; hasMore: boolean }>;

export function LikersSheet({
  open, onClose, title, fetcher, emptyTitle = "هنوز کسی نبوده", emptyDesc = "اولین نفر باش!",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  fetcher: LikersFetcher;
  emptyTitle?: string;
  emptyDesc?: string;
}) {
  const [users, setUsers] = React.useState<LikerUser[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const reqId = React.useRef(0);

  /* بارگذاری صفحه‌ی n (افزودنی برای صفحات بعدی) */
  const load = React.useCallback(
    async (target: number, append: boolean) => {
      const id = ++reqId.current;
      if (!append) setState("loading");
      try {
        const res = await fetcher(target);
        if (id !== reqId.current) return; // پاسخ کهنه
        setUsers((prev) => (append ? [...prev, ...res.users] : res.users));
        setHasMore(res.hasMore);
        setState("ready");
      } catch {
        if (id === reqId.current) setState("error");
      }
    },
    [fetcher]
  );

  /* ریست هنگام باز شدن */
  React.useEffect(() => {
    if (open) {
      setUsers([]);
      setPage(1);
      setHasMore(false);
      setDragY(0);
      load(1, false);
    }
  }, [open, load]);

  /* قفل اسکرول + Escape */
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function openProfile(id: string) {
    onClose();
    navigate({ view: "profile", id });
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0.6, scale: 0.98 }}
            animate={{ y: dragging ? dragY : 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0.4, transition: { duration: 0.24, ease: [0.3, 0, 0.8, 0.15] } }}
            transition={SPRING.sheet}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragStart={() => setDragging(true)}
            onDrag={(_, info) => setDragY(Math.max(0, info.offset.y))}
            onDragEnd={(_, info) => {
              setDragging(false);
              setDragY(0);
              if (info.offset.y > 110 || info.velocity.y > 700) onClose();
            }}
            className="relative w-full sm:max-w-md max-h-[76dvh] flex flex-col
                       bg-card rounded-t-[30px] sm:rounded-[30px] border border-border/70 shadow-float overflow-hidden"
          >
            <div className="h-[3px] w-full grad-brand shrink-0" aria-hidden />

            {/* هدر قابل درگ */}
            <div
              className="shrink-0 px-4 pt-2 pb-3 flex items-center gap-3 border-b border-border/60 bg-card/95 backdrop-blur"
              style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
            >
              <span className="sm:hidden mx-auto w-11 h-1.5 rounded-full bg-border absolute left-1/2 -translate-x-1/2 top-1.5" aria-hidden />
              <div className="grid place-items-center size-10 rounded-2xl grad-brand shadow-grad shrink-0">
                <Icon name="heart" size={19} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-black text-foreground leading-tight truncate">{title}</h2>
                {state === "ready" && (
                  <p className="text-[11.5px] text-muted-foreground mt-0.5 nums-fa">
                    {toFa(users.length)} نفر{hasMore ? "+" : ""}
                  </p>
                )}
              </div>
              <IconBtn label="بستن" variant="soft" size={40} onClick={onClose}>
                <Icon name="x" size={18} />
              </IconBtn>
            </div>

            {/* لیست */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-2.5">
              {state === "loading" ? (
                <div className="space-y-2 px-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-1.5">
                      <Sk circle className="size-11" />
                      <div className="flex-1 space-y-2">
                        <Sk className="h-3.5 w-28" />
                        <Sk className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : state === "error" ? (
                <div className="py-10 flex flex-col items-center text-center px-6">
                  <div className="grid place-items-center size-16 rounded-[22px] bg-destructive/10">
                    <Icon name="alert" size={28} className="text-destructive" />
                  </div>
                  <p className="mt-3 text-[13.5px] font-black text-foreground">دریافت لیست ناموفق بود</p>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-6">اتصال اینترنت را بررسی کن و دوباره تلاش کن.</p>
                  <Btn variant="grad" size="md" className="mt-4" onClick={() => load(1, false)}>
                    تلاش مجدد
                  </Btn>
                </div>
              ) : users.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-center px-6">
                  <div className="grid place-items-center size-16 rounded-[22px] glass-strong shadow-soft">
                    <Icon name="heart" size={26} className="text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-[13.5px] font-black text-foreground">{emptyTitle}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-6">{emptyDesc}</p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-border/50">
                    {users.map((u, i) => (
                      <motion.li
                        key={u.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: Math.min(i, 8) * 0.02 }}
                      >
                        <button
                          onClick={() => openProfile(u.id)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted/70
                                     transition-colors text-right outline-none min-h-[60px]"
                        >
                          <GradAvatar
                            name={u.name}
                            src={u.avatarUrl ?? null}
                            size="lg"
                            verified={u.isVerifiedBadge}
                            topTalent={u.isTopTalent}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13.5px] font-black text-foreground truncate">{u.name}</span>
                            {u.username && (
                              <span className="block text-[11.5px] text-muted-foreground truncate" dir="ltr">
                                @{u.username}
                              </span>
                            )}
                          </span>
                          <Icon name="chevronLeft" size={16} className="text-muted-foreground shrink-0" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>

                  {hasMore && (
                    <div className="pt-3 px-2 pb-1 flex justify-center">
                      <Btn
                        variant="outline"
                        size="md"
                        onClick={() => {
                          const next = page + 1;
                          setPage(next);
                          load(next, true);
                        }}
                      >
                        <Icon name="chevronDown" size={16} />
                        نمایش بیشتر
                      </Btn>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─────────── فچر آماده برای پست‌ها — نقاط مصرف فقط این را می‌سازند ─────────── */

export function postLikersFetcher(postId: string): LikersFetcher {
  return async (page) => {
    const res = await fetch(`/api/posts/${postId}/likes?page=${page}`, { credentials: "same-origin" });
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return { users: data.users ?? [], hasMore: !!data.hasMore };
  };
}

export function commentLikersFetcher(commentId: string): LikersFetcher {
  return async (page) => {
    const res = await fetch(`/api/comments/${commentId}/likes?page=${page}`, { credentials: "same-origin" });
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return { users: data.users ?? [], hasMore: !!data.hasMore };
  };
}

export function portfolioLikersFetcher(itemId: string): LikersFetcher {
  return async (page) => {
    const res = await fetch(`/api/portfolio/${itemId}/likes?page=${page}`, { credentials: "same-origin" });
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return { users: data.users ?? [], hasMore: !!data.hasMore };
  };
}
