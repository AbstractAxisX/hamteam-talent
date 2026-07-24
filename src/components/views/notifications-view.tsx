"use client";

import { useEffect, useState, useCallback } from "react";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
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
  type LucideIcon,
} from "lucide-react";

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
      return MessageCircle;
    default:
      return Bell;
  }
}

function colorFor(type: string): string {
  switch (type) {
    case "job_match":
      return "bg-warning/15 text-warning";
    case "connection_request":
      return "bg-primary/10 text-primary";
    case "connection_accepted":
      return "bg-success/15 text-success";
    case "broadcast":
      return "bg-accent text-accent-foreground";
    case "chat":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function handleLink(link: string | null) {
  if (!link) return;
  // Link looks like `#/job/xxx`, `#/profile/xxx`, `#/chat/xxx`
  const hash = link.startsWith("#") ? link.slice(1) : link;
  const parts = hash.replace(/^\//, "").split("/");
  const view = parts[0];
  const id = parts[1];
  switch (view) {
    case "explore":
      navigate({ view: "explore" });
      break;
    case "people":
      navigate({ view: "people" });
      break;
    case "jobs":
      navigate({ view: "jobs" });
      break;
    case "job":
      if (id) navigate({ view: "job", id });
      break;
    case "profile":
      if (id) navigate({ view: "profile", id });
      break;
    case "chat":
      navigate({ view: "chat", conversationId: id });
      break;
    case "connections":
      navigate({ view: "connections" });
      break;
    case "notifications":
      navigate({ view: "notifications" });
      break;
    case "feed":
      navigate({ view: "feed" });
      break;
    default:
      break;
  }
}

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

  const markRead = useCallback(
    async (id: string) => {
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
    },
    []
  );

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

  if (!userLoading && !user) {
    return (
      <div className="space-y-4">
        <Header unreadCount={0} onMarkAllRead={markAllRead} markingAll={markingAll} />
        <Card className="p-8 text-center space-y-3">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg">برای مشاهده اعلان‌ها وارد شوید</h2>
          <p className="text-sm text-muted-foreground">
            اعلان‌های درخواست ارتباط، نیازمندی‌های جدید و پیام‌های شما در این صفحه نمایش داده می‌شود.
          </p>
          <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5">
            ورود / ثبت‌نام
          </Button>
        </Card>
      </div>
    );
  }

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  return (
    <div className="space-y-4">
      <Header
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        markingAll={markingAll}
      />

      {loading ? (
        <ListSkeleton />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="اعلانی ندارید"
          description="وقتی رویداد جدیدی رخ دهد — درخواست ارتباط، نیازمندی مطابق مهارت‌های شما یا پیام جدید — اینجا نمایش داده می‌شود."
          action={
            <Button
              variant="outline"
              onClick={() => navigate({ view: "explore" })}
              className="gap-1.5"
            >
              کاوش کردن
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = iconFor(n.type);
            const color = colorFor(n.type);
            return (
              <Card
                key={n.id}
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
                className={`p-4 cursor-pointer hover:shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  !n.read ? "bg-primary/[0.04] border-primary/20" : "bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-snug">
                        {n.title}
                      </h3>
                      {!n.read && (
                        <span
                          className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"
                          aria-label="خوانده‌نشده"
                        />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-1 leading-6 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/80 mt-2">
                      {timeAgoFa(n.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Header({
  unreadCount,
  onMarkAllRead,
  markingAll,
}: {
  unreadCount: number;
  onMarkAllRead: () => void;
  markingAll: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">اعلان‌ها</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `${toFa(unreadCount)} اعلان خوانده‌نشده`
              : "همه اعلان‌ها خوانده شده‌اند"}
          </p>
        </div>
      </div>
      {unreadCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={markingAll}
          onClick={onMarkAllRead}
        >
          <CheckCheck className="w-4 h-4" />
          <span className="hidden sm:inline">خواندن همه</span>
        </Button>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
