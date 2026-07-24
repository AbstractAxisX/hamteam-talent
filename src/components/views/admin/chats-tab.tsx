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
import {
  MessageCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type AdminConversation = {
  id: string;
  createdAt: string;
  messageCount: number;
  lastMessage: { content: string; createdAt: string } | null;
  userA: {
    id: string;
    name: string;
    phone: string;
    role: string;
    isBanned: boolean;
    avatarUrl: string | null;
  };
  userB: {
    id: string;
    name: string;
    phone: string;
    role: string;
    isBanned: boolean;
    avatarUrl: string | null;
  };
};

type ConversationMessage = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  readAt: string | null;
};

export function ChatsTab() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{
        conversations: AdminConversation[];
        total: number;
        pages: number;
      }>(`/api/admin/conversations?page=${page}&limit=30`);
      setConversations(data.conversations);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page]);

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

  if (conversations.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState icon={MessageCircle} title="گفتگویی موجود نیست" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {toFa(total)} گفتگو — فقط خواندنی
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pr-4">کاربر A</TableHead>
              <TableHead>کاربر B</TableHead>
              <TableHead className="text-center">تعداد پیام</TableHead>
              <TableHead>آخرین پیام</TableHead>
              <TableHead className="pl-4 text-left">مشاهده</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="pr-4">
                  <button
                    onClick={() => navigate({ view: "profile", id: c.userA.id })}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <UserAvatar
                      name={c.userA.name}
                      avatarUrl={c.userA.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.userA.name}</div>
                      <div className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {toFa(c.userA.phone)}
                      </div>
                    </div>
                  </button>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => navigate({ view: "profile", id: c.userB.id })}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <UserAvatar
                      name={c.userB.name}
                      avatarUrl={c.userB.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.userB.name}</div>
                      <div className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {toFa(c.userB.phone)}
                      </div>
                    </div>
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium nums-fa">
                    {toFa(c.messageCount)}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs">
                  {c.lastMessage ? (
                    <div className="truncate">
                      <span className="text-muted-foreground/70">»</span> {c.lastMessage.content}
                      <div className="text-[10px] mt-0.5">{timeAgoFa(c.lastMessage.createdAt)}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="pl-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDetailId(c.id)}
                    aria-label="مشاهده پیام‌ها"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            صفحه {toFa(page)} از {toFa(pages)}
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages || loading}
              className="gap-1"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      <ConversationDetailDialog
        conversation={conversations.find((c) => c.id === detailId) ?? null}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
    </div>
  );
}

function ConversationDetailDialog({
  conversation,
  open,
  onOpenChange,
}: {
  conversation: AdminConversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversation) {
      queueMicrotask(() => setMessages([]));
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    // Use admin-only endpoint to read messages of any conversation.
    api<{ messages: ConversationMessage[] }>(
      `/api/admin/conversations/${conversation.id}/messages`
    )
      .then((d) => {
        if (!cancelled) setMessages(d.messages || []);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversation]);

  if (!conversation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">
            گفتگوی {conversation.userA.name} ↔ {conversation.userB.name}
          </DialogTitle>
          <DialogDescription>
            مشاهده پیام‌ها — فقط خواندنی. {toFa(conversation.messageCount)} پیام کل.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto slim-scroll max-h-[60vh] space-y-2 pr-1">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              پیامی برای نمایش نیست
            </div>
          ) : (
            messages.map((m) => {
              const isFromA = m.senderId === conversation.userA.id;
              const senderName = isFromA ? conversation.userA.name : conversation.userB.name;
              return (
                <div
                  key={m.id}
                  className={`flex ${isFromA ? "justify-start" : "justify-end"}`}
                >
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-xl px-3 py-2 text-sm ${
                        isFromA ? "bg-muted" : "bg-primary/10"
                      }`}
                    >
                      <div className="text-[10px] text-muted-foreground mb-0.5">
                        {senderName}
                      </div>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                    <div className={`text-[10px] text-muted-foreground mt-0.5 ${isFromA ? "" : "text-left"}`}>
                      {timeAgoFa(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate({ view: "profile", id: conversation.userA.id })}
          >
            <ArrowLeft className="w-4 h-4" />
            پروفایل {conversation.userA.name}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate({ view: "profile", id: conversation.userB.id })}
          >
            پروفایل {conversation.userB.name}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// silence unused
void Badge;
