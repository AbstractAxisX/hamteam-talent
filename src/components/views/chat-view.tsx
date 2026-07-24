"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { io, type Socket } from "socket.io-client";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa } from "@/lib/format";
import {
  MessageCircle,
  Send,
  ArrowRight,
  Users,
  Lock,
  Search,
  Loader2,
} from "lucide-react";

type OtherUser = {
  id: string;
  name: string;
  isVerifiedBadge: boolean;
  avatarUrl: string | null;
};

type ConversationListItem = {
  id: string;
  otherUser: OtherUser;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

type ConversationDetail = {
  conversation: {
    id: string;
    otherUser: OtherUser & { bioShort?: string };
  } | null;
  messages: ChatMessage[];
};

export function ChatView({ conversationId }: { conversationId?: string }) {
  const { user, loading: userLoading } = useUser();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<ConversationDetail | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const d = await api<{ conversations: ConversationListItem[] }>(
        "/api/chat/conversations"
      );
      setConversations(d.conversations);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setConvLoading(false);
    }
  }, []);

  // Load messages of active conversation
  const loadMessages = useCallback(async (id: string) => {
    setMsgLoading(true);
    try {
      const d = await api<ConversationDetail>(
        `/api/chat/conversations/${id}/messages`
      );
      setActiveConv(d);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
      setActiveConv(null);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadConversations();
    else setConvLoading(false);
  }, [user, loadConversations]);

  useEffect(() => {
    if (conversationId && user) loadMessages(conversationId);
    else setActiveConv(null);
  }, [conversationId, user, loadMessages]);

  // Socket.io connection — gateway uses XTransformPort=3003 in query, path "/"
  useEffect(() => {
    if (!user) return;
    const socket = io("/", {
      path: "/",
      query: { XTransformPort: "3003" },
      auth: { userId: user.id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // connected
    });
    socket.on("connect_error", (err) => {
      console.warn("[chat] socket connect_error", err.message);
    });

    socket.on("message", (msg: ChatMessage) => {
      // Only handle if it belongs to the active conversation
      if (activeConvRef.current?.conversation?.id === msg.conversationId) {
        setActiveConv((prev) => {
          if (!prev) return prev;
          // Avoid duplicates (we also emit optimistically for own messages)
          if (prev.messages.some((m) => m.id === msg.id)) return prev;
          return { ...prev, messages: [...prev.messages, msg] };
        });
        // Scroll to bottom
        queueMicrotask(() => scrollToBottom());
      }
      // Always refresh conversation list to update last message preview
      loadConversations();
    });

    socket.on("typing", (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (
        activeConvRef.current?.conversation?.id === data.conversationId &&
        data.userId !== user.id
      ) {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          if (typingClearRef.current) clearTimeout(typingClearRef.current);
          typingClearRef.current = setTimeout(() => setIsTyping(false), 4000);
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
    };
  }, [user]);

  // Keep a ref of activeConv for socket handlers (avoid stale closures)
  const activeConvRef = useRef<ConversationDetail | null>(null);
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  // Emit join when active conversation changes
  useEffect(() => {
    if (!conversationId || !socketRef.current) return;
    if (socketRef.current.connected) {
      socketRef.current.emit("join", { conversationId });
    } else {
      socketRef.current.once("connect", () => {
        socketRef.current?.emit("join", { conversationId });
      });
    }
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    queueMicrotask(() => scrollToBottom());
  }, [activeConv?.messages.length, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || !conversationId || !user || !socketRef.current) return;
    setDraft("");
    // Reset typing
    socketRef.current.emit("typing", {
      conversationId,
      userId: user.id,
      isTyping: false,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Optimistic message — server will broadcast the persisted version
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
    };
    setActiveConv((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev
    );
    queueMicrotask(() => scrollToBottom());

    socketRef.current.emit("message", {
      conversationId,
      senderId: user.id,
      content,
    });

    // Update conversation list preview optimistically
    setConversations((prev) =>
      prev
        .map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: {
                  content,
                  createdAt: optimistic.createdAt,
                  senderId: user.id,
                },
              }
            : c
        )
        .sort((a, b) => {
          const at = a.lastMessage?.createdAt || "0";
          const bt = b.lastMessage?.createdAt || "0";
          return at < bt ? 1 : -1;
        })
    );
  }, [draft, conversationId, user, scrollToBottom]);

  const handleDraftChange = (val: string) => {
    setDraft(val);
    if (!conversationId || !user || !socketRef.current) return;
    socketRef.current.emit("typing", {
      conversationId,
      userId: user.id,
      isTyping: true,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", {
        conversationId,
        userId: user.id,
        isTyping: false,
      });
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filtered conversation list (search by name)
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((c) =>
      c.otherUser.name.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // Not logged in
  if (!userLoading && !user) {
    return (
      <div className="space-y-4">
        <ChatHeader />
        <Card className="p-8 text-center space-y-3">
          <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg">برای چت کردن وارد شوید</h2>
          <p className="text-sm text-muted-foreground">
            برای شروع گفتگو با همکاران، ابتدا وارد حساب کاربری خود شوید.
          </p>
          <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5">
            ورود / ثبت‌نام
          </Button>
        </Card>
      </div>
    );
  }

  // Mobile: show conversation list OR active chat
  const showMobileList = !conversationId;

  return (
    <div className="space-y-4">
      <ChatHeader />

      {/* Mobile: chat list */}
      {showMobileList && (
        <div className="lg:hidden">
          <ChatList
            conversations={filteredConversations}
            loading={convLoading}
            search={search}
            onSearch={setSearch}
            activeId={conversationId}
          />
        </div>
      )}

      {/* Mobile: active chat */}
      {!showMobileList && (
        <div className="lg:hidden">
          <ChatThread
            conv={activeConv}
            loading={msgLoading}
            draft={draft}
            onDraftChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            onSend={handleSend}
            currentUserId={user?.id || ""}
            isTyping={isTyping}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            onBack={() => navigate({ view: "chat" })}
          />
        </div>
      )}

      {/* Desktop: two-pane */}
      <div className="hidden lg:grid lg:grid-cols-[320px_1fr] gap-4">
        <div>
          <ChatList
            conversations={filteredConversations}
            loading={convLoading}
            search={search}
            onSearch={setSearch}
            activeId={conversationId}
          />
        </div>
        <div>
          {conversationId ? (
            <ChatThread
              conv={activeConv}
              loading={msgLoading}
              draft={draft}
              onDraftChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              onSend={handleSend}
              currentUserId={user?.id || ""}
              isTyping={isTyping}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
            />
          ) : (
            <Card className="h-[70vh] flex items-center justify-center">
              <EmptyState
                icon={MessageCircle}
                title="یک گفتگو را انتخاب کنید"
                description="برای شروع گفتگوی جدید، از پروفایل همکاران یا صفحه‌ی افراد استفاده کنید."
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
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
        <MessageCircle className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-xl font-bold leading-tight">چت</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          گفتگوی زنده با همکاران
        </p>
      </div>
    </div>
  );
}

function ChatList({
  conversations,
  loading,
  search,
  onSearch,
  activeId,
}: {
  conversations: ConversationListItem[];
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  activeId?: string;
}) {
  return (
    <Card className="flex flex-col h-[70vh] overflow-hidden">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-sm">گفتگوها</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => navigate({ view: "people" })}
          >
            <Users className="w-3.5 h-3.5" />
            همکاران
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="جست‌وجو در گفتگوها..."
            className="w-full h-8 pr-7 pl-2 text-xs rounded-md border border-input bg-background/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto slim-scroll">
        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-2.5 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={MessageCircle}
              title={search ? "موردی پیدا نشد" : "گفتگویی ندارید"}
              description={
                search
                  ? "عبارت دیگری را امتحان کنید."
                  : "برای شروع گفتگو، به پروفایل یکی از همکاران بروید."
              }
              className="py-6"
            />
          </div>
        ) : (
          conversations.map((c) => {
            const active = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => navigate({ view: "chat", conversationId: c.id })}
                className={`w-full text-right flex items-center gap-2.5 p-3 hover:bg-muted/50 transition-colors border-b border-border/50 ${
                  active ? "bg-primary/10" : ""
                }`}
              >
                <UserAvatar
                  name={c.otherUser.name}
                  avatarUrl={c.otherUser.avatarUrl}
                  verified={c.otherUser.isVerifiedBadge}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-xs truncate">
                      {c.otherUser.name}
                    </span>
                    {c.lastMessage && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {timeAgoFa(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {c.lastMessage
                      ? c.lastMessage.content
                      : "گفتگوی جدید — شروع کنید"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}

function ChatThread({
  conv,
  loading,
  draft,
  onDraftChange,
  onKeyDown,
  onSend,
  currentUserId,
  isTyping,
  messagesContainerRef,
  messagesEndRef,
  onBack,
}: {
  conv: ConversationDetail | null;
  loading: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  currentUserId: string;
  isTyping: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack?: () => void;
}) {
  const other = conv?.conversation?.otherUser;
  const messages = conv?.messages ?? [];

  return (
    <Card className="flex flex-col h-[70vh] overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2.5">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onBack}
            aria-label="بازگشت"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
        {other ? (
          <>
            <button
              onClick={() => navigate({ view: "profile", id: other.id })}
              className="shrink-0"
            >
              <UserAvatar
                name={other.name}
                avatarUrl={other.avatarUrl}
                verified={other.isVerifiedBadge}
                size="md"
              />
            </button>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate({ view: "profile", id: other.id })}
                className="font-semibold text-sm hover:text-primary transition-colors truncate block text-right"
              >
                {other.name}
              </button>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                {isTyping ? (
                  <span className="text-primary flex items-center gap-1">
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                    </span>
                    در حال تایپ...
                  </span>
                ) : (
                  <span className="truncate">
                    {other.bioShort || "مشاهده پروفایل"}
                  </span>
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2.5 w-20 mt-1" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto slim-scroll p-4 space-y-3 bg-muted/20"
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <Skeleton
                  className={`h-12 ${i % 2 === 0 ? "w-48" : "w-56"} rounded-2xl`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="گفتگو را شروع کنید"
              description="اولین پیام را ارسال کنید — گفتگوی شما کاملاً خصوصی است."
              className="py-6"
            />
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMine = m.senderId === currentUserId;
            const prev = messages[idx - 1];
            const showSender =
              !isMine && (!prev || prev.senderId !== m.senderId);
            return (
              <div
                key={m.id}
                className={`flex flex-col ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                {showSender && (
                  <span className="text-[10px] text-muted-foreground mb-1 px-1">
                    {other?.name}
                  </span>
                )}
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-6 break-words whitespace-pre-wrap ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-bl-md"
                      : "bg-card border border-border rounded-br-md"
                  }`}
                >
                  {m.content}
                  <span
                    className={`block text-[9px] mt-1 ${
                      isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {timeAgoFa(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="پیام بنویسید..."
            className="flex-1 min-h-[44px] max-h-32 resize-none text-sm"
            rows={1}
          />
          <Button
            onClick={onSend}
            disabled={!draft.trim()}
            className="h-11 w-11 p-0 shrink-0"
            aria-label="ارسال"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          Enter برای ارسال · Shift+Enter برای خط جدید
        </p>
      </div>
    </Card>
  );
}
