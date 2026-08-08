"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { MyNeedsData, NeedListItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatCount } from "@/lib/format";
import { getProvinceName } from "@/lib/geo";
import {
  Briefcase,
  Plus,
  Inbox,
  Send,
  MapPin,
  Users,
  Clock,
  ChevronLeft,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "posted" | "applied";

export function MyNeedsView() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<MyNeedsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("posted");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<MyNeedsData>("/api/needs/my-needs");
      setData(d);
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load, reloadKey]);

  /* ── Guest state ── */
  if (!userLoading && !user) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Header />
        <Card className="p-0 rounded-2xl border-border/60 overflow-hidden">
          <EmptyState
            kind="jobs"
            title="برای مشاهده نیازمندی‌های خود وارد شوید"
            description="پس از ورود، نیازمندی‌های ثبت‌شده و درخواست‌های شما در این صفحه نمایش داده می‌شود."
            action={
              <Button
                onClick={() => navigate({ view: "auth" })}
                className="gap-1.5 rounded-2xl"
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

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Header />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="grid grid-cols-2 h-11 rounded-2xl bg-muted border border-border p-1">
          <TabsTrigger
            value="posted"
            className="rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5"
          >
            <Inbox className="w-4 h-4" />
            نیازمندی‌های من
            {data && data.posted.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] h-4 px-1 rounded-md font-bold"
              >
                {toFa(data.posted.length)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="applied"
            className="rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5"
          >
            <Send className="w-4 h-4" />
            درخواست‌های من
            {data && data.applied.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] h-4 px-1 rounded-md font-bold"
              >
                {toFa(data.applied.length)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <ListSkeleton />
      ) : tab === "posted" ? (
        data && data.posted.length > 0 ? (
          <div className="space-y-3">
            {data.posted.map((need, i) => (
              <PostedNeedCard key={need.id} need={need} index={i} />
            ))}
          </div>
        ) : (
          <Card className="p-0 rounded-2xl border-border/60 overflow-hidden">
            <EmptyState
              kind="jobs"
              title="هنوز نیازمندی ثبت نکرده‌اید"
              description="اولین نیازمندی خود را ثبت کنید تا افراد مرتبط با آن آگاه شوند."
              action={
                <Button
                  onClick={() => navigate({ view: "create-need" })}
                  className="gap-1.5 rounded-2xl"
                >
                  <Plus className="w-4 h-4" />
                  ثبت نیازمندی
                </Button>
              }
            />
          </Card>
        )
      ) : data && data.applied.length > 0 ? (
        <div className="space-y-3">
          {data.applied.map((a, i) => (
            <AppliedNeedCard
              key={a.id}
              applicationId={a.id}
              message={a.message}
              createdAt={a.createdAt}
              need={a.need}
              index={i}
            />
          ))}
        </div>
      ) : (
        <Card className="p-0 rounded-2xl border-border/60 overflow-hidden">
          <EmptyState
            kind="jobs"
            title="درخواستی ثبت نکرده‌اید"
            description="نیازمندی‌های دیگران را بررسی کنید و برای موارد مرتبط درخواست بفرستید."
            action={
              <Button
                variant="outline"
                onClick={() => navigate({ view: "needs" })}
                className="gap-1.5 rounded-2xl"
              >
                <Briefcase className="w-4 h-4" />
                مرور نیازمندی‌ها
              </Button>
            }
          />
        </Card>
      )}
    </div>
  );
}

/* ── Header ── */
function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-11 h-11 rounded-2xl bg-primary text-primary-foreground shadow-md">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold leading-tight">
            نیازمندی‌های من
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            مدیریت نیازمندی‌ها و درخواست‌ها
          </p>
        </div>
      </div>
      <Button
        onClick={() => navigate({ view: "create-need" })}
        className="gap-1.5 rounded-xl font-bold h-10"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">ثبت نیازمندی</span>
      </Button>
    </motion.div>
  );
}

/* ── Posted need card ── */
function PostedNeedCard({
  need,
  index,
}: {
  need: NeedListItem;
  index: number;
}) {
  const isClosed = need.status === "closed";
  const locationLabel = need.city
    ? `${need.city}${need.province ? `، ${getProvinceName(need.province)}` : ""}`
    : need.province
    ? getProvinceName(need.province)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Card
        onClick={() => navigate({ view: "need", id: need.id })}
        className="p-4 rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-sm leading-7 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {need.title}
          </h3>
          <Badge
            variant={isClosed ? "secondary" : "outline"}
            className={cn(
              "shrink-0 text-[10px] h-5 rounded-md font-medium",
              !isClosed && "border-success/40 text-success"
            )}
          >
            {isClosed ? "بسته" : "باز"}
          </Badge>
        </div>

        <p className="text-[13px] text-muted-foreground leading-7 line-clamp-2 mb-2">
          {need.description}
        </p>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" />
            {formatCount(need.applicationCount)} درخواست
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgoFa(need.createdAt)}
          </span>
          {locationLabel && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationLabel}
            </span>
          )}
          <ChevronLeft className="w-4 h-4 mr-auto text-muted-foreground/60 group-hover:text-primary transition-colors" />
        </div>
      </Card>
    </motion.div>
  );
}

/* ── Applied need card ── */
function AppliedNeedCard({
  applicationId: _applicationId,
  message,
  createdAt,
  need,
  index,
}: {
  applicationId: string;
  message: string;
  createdAt: string;
  need: NeedListItem;
  index: number;
}) {
  void _applicationId;
  const isClosed = need.status === "closed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Card
        onClick={() => navigate({ view: "need", id: need.id })}
        className="p-4 rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-bold text-sm leading-7 line-clamp-2 group-hover:text-primary transition-colors flex-1">
                {need.title}
              </h3>
              {isClosed && (
                <Badge
                  variant="secondary"
                  className="shrink-0 text-[10px] h-5 rounded-md font-medium"
                >
                  بسته
                </Badge>
              )}
            </div>
            {message ? (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-6 mb-2 p-2 rounded-lg bg-muted/40">
                {message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic line-clamp-1 leading-6 mb-2">
                بدون پیام
              </p>
            )}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <UserAvatar
                name={need.user.name}
                avatarUrl={need.user.avatarUrl}
                verified={need.user.isVerifiedBadge}
                size="xs"
              />
              <span className="font-semibold truncate max-w-[100px]">
                {need.user.name}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgoFa(createdAt)}
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0 mt-2" />
        </div>
      </Card>
    </motion.div>
  );
}

/* ── Skeleton ── */
function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-4 rounded-2xl border-border/60 shadow-sm">
          <Skeleton className="h-5 w-3/4 rounded mb-2" />
          <Skeleton className="h-12 w-full rounded mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </Card>
      ))}
    </div>
  );
}
