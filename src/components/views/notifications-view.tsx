"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate, type Route } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa } from "@/lib/format";
import {
  Bell,
  Briefcase,
  UserPlus,
  UserCheck,
  Megaphone,
  MessageCircle,
  CheckCheck,
  Lock,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationCounts } from "@/lib/types";

/* ───────────────────────────── Types ───────────────────────────── */

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type NotifsData = {
  notifications: NotificationItem[];
  unreadCount: number;
  counts: NotificationCounts;
};

type Category = "all" | "job_match" | "connection" | "chat" | "broadcast";

const CATEGORY_LABEL: Record<Category, string> = {
  all: "همه",
  job_match: "نیازمندی",
  connection: "ارتباط",
  chat: "چت",
  broadcast: "سراسری",
};

/* ───────────────────────────── Helpers ───────────────────────────── */

function iconFor(type: string): LucideIcon {
  switch (true) {
    case type === "job_match":
      return Briefcase;
    case type.startsWith("connection_request"):
      return UserPlus;
    case type.startsWith("connection_accepted"):
      return UserCheck;
    case type === "broadcast":
      return Megaphone;
    case type === "chat" || type === "chat_message":
      return MessageCircle;
    default:
      return Bell;
  }
}

// Solid color tints (calm petrol-teal palette — no neon)
function colorFor(type: string): string {
  switch (true) {
    case type === "job_match":
      return "bg-gold/15 text-gold";
    case type.startsWith("connection"):
      return "bg-success/15 text-success";
    case type === "broadcast":
      return "bg-accent text-accent-foreground";
    case type === "chat" || type === "chat_message":
      return "bg-primary/12 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function handleLink(link: string | null) {
  if (!link) return;
  const hash = link.startsWith("#") ? link.slice(1) : link;
  const parts = hash.replace(/^\//, "").split("/");
  const view = parts[0];
  const id = parts[1];
  let route: Route | null = null;
  switch (view) {
    case "discover":
    case "explore":
      route = { view: "discover" };
      break;
    case "talents":
    case "people":
      route = { view: "talents" };
      break;
    case "need":
    case "needs":
      if (id) route = { view: "need", id };
      else route = { view: "needs" };
      break;
    case "profile":
      if (id) route = { view: "profile", id };
      break;
    case "chat":
      route = { view: "chat", conversationId: id };
      break;
    case "connections":
      route = { view: "connections" };
      break;
    case "notifications":
      route = { view: "notifications" };
      break;
    case "feed":
      route = { view: "feed" };
      break;
    default:
      break;
  }
  if (route) navigate(route);
}

/* ───────────────────────────── Main View ───────────────────────────── */

export function NotificationsView() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<NotifsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<Category>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<NotifsData>("/api/notifications");
      setData(d);
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const notifications = prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      // Recompute counts
      const counts: NotificationCounts = {
        all: unreadCount,
        job_match: 0,
        connection: 0,
        chat: 0,
        broadcast: 0,
      };
      for (const n of notifications) {
        if (n.read) continue;
        switch (true) {
          case n.type === "job_match":
            counts.job_match++;
            break;
          case n.type.startsWith("connection"):
            counts.connection++;
            break;
          case n.type === "chat" || n.type === "chat_message":
            counts.chat++;
            break;
          case n.type === "broadcast":
            counts.broadcast++;
            break;
        }
      }
      return { notifications, unreadCount, counts };
    });
    try {
      await apiPost("/api/notifications", { id, action: "markRead" });
    } catch {
      // ignore — optimistic is fine
    }
  }, []);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiPost("/api/notifications", { action: "markAllRead" });
      setData((prev) => {
        if (!prev) return prev;
        return {
          notifications: prev.notifications.map((n) => ({
            ...n,
            read: true,
          })),
          unreadCount: 0,
          counts: {
            all: 0,
            job_match: 0,
            connection: 0,
            chat: 0,
            broadcast: 0,
          },
        };
      });
      toast({
        title: "همه خوانده شدند",
        description: "اعلان‌ها به‌عنوان خوانده‌شده علامت‌گذاری شدند.",
      });
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setMarkingAll(false);
    }
  };

  // Filter notifications client-side based on active tab
  const filteredNotifications = useMemo(() => {
    if (!data) return [];
    if (activeTab === "all") return data.notifications;
    return data.notifications.filter((n) => {
      switch (activeTab) {
        case "job_match":
          return n.type === "job_match";
        case "connection":
          return n.type.startsWith("connection");
        case "chat":
          return n.type === "chat" || n.type === "chat_message";
        case "broadcast":
          return n.type === "broadcast";
        default:
          return true;
      }
    });
  }, [data, activeTab]);

  const counts = data?.counts ?? {
    all: 0,
    job_match: 0,
    connection: 0,
    chat: 0,
    broadcast: 0,
  };
  const unreadCount = data?.unreadCount ?? 0;

  /* ── Not logged in ── */
  if (!userLoading && !user) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <PageHeader
          unreadCount={0}
          onMarkAllRead={markAllRead}
          markingAll={markingAll}
        />
        <Card className="p-0 rounded-2xl border-border/60 overflow-hidden">
          <EmptyState
            kind="notif"
            title="برای مشاهده اعلان‌ها وارد شوید"
            description="اعلان‌های درخواست ارتباط، نیازمندی‌های جدید و پیام‌های شما در این صفحه نمایش داده می‌شود."
            action={
              <Button
                onClick={() => navigate({ view: "auth" })}
                className="gap-1.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90"
              >
                <Lock className="w-4 h-4" />
                ورود / ثبت‌نام
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const tabs: { key: Category; label: string; count: number }[] = [
    { key: "all", label: CATEGORY_LABEL.all, count: counts.all },
    { key: "job_match", label: CATEGORY_LABEL.job_match, count: counts.job_match },
    {
      key: "connection",
      label: CATEGORY_LABEL.connection,
      count: counts.connection,
    },
    { key: "chat", label: CATEGORY_LABEL.chat, count: counts.chat },
    { key: "broadcast", label: CATEGORY_LABEL.broadcast, count: counts.broadcast },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        markingAll={markingAll}
      />

      {/* ═══ Category tabs ═══ */}
      <div className="-mx-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-1 w-max pb-1">
          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {t.label}
                {t.count > 0 && (
                  <span
                    className={cn(
                      "inline-grid place-items-center min-w-[18px] h-[18px] px-1 text-[10px] rounded-full font-bold",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {toFa(t.count)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Notifications list ═══ */}
      {loading ? (
        <ListSkeleton />
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-0 rounded-2xl border-border/60 overflow-hidden">
          <EmptyState
            kind="notif"
            title={
              activeTab === "all"
                ? "اعلانی ندارید"
                : `اعلان ${CATEGORY_LABEL[activeTab]} ندارید`
            }
            description={
              activeTab === "all"
                ? "وقتی رویداد جدیدی رخ دهد — درخواست ارتباط، نیازمندی مطابق مهارت‌های شما یا پیام جدید — اینجا نمایش داده می‌شود."
                : "وقتی اعلان جدیدی در این دسته‌بندی ثبت شود، اینجا نمایش داده می‌شود."
            }
            action={
              activeTab === "all" ? (
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "discover" })}
                  className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5"
                >
                  کاوش کردن
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("all")}
                  className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5"
                >
                  مشاهده همه اعلان‌ها
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2.5">
            {filteredNotifications.map((n, i) => {
              const Icon = iconFor(n.type);
              const color = colorFor(n.type);
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                    delay: Math.min(i * 0.04, 0.4),
                  }}
                >
                  <Card
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                      handleLink(n.link);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!n.read) markRead(n.id);
                        handleLink(n.link);
                      }
                    }}
                    className={cn(
                      "p-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-2xl border-border/60 shadow-sm",
                      !n.read
                        ? "bg-primary/5 border-primary/25"
                        : "bg-card"
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={cn(
                          "grid place-items-center w-11 h-11 rounded-2xl shrink-0",
                          color
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm leading-snug">
                            {n.title}
                          </h3>
                          {!n.read && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 20,
                              }}
                              className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5 ring-4 ring-primary/15"
                              aria-label="خوانده‌نشده"
                            />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-1.5 leading-6 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/80 mt-2 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          {timeAgoFa(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

/* ───────────────────────────── Header ───────────────────────────── */

function PageHeader({
  unreadCount,
  onMarkAllRead,
  markingAll,
}: {
  unreadCount: number;
  onMarkAllRead: () => void;
  markingAll: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-11 h-11 rounded-2xl bg-primary text-primary-foreground shadow-md">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold leading-tight tracking-tight">
            اعلان‌ها
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            {unreadCount > 0 ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {toFa(unreadCount)} اعلان خوانده‌نشده
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-gold/70" />
                همه اعلان‌ها خوانده شده‌اند
              </>
            )}
          </p>
        </div>
      </div>
      {unreadCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5"
          disabled={markingAll}
          onClick={onMarkAllRead}
        >
          <CheckCheck className="w-4 h-4" />
          <span className="hidden sm:inline">همه خوانده شد</span>
          <span className="sm:hidden">خواندن</span>
        </Button>
      )}
    </motion.div>
  );
}

/* ───────────────────────────── Skeleton ───────────────────────────── */

function ListSkeleton() {
  return (
    <div className="space-y-2.5">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="p-4 rounded-2xl border-border/60 shadow-sm">
          <div className="flex items-start gap-3.5">
            <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
