"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNav, navigate, type Route } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/icon";
import { LogoMark } from "@/components/shared/illustrations";
import { UserAvatar } from "@/components/shared/user-avatar";
import { BackButton } from "@/components/shared/back-button";
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
import { TopTalentView } from "@/components/views/top-talent-view";
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
    case "post": return <PostDetailView id={route.id} fromProfile={route.params?.from === "profile"} />;
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
    case "top-talent": return <TopTalentView />;
    case "onboarding": return <OnboardingView />;
    // ادمین با پالت سبز قبلی (ایزوله — کد ادمین دست‌نخورده)
    case "admin": return <div className="admin-legacy"><AdminView /></div>;
    case "auth": return <AuthView />;
    default: return <FeedView />;
  }
}

// ── "Standard Tab Bar" — clean, professional, iOS-quality ──

// Top-level views: no back button shown on detail pages
const TOP_LEVEL = new Set([
  "feed", "explore", "discover", "talents", "needs", "following", "dashboard", "settings", "my-profile",
]);

// Mobile bottom tab bar (5 tabs + more)
const MOBILE_TABS = [
  { key: "feed", label: "خانه", icon: "home" as const, route: { view: "feed" } as Route },
  { key: "explore", label: "برترین‌ها", icon: "sparkles" as const, route: { view: "explore" } as Route },
  { key: "discover", label: "کشف", icon: "compass" as const, route: { view: "discover" } as Route },
  { key: "talents", label: "استعدادها", icon: "users" as const, route: { view: "talents" } as Route },
  { key: "needs", label: "نیازمندی", icon: "briefcase" as const, route: { view: "needs" } as Route },
];

// Desktop top nav (center cluster)
const DESKTOP_NAV = [
  { key: "feed", label: "خانه", route: { view: "feed" } as Route },
  { key: "explore", label: "استعدادهای برتر", route: { view: "explore" } as Route },
  { key: "discover", label: "کشف", route: { view: "discover" } as Route },
  { key: "talents", label: "استعدادها", route: { view: "talents" } as Route },
  { key: "needs", label: "نیازمندی", route: { view: "needs" } as Route },
];



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
    <div className="relative min-h-screen flex flex-col bg-background">
      {/* ═══ Aurora ambient background — زنده، فقط transform (۶۰fps) ═══ */}
      <div aria-hidden className="aurora">
        <span className="aurora-blob aurora-1" />
        <span className="aurora-blob aurora-2" />
        <span className="aurora-blob aurora-3" />
      </div>

      {/* ═══ Mobile: هدر شیشه‌ای چسبان (لوگو + دکمه ورود/اکشن‌ها) ═══ */}
      <MobileHeader user={user} loading={loading} unread={unread} />

      {/* ═══ Desktop: clean top bar (glass, logo start, nav center, actions end) ═══ */}
      <DesktopTopBar
        isActive={isActive}
        user={user}
        loading={loading}
        unread={unread}
        chatUnread={chatUnread}
        showBack={showBack}
      />

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
            "grad-brand text-white shadow-glow"
          )}
          style={{
            width: "56px",
            height: "56px",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
          }}
          aria-label="چت"
        >
          <Icon name="chat" size={24} strokeWidth={2.2} className="text-white" />
          {chatUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 grid place-items-center rounded-full bg-rose text-white text-[11px] font-extrabold ring-2 ring-background">
              {chatUnread > 9 ? toFa(9) + "+" : toFa(chatUnread)}
            </span>
          )}
        </motion.button>
      )}

      {/* ═══ Main content ═══ */}
      <main ref={mainRef} className="relative flex-1 w-full">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8 pt-[4.5rem] md:pt-24 pb-28 md:pb-12">
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

      {/* ═══ Mobile: bottom tab bar (5 tabs + more sheet) ═══ */}
      <MobileTabBar
        tabs={MOBILE_TABS}
        isActive={isActive}
        onTabClick={handleTabClick}
        user={user}
        unread={unread}
        chatUnread={chatUnread}
      />
    </div>
  );
}

// ── Mobile: sticky glass header — لوگو راست، دکمه ورود/اکشن‌ها چپ ──
function MobileHeader({
  user,
  loading,
  unread,
}: {
  user: any;
  loading: boolean;
  unread: number;
}) {
  return (
    <header
      className="md:hidden sticky top-0 z-40 h-14 glass-strong border-b border-border/50"
      aria-label="هدر موبایل"
    >
      <div className="h-full px-4 flex items-center justify-between gap-3">
        {/* لوگو — سمت راست */}
        <button
          onClick={() => navigate({ view: "feed" })}
          className="flex items-center gap-2 shrink-0"
          aria-label="همتیم"
        >
          <span className="grid place-items-center w-9 h-9 rounded-xl grad-brand shadow-glow">
            <LogoMark className="w-6 h-6" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-foreground">همتیم</span>
        </button>

        {/* اکشن‌ها — سمت چپ */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <button
                onClick={() => navigate({ view: "notifications" })}
                className="relative grid place-items-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" size={18} strokeWidth={2.2} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-0.5 grid place-items-center rounded-full bg-rose text-white text-[9px] font-extrabold">
                    {unread > 9 ? toFa(9) + "+" : toFa(unread)}
                  </span>
                )}
              </button>
              <button onClick={() => navigate({ view: "my-profile" })} aria-label="پروفایل من">
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.profile?.avatarUrl}
                  verified={user.isVerifiedBadge}
                  topTalent={user.isTopTalent}
                  gender={user.profile?.gender}
                  size="sm"
                />
              </button>
            </>
          ) : loading ? (
            <span className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          ) : (
            <button
              onClick={() => navigate({ view: "auth" })}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl grad-brand text-white font-extrabold text-[13px] shadow-glow hover:opacity-95 transition-opacity"
            >
              ورود / ثبت‌نام
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Desktop top bar: clean, glass, logo start, nav center, actions end ──
function DesktopTopBar({
  isActive,
  user,
  loading,
  unread,
  chatUnread,
  showBack,
}: {
  isActive: (key: string) => boolean;
  user: any;
  loading: boolean;
  unread: number;
  chatUnread: number;
  showBack: boolean;
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
          <span className="grid place-items-center w-10 h-10 rounded-2xl grad-brand shadow-glow">
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
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="desktop-nav-pill"
                    className="absolute inset-0 rounded-xl grad-brand shadow-glow"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── End: Actions (back on detail pages, chat, notifications, profile / login) ── */}
        <div className="flex items-center gap-2 shrink-0">
          {showBack && <BackButton label="بازگشت" className="hidden md:inline-flex" />}
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
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl grad-brand text-white font-extrabold text-sm shadow-glow hover:opacity-95 transition-opacity"
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

// ── Mobile: bottom tab bar (4 tabs + "more" button that opens sheet) ──
function MobileTabBar({
  tabs,
  isActive,
  onTabClick,
  user,
  unread,
  chatUnread,
}: {
  tabs: typeof MOBILE_TABS;
  isActive: (key: string) => boolean;
  onTabClick: (tab: typeof MOBILE_TABS[number]) => void;
  user: any;
  unread: number;
  chatUnread: number;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  const moreItems = [
    { key: "my-profile", label: "پروفایل", icon: "user" as const, route: { view: "my-profile" } as Route },
    { key: "chat", label: "چت", icon: "chat" as const, route: { view: "chat" } as Route, badge: chatUnread },
    { key: "notifications", label: "اعلان‌ها", icon: "bell" as const, route: { view: "notifications" } as Route, badge: unread },
    { key: "connections", label: "ارتباطات", icon: "userPlus" as const, route: { view: "connections" } as Route },
    { key: "my-needs", label: "نیازمندی‌های من", icon: "briefcase" as const, route: { view: "my-needs" } as Route },
    { key: "dashboard", label: "داشبورد", icon: "grid" as const, route: { view: "dashboard" } as Route },
    { key: "following", label: "دنبال‌شده", icon: "userCheck" as const, route: { view: "following" } as Route },
    { key: "edit-profile", label: "ویرایش پروفایل", icon: "pencil" as const, route: { view: "edit-profile" } as Route },
    { key: "tickets", label: "تیکت‌ها", icon: "ticket" as const, route: { view: "tickets" } as Route },
    { key: "settings", label: "تنظیمات", icon: "settings" as const, route: { view: "settings" } as Route },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed z-40 inset-x-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        {/* داکِ شیشه‌ای مایع — بدون z-index روی main تا شیت‌ها (z-70+) روی آن قرار گیرند
            (کلاس‌های backdrop-* خودِ Tailwind چون unprefixed کامپایل می‌شوند، در همه‌ی مرورگرها بلور واقعی می‌دهند) */}
        <div className="glass-liquid backdrop-blur-[28px] backdrop-saturate-200 backdrop-brightness-105 rounded-[26px] overflow-hidden">
        <div className="grid grid-cols-6 h-[64px]">
          {tabs.map((tab) => {
            const active = isActive(tab.key);
            return (
              <motion.button
                key={tab.key}
                onClick={() => onTabClick(tab)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="relative flex flex-col items-center justify-center gap-0.5"
                aria-label={tab.label}
              >
                {active && (
                  <motion.span
                    layoutId="dock-pill"
                    className="absolute inset-x-2 inset-y-1.5 rounded-[18px] grad-brand shadow-glow"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <motion.span
                  key={active ? `${tab.key}-on` : `${tab.key}-off`}
                  initial={false}
                  animate={active ? { scale: [1, 1.28, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={cn("relative grid place-items-center w-7 h-7", active ? "text-white" : "text-muted-foreground")}
                >
                  <Icon name={tab.icon} size={23} strokeWidth={active ? 2.5 : 2.0} />
                </motion.span>
                <span className={cn("relative text-[10px] font-bold leading-none", active ? "text-white" : "text-muted-foreground")}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
          {/* More button — opens swipe-up sheet */}
          <motion.button
            onClick={() => setMoreOpen(true)}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="relative flex flex-col items-center justify-center gap-0.5"
            aria-label="بیشتر"
          >
            <span className="relative grid place-items-center w-7 h-7 text-muted-foreground">
              <Icon name="more" size={23} strokeWidth={2.0} />
            </span>
            <span className="relative text-[10px] font-bold leading-none text-muted-foreground">بیشتر</span>
          </motion.button>
        </div>
        </div>
      </nav>

      {/* Swipe-up "More" sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/30"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe"
            >
              <div className="glass-strong rounded-t-[28px] border-t border-border/40 overflow-hidden" style={{ boxShadow: "0 -12px 40px rgba(0,0,0,0.15)" }}>
                {/* Drag handle */}
                <div className="pt-3 pb-1 grid place-items-center">
                  <div className="w-10 h-1 rounded-full bg-border" />
                </div>
                {/* Header */}
                <div className="px-5 pt-2 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-base">منوی بیشتر</h3>
                  <button onClick={() => setMoreOpen(false)} className="grid place-items-center w-8 h-8 rounded-full bg-muted">
                    <Icon name="x" size={16} />
                  </button>
                </div>
                {/* User card */}
                {user && (
                  <button
                    onClick={() => { navigate({ view: "my-profile" }); setMoreOpen(false); }}
                    className="mx-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-accent w-[calc(100%-2rem)] text-right"
                  >
                    <UserAvatar name={user.name} avatarUrl={user.profile?.avatarUrl} verified={user.isVerifiedBadge} gender={user.profile?.gender} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{user.name}</p>
                      {user.username && <p className="text-xs text-muted-foreground truncate" dir="ltr">@{user.username}</p>}
                    </div>
                    <Icon name="chevronRight" size={16} className="text-muted-foreground" />
                  </button>
                )}
                {/* Grid of items */}
                <div className="px-4 pb-5 grid grid-cols-4 gap-2">
                  {moreItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => { navigate(item.route); setMoreOpen(false); }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-muted/50 transition-colors active:scale-95"
                    >
                      <div className="relative grid place-items-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
                        <Icon name={item.icon} size={22} strokeWidth={2.2} />
                        {item.badge ? (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-bold">
                            {item.badge > 9 ? "۹+" : item.badge}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                    </button>
                  ))}
                  {user && (
                    <button
                      onClick={async () => {
                        await apiPost("/api/auth/logout");
                        useUser.getState().setUser(null);
                        setMoreOpen(false);
                        toast({ title: "خارج شدید" });
                        navigate({ view: "feed" });
                      }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-rose/5 transition-colors active:scale-95"
                    >
                      <div className="grid place-items-center w-12 h-12 rounded-2xl bg-rose/10 text-rose">
                        <Icon name="logout" size={22} strokeWidth={2.2} />
                      </div>
                      <span className="text-[11px] font-medium text-rose text-center leading-tight">خروج</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
