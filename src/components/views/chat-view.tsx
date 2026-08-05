"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
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
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────────────────────────── Types ───────────────────────────── */

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

/* ───────────────────────────── Main View ───────────────────────────── */

export function ChatView({ conversationId }: { conversationId?: string }) {
  const { user, loading: userLoading } = useUser();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<ConversationDetail | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConvRef = useRef<ConversationDetail | null>(null);

  /* ── Load conversation list ── */
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

  /* ── Load messages of active conversation ── */
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

  /* ── Auto-scroll helper ── */
  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  /* ── Keep activeConv ref synced for socket handlers ── */
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  /* ── Socket.io connection (mini-service on port 3003 via gateway) ── */
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

    socket.on("connect_error", (err: Error) => {
      console.warn("[chat] socket connect_error", err.message);
    });

    socket.on("message", (msg: ChatMessage) => {
      if (activeConvRef.current?.conversation?.id === msg.conversationId) {
        setActiveConv((prev) => {
          if (!prev) return prev;
          if (prev.messages.some((m) => m.id === msg.id)) return prev;
          return { ...prev, messages: [...prev.messages, msg] };
        });
        queueMicrotask(() => scrollToBottom());
      }
      // Always refresh conversation list to update last message preview
      loadConversations();
    });

    socket.on(
      "typing",
      (data: { conversationId: string; userId: string; isTyping: boolean }) => {
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
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
    };
  }, [user, loadConversations, scrollToBottom]);

  /* ── Emit join when active conversation changes ── */
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

  /* ── Auto-scroll to bottom on new messages ── */
  useEffect(() => {
    queueMicrotask(() => scrollToBottom());
  }, [activeConv?.messages.length, scrollToBottom]);

  /* ── Send a message ── */
  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content || !conversationId || !user || !socketRef.current) return;
    setDraft("");
    socketRef.current.emit("typing", {
      conversationId,
      userId: user.id,
      isTyping: false,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

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

  /* ── Filtered list ── */
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((c) =>
      c.otherUser.name.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  /* ── Not logged in ── */
  if (!userLoading && !user) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <PageHeader />
        <Card className="p-0 rounded-2xl border-border/60 overflow-hidden">
          <EmptyState
            kind="chat"
            title="برای چت کردن وارد شوید"
            description="برای شروع گفتگو با همکاران، ابتدا وارد حساب کاربری خود شوید."
            action={
              <Button
                onClick={() => navigate({ view: "auth" })}
                className="gap-1.5 rounded-2xl bg-lime text-forest font-bold hover:bg-lime/90"
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

  const showMobileList = !conversationId;

  return (
    <div className="space-y-4">
      <PageHeader />

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
            onBack={() => navigate({ view: "chat" })}
          />
        </div>
      )}

      {/* Desktop: two-pane — list on right (RTL start), chat on left */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_320px] gap-4">
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
            />
          ) : (
            <Card className="h-[72vh] flex items-center justify-center rounded-2xl border-border/60 bg-cream-gradient">
              <EmptyState
                kind="chat"
                title="یک گفتگو را انتخاب کنید"
                description="از لیست کناری یک گفتگو را انتخاب کنید یا همکار جدیدی پیدا کنید."
                action={
                  <Button
                    variant="outline"
                    onClick={() => navigate({ view: "talents" })}
                    className="gap-1.5 rounded-2xl border-forest/30 text-forest hover:bg-forest/5"
                  >
                    <Users className="w-4 h-4" />
                    پیدا کردن همکار
                  </Button>
                }
              />
            </Card>
          )}
        </div>
        <div>
          <ChatList
            conversations={filteredConversations}
            loading={convLoading}
            search={search}
            onSearch={setSearch}
            activeId={conversationId}
          />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Page Header ───────────────────────────── */

function PageHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-11 h-11 rounded-2xl bg-forest text-lime shadow-md">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold leading-tight tracking-tight">چت</h1>
          <p className="text-xs text-muted-foreground mt-0.5">گفتگوی زنده با همکاران</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate({ view: "talents" })}
        className="gap-1.5 rounded-2xl border-forest/30 text-forest hover:bg-forest/5"
      >
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">همکاران</span>
      </Button>
    </motion.div>
  );
}

/* ───────────────────────────── Chat List (right pane, RTL) ───────────────────────────── */

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
    <Card className="flex flex-col h-[72vh] lg:h-[72vh] overflow-hidden rounded-2xl border-border/60 shadow-sm">
      {/* Header */}
      <div className="p-3.5 border-b border-border/60 space-y-2.5 bg-card">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <span className="grid place-items-center w-6 h-6 rounded-lg bg-lime/20 text-forest">
              <MessageCircle className="w-3.5 h-3.5" />
            </span>
            گفتگوها
          </h2>
          <span className="text-[10px] text-muted-foreground font-medium">
            {toFa(conversations.length)} گفتگو
          </span>
        </div>
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="جست‌وجو در گفتگوها..."
            className="w-full h-9 pr-8 pl-3 text-xs rounded-xl border border-input bg-muted/40 focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto slim-scroll">
        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="h-2.5 w-40 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              kind="chat"
              title={search ? "موردی پیدا نشد" : "گفتگویی ندارید"}
              description={
                search
                  ? "عبارت دیگری را امتحان کنید."
                  : "برای شروع گفتگو، به پروفایل یکی از همکاران بروید."
              }
              className="py-6"
              action={
                !search ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ view: "talents" })}
                    className="gap-1.5 rounded-2xl border-forest/30 text-forest hover:bg-forest/5"
                  >
                    <Users className="w-4 h-4" />
                    پیدا کردن همکار
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          conversations.map((c, i) => {
            const active = c.id === activeId;
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
                onClick={() => navigate({ view: "chat", conversationId: c.id })}
                className={cn(
                  "relative w-full text-right flex items-center gap-3 p-3 transition-colors border-b border-border/40",
                  active ? "bg-lime/15" : "hover:bg-muted/40"
                )}
              >
                <UserAvatar
                  name={c.otherUser.name}
                  avatarUrl={c.otherUser.avatarUrl}
                  verified={c.otherUser.isVerifiedBadge}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-xs truncate",
                        active
                          ? "font-bold text-forest"
                          : "font-semibold text-foreground"
                      )}
                    >
                      {c.otherUser.name}
                    </span>
                    {c.lastMessage && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {timeAgoFa(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-[11px] line-clamp-1 mt-0.5 leading-5",
                      active ? "text-forest/70" : "text-muted-foreground"
                    )}
                  >
                    {c.lastMessage
                      ? c.lastMessage.content
                      : "گفتگوی جدید — شروع کنید"}
                  </p>
                </div>
                {active && (
                  <motion.span
                    layoutId="chat-active-pill"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full bg-lime"
                  />
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </Card>
  );
}

/* ───────────────────────────── Chat Thread (left pane) ───────────────────────────── */

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
  onBack?: () => void;
}) {
  const other = conv?.conversation?.otherUser;
  const messages = conv?.messages ?? [];

  return (
    <Card className="flex flex-col h-[72vh] overflow-hidden rounded-2xl border-border/60 shadow-sm">
      {/* ── Header ── */}
      <div className="p-3 border-b border-border/60 flex items-center gap-3 bg-forest text-white">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl hover:bg-white/10 text-white"
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
              aria-label="مشاهده پروفایل"
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
                className="font-bold text-sm hover:text-lime transition-colors truncate block text-right"
              >
                {other.name}
              </button>
              <p className="text-[11px] text-white/70 flex items-center gap-1.5 h-4">
                {isTyping ? (
                  <span className="text-lime font-medium flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-lime animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-lime animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-lime animate-bounce" />
                    </span>
                    در حال تایپ...
                  </span>
                ) : (
                  <span className="truncate">{other.bioShort || "مشاهده پروفایل"}</span>
                )}
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-white/40 shrink-0" />
          </>
        ) : (
          <div className="flex-1">
            <Skeleton className="h-4 w-32 rounded bg-white/10" />
            <Skeleton className="h-2.5 w-20 mt-1.5 rounded bg-white/10" />
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto slim-scroll p-4 space-y-3 bg-cream-gradient"
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => {
              // Spec: own messages on LEFT visually (items-end in RTL),
              // other's on RIGHT visually (items-start in RTL).
              const mine = i % 2 === 0;
              return (
                <div
                  key={i}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <Skeleton
                    className={cn(
                      "h-12 rounded-2xl",
                      mine ? "w-48 rounded-tl-md" : "w-56 rounded-tr-md"
                    )}
                  />
                </div>
              );
            })}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              kind="chat"
              title="گفتگو را شروع کنید"
              description="اولین پیام را ارسال کنید — گفتگوی شما کاملاً خصوصی است."
              className="py-6"
            />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => {
              const isMine = m.senderId === currentUserId;
              const prev = messages[idx - 1];
              const showSender =
                !isMine && (!prev || prev.senderId !== m.senderId);
              return (
                <motion.div
                  key={m.id}
                  layout="position"
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "flex flex-col",
                    // Spec: own messages on LEFT visually (items-end in RTL flex-col),
                    // other's on RIGHT visually (items-start in RTL flex-col).
                    isMine ? "items-end" : "items-start"
                  )}
                >
                  {showSender && (
                    <span className="text-[10px] text-muted-foreground mb-1 px-2 font-medium">
                      {other?.name}
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] sm:max-w-[70%] px-3.5 py-2.5 text-sm leading-6 break-words whitespace-pre-wrap shadow-sm",
                      isMine
                        ? "bg-forest text-white rounded-2xl rounded-tl-md"
                        : "bg-card border border-border/60 rounded-2xl rounded-tr-md"
                    )}
                  >
                    {m.content}
                    <span
                      className={cn(
                        "block text-[9px] mt-1",
                        isMine ? "text-white/60" : "text-muted-foreground"
                      )}
                    >
                      {timeAgoFa(m.createdAt)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── Input ── */}
      <div className="p-3 border-t border-border/60 bg-card">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="پیام بنویسید..."
              className="flex-1 min-h-[44px] max-h-32 resize-none text-sm rounded-2xl pr-4 pl-3 py-2.5 border-border/60 focus-visible:ring-1 focus-visible:ring-lime/50"
              rows={1}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onSend}
            disabled={!draft.trim()}
            className="h-11 w-11 p-0 shrink-0 rounded-full bg-lime text-forest grid place-items-center shadow-md disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-shadow hover:shadow-lg"
            aria-label="ارسال"
          >
            <Send className="w-4 h-4 -scale-x-100" />
          </motion.button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-gold/70" />
          Enter برای ارسال · Shift+Enter برای خط جدید
        </p>
      </div>
    </Card>
  );
}
