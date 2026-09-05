"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { BackButton } from "@/components/shared/back-button";
import type { MyNeedsData, NeedListItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatCount } from "@/lib/format";
import { getProvinceName } from "@/lib/geo";
import { cn } from "@/lib/utils";

export function MyNeedsView() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<MyNeedsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<MyNeedsData>("/api/needs/my-needs");
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

  if (!userLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <BackButton label="بازگشت" />
        <Header />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="glass p-8 text-center space-y-3 shadow-card rounded-3xl border-border/50">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
              <Icon name="lock" className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg">برای مشاهده نیازمندی‌های خود وارد شوید</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-6">
              نیازمندی‌های ارسالی و درخواست‌های شما در این صفحه نمایش داده می‌شود.
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

  const postedCount = data?.posted.length ?? 0;
  const appliedCount = data?.applied.length ?? 0;
  const defaultTab = postedCount > 0 || appliedCount === 0 ? "posted" : "applied";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <BackButton label="بازگشت" />
      <Header
        postedCount={loading ? null : postedCount}
        appliedCount={loading ? null : appliedCount}
      />

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full h-12 rounded-2xl glass border border-border/50 p-1">
          <TabsTrigger
            value="posted"
            className="gap-1.5 flex-1 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft"
          >
            <Icon name="upload" className="w-4 h-4" />
            ارسالی
            {postedCount > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary/15 text-primary border border-primary/30">
                {toFa(postedCount)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="applied"
            className="gap-1.5 flex-1 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft"
          >
            <Icon name="send" className="w-4 h-4" />
            درخواست‌های من
            {appliedCount > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-gold/20 text-gold border border-gold/30">
                {toFa(appliedCount)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Posted tab */}
        <TabsContent value="posted" className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : !data || data.posted.length === 0 ? (
            <EmptyState
              kind="jobs"
              title="هنوز نیازمندی‌ای منتشر نکرده‌اید"
              description="نیازها و فرصت‌های خود را ثبت کنید تا افراد مرتبط پیدا شوند."
              action={
                <Button onClick={() => navigate({ view: "create-need" })} className="gap-1.5 rounded-2xl font-bold">
                  <Icon name="plus" className="w-4 h-4" />
                  ثبت اولین نیازمندی
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.posted.map((need, i) => (
                <PostedNeedCard key={need.id} need={need} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Applied tab */}
        <TabsContent value="applied" className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : !data || data.applied.length === 0 ? (
            <EmptyState
              kind="jobs"
              title="هنوز درخواستی ثبت نکرده‌اید"
              description="نیازمندی‌های دیگران را مشاهده و برای آن‌ها درخواست بفرستید."
              action={
                <Button onClick={() => navigate({ view: "needs" })} className="gap-1.5 rounded-2xl font-bold">
                  <Icon name="briefcase" className="w-4 h-4" />
                  مرور نیازمندی‌ها
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.applied.map((a, i) => (
                <AppliedNeedCard key={a.id} need={a.need} message={a.message} appliedAt={a.createdAt} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Header({
  postedCount,
  appliedCount,
}: {
  postedCount?: number | null;
  appliedCount?: number | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="relative flex items-center gap-4">
        <div className="grid place-items-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0">
          <Icon name="briefcase" className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight leading-none">نیازمندی‌های من</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-6">مدیریت نیازمندی‌های ارسالی و درخواست‌های شما</p>
        </div>
      </div>

      {(postedCount !== undefined || appliedCount !== undefined) && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Card className="glass-strong p-3 rounded-2xl border-border/50 flex flex-col items-center text-center">
            <span className="text-2xl font-black text-primary nums-fa">{toFa(postedCount ?? 0)}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">ارسالی</span>
          </Card>
          <Card className="glass-strong p-3 rounded-2xl border-border/50 flex flex-col items-center text-center">
            <span className="text-2xl font-black text-gold nums-fa">{toFa(appliedCount ?? 0)}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">درخواست ثبت‌شده</span>
          </Card>
        </div>
      )}
    </motion.div>
  );
}

function PostedNeedCard({ need, index }: { need: NeedListItem; index: number }) {
  const isClosed = need.status === "closed";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        onClick={() => navigate({ view: "need", id: need.id })}
        className="glass p-5 border-border/50 hover:border-primary/40 hover:shadow-lift transition-all cursor-pointer group rounded-3xl"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[15px] leading-7 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {need.title}
          </h3>
          <Badge
            className={cn(
              "shrink-0 h-6 px-2 text-[10px] rounded-md font-medium",
              isClosed ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary border border-primary/30"
            )}
          >
            {isClosed ? "بسته" : "باز"}
          </Badge>
        </div>
        <p className="text-[13px] text-muted-foreground leading-7 line-clamp-2 mb-3 whitespace-pre-wrap break-words">
          {need.description}
        </p>
        {(need.categoryName || need.skills.length > 0) && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {need.categoryName && (
              <Badge variant="secondary" className="text-[10px] py-0 h-5 rounded-md font-medium">{need.categoryName}</Badge>
            )}
            {need.skills.slice(0, 3).map((s) => (
              <Badge key={s.id} variant="outline" className="text-[10px] py-0 h-5 rounded-md border-primary/25 text-primary font-medium">
                {s.name}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Icon name="users" className="w-3.5 h-3.5" />
            <span className="nums-fa">{formatCount(need.applicationCount)} درخواست</span>
          </span>
          <span className="inline-flex items-center gap-1 nums-fa">
            {timeAgoFa(need.createdAt)}
            <Icon name="chevronLeft" className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

function AppliedNeedCard({
  need,
  message,
  appliedAt,
  index,
}: {
  need: NeedListItem;
  message: string;
  appliedAt: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        onClick={() => navigate({ view: "need", id: need.id })}
        className="glass p-5 border-border/50 hover:border-primary/40 hover:shadow-lift transition-all cursor-pointer group rounded-3xl"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[15px] leading-7 line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {need.title}
          </h3>
          <Badge
            variant="outline"
            className="shrink-0 h-6 px-2 text-[10px] rounded-md border-gold/40 text-gold font-medium"
          >
            درخواست داده‌ام
          </Badge>
        </div>
        <p className="text-[13px] text-muted-foreground leading-7 line-clamp-1 mb-3 whitespace-pre-wrap break-words">
          {need.description}
        </p>
        {message && (
          <div className="rounded-xl bg-background/40 border border-border/50 p-2.5 mb-3">
            <p className="text-[10px] font-bold text-muted-foreground mb-0.5">پیام شما</p>
            <p className="text-[12px] text-foreground/90 leading-5 line-clamp-2">{message}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate({ view: "profile", id: need.user.id });
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <UserAvatar name={need.user.name} avatarUrl={need.user.avatarUrl} verified={need.user.isVerifiedBadge} size="sm" />
            <span className="text-xs font-semibold truncate max-w-[100px]">{need.user.name}</span>
          </button>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1 nums-fa">
            {timeAgoFa(appliedAt)}
            <Icon name="chevronLeft" className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="glass p-5 border-border/50 rounded-3xl space-y-3">
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-12 w-full rounded" />
          <div className="flex items-center gap-2 pt-3 border-t border-border/40">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </Card>
      ))}
    </div>
  );
}
