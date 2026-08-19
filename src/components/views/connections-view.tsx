"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── Spinner (no lucide) ── */
function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type OtherUser = {
  id: string;
  name: string;
  isVerifiedBadge: boolean;
  avatarUrl: string | null;
  bioShort: string;
};

type ConnItem = {
  id: string;
  otherUser: OtherUser;
  status: string;
  createdAt: string;
};

type ConnectionsData = {
  pending: ConnItem[];
  sent: ConnItem[];
  accepted: ConnItem[];
  counts: { pending: number; sent: number; accepted: number };
};

export function ConnectionsView() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<ConnectionsData>("/api/connections");
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
        <Header counts={null} loading={false} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="glass p-8 text-center space-y-3 shadow-card rounded-3xl border-border/50">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
              <Icon name="lock" className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg">برای مشاهده ارتباطات وارد شوید</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-6">
              درخواست‌های ارتباطی و افراد متصل شما در این صفحه نمایش داده می‌شود.
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

  const handleAccept = async (id: string) => {
    setActingId(id);
    try {
      await api(`/api/connections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" }),
      });
      toast({ title: "پذیرفته شد", description: "درخواست ارتباط پذیرفته شد." });
      await load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingId(id);
    try {
      await api(`/api/connections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject" }),
      });
      toast({ title: "رد شد", description: "درخواست ارتباط رد شد." });
      await load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const counts = data?.counts ?? { pending: 0, sent: 0, accepted: 0 };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Header counts={counts} loading={loading} />

      <Tabs defaultValue={counts.pending > 0 ? "pending" : "accepted"} className="w-full">
        <TabsList className="w-full h-12 rounded-2xl glass border border-border/50 p-1">
          <TabsTrigger
            value="pending"
            className="gap-1.5 flex-1 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft"
          >
            <Icon name="userPlus" className="w-4 h-4" />
            دریافتی
            {counts.pending > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-gold/20 text-gold border border-gold/30">
                {toFa(counts.pending)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="accepted"
            className="gap-1.5 flex-1 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft"
          >
            <Icon name="userCheck" className="w-4 h-4" />
            ارتباطات
            {counts.accepted > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary/15 text-primary border border-primary/30">
                {toFa(counts.accepted)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="gap-1.5 flex-1 rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft"
          >
            <Icon name="send" className="w-4 h-4" />
            ارسالی
            {counts.sent > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {toFa(counts.sent)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending received */}
        <TabsContent value="pending" className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : !data || data.pending.length === 0 ? (
            <EmptyState
              kind="connections"
              title="درخواست ارتباط جدیدی ندارید"
              description="وقتی کسی درخواست ارتباط با شما بفرستد، اینجا نمایش داده می‌شود."
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "discover" })}
                  className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                >
                  <Icon name="users" className="w-4 h-4" />
                  کشف استعدادها
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.pending.map((c, i) => (
                <PendingCard
                  key={c.id}
                  item={c}
                  index={i}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  acting={actingId === c.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Accepted */}
        <TabsContent value="accepted" className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : !data || data.accepted.length === 0 ? (
            <EmptyState
              kind="connections"
              title="هنوز ارتباطی ندارید"
              description="با ارسال درخواست ارتباط به همکاران، شبکه‌ی حرفه‌ای خود را بسازید."
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "discover" })}
                  className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                >
                  <Icon name="users" className="w-4 h-4" />
                  کشف استعدادها
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.accepted.map((c, i) => (
                <AcceptedCard key={c.id} item={c} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent */}
        <TabsContent value="sent" className="mt-4">
          {loading ? (
            <ListSkeleton />
          ) : !data || data.sent.length === 0 ? (
            <EmptyState
              kind="connections"
              title="درخواست ارسالی ندارید"
              description="درخواست‌های در انتظار پاسخ شما در اینجا نمایش داده می‌شود."
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "discover" })}
                  className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                >
                  <Icon name="users" className="w-4 h-4" />
                  کشف استعدادها
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.sent.map((c, i) => (
                <SentCard key={c.id} item={c} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Header({
  counts,
  loading,
}: {
  counts: { pending: number; sent: number; accepted: number } | null;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl glass border border-border/50 p-6 shadow-float"
    >
      <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="relative flex items-center gap-4">
        <div className="grid place-items-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-glow shrink-0">
          <Icon name="users" className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight leading-none">ارتباطات</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-6">مدیریت درخواست‌ها و شبکه‌ی حرفه‌ای شما</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {counts ? (
          <>
            <Card className="glass-strong p-3 rounded-2xl border-border/50 flex flex-col items-center text-center">
              <span className="text-xl font-black text-primary nums-fa">{toFa(counts.accepted)}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">ارتباطات</span>
            </Card>
            <Card className="glass-strong p-3 rounded-2xl border-border/50 flex flex-col items-center text-center">
              <span className="text-xl font-black text-gold nums-fa">{toFa(counts.pending)}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">دریافتی</span>
            </Card>
            <Card className="glass-strong p-3 rounded-2xl border-border/50 flex flex-col items-center text-center">
              <span className="text-xl font-black text-foreground nums-fa">{toFa(counts.sent)}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">ارسالی</span>
            </Card>
          </>
        ) : (
          [0, 1, 2].map((i) => (
            <Card key={i} className="glass-strong p-3 rounded-2xl border-border/50 flex flex-col items-center">
              {loading ? (
                <>
                  <Skeleton className="h-5 w-8 rounded" />
                  <Skeleton className="h-3 w-12 rounded mt-1" />
                </>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}

function PersonRow({
  item,
  actions,
  index = 0,
}: {
  item: ConnItem;
  actions?: React.ReactNode;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="glass p-4 hover:shadow-lift transition-shadow duration-300 rounded-3xl border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ view: "profile", id: item.otherUser.id })}
            aria-label={`پروفایل ${item.otherUser.name}`}
            className="shrink-0"
          >
            <UserAvatar
              name={item.otherUser.name}
              avatarUrl={item.otherUser.avatarUrl}
              verified={item.otherUser.isVerifiedBadge}
              size="lg"
              ringColor="oklch(0.6 0.15 160 / 0.3)"
            />
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => navigate({ view: "profile", id: item.otherUser.id })}
              className="font-bold text-sm hover:text-primary transition-colors truncate block text-right"
            >
              {item.otherUser.name}
            </button>
            {item.otherUser.bioShort ? (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 leading-5">{item.otherUser.bioShort}</p>
            ) : (
              <p className="text-xs text-muted-foreground/70 mt-0.5">بدون توضیحات</p>
            )}
            <p className="text-[10px] text-muted-foreground/80 mt-1 nums-fa">{timeAgoFa(item.createdAt)}</p>
          </div>
          {actions && <div className="shrink-0 flex flex-col gap-1.5">{actions}</div>}
        </div>
      </Card>
    </motion.div>
  );
}

function PendingCard({
  item,
  index,
  onAccept,
  onReject,
  acting,
}: {
  item: ConnItem;
  index: number;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  acting: boolean;
}) {
  return (
    <PersonRow
      item={item}
      index={index}
      actions={
        <>
          <Button
            size="sm"
            className="gap-1.5 h-9 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            disabled={acting}
            onClick={() => onAccept(item.id)}
          >
            {acting ? <Spinner className="w-3.5 h-3.5" /> : <Icon name="check" className="w-3.5 h-3.5" />}
            پذیرش
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-9 rounded-2xl font-semibold text-rose hover:text-rose border-rose/30 hover:border-rose/50 hover:bg-rose/5"
            disabled={acting}
            onClick={() => onReject(item.id)}
          >
            <Icon name="x" className="w-3.5 h-3.5" />
            رد
          </Button>
        </>
      }
    />
  );
}

function AcceptedCard({ item, index }: { item: ConnItem; index: number }) {
  const [starting, setStarting] = useState(false);

  async function startChat() {
    setStarting(true);
    try {
      const r = await apiPost<{ conversationId: string }>("/api/chat/start", { userId: item.otherUser.id });
      navigate({ view: "chat", conversationId: r.conversationId });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setStarting(false);
    }
  }

  return (
    <PersonRow
      item={item}
      index={index}
      actions={
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-9 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-semibold"
          onClick={startChat}
          disabled={starting}
        >
          {starting ? <Spinner className="w-3.5 h-3.5" /> : <Icon name="chat" className="w-3.5 h-3.5" />}
          چت
        </Button>
      }
    />
  );
}

function SentCard({ item, index }: { item: ConnItem; index: number }) {
  return (
    <PersonRow
      item={item}
      index={index}
      actions={
        <Badge className="gap-1 border border-gold/40 bg-gold/10 text-gold h-9 px-2.5 rounded-2xl font-medium">
          <Icon name="clock" className="w-3 h-3" />
          در انتظار پاسخ
        </Badge>
      }
    />
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="glass p-4 border-border/50 rounded-3xl">
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
              <Skeleton className="h-2.5 w-16 rounded" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-9 w-20 rounded-2xl" />
              <Skeleton className="h-9 w-20 rounded-2xl" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
