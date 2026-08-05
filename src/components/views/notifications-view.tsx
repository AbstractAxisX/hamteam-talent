"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
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
};

/* ───────────────────────────── Helpers ───────────────────────────── */

function iconFor(type: string): LucideIcon {
  switch (type) {
    case "job_match":
      return Briefcase;
    case "connection_request":
      return UserPlus;
    case "connection_accepted":
      return UserCheck;
    case "broadcast":
      return Megaphone;
    case "chat":
    case "chat_message":
      return MessageCircle;
    default:
      return Bell;
  }
}

// Per spec: connection=forest, broadcast=lime, chat=forest, job_match=gold.
function colorFor(type: string): string {
  switch (type) {
    case "job_match":
      return "bg-gold/15 text-gold";
    case "connection_request":
    case "connection_accepted":
      return "bg-forest/12 text-forest";
    case "broadcast":
      return "bg-lime/25 text-forest";
    case "chat":
    case "chat_message":
      return "bg-forest/12 text-forest";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// Translate legacy link strings into valid app routes.
// Old links use obsolete views (explore/people/jobs/job); map to current routes.
function handleLink(link: string | null) {
  if (!link) return;
  const hash = link.startsWith("#") ? link.slice(1) : link;
  const parts = hash.replace(/^\//, "").split("/");
  const view = parts[0];
  const id = parts[1];
  let route: Route | null = null;
  switch (view) {
    case "explore":
    case "discover":
      route = { view: "discover" };
      break;
    case "people":
    case "talents":
      route = { view: "talents" };
      break;
    case "jobs":
    case "job":
      // No dedicated jobs view in this app — fall back to feed.
      route = { view: "feed" };
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<NotifsData>("/api/notifications");
      setData(d);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
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
      return { notifications, unreadCount };
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
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        };
      });
      toast({ title: "همه خوانده شدند", description: "اعلان‌ها به‌عنوان خوانده‌شده علامت‌گذاری شدند." });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setMarkingAll(false);
    }
  };

  /* ── Not logged in ── */
  if (!userLoading && !user) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <PageHeader unreadCount={0} onMarkAllRead={markAllRead} markingAll={markingAll} />
        <Card className="p-0 rounded-2xl border-border/60 overflow-hidden">
          <EmptyState
            kind="notif"
            title="برای مشاهده اعلان‌ها وارد شوید"
            description="اعلان‌های درخواست ارتباط، نیازمندی‌های جدید و پیام‌های شما در این صفحه نمایش داده می‌شود."
            action={
              <Button
                onClick={() => navigate({ view: "auth" })}
                className="gap-1.5 rounded-2xl bg-lime text-forest font-bold hover:bg-lime/90"
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

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        markingAll={markingAll}
      />

      {loading ? (
        <ListSkeleton />
      ) : notifications.length === 0 ? (
        <Card className="p-0 rounded-2xl border-border/60 overflow-hidden">
          <EmptyState
            kind="notif"
            title="اعلانی ندارید"
            description="وقتی رویداد جدیدی رخ دهد — درخواست ارتباط، نیازمندی مطابق مهارت‌های شما یا پیام جدید — اینجا نمایش داده می‌شود."
            action={
              <Button
                variant="outline"
                onClick={() => navigate({ view: "discover" })}
                className="gap-1.5 rounded-2xl border-forest/30 text-forest hover:bg-forest/5"
              >
                کاوش کردن
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n, i) => {
            const Icon = iconFor(n.type);
            const color = colorFor(n.type);
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                    "p-4 cursor-pointer hover:shadow-md hover:border-forest/20 transition-all outline-none focus-visible:ring-2 focus-visible:ring-lime/60 rounded-2xl border-border/60 shadow-sm",
                    !n.read ? "bg-lime/5 border-lime/30" : "bg-card"
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
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            className="w-2.5 h-2.5 rounded-full bg-lime shrink-0 mt-1.5 ring-4 ring-lime/20"
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
        <div className="grid place-items-center w-11 h-11 rounded-2xl bg-forest text-lime shadow-md">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold leading-tight tracking-tight">
            اعلان‌ها
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            {unreadCount > 0 ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
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
          className="gap-1.5 rounded-2xl border-forest/30 text-forest hover:bg-forest/5"
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
