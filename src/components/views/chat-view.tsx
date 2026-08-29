"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa } from "@/lib/format";
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

/* ─────────────────── Inline tick icons (no lucide) ──────────────── */

function SingleTick({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 12l5 5L20 5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoubleTick({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 12l5 5L17 5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 17L20 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l10-10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  // Dedup set: track processed message IDs to fix the double-send bug
  const processedIdsRef = useRef<Set<string>>(new Set());

  /* ── Load conversation list ── */
  const loadConversations = useCallback(async () => {
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

  /* ── Load messages of active conversation ── */
  const loadMessages = useCallback(async (id: string) => {
    setMsgLoading(true);
    // Reset dedup set when switching conversations
    processedIdsRef.current = new Set();
    try {
      const d = await api<ConversationDetail>(
        `/api/chat/conversations/${id}/messages`
      );
      setActiveConv(d);
      // Mark all returned message ids as processed
      d.messages.forEach((m) => processedIdsRef.current.add(m.id));
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
      setActiveConv(null);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  /* ── Silent poll for read-status updates only (does not duplicate messages) ── */
  const pollReadStatus = useCallback(async (id: string) => {
    try {
      const d = await api<ConversationDetail>(
        `/api/chat/conversations/${id}/messages`
      );
      setActiveConv((prev) => {
        if (!prev || prev.conversation?.id !== id) return prev;
        // Only update readAt fields for existing messages — never append duplicates
        const existingMap = new Map(prev.messages.map((m) => [m.id, m]));
        // Update readAt for messages that now have readAt set
        const updated = d.messages.map((serverMsg) => {
          const existing = existingMap.get(serverMsg.id);
          if (existing) {
            // Preserve local copy but update readAt
            if (!existing.readAt && serverMsg.readAt) {
              return { ...existing, readAt: serverMsg.readAt };
            }
            return existing;
          }
          return serverMsg;
        });
        // Add any server-only messages we haven't seen yet (e.g. sent from another device)
        const localIds = new Set(prev.messages.map((m) => m.id));
        const newOnes = d.messages.filter((m) => !localIds.has(m.id));
        if (newOnes.length > 0) {
          newOnes.forEach((m) => processedIdsRef.current.add(m.id));
        }
        return { ...prev, messages: [...updated, ...newOnes] };
      });
    } catch {
      /* ignore */
    }
  }, []);

  /* ── Keep refs in sync ── */
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

      // Dedup guard: never add the same message twice
      if (processedIdsRef.current.has(msg.id)) {
        // Even if seen, fall through to update read-status if needed
        if (msg.conversationId === activeId && msg.senderId !== myId) {
          apiPost(`/api/chat/conversations/${msg.conversationId}/read`)
            .then(() => loadConversations())
            .catch(() => {});
        }
        return;
      }
      processedIdsRef.current.add(msg.id);

      if (msg.conversationId === activeId) {
        setActiveConv((prev) => {
          if (!prev) return prev;
          // Double-check by id one more time (race-safety)
          if (prev.messages.some((m) => m.id === msg.id)) return prev;

          // Own message: replace the temp by content match
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
            // No temp found (sent from another device) — append
            return { ...prev, messages: [...msgs, msg] };
          }

          // Other's message: append
          return { ...prev, messages: [...prev.messages, msg] };
        });

        if (isNearBottom()) {
          queueMicrotask(() => scrollToBottom());
        }

        if (msg.senderId !== myId) {
          apiPost(`/api/chat/conversations/${msg.conversationId}/read`)
            .then(() => loadConversations())
            .catch(() => {});
        }
      }

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
  useEffect(() => {
    if (!conversationId || !user) return;
    pollRef.current = setInterval(() => {
      pollReadStatus(conversationId);
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversationId, user, pollReadStatus]);

  /* ── Auto-scroll to bottom on new messages ── */
  useEffect(() => {
    queueMicrotask(() => scrollToBottom());
  }, [activeConv?.messages.length, scrollToBottom]);

  /* ── Send a message (no double-add bug) ── */
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

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Register the temp id as processed so the dedup guard doesn't reject it
    processedIdsRef.current.add(tempId);

    const optimistic: ChatMessage = {
      id: tempId,
      conversationId: convId,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setActiveConv((prev) =>
      prev
        ? // Avoid duplicate: only add if not already present
          prev.messages.some((m) => m.id === tempId)
          ? prev
          : { ...prev, messages: [...prev.messages, optimistic] }
        : prev
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
      <div className="fixed inset-0 z-30 lg:static lg:z-auto bg-background flex items-center justify-center p-6 pt-safe pb-safe">
        <EmptyState
          kind="chat"
          title="برای چت کردن وارد شوید"
          description="برای شروع گفتگو با همکاران، ابتدا وارد حساب کاربری خود شوید."
          action={
            <button
              onClick={() => navigate({ view: "auth" })}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
            >
              <Icon name="lock" size={18} />
              ورود / ثبت‌نام
            </button>
          }
        />
      </div>
    );
  }

  /* ── Respond to message requests ── */
  const handleRespond = async (id: string, action: "accept" | "reject") => {
    try {
      await apiPost(`/api/chat/conversations/${id}/respond`, { action });
      toast({
        title: action === "accept" ? "درخواست تأیید شد" : "درخواست رد شد",
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

  /* ── Layout: full-screen mobile, 2-pane desktop ── */
  return (
    <div
      className={cn(
        "fixed inset-0 z-30 bg-background flex flex-col pt-safe pb-safe",
        "lg:static lg:z-auto lg:inset-auto lg:bg-transparent lg:p-0",
        "lg:grid lg:grid-cols-[360px_1fr] lg:gap-4 lg:h-[calc(100vh-5rem)]"
      )}
    >
      {/* ── List panel ── */}
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
          <div className="h-full flex items-center justify-center rounded-3xl glass p-6">
            <EmptyState
              kind="chat"
              title="یک گفتگو را انتخاب کنید"
              description="از لیست کناری یک گفتگو را انتخاب کنید یا همکار جدیدی پیدا کنید."
              action={
                <button
                  onClick={() => navigate({ view: "talents" })}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
                >
                  <Icon name="users" size={16} />
                  پیدا کردن همکار
                </button>
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
    <div className="h-full flex flex-col glass lg:rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-border/60 space-y-3">
        {/* Mobile title */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="grid place-items-center w-11 h-11 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Icon name="chat" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black leading-tight tracking-tight">چت</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              گفتگوی زنده با همکاران
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative flex items-center gap-0.5 p-1 rounded-2xl bg-muted/60">
          <AnimatePresence>
            {listTab === "messages" && (
              <motion.div
                layoutId="list-tab-pill"
                className="absolute inset-y-1 right-1 w-[calc(50%-0.25rem)] rounded-xl bg-primary shadow-md shadow-primary/20"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            {listTab === "requests" && (
              <motion.div
                layoutId="list-tab-pill"
                className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-primary shadow-md shadow-primary/20"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
          </AnimatePresence>
          {tabItems.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={cn(
                "relative z-10 flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5",
                listTab === t.key
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums",
                    listTab === t.key
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : t.key === "requests"
                      ? "bg-gold/15 text-gold"
                      : "bg-muted-foreground/15 text-muted-foreground"
                  )}
                >
                  {toFa(t.count)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Icon
            name="search"
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="جست‌وجو در گفتگوها..."
            className="w-full h-9 pr-9 pl-3 text-xs rounded-xl border border-input bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto slim-scroll min-h-0">
        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
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
                    <button
                      onClick={() => navigate({ view: "talents" })}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
                    >
                      <Icon name="users" size={16} />
                      پیدا کردن همکار
                    </button>
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
            <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-bold shadow-md shadow-rose/30 tabular-nums">
              {c.unreadCount > 9 ? "۹+" : toFa(c.unreadCount)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm truncate",
                active ? "font-bold text-primary" : "font-bold text-foreground"
              )}
            >
              {c.otherUser.name}
            </span>
            {c.lastMessage && (
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {timeAgoFa(c.lastMessage.createdAt)}
              </span>
            )}
          </div>
          <p
            className={cn(
              "text-xs line-clamp-1 mt-0.5 leading-5",
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
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[9px] font-bold flex items-center gap-0.5">
            <Icon name="clock" size={10} /> در انتظار
          </span>
        )}
      </button>

      {/* Accept / reject buttons for incoming requests */}
      {showActions && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <button
            onClick={() => handleRespond("accept")}
            disabled={busy}
            className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-primary/20"
          >
            {busy ? (
              <Icon name="loader" size={14} className="animate-spin" />
            ) : (
              <Icon name="check" size={14} />
            )}
            تأیید
          </button>
          <button
            onClick={() => handleRespond("reject")}
            disabled={busy}
            className="flex-1 h-9 rounded-xl border border-rose/30 text-rose hover:bg-rose/5 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Icon name="x" size={14} />
            رد
          </button>
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

  // Status pill for header
  const StatusPill = () => {
    if (isTyping) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary-foreground/85">
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/70 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/70 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/70 animate-bounce" />
          </span>
          در حال تایپ...
        </span>
      );
    }
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-primary-foreground/70">
          <Icon name="userCheck" size={12} />
          در ارتباط
        </span>
      );
    }
    if (isMyRequestPending) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-primary-foreground/70">
          <Icon name="clock" size={12} />
          درخواست ارسال شد
        </span>
      );
    }
    if (isTheirRequestPending) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-primary-foreground/70">
          <Icon name="bell" size={12} />
          درخواست پیام جدید
        </span>
      );
    }
    return (
      <span className="text-[11px] text-primary-foreground/70 truncate">
        {other?.bioShort || "مشاهده پروفایل"}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background lg:rounded-3xl lg:border lg:border-border/60 lg:shadow-card overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 p-3 border-b border-border/60 flex items-center gap-3 bg-primary text-primary-foreground lg:rounded-t-3xl">
        {onBack && (
          <button
            onClick={onBack}
            className="shrink-0 grid place-items-center w-9 h-9 rounded-xl hover:bg-white/10 text-primary-foreground transition-colors"
            aria-label="بازگشت"
          >
            <Icon name="chevronRight" size={20} />
          </button>
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
              <div className="h-4 mt-0.5">
                <StatusPill />
              </div>
            </div>
            <Icon name="chevronLeft" size={16} className="text-primary-foreground/40 shrink-0" />
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
        className="flex-1 overflow-y-auto slim-scroll p-4 space-y-2.5 bg-background min-h-0"
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
              const next = messages[idx + 1];
              const isLastInGroup = !next || next.senderId !== m.senderId;
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
                        : "glass border border-border/60 rounded-2xl rounded-tr-md"
                    )}
                  >
                    {m.content}
                    {isLastInGroup && (
                      <span className="flex items-center gap-1.5 mt-1 -mb-0.5">
                        <span
                          className={cn(
                            "text-[9px] tabular-nums",
                            isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}
                        >
                          {timeAgoFa(m.createdAt)}
                        </span>
                        {/* ── Sent / Seen ticks (WhatsApp-style) ── */}
                        {isMine && (
                          <span className="mr-auto flex items-center">
                            {isPending ? (
                              <SingleTick
                                size={12}
                                className="text-primary-foreground/40"
                              />
                            ) : isRead ? (
                              <DoubleTick
                                size={14}
                                className="text-primary-foreground"
                              />
                            ) : (
                              <SingleTick
                                size={12}
                                className="text-primary-foreground/70"
                              />
                            )}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {/* Live typing indicator */}
            {isTyping && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-start"
              >
                <div className="glass border border-border/60 rounded-2xl rounded-tr-md px-4 py-3 flex gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 p-3 border-t border-border/60 glass lg:rounded-b-3xl pb-safe">
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
                className="h-11 w-11 p-0 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-shadow hover:shadow-xl"
                aria-label="ارسال"
              >
                <Icon name="send" size={18} className="-scale-x-100" />
              </motion.button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-2 flex items-center gap-1">
              <Icon name="sparkles" size={11} className="text-gold/70" />
              Enter برای ارسال · Shift+Enter برای خط جدید
            </p>
          </>
        ) : isMyRequestPending ? (
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gold/10 border border-gold/20">
            <Icon name="clock" size={16} className="text-gold" />
            <p className="text-xs font-medium text-gold">
              در انتظار تأیید درخواست — پس از پذیرش طرف مقابل می‌توانید پیام دهید.
            </p>
          </div>
        ) : isTheirRequestPending ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1 px-2">
              این کاربر می‌خواهد با شما گفتگو کند.
            </p>
            <button
              onClick={() => handleRespond("accept")}
              disabled={busyRespond}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-colors"
            >
              {busyRespond ? (
                <Icon name="loader" size={16} className="animate-spin" />
              ) : (
                <Icon name="check" size={16} />
              )}
              تأیید
            </button>
            <button
              onClick={() => handleRespond("reject")}
              disabled={busyRespond}
              className="h-10 px-4 rounded-xl border border-rose/30 text-rose hover:bg-rose/5 font-semibold text-sm flex items-center gap-1.5 transition-colors"
            >
              <Icon name="x" size={16} />
              رد
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
