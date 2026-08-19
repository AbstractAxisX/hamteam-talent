"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { NotificationCounts } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationsData = {
  notifications: Notification[];
  unreadCount: number;
  counts: NotificationCounts;
};

const TABS: { id: keyof NotificationCounts; label: string; iconName: string }[] = [
  { id: "all", label: "همه", iconName: "bell" },
  { id: "job_match", label: "نیازمندی", iconName: "briefcase" },
  { id: "connection", label: "ارتباط", iconName: "users" },
  { id: "chat", label: "چت", iconName: "chat" },
  { id: "broadcast", label: "سراسری", iconName: "sparkles" },
];

// Map notification type to icon name + color class
function notifIconAndColor(type: string): { iconName: string; tint: string; ring: string } {
  switch (true) {
    case type === "job_match":
      return { iconName: "briefcase", tint: "text-primary", ring: "bg-primary/10" };
    case type.startsWith("connection"):
      return { iconName: "userPlus", tint: "text-gold", ring: "bg-gold/10" };
    case type === "chat" || type === "chat_message":
      return { iconName: "chat", tint: "text-success", ring: "bg-success/10" };
    case type === "broadcast":
      return { iconName: "sparkles", tint: "text-rose", ring: "bg-rose/10" };
    default:
      return { iconName: "bell", tint: "text-muted-foreground", ring: "bg-muted" };
  }
}

export function NotificationsView() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<keyof NotificationCounts>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<NotificationsData>("/api/notifications");
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

  const filtered = (() => {
    if (!data) return [];
    if (tab === "all") return data.notifications;
    if (tab === "job_match")
      return data.notifications.filter((n) => n.type === "job_match");
    if (tab === "connection")
      return data.notifications.filter((n) => n.type.startsWith("connection"));
    if (tab === "chat")
      return data.notifications.filter((n) => n.type === "chat" || n.type === "chat_message");
    if (tab === "broadcast")
      return data.notifications.filter((n) => n.type === "broadcast");
    return data.notifications;
  })();

  async function markAllRead() {
    try {
      const r = await apiPost<{ ok: boolean; unreadCount: number; counts: NotificationCounts }>("/api/notifications", {
        action: "markAllRead",
      });
      setData((d) =>
        d
          ? {
              notifications: d.notifications.map((n) => ({ ...n, read: true })),
              unreadCount: r.unreadCount,
              counts: r.counts,
            }
          : d
      );
      toast({ title: "خوانده شد", description: "همه‌ی اعلان‌ها خوانده شدند." });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function markOneRead(n: Notification) {
    // Optimistic update
    setData((d) =>
      d
        ? {
            notifications: d.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
            unreadCount: Math.max(0, d.unreadCount - 1),
            counts: d.counts,
          }
        : d
    );
    try {
      await apiPost<{ ok: boolean; unreadCount: number; counts: NotificationCounts }>("/api/notifications", {
        id: n.id,
        action: "markRead",
      });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
    // Then navigate if link present
    if (n.link) {
      const hash = n.link.startsWith("#") ? n.link.slice(1) : n.link;
      const parts = hash.split("/");
      const view = parts[1] || "";
      if (view === "need" && parts[2]) navigate({ view: "need", id: parts[2] });
      else if (view === "profile" && parts[2]) navigate({ view: "profile", id: parts[2] });
      else if (view === "connections") navigate({ view: "connections" });
      else if (view === "chat") navigate({ view: "chat", conversationId: parts[2] });
      else if (view === "post" && parts[2]) navigate({ view: "post", id: parts[2] });
      else if (view === "feed") navigate({ view: "feed" });
      else if (view === "dashboard") navigate({ view: "dashboard" });
    }
  }

  if (!userLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Header unreadCount={null} loading={false} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="glass p-8 text-center space-y-3 shadow-card rounded-3xl border-border/50">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
              <Icon name="lock" className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg">برای مشاهده اعلان‌ها وارد شوید</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-6">
              اعلان‌های نیازمندی، ارتباط، چت و پیام‌های سراسری در این صفحه قرار می‌گیرند.
            </p>
            <Button
              onClick={() => navigate({ view: "auth" })}
              className="gap-1.5 rounded-2xl font-bold mx-auto bg-primary text-primary-foreground"
            >
              ورود / ثبت‌نام
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Header unreadCount={unread} loading={loading} onMarkAll={markAllRead} />

      <Tabs
        value={tab as string}
        onValueChange={(v) => setTab(v as keyof NotificationCounts)}
        className="w-full"
      >
        <TabsList className="w-full h-12 rounded-2xl glass border border-border/50 p-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const c = data?.counts[t.id] ?? 0;
            return (
              <TabsTrigger
                key={t.id}
                value={t.id as string}
                className="gap-1.5 flex-1 min-w-[80px] rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft"
              >
                <Icon name={t.iconName} className="w-4 h-4" />
                {t.label}
                {c > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-gold/20 text-gold border border-gold/30">
                    {toFa(c)}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={tab as string} className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState
              kind="notif"
              title="اعلانی برای این دسته ندارید"
              description="وقتی اعلان جدیدی برسد، اینجا نمایش داده می‌شود."
            />
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((n, i) => {
                  const { iconName, tint, ring } = notifIconAndColor(n.type);
                  return (
                    <motion.button
                      key={n.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.25), ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => markOneRead(n)}
                      className={cn(
                        "w-full text-right p-4 rounded-2xl border transition-all hover:shadow-lift",
                        n.read
                          ? "glass border-border/40"
                          : "glass-strong border-primary/30 hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("grid place-items-center w-10 h-10 rounded-xl shrink-0", ring, tint)}>
                          <Icon name={iconName} className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm truncate">{n.title}</p>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-label="خوانده نشده" />
                            )}
                          </div>
                          {n.body && (
                            <p className="text-xs text-muted-foreground leading-6 mt-1 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/70 mt-1 nums-fa">
                            {timeAgoFa(n.createdAt)}
                          </p>
                        </div>
                        {n.link && (
                          <Icon name="chevronLeft" className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Header({
  unreadCount,
  loading,
  onMarkAll,
}: {
  unreadCount: number | null;
  loading: boolean;
  onMarkAll?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="grid place-items-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0 relative">
            <Icon name="bell" className="w-7 h-7" />
            {unreadCount !== null && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[24px] h-6 px-1.5 grid place-items-center rounded-full bg-gold text-background text-[11px] font-black border-2 border-background nums-fa">
                {toFa(unreadCount > 99 ? 99 : unreadCount)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">اعلان‌ها</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-6">
              {loading
                ? "در حال بارگذاری..."
                : unreadCount !== null && unreadCount > 0
                ? `${toFa(unreadCount)} اعلان خوانده نشده`
                : "همه‌ی اعلان‌ها خوانده شده"}
            </p>
          </div>
        </div>
        {unreadCount !== null && unreadCount > 0 && (
          <Button
            onClick={onMarkAll}
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-2xl font-bold border-primary/30 text-primary hover:bg-primary/5"
          >
            <Icon name="check" className="w-4 h-4" />
            خواندن همه
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="glass p-4 border-border/50 rounded-2xl">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-2.5 w-16 rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
