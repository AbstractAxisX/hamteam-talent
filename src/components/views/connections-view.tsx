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
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa } from "@/lib/format";
import {
  Users,
  UserCheck,
  UserPlus,
  Inbox,
  Clock,
  Lock,
  Check,
  X,
  MessageCircle,
  Loader2,
} from "lucide-react";

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
      <div className="space-y-5 max-w-2xl mx-auto">
        <Header />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-8 text-center space-y-3 border-border/60 shadow-card">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg">برای مشاهده ارتباطات خود وارد شوید</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-6">
              درخواست‌های ارتباطی و افراد متصل شما در این صفحه نمایش داده می‌شود.
            </p>
            <Button
              onClick={() => navigate({ view: "auth" })}
              className="gap-1.5 rounded-xl font-semibold mx-auto"
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
    <div className="space-y-5 max-w-2xl mx-auto">
      <Header />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full h-11 rounded-xl p-1">
          <TabsTrigger value="pending" className="gap-1.5 flex-1 rounded-lg font-semibold text-xs sm:text-sm">
            <UserPlus className="w-4 h-4" />
            دریافتی
            {counts.pending > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] bg-gold/15 text-gold border-0"
              >
                {toFa(counts.pending)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="gap-1.5 flex-1 rounded-lg font-semibold text-xs sm:text-sm">
            <UserCheck className="w-4 h-4" />
            ارتباطات
            {counts.accepted > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-0"
              >
                {toFa(counts.accepted)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-1.5 flex-1 rounded-lg font-semibold text-xs sm:text-sm">
            <Inbox className="w-4 h-4" />
            ارسالی
            {counts.sent > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] bg-muted text-muted-foreground border-0"
              >
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
                  onClick={() => navigate({ view: "people" })}
                  className="gap-1.5 rounded-xl font-semibold"
                >
                  <Users className="w-4 h-4" />
                  پیدا کردن همکار
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
                  onClick={() => navigate({ view: "people" })}
                  className="gap-1.5 rounded-xl font-semibold"
                >
                  <Users className="w-4 h-4" />
                  پیدا کردن همکار
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
                  onClick={() => navigate({ view: "people" })}
                  className="gap-1.5 rounded-xl font-semibold"
                >
                  <Users className="w-4 h-4" />
                  پیدا کردن همکار
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

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3"
    >
      <div className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-gradient text-white shadow-soft">
        <Users className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-xl font-extrabold leading-tight tracking-tight">ارتباطات</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          مدیریت درخواست‌ها و شبکه‌ی حرفه‌ای شما
        </p>
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
      <Card className="p-4 border-border/60 shadow-card hover:shadow-lift transition-shadow duration-300">
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
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 leading-5">
                {item.otherUser.bioShort}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/70 mt-0.5">بدون توضیحات</p>
            )}
            <p className="text-[10px] text-muted-foreground/80 mt-1 nums-fa">
              {timeAgoFa(item.createdAt)}
            </p>
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
            className="gap-1.5 h-8 rounded-lg font-semibold"
            disabled={acting}
            onClick={() => onAccept(item.id)}
          >
            {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            پذیرش
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 rounded-lg font-semibold text-rose hover:text-rose border-rose/30 hover:border-rose/50"
            disabled={acting}
            onClick={() => onReject(item.id)}
          >
            <X className="w-3.5 h-3.5" />
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
      const r = await apiPost<{ conversationId: string }>("/api/chat/start", {
        userId: item.otherUser.id,
      });
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
          className="gap-1.5 h-8 rounded-lg font-semibold"
          onClick={startChat}
          disabled={starting}
        >
          {starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
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
        <Badge
          variant="outline"
          className="gap-1 border-gold/30 text-gold h-8 px-2.5 rounded-lg font-medium"
        >
          <Clock className="w-3 h-3" />
          در انتظار پاسخ
        </Badge>
      }
    />
  );
}

// Loader2 imported above for the spinners in PendingCard and AcceptedCard

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-4 border-border/60 shadow-card">
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
              <Skeleton className="h-2.5 w-16 rounded" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
