"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
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
  Check,
  CheckCheck,
  X,
  Clock,
  UserCheck,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────────────────────────── Types ───────────────────────────── */

type OtherUser = {
  id: string;
  name: string;
  isVerifiedBadge: boolean;
  avatarUrl: string | null;
  gender?: string | null;
  bioShort?: string;
};

type ConversationListItem = {
  id: string;
  otherUser: OtherUser;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  status: "active" | "pending_request";
  initiatorId: string | null;
  unreadCount: number;
  myRequestPending?: boolean;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
};

type ConversationDetail = {
  conversation: {
    id: string;
    otherUser: OtherUser;
  } | null;
  messages: ChatMessage[];
};

/* ───────────────────────────── Main View ───────────────────────────── */

export function ChatView({ conversationId }: { conversationId?: string }) {
  const { user, loading: userLoading } = useUser();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [requests, setRequests] = useState<ConversationListItem[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<ConversationDetail | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState("");
  const [listTab, setListTab] = useState<"messages" | "requests">("messages");

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConvIdRef = useRef<string | undefined>(conversationId);
  const myUserIdRef = useRef<string | undefined>(user?.id);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Load conversation list ── */
  const loadConversations = useCallback(async () => {
    setConvLoading((prev) => (prev ? prev : true));
    try {
      const d = await api<{
        conversations: ConversationListItem[];
        requests: ConversationListItem[];
        unreadCount: number;
      }>("/api/chat/conversations");
      setConversations(d.conversations || []);
      setRequests(d.requests || []);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setConvLoading(false);
    }
  }, []);

  /* ── Load messages of active conversation (with loading state) ── */
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

  /* ── Silent poll for read-status / new messages from server ── */
  // Replaces local messages with server truth, but preserves optimistic
  // temp-* messages that haven't been confirmed by socket echo yet.
  const pollMessages = useCallback(async (id: string) => {
    try {
      const d = await api<ConversationDetail>(
        `/api/chat/conversations/${id}/messages`
      );
      setActiveConv((prev) => {
        if (!prev || prev.conversation?.id !== id) return prev;
        const pending = prev.messages.filter((m) => m.id.startsWith("temp-"));
        return { ...d, messages: [...d.messages, ...pending] };
      });
    } catch {
      /* ignore — polling is best-effort */
    }
  }, []);

  /* ── Keep refs in sync (used inside socket handlers) ── */
  useEffect(() => {
    activeConvIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    myUserIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    if (user) loadConversations();
    else setConvLoading(false);
  }, [user, loadConversations]);

  useEffect(() => {
    if (conversationId && user) {
      loadMessages(conversationId);
      // Mark messages as read on open
      apiPost(`/api/chat/conversations/${conversationId}/read`)
        .then(() => loadConversations())
        .catch(() => {});
    } else {
      setActiveConv(null);
    }
  }, [conversationId, user, loadMessages, loadConversations]);

  /* ── Auto-scroll helper ── */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const isNearBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 180;
  }, []);

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
      const myId = myUserIdRef.current;
      const activeId = activeConvIdRef.current;

      if (msg.conversationId === activeId) {
        setActiveConv((prev) => {
          if (!prev) return prev;
          // Dedupe by id (in case of duplicate delivery)
          if (prev.messages.some((m) => m.id === msg.id)) return prev;

          // ── Bug fix: double-send ──
          // If the message is from ME, it was already added optimistically
          // with a temp-* id. Find that optimistic message (matching content,
          // most-recent-first) and replace it with the real server message.
          // This prevents the duplicate the sender previously saw.
          if (msg.senderId === myId) {
            const msgs = [...prev.messages];
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (
                msgs[i].id.startsWith("temp-") &&
                msgs[i].content === msg.content
              ) {
                msgs[i] = msg;
                return { ...prev, messages: msgs };
              }
            }
            // No temp message found (e.g. sent from another device) — append.
            return { ...prev, messages: [...msgs, msg] };
          }

          // From the other user — just append.
          return { ...prev, messages: [...prev.messages, msg] };
        });

        // Auto-scroll only if user is near the bottom (so we don't yank them
        // up while they're reading older messages).
        if (isNearBottom()) {
          queueMicrotask(() => scrollToBottom());
        }

        // If I'm the receiver, mark as read — this also sets readAt on the
        // sender's messages which my polling will pick up.
        if (msg.senderId !== myId) {
          apiPost(`/api/chat/conversations/${msg.conversationId}/read`)
            .then(() => loadConversations())
            .catch(() => {});
        }
      }

      // Always refresh the conversation list so lastMessage preview + unread
      // counts stay in sync.
      loadConversations();
    });

    socket.on(
      "typing",
      (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        if (
          activeConvIdRef.current === data.conversationId &&
          data.userId !== myUserIdRef.current
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
  }, [user, loadConversations, scrollToBottom, isNearBottom]);

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

  /* ── Poll for read-status every 5s while chat is open ── */
  // This updates the sender's ticks from single (✓) to double (✓✓) once the
  // other user reads the messages (their `read` API call sets `readAt`).
  useEffect(() => {
    if (!conversationId || !user) return;
    pollRef.current = setInterval(() => {
      pollMessages(conversationId);
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversationId, user, pollMessages]);

  /* ── Auto-scroll to bottom on new messages ── */
  useEffect(() => {
    queueMicrotask(() => scrollToBottom());
  }, [activeConv?.messages.length, scrollToBottom]);

  /* ── Send a message ── */
  const handleSend = useCallback(() => {
    const content = draft.trim();
    const convId = conversationId;
    if (!content || !convId || !user || !socketRef.current) return;
    setDraft("");
    socketRef.current.emit("typing", {
      conversationId: convId,
      userId: user.id,
      isTyping: false,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Optimistic message with temp id — will be replaced when the socket
    // echoes back the real, persisted message.
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId: convId,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setActiveConv((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev
    );
    queueMicrotask(() => scrollToBottom());

    socketRef.current.emit("message", {
      conversationId: convId,
      senderId: user.id,
      content,
    });

    setConversations((prev) =>
      prev
        .map((c) =>
          c.id === convId
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

  /* ── Active conversation status (from list) ── */
  const activeConvInfo = useMemo(() => {
    if (!conversationId) return null;
    const inList =
      conversations.find((c) => c.id === conversationId) ||
      requests.find((c) => c.id === conversationId);
    if (inList) return inList;
    return {
      id: conversationId,
      otherUser: activeConv?.conversation?.otherUser ?? {
        id: "",
        name: "",
        isVerifiedBadge: false,
        avatarUrl: null,
      },
      lastMessage: null,
      status: "active" as const,
      initiatorId: null,
      unreadCount: 0,
    };
  }, [conversationId, conversations, requests, activeConv]);

  /* ── Filtered list ── */
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((c) =>
      c.otherUser.name.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.trim().toLowerCase();
    return requests.filter((c) =>
      c.otherUser.name.toLowerCase().includes(q)
    );
  }, [requests, search]);

  /* ── Not logged in ── */
  if (!userLoading && !user) {
    return (
      <div className="fixed inset-0 z-50 lg:static lg:z-auto bg-background flex items-center justify-center p-6 pt-safe pb-safe">
        <EmptyState
          kind="chat"
          title="برای چت کردن وارد شوید"
          description="برای شروع گفتگو با همکاران، ابتدا وارد حساب کاربری خود شوید."
          action={
            <Button
              onClick={() => navigate({ view: "auth" })}
              className="gap-1.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90"
            >
              <Lock className="w-4 h-4" />
              ورود / ثبت‌نام
            </Button>
          }
        />
      </div>
    );
  }

  /* ── Respond to message requests (shared handler) ── */
  const handleRespond = async (id: string, action: "accept" | "reject") => {
    try {
      await apiPost(`/api/chat/conversations/${id}/respond`, { action });
      toast({
        title: action === "accept" ? "درخواست تأیید شد ✅" : "درخواست رد شد",
      });
      if (action === "accept") {
        await loadMessages(id);
        await loadConversations();
        navigate({ view: "chat", conversationId: id });
      } else {
        await loadConversations();
        if (id === conversationId) navigate({ view: "chat" });
      }
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  /* ── Full-screen mobile layout, 2-pane desktop layout ── */
  // Mobile: covers entire viewport (incl. top floating pills + bottom dock)
  //         via `fixed inset-0 z-50`. Shows list OR thread depending on conv.
  // Desktop: fits inside <main> padding as a 2-column grid (list + thread).
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background flex flex-col pt-safe pb-safe",
        "lg:static lg:z-auto lg:inset-auto lg:bg-transparent lg:p-0",
        "lg:grid lg:grid-cols-[340px_1fr] lg:gap-4 lg:h-[calc(100vh-5rem)]"
      )}
    >
      {/* ── List panel ── */}
      {/* Mobile: shown only when no active conversation. Desktop: always shown. */}
      <div
        className={cn(
          "flex-1 min-h-0",
          conversationId && "hidden lg:block"
        )}
      >
        <ChatListPanel
          conversations={filteredConversations}
          requests={filteredRequests}
          loading={convLoading}
          search={search}
          onSearch={setSearch}
          activeId={conversationId}
          listTab={listTab}
          onTabChange={setListTab}
          onRespond={handleRespond}
        />
      </div>

      {/* ── Thread panel ── */}
      {/* Mobile: shown only when conversation is active. Desktop: always shown. */}
      <div
        className={cn(
          "flex-1 min-h-0",
          !conversationId && "hidden lg:block"
        )}
      >
        {conversationId ? (
          <ChatThread
            conv={activeConv}
            convInfo={activeConvInfo}
            loading={msgLoading}
            draft={draft}
            onDraftChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            onSend={handleSend}
            currentUserId={user?.id || ""}
            isTyping={isTyping}
            messagesContainerRef={messagesContainerRef}
            onBack={() => navigate({ view: "chat" })}
            onRespond={handleRespond}
          />
        ) : (
          <div className="h-full flex items-center justify-center rounded-2xl border border-border/60 bg-muted/30 p-6">
            <EmptyState
              kind="chat"
              title="یک گفتگو را انتخاب کنید"
              description="از لیست کناری یک گفتگو را انتخاب کنید یا همکار جدیدی پیدا کنید."
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "talents" })}
                  className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Users className="w-4 h-4" />
                  پیدا کردن همکار
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Chat List Panel ───────────────────────────── */

function ChatListPanel({
  conversations,
  requests,
  loading,
  search,
  onSearch,
  activeId,
  listTab,
  onTabChange,
  onRespond,
}: {
  conversations: ConversationListItem[];
  requests: ConversationListItem[];
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  activeId?: string;
  listTab: "messages" | "requests";
  onTabChange: (t: "messages" | "requests") => void;
  onRespond: (id: string, action: "accept" | "reject") => void;
}) {
  const tabItems = [
    { key: "messages" as const, label: "پیام‌ها", count: conversations.length },
    { key: "requests" as const, label: "درخواست‌ها", count: requests.length },
  ];

  return (
    <div className="h-full flex flex-col bg-card border-b border-border/60 lg:border lg:rounded-2xl lg:shadow-card overflow-hidden">
      {/* Header with title + tabs + search */}
      <div className="shrink-0 p-3 border-b border-border/60 space-y-3 bg-card lg:rounded-t-2xl">
        {/* Mobile title (full-screen header) */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="grid place-items-center w-10 h-10 rounded-2xl bg-primary text-primary-foreground shadow-md">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold leading-tight tracking-tight">چت</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              گفتگوی زنده با همکاران
            </p>
          </div>
        </div>

        {/* Tabs + find-coworkers button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/60">
            {tabItems.map((t) => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={cn(
                  "relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  listTab === t.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {t.count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                      listTab === t.key
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : t.key === "requests"
                        ? "bg-warning/15 text-warning"
                        : "bg-muted-foreground/15 text-muted-foreground"
                    )}
                  >
                    {toFa(t.count)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl hover:bg-primary/5 text-primary"
            onClick={() => navigate({ view: "talents" })}
            aria-label="پیدا کردن همکار"
          >
            <Users className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="جست‌وجو در گفتگوها..."
            className="w-full h-9 pr-8 pl-3 text-xs rounded-xl border border-input bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto slim-scroll min-h-0">
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
        ) : listTab === "messages" ? (
          conversations.length === 0 ? (
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
                      className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <Users className="w-4 h-4" />
                      پیدا کردن همکار
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            conversations.map((c, i) => (
              <ConversationRow
                key={c.id}
                c={c}
                active={c.id === activeId}
                index={i}
                onRespond={onRespond}
                showActions={false}
              />
            ))
          )
        ) : requests.length === 0 ? (
          <div className="p-4">
            <EmptyState
              kind="chat"
              title={search ? "موردی پیدا نشد" : "درخواستی ندارید"}
              description={
                search
                  ? "عبارت دیگری را امتحان کنید."
                  : "درخواست‌های پیام جدید اینجا نمایش داده می‌شوند."
              }
              className="py-6"
            />
          </div>
        ) : (
          requests.map((c, i) => (
            <ConversationRow
              key={c.id}
              c={c}
              active={c.id === activeId}
              index={i}
              onRespond={onRespond}
              showActions
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Conversation Row ───────────────────────────── */

function ConversationRow({
  c,
  active,
  index,
  onRespond,
  showActions,
}: {
  c: ConversationListItem;
  active: boolean;
  index: number;
  onRespond: (id: string, action: "accept" | "reject") => void;
  showActions: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handleRespond(action: "accept" | "reject") {
    setBusy(true);
    try {
      await onRespond(c.id, action);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.25) }}
      className={cn(
        "relative border-b border-border/40 transition-colors",
        active ? "bg-primary/10" : "hover:bg-muted/40"
      )}
    >
      <button
        onClick={() => navigate({ view: "chat", conversationId: c.id })}
        className="w-full text-right flex items-center gap-3 p-3"
      >
        <div className="relative shrink-0">
          <UserAvatar
            name={c.otherUser.name}
            avatarUrl={c.otherUser.avatarUrl}
            verified={c.otherUser.isVerifiedBadge}
            gender={c.otherUser.gender}
            size="md"
          />
          {c.unreadCount > 0 && c.status === "active" && (
            <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {toFa(c.unreadCount > 9 ? "۹+" : c.unreadCount)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-xs truncate",
                active ? "font-bold text-primary" : "font-semibold text-foreground"
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
              active ? "text-primary/80" : "text-muted-foreground"
            )}
          >
            {c.status === "pending_request" && c.myRequestPending
              ? "در انتظار تأیید درخواست..."
              : c.lastMessage
              ? c.lastMessage.content
              : "گفتگوی جدید — شروع کنید"}
          </p>
        </div>
        {!showActions && c.status === "pending_request" && (
          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-warning/15 text-warning text-[9px] font-bold flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" /> در انتظار
          </span>
        )}
      </button>

      {/* Accept / reject buttons for incoming requests */}
      {showActions && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleRespond("accept")}
            disabled={busy}
            className="gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-8 text-xs flex-1"
          >
            {busy ? <Skeleton className="w-3 h-3 rounded-full" /> : <Check className="w-3.5 h-3.5" />}
            تأیید
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRespond("reject")}
            disabled={busy}
            className="gap-1.5 rounded-xl border-rose/30 text-rose hover:bg-rose/5 font-semibold h-8 text-xs flex-1"
          >
            <X className="w-3.5 h-3.5" />
            رد
          </Button>
        </div>
      )}
    </motion.div>
  );
}

/* ───────────────────────────── Chat Thread ───────────────────────────── */

function ChatThread({
  conv,
  convInfo,
  loading,
  draft,
  onDraftChange,
  onKeyDown,
  onSend,
  currentUserId,
  isTyping,
  messagesContainerRef,
  onBack,
  onRespond,
}: {
  conv: ConversationDetail | null;
  convInfo: ConversationListItem | null;
  loading: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  currentUserId: string;
  isTyping: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  onBack?: () => void;
  onRespond: (id: string, action: "accept" | "reject") => void;
}) {
  const other = conv?.conversation?.otherUser;
  const messages = conv?.messages ?? [];
  const status = convInfo?.status || "active";
  const initiatorId = convInfo?.initiatorId || null;
  const isMyRequestPending =
    status === "pending_request" && initiatorId === currentUserId;
  const isTheirRequestPending =
    status === "pending_request" && initiatorId !== currentUserId;
  const [busyRespond, setBusyRespond] = useState(false);

  async function handleRespond(action: "accept" | "reject") {
    if (!conv?.conversation) return;
    setBusyRespond(true);
    try {
      await onRespond(conv.conversation.id, action);
    } finally {
      setBusyRespond(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-background lg:rounded-2xl lg:border lg:border-border/60 lg:shadow-card overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 p-3 border-b border-border/60 flex items-center gap-3 bg-primary text-primary-foreground lg:rounded-t-2xl">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl hover:bg-white/10 text-primary-foreground"
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
                gender={other.gender}
                size="md"
              />
            </button>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate({ view: "profile", id: other.id })}
                className="font-bold text-sm hover:opacity-90 transition-opacity truncate block text-right w-full"
              >
                {other.name}
              </button>
              <p className="text-[11px] text-primary-foreground/70 flex items-center gap-1.5 h-4">
                {isTyping ? (
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-bounce" />
                    </span>
                    در حال تایپ...
                  </span>
                ) : status === "active" ? (
                  <span className="truncate flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> دنبال‌شده
                  </span>
                ) : isMyRequestPending ? (
                  <span className="truncate flex items-center gap-1">
                    <Clock className="w-3 h-3" /> درخواست ارسال شد
                  </span>
                ) : isTheirRequestPending ? (
                  <span className="truncate flex items-center gap-1">
                    <Bell className="w-3 h-3" /> درخواست پیام جدید
                  </span>
                ) : (
                  <span className="truncate">{other.bioShort || "مشاهده پروفایل"}</span>
                )}
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-primary-foreground/40 shrink-0" />
          </>
        ) : (
          <div className="flex-1">
            <Skeleton className="h-4 w-32 rounded bg-primary-foreground/10" />
            <Skeleton className="h-2.5 w-20 mt-1.5 rounded bg-primary-foreground/10" />
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto slim-scroll p-4 space-y-3 bg-background min-h-0"
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => {
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
              title={
                isMyRequestPending
                  ? "درخواست شما ارسال شد"
                  : isTheirRequestPending
                  ? "درخواست پیام جدید"
                  : "گفتگو را شروع کنید"
              }
              description={
                isMyRequestPending
                  ? "پس از تأیید طرف مقابل، می‌توانید پیام رد و بدل کنید."
                  : isTheirRequestPending
                  ? "این کاربر می‌خواهد با شما گفتگو شروع کند. درخواست را تأیید یا رد کنید."
                  : "اولین پیام را ارسال کنید — گفتگوی شما کاملاً خصوصی است."
              }
              className="py-6"
            />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => {
              const isMine = m.senderId === currentUserId;
              const prev = messages[idx - 1];
              const showSender = !isMine && (!prev || prev.senderId !== m.senderId);
              const isPending = m.id.startsWith("temp-");
              const isRead = !!m.readAt;
              return (
                <motion.div
                  key={m.id}
                  layout="position"
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "flex flex-col",
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
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tl-md"
                        : "bg-card border border-border/60 rounded-2xl rounded-tr-md"
                    )}
                  >
                    {m.content}
                    <span className="flex items-center gap-1.5 mt-1 -mb-0.5">
                      <span
                        className={cn(
                          "text-[9px]",
                          isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                        )}
                      >
                        {timeAgoFa(m.createdAt)}
                      </span>
                      {/* ── Sent / Seen ticks (WhatsApp-style) ── */}
                      {isMine && (
                        <span className="mr-auto flex items-center">
                          {isRead ? (
                            // Seen — double tick, brighter (signifies read receipt)
                            <CheckCheck className="w-3.5 h-3.5 text-primary-foreground" />
                          ) : (
                            // Sent (or pending) — single tick, slightly dimmer
                            <Check
                              className={cn(
                                "w-3 h-3",
                                isPending
                                  ? "text-primary-foreground/40"
                                  : "text-primary-foreground/70"
                              )}
                            />
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                </motion.div>
              );
            })}
            {/* Live typing indicator (other user is typing) */}
            {isTyping && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-start"
              >
                <div className="bg-card border border-border/60 rounded-2xl rounded-tr-md px-4 py-3 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Input area (varies by conversation status) ── */}
      <div className="shrink-0 p-3 border-t border-border/60 bg-card lg:rounded-b-2xl">
        {status === "active" ? (
          <>
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="پیام بنویسید..."
                  className="flex-1 min-h-[44px] max-h-32 resize-none text-sm rounded-2xl pr-4 pl-3 py-2.5 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40"
                  rows={1}
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={onSend}
                disabled={!draft.trim()}
                className="h-11 w-11 p-0 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-md disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-shadow hover:shadow-lg"
                aria-label="ارسال"
              >
                <Send className="w-4 h-4 -scale-x-100" />
              </motion.button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold/70" />
              Enter برای ارسال · Shift+Enter برای خط جدید
            </p>
          </>
        ) : isMyRequestPending ? (
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-warning/10 border border-warning/20">
            <Clock className="w-4 h-4 text-warning" />
            <p className="text-xs font-medium text-warning">
              در انتظار تأیید درخواست — پس از پذیرش طرف مقابل می‌توانید پیام دهید.
            </p>
          </div>
        ) : isTheirRequestPending ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1 px-2">
              این کاربر می‌خواهد با شما گفتگو کند.
            </p>
            <Button
              size="sm"
              onClick={() => handleRespond("accept")}
              disabled={busyRespond}
              className="gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-10"
            >
              {busyRespond ? (
                <Skeleton className="w-3.5 h-3.5 rounded-full" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              تأیید
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRespond("reject")}
              disabled={busyRespond}
              className="gap-1.5 rounded-xl border-rose/30 text-rose hover:bg-rose/5 font-semibold h-10"
            >
              <X className="w-4 h-4" />
              رد
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
