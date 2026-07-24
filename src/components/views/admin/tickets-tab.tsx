"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";
import { toFa, timeAgoFa } from "@/lib/format";
import { navigate } from "@/lib/nav";
import { Ticket as TicketIcon, MessageSquare, Shield, ChevronLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminTicket = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    isVerifiedBadge: boolean;
    isBanned: boolean;
    avatarUrl: string | null;
  };
};

export function TicketsTab() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ tickets: AdminTicket[] }>("/api/admin/tickets");
      setTickets(data.tickets);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState icon={TicketIcon} title="تیکتی موجود نیست" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">{toFa(tickets.length)} تیکت</div>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pr-4">موضوع</TableHead>
              <TableHead>ایجادکننده</TableHead>
              <TableHead className="text-center">وضعیت</TableHead>
              <TableHead className="text-center">پاسخ‌ها</TableHead>
              <TableHead>آخرین به‌روزرسانی</TableHead>
              <TableHead className="pl-4 text-left">مشاهده</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => {
              const isOpen = t.status === "open";
              return (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ view: "ticket", id: t.id })}
                >
                  <TableCell className="pr-4 max-w-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 ${
                          isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <TicketIcon className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-medium truncate">{t.subject}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({ view: "profile", id: t.user.id });
                      }}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <UserAvatar
                        name={t.user.name}
                        avatarUrl={t.user.avatarUrl}
                        verified={t.user.isVerifiedBadge}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-1">
                          {t.user.name}
                          {t.user.role === "admin" && (
                            <Shield className="w-3 h-3 text-warning" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono" dir="ltr">
                          {toFa(t.user.phone)}
                        </div>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={isOpen ? "default" : "secondary"}
                      className={
                        isOpen
                          ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px]"
                          : "text-[10px]"
                      }
                    >
                      {isOpen ? "باز" : "بسته"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <MessageSquare className="w-3 h-3 text-muted-foreground" />
                      {toFa(t.replyCount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgoFa(t.updatedAt)}
                  </TableCell>
                  <TableCell className="pl-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({ view: "ticket", id: t.id });
                      }}
                      aria-label="مشاهده تیکت"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
