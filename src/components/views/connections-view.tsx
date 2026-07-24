"use client";

import { useEffect, useState, useCallback } from "react";
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
      <div className="space-y-4">
        <Header />
        <Card className="p-8 text-center space-y-3">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg">برای مشاهده ارتباطات خود وارد شوید</h2>
          <p className="text-sm text-muted-foreground">
            درخواست‌های ارتباطی و افراد متصل شما در این صفحه نمایش داده می‌شود.
          </p>
          <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5">
            ورود / ثبت‌نام
          </Button>
        </Card>
      </div>
    );
  }

  const handleAccept = async (id: string) => {
    setActingId(id);
    try {
      await apiPost(`/api/connections/${id}`, { action: "accept" });
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
      await apiPost(`/api/connections/${id}`, { action: "reject" });
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
    <div className="space-y-4">
      <Header />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="gap-1.5 flex-1">
            <UserPlus className="w-4 h-4" />
            دریافتی
            {counts.pending > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] bg-warning/15 text-warning"
              >
                {toFa(counts.pending)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="gap-1.5 flex-1">
            <UserCheck className="w-4 h-4" />
            ارتباطات
            {counts.accepted > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary"
              >
                {toFa(counts.accepted)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-1.5 flex-1">
            <Inbox className="w-4 h-4" />
            ارسالی
            {counts.sent > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] bg-muted text-muted-foreground"
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
              icon={UserPlus}
              title="درخواست ارتباط جدیدی ندارید"
              description="وقتی کسی درخواست ارتباط با شما بفرستد، اینجا نمایش داده می‌شود."
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "people" })}
                  className="gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  پیدا کردن همکار
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.pending.map((c) => (
                <PendingCard
                  key={c.id}
                  item={c}
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
              icon={UserCheck}
              title="هنوز ارتباطی ندارید"
              description="با ارسال درخواست ارتباط به همکاران، شبکه‌ی حرفه‌ای خود را بسازید."
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "people" })}
                  className="gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  پیدا کردن همکار
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.accepted.map((c) => (
                <AcceptedCard key={c.id} item={c} />
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
              icon={Inbox}
              title="درخواست ارسالی ندارید"
              description="درخواست‌های در انتظار پاسخ شما در اینجا نمایش داده می‌شود."
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "people" })}
                  className="gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  پیدا کردن همکار
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.sent.map((c) => (
                <SentCard key={c.id} item={c} />
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
    <div className="flex items-center gap-2.5">
      <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
        <Users className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-xl font-bold leading-tight">ارتباطات</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          مدیریت درخواست‌ها و شبکه‌ی حرفه‌ای شما
        </p>
      </div>
    </div>
  );
}

function PersonRow({
  item,
  actions,
}: {
  item: ConnItem;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ view: "profile", id: item.otherUser.id })}
          aria-label={`پروفایل ${item.otherUser.name}`}
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
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {item.otherUser.bioShort}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/70 mt-0.5">بدون توضیحات</p>
          )}
          <p className="text-[10px] text-muted-foreground/80 mt-1">
            {timeAgoFa(item.createdAt)}
          </p>
        </div>
        {actions && <div className="shrink-0 flex flex-col gap-1.5">{actions}</div>}
      </div>
    </Card>
  );
}

function PendingCard({
  item,
  onAccept,
  onReject,
  acting,
}: {
  item: ConnItem;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  acting: boolean;
}) {
  return (
    <PersonRow
      item={item}
      actions={
        <>
          <Button
            size="sm"
            className="gap-1.5 h-8"
            disabled={acting}
            onClick={() => onAccept(item.id)}
          >
            <Check className="w-3.5 h-3.5" />
            پذیرش
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-destructive hover:text-destructive"
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

function AcceptedCard({ item }: { item: ConnItem }) {
  return (
    <PersonRow
      item={item}
      actions={
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8"
          onClick={() => {
            // Start a chat with this user
            (async () => {
              try {
                const r = await apiPost<{ conversationId: string }>(
                  "/api/chat/start",
                  { userId: item.otherUser.id }
                );
                navigate({ view: "chat", conversationId: r.conversationId });
              } catch (e) {
                toast({
                  title: "خطا",
                  description: (e as Error).message,
                  variant: "destructive",
                });
              }
            })();
          }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          پیام
        </Button>
      }
    />
  );
}

function SentCard({ item }: { item: ConnItem }) {
  return (
    <PersonRow
      item={item}
      actions={
        <Badge
          variant="outline"
          className="gap-1 border-warning/30 text-warning h-8 px-2"
        >
          <Clock className="w-3 h-3" />
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
        <Card key={i} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
