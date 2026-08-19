"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNav, navigate, type Route } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/icon";
import { LogoMark } from "@/components/shared/illustrations";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AuthView } from "@/components/views/auth-view";
import { FeedView } from "@/components/views/feed-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { FollowingView } from "@/components/views/following-view";
import { DiscoverView } from "@/components/views/discover-view";
import { ExploreView, PostDetailView } from "@/components/views/explore-view";
import { TalentsView } from "@/components/views/talents-view";
import { NeedsView } from "@/components/views/needs-view";
import { NeedDetailView } from "@/components/views/need-detail-view";
import { CreateNeedView } from "@/components/views/create-need-view";
import { MyNeedsView } from "@/components/views/my-needs-view";
import { CategoryView } from "@/components/views/category-view";
import { ProfileView } from "@/components/views/profile-view";
import { EditProfileView } from "@/components/views/edit-profile-view";
import { ConnectionsView } from "@/components/views/connections-view";
import { ChatView } from "@/components/views/chat-view";
import { NotificationsView } from "@/components/views/notifications-view";
import { TicketsView } from "@/components/views/tickets-view";
import { TicketDetailView } from "@/components/views/ticket-detail-view";
import { SettingsView } from "@/components/views/settings-view";
import { OnboardingView } from "@/components/views/onboarding-view";
import { AdminView } from "@/components/views/admin-view";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";

function renderView(route: Route) {
  switch (route.view) {
    case "feed": return <FeedView />;
    case "dashboard": return <DashboardView />;
    case "following": return <FollowingView />;
    case "discover": return <DiscoverView />;
    case "explore": return <ExploreView />;
    case "post": return <PostDetailView id={route.id} />;
    case "talents": return <TalentsView />;
    case "needs": return <NeedsView />;
    case "need": return <NeedDetailView id={route.id} />;
    case "create-need": return <CreateNeedView />;
    case "my-needs": return <MyNeedsView />;
    case "category": return <CategoryView id={route.id} />;
    case "profile": return <ProfileView id={route.id} />;
    case "my-profile": return <ProfileView id="me" />;
    case "edit-profile": return <EditProfileView />;
    case "connections": return <ConnectionsView />;
    case "chat": return <ChatView conversationId={route.conversationId} />;
    case "notifications": return <NotificationsView />;
    case "tickets": return <TicketsView />;
    case "ticket": return <TicketDetailView id={route.id} />;
    case "settings": return <SettingsView />;
    case "onboarding": return <OnboardingView />;
    case "admin": return <AdminView />;
    case "auth": return <AuthView />;
    default: return <FeedView />;
  }
}

// ── "Standard Tab Bar" — clean, professional, iOS-quality ──

// Top-level views: no back button shown on detail pages
const TOP_LEVEL = new Set([
  "feed", "explore", "discover", "talents", "needs", "following", "dashboard", "settings", "my-profile",
]);

// Mobile bottom tab bar (5 tabs)
const MOBILE_TABS = [
  { key: "feed", label: "خانه", icon: "home" as const, route: { view: "feed" } as Route },
  { key: "explore", label: "اکسپلور", icon: "sparkles" as const, route: { view: "explore" } as Route },
  { key: "discover", label: "کشف", icon: "compass" as const, route: { view: "discover" } as Route },
  { key: "talents", label: "استعدادها", icon: "users" as const, route: { view: "talents" } as Route },
  { key: "profile", label: "پروفایل", icon: "user" as const, route: null },
];

// Desktop top nav (center cluster)
const DESKTOP_NAV = [
  { key: "feed", label: "خانه", route: { view: "feed" } as Route },
  { key: "explore", label: "اکسپلور", route: { view: "explore" } as Route },
  { key: "discover", label: "کشف", route: { view: "discover" } as Route },
  { key: "talents", label: "استعدادها", route: { view: "talents" } as Route },
  { key: "needs", label: "نیازمندی", route: { view: "needs" } as Route },
];

// Soft premium shadows (kept subtle, no rose tint on active chrome)
const FAB_SHADOW = "shadow-[0_10px_30px_rgba(0,0,0,0.32)]";

export function AppShell({ children }: { children?: React.ReactNode }) {
  const route = useNav((s) => s.route);
  const init = useNav((s) => s.init);
  const { user, fetchUser, loading } = useUser();
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  // Init nav + fetch user
  useEffect(() => {
    const cleanup = init();
    fetchUser();
    return cleanup;
  }, [init, fetchUser]);

  // Fetch unread notification + chat counts
  useEffect(() => {
    if (!user) return;
    const tick = async () => {
      try {
        const [notifRes, chatRes] = await Promise.all([
          fetch("/api/notifications"),
          fetch("/api/chat/conversations"),
        ]);
        if (notifRes.ok) {
          const data = await notifRes.json();
          setUnread(data.unreadCount || 0);
        }
        if (chatRes.ok) {
          const data = await chatRes.json();
          setChatUnread(data.unreadCount || 0);
        }
      } catch { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [user, route]);

  // Scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route.view, (route as any).id, (route as any).conversationId]);

  // Auth / Onboarding = full screen, no chrome
  if (route.view === "auth" || route.view === "onboarding") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{renderView(route)}</main>
      </div>
    );
  }

  // Admin = full screen, no chrome
  if (route.view === "admin") {
    return <div className="min-h-screen"><main>{renderView(route)}</main></div>;
  }

  const activeView = route.view;
  const showBack = !TOP_LEVEL.has(activeView);

  function goBack() {
    if (typeof window !== "undefined") window.history.back();
  }

  // Route key for transitions
  const routeKey =
    route.view +
    (route.view === "profile" ? route.id : "") +
    (route.view === "category" ? route.id : "") +
    (route.view === "ticket" ? route.id : "") +
    (route.view === "chat" ? route.conversationId || "" : "");

  function isActive(key: string): boolean {
    if (key === "needs") return activeView === "needs" || activeView === "my-needs" || activeView === "create-need";
    if (key === "chat") return activeView === "chat";
    if (key === "profile") return activeView === "my-profile" || activeView === "profile" || activeView === "edit-profile";
    if (key === "notifications") return activeView === "notifications";
    return activeView === key;
  }

  function handleTabClick(tab: typeof MOBILE_TABS[number]) {
    if (tab.key === "profile") {
      if (user) navigate({ view: "my-profile" });
      else navigate({ view: "auth" });
    } else if (tab.route) {
      navigate(tab.route);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ═══ Desktop: clean top bar (glass, logo start, nav center, actions end) ═══ */}
      <DesktopTopBar
        isActive={isActive}
        user={user}
        loading={loading}
        unread={unread}
        chatUnread={chatUnread}
      />

      {/* ═══ Mobile: floating top-left back button (detail pages only) ═══ */}
      {showBack && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: -10 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          onClick={goBack}
          whileTap={{ scale: 0.88 }}
          className="md:hidden fixed top-4 left-4 z-40 grid place-items-center w-10 h-10 rounded-full glass-strong text-foreground"
          style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.3)" }}
          aria-label="بازگشت"
        >
          <Icon name="arrowLeft" size={20} strokeWidth={2.4} />
        </motion.button>
      )}

      {/* ═══ Mobile: floating chat FAB (bottom-left, above tab bar) ═══ */}
      {user && activeView !== "chat" && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.15 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate({ view: "chat" })}
          className={cn(
            "md:hidden fixed left-4 z-40 grid place-items-center rounded-full",
            "bg-primary text-primary-foreground",
            FAB_SHADOW
          )}
          style={{
            width: "56px",
            height: "56px",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
          }}
          aria-label="چت"
        >
          <Icon name="chat" size={24} strokeWidth={2.2} className="text-primary-foreground" />
          {chatUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 grid place-items-center rounded-full bg-rose text-white text-[11px] font-extrabold ring-2 ring-background">
              {chatUnread > 9 ? toFa(9) + "+" : toFa(chatUnread)}
            </span>
          )}
        </motion.button>
      )}

      {/* ═══ Main content ═══ */}
      <main ref={mainRef} className="flex-1 w-full">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8 pt-4 md:pt-24 pb-28 md:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={routeKey}
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              {renderView(route)}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ═══ Mobile: standard bottom tab bar (edge-to-edge glass) ═══ */}
      <MobileTabBar
        tabs={MOBILE_TABS}
        isActive={isActive}
        onTabClick={handleTabClick}
        user={user}
      />
    </div>
  );
}

// ── Desktop top bar: clean, glass, logo start, nav center, actions end ──
function DesktopTopBar({
  isActive,
  user,
  loading,
  unread,
  chatUnread,
}: {
  isActive: (key: string) => boolean;
  user: any;
  loading: boolean;
  unread: number;
  chatUnread: number;
}) {
  return (
    <header
      className="hidden md:flex fixed top-0 inset-x-0 z-40 h-16 glass-strong border-b border-border/60"
    >
      <div className="mx-auto w-full max-w-7xl px-6 flex items-center justify-between gap-6">
        {/* ── Start: Logo + wordmark ── */}
        <button
          onClick={() => navigate({ view: "feed" })}
          className="flex items-center gap-2.5 shrink-0"
          aria-label="همتیم"
        >
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/12">
            <LogoMark className="w-7 h-7" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-foreground">همتیم</span>
        </button>

        {/* ── Center: nav links ── */}
        <nav className="flex items-center gap-1">
          {DESKTOP_NAV.map((item) => {
            const active = isActive(item.key);
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.route)}
                className={cn(
                  "relative h-10 px-4 rounded-xl text-sm font-bold transition-colors",
                  active
                    ? "text-primary-foreground bg-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* ── End: Actions (chat, notifications, profile / login) ── */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {/* Chat */}
              <button
                onClick={() => navigate({ view: "chat" })}
                className="relative grid place-items-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label="چت"
              >
                <Icon name="chat" size={20} strokeWidth={2.2} />
                {chatUnread > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-extrabold">
                    {chatUnread > 9 ? toFa(9) + "+" : toFa(chatUnread)}
                  </span>
                )}
              </button>
              {/* Notifications */}
              <button
                onClick={() => navigate({ view: "notifications" })}
                className="relative grid place-items-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" size={20} strokeWidth={2.2} />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-extrabold">
                    {unread > 9 ? toFa(9) + "+" : toFa(unread)}
                  </span>
                )}
              </button>
              {/* More menu (secondary destinations) */}
              <DesktopMoreMenu />
              {/* Avatar */}
              <button
                onClick={() => navigate({ view: "my-profile" })}
                className="shrink-0 ms-1"
                aria-label="پروفایل من"
              >
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.profile?.avatarUrl}
                  verified={user.isVerifiedBadge}
                  gender={user.profile?.gender}
                  size="sm"
                />
              </button>
            </>
          ) : loading ? null : (
            <button
              onClick={() => navigate({ view: "auth" })}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm hover:bg-primary/90 transition-colors"
            >
              ورود / ثبت‌نام
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Desktop: "more" dropdown for secondary destinations (connections, my-needs, tickets, settings, dashboard, following) ──
function DesktopMoreMenu() {
  const [open, setOpen] = useState(false);
  const items = [
    { label: "داشبورد", icon: "grid" as const, route: { view: "dashboard" } as Route },
    { label: "دنبال‌شده", icon: "userCheck" as const, route: { view: "following" } as Route },
    { label: "ارتباطات", icon: "userPlus" as const, route: { view: "connections" } as Route },
    { label: "نیازمندی‌های من", icon: "briefcase" as const, route: { view: "my-needs" } as Route },
    { label: "تیکت‌ها", icon: "ticket" as const, route: { view: "tickets" } as Route },
    { label: "تنظیمات", icon: "settings" as const, route: { view: "settings" } as Route },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid place-items-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="بیشتر"
      >
        <Icon name="grid" size={20} strokeWidth={2.2} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute end-0 mt-2 w-56 rounded-2xl glass-strong border border-border/60 overflow-hidden z-40"
              style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}
            >
              <div className="p-1.5">
                {items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(item.route);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-bold text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Icon name={item.icon} size={18} strokeWidth={2.2} className="text-muted-foreground" />
                    <span className="flex-1 text-start">{item.label}</span>
                  </button>
                ))}
                <div className="my-1 mx-2 h-px bg-border/60" />
                <button
                  onClick={async () => {
                    await apiPost("/api/auth/logout");
                    useUser.getState().setUser(null);
                    setOpen(false);
                    toast({ title: "خارج شدید" });
                    navigate({ view: "feed" });
                  }}
                  className="w-full flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-bold text-rose hover:bg-rose/10 transition-colors"
                >
                  <Icon name="logout" size={18} strokeWidth={2.4} className="text-rose" />
                  <span className="flex-1 text-start">خروج</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mobile: standard bottom tab bar (edge-to-edge glass, 5 tabs, iOS-quality) ──
function MobileTabBar({
  tabs,
  isActive,
  onTabClick,
  user,
}: {
  tabs: typeof MOBILE_TABS;
  isActive: (key: string) => boolean;
  onTabClick: (tab: typeof MOBILE_TABS[number]) => void;
  user: any;
}) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border/60 pb-safe"
      style={{ boxShadow: "0 -6px 24px rgba(0,0,0,0.25)" }}
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          return (
            <motion.button
              key={tab.key}
              onClick={() => onTabClick(tab)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="relative flex flex-col items-center justify-center gap-1 py-2"
              aria-label={tab.label}
            >
              {active && (
                <motion.span
                  layoutId="active-tab-pill"
                  className="absolute inset-x-3 inset-y-1.5 rounded-2xl bg-primary/12"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={cn(
                  "relative grid place-items-center w-7 h-7 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {/* For profile tab, use filled icon when active */}
                <Icon
                  name={tab.icon}
                  size={24}
                  strokeWidth={active ? 2.6 : 2.0}
                  className={active ? "text-primary" : "text-muted-foreground"}
                />
                {/* Profile tab: show avatar when logged in */}
                {tab.key === "profile" && user && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-background grid place-items-center ring-1 ring-border">
                    <span
                      className="block rounded-full"
                      style={{
                        width: "10px",
                        height: "10px",
                        backgroundColor: user.isVerifiedBadge
                          ? "oklch(0.75 0.15 80)"
                          : "oklch(0.6 0.15 160)",
                      }}
                    />
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "relative text-[10px] font-bold leading-none transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
