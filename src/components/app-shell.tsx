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

// ── "Edge Navigation" — premium pattern: chrome lives only at screen edges ──

// Top-level views: no back button shown
const TOP_LEVEL = new Set([
  "feed", "explore", "discover", "talents", "needs", "following", "dashboard", "settings",
]);

// Primary destinations (mobile sheet row + desktop sidebar top group)
const PRIMARY_NAV = [
  { key: "feed", label: "خانه", icon: "home" as const },
  { key: "explore", label: "اکسپلور", icon: "sparkles" as const },
  { key: "discover", label: "کشف", icon: "compass" as const },
  { key: "talents", label: "استعدادها", icon: "users" as const },
  { key: "needs", label: "نیازمندی", icon: "briefcase" as const },
];

// Secondary destinations (mobile sheet grid + desktop sidebar bottom group)
const SECONDARY_NAV = [
  { key: "dashboard", label: "داشبورد", icon: "grid" as const },
  { key: "following", label: "دنبال‌شده", icon: "userCheck" as const },
  { key: "connections", label: "ارتباطات", icon: "userPlus" as const },
  { key: "my-needs", label: "نیازمندی‌های من", icon: "briefcase" as const },
  { key: "tickets", label: "تیکت‌ها", icon: "ticket" as const },
  { key: "settings", label: "تنظیمات", icon: "settings" as const },
];

// Soft premium shadows
const SOFT_SHADOW = "shadow-[0_4px_18px_rgba(20,20,40,0.08)]";
const FLOAT_SHADOW = "shadow-[0_8px_28px_rgba(20,20,40,0.12)]";
const FAB_SHADOW = "shadow-[0_14px_34px_rgba(20,20,40,0.22)]";
const ROSE_GLOW = "shadow-[0_6px_18px_rgba(196,60,108,0.32)]";

export function AppShell({ children }: { children?: React.ReactNode }) {
  const route = useNav((s) => s.route);
  const init = useNav((s) => s.init);
  const { user, fetchUser, loading } = useUser();
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Close mobile menu on browser navigation (hashchange)
  useEffect(() => {
    const handler = () => setMenuOpen(false);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

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
  const showBack = !TOP_LEVEL.has(activeView) && activeView !== "auth";

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ═══ Desktop sidebar — RTL: right side, icon-only, expands on hover ═══ */}
      <DesktopSidebar
        isActive={isActive}
        user={user}
        loading={loading}
        unread={unread}
        chatUnread={chatUnread}
      />

      {/* ═══ Mobile top chrome — corner floating buttons only ═══ */}
      <MobileTopChrome
        showBack={showBack}
        goBack={goBack}
        user={user}
        loading={loading}
        unread={unread}
      />

      {/* ═══ Mobile chat FAB — bottom-left, sits above menu FAB ═══ */}
      {user && activeView !== "chat" && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.15 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate({ view: "chat" })}
          className={cn(
            "md:hidden fixed bottom-24 left-4 z-30 grid place-items-center rounded-full bg-card text-foreground",
            FLOAT_SHADOW
          )}
          style={{ width: "52px", height: "52px" }}
          aria-label="چت"
        >
          <Icon name="chat" size={22} strokeWidth={2.2} className="text-foreground" />
          {chatUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-extrabold ring-2 ring-card">
              {chatUnread > 9 ? toFa(9) + "+" : toFa(chatUnread)}
            </span>
          )}
        </motion.button>
      )}

      {/* ═══ Main content — full-bleed except sidebar reservation on desktop ═══ */}
      <main ref={mainRef} className="flex-1 w-full md:pr-16">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8 pt-16 md:pt-8 pb-32 md:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={routeKey}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              {renderView(route)}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ═══ Mobile menu FAB + radial bottom sheet ═══ */}
      <MobileMenuFab
        open={menuOpen}
        setOpen={setMenuOpen}
        isActive={isActive}
        user={user}
        loading={loading}
        unread={unread}
        chatUnread={chatUnread}
      />
    </div>
  );
}

// ── Desktop: vertical icon rail that expands on hover (RTL → right side) ──
function DesktopSidebar({
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
  const [expanded, setExpanded] = useState(false);

  // Sidebar order: primary group, then secondary group, then chat + notifications
  const lowerItems = [
    { key: "chat", label: "چت", icon: "chat" as const, badge: chatUnread },
    { key: "notifications", label: "اعلان‌ها", icon: "bell" as const, badge: unread },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 220 : 72 }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="hidden md:flex fixed top-0 right-0 bottom-0 z-30 flex-col bg-sidebar border-l border-sidebar-border overflow-hidden"
      style={{ boxShadow: "0 0 50px rgba(20,20,40,0.04)" }}
    >
      {/* ── Logo (top) ── */}
      <div className="h-16 shrink-0 flex items-center pe-2 ps-2">
        <button
          onClick={() => navigate({ view: "feed" })}
          className="w-12 h-12 mx-auto shrink-0 grid place-items-center rounded-2xl hover:bg-muted/60 transition-colors"
          aria-label="همتیم"
        >
          <LogoMark className="w-8 h-8" />
        </button>
        <motion.span
          initial={false}
          animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : 8 }}
          transition={{ duration: 0.15, delay: expanded ? 0.08 : 0 }}
          className="text-xl font-extrabold tracking-tight whitespace-nowrap text-foreground"
        >
          همتیم
        </motion.span>
      </div>

      {/* ── Nav (middle, scrollable) ── */}
      <nav className="flex-1 px-2 py-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        {PRIMARY_NAV.map((item) => (
          <SidebarNavButton
            key={item.key}
            item={item}
            expanded={expanded}
            active={isActive(item.key)}
          />
        ))}

        <div className="my-1.5 mx-2 h-px bg-border" />

        {SECONDARY_NAV.map((item) => (
          <SidebarNavButton
            key={item.key}
            item={item}
            expanded={expanded}
            active={isActive(item.key)}
          />
        ))}

        <div className="my-1.5 mx-2 h-px bg-border" />

        {lowerItems.map((item) => (
          <SidebarNavButton
            key={item.key}
            item={item}
            expanded={expanded}
            active={isActive(item.key)}
            badge={item.badge}
          />
        ))}
      </nav>

      {/* ── Profile / login (bottom) ── */}
      <div className="shrink-0 p-2 border-t border-sidebar-border">
        {user ? (
          <button
            onClick={() => navigate({ view: "my-profile" })}
            className={cn(
              "w-full h-12 rounded-2xl transition-colors flex items-center",
              expanded ? "ps-2 gap-3" : "justify-center"
            )}
            aria-label="پروفایل من"
          >
            <span className="shrink-0">
              <UserAvatar
                name={user.name}
                avatarUrl={user.profile?.avatarUrl}
                verified={user.isVerifiedBadge}
                gender={user.profile?.gender}
                size="sm"
              />
            </span>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15, delay: 0.08 }}
                  className="text-sm font-bold whitespace-nowrap truncate text-foreground"
                >
                  {user.name}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ) : loading ? null : (
          <button
            onClick={() => navigate({ view: "auth" })}
            className={cn(
              "w-full h-12 rounded-2xl bg-primary text-primary-foreground transition-colors flex items-center",
              expanded ? "ps-2 gap-3 justify-start" : "justify-center"
            )}
            aria-label="ورود"
          >
            <span className="w-9 h-9 shrink-0 grid place-items-center rounded-full bg-primary-foreground/15">
              <Icon name="user" size={20} className="text-primary-foreground" />
            </span>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15, delay: 0.08 }}
                  className="text-sm font-extrabold whitespace-nowrap"
                >
                  ورود / ثبت‌نام
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
    </motion.aside>
  );
}

// ── Desktop sidebar nav button (icon + sliding label) ──
function SidebarNavButton({
  item,
  expanded,
  active,
  badge = 0,
}: {
  item: { key: string; label: string; icon: string };
  expanded: boolean;
  active: boolean;
  badge?: number;
}) {
  return (
    <button
      onClick={() => navigate({ view: item.key as Route["view"] } as Route)}
      className={cn(
        "relative w-full h-11 rounded-2xl transition-colors flex items-center",
        active
          ? "bg-rose/10"
          : "hover:bg-muted/60"
      )}
      style={active ? { boxShadow: "0 4px 14px rgba(196,60,108,0.16)" } : undefined}
    >
      {/* Active accent bar (RTL: right edge = start) */}
      {active && (
        <motion.span
          layoutId="sidebar-active-bar"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-rose"
        />
      )}
      {/* Icon slot */}
      <span
        className={cn(
          "w-12 h-11 grid place-items-center shrink-0",
          active ? "text-rose" : "text-foreground/75"
        )}
      >
        <span className="relative">
          <Icon name={item.icon as any} size={22} strokeWidth={active ? 2.6 : 2} />
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 grid place-items-center rounded-full bg-rose text-white text-[9px] font-extrabold ring-2 ring-sidebar">
              {badge > 9 ? toFa(9) + "+" : toFa(badge)}
            </span>
          )}
        </span>
      </span>
      {/* Label (slides in on expand) */}
      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15, delay: 0.08 }}
            className={cn(
              "text-sm font-bold whitespace-nowrap",
              active ? "text-rose" : "text-foreground"
            )}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Mobile top chrome — corner floating circles ──
function MobileTopChrome({
  showBack,
  goBack,
  user,
  loading,
  unread,
}: {
  showBack: boolean;
  goBack: () => void;
  user: any;
  loading: boolean;
  unread: number;
}) {
  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-30 pt-safe pointer-events-none">
      <div className="px-4 pt-3 flex items-center justify-between gap-2">
        {/* Right corner (RTL start) — Back on detail pages, else logo mark */}
        <div className="pointer-events-auto">
          <AnimatePresence mode="wait">
            {showBack ? (
              <motion.button
                key="back"
                initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 30 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                onClick={goBack}
                whileTap={{ scale: 0.86 }}
                className={cn(
                  "grid place-items-center w-11 h-11 rounded-full bg-card text-foreground",
                  SOFT_SHADOW
                )}
                aria-label="بازگشت"
              >
                <Icon name="chevronRight" size={22} strokeWidth={2.6} />
              </motion.button>
            ) : (
              <motion.button
                key="logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                whileTap={{ scale: 0.86 }}
                onClick={() => navigate({ view: "feed" })}
                className={cn(
                  "grid place-items-center w-11 h-11 rounded-full bg-card",
                  SOFT_SHADOW
                )}
                aria-label="همتیم"
              >
                <LogoMark className="w-7 h-7" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Left corner (RTL end) — Notifications + Profile (or login button) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {user ? (
            <>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                whileTap={{ scale: 0.86 }}
                onClick={() => navigate({ view: "notifications" })}
                className={cn(
                  "relative grid place-items-center w-11 h-11 rounded-full bg-card",
                  SOFT_SHADOW
                )}
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" size={20} strokeWidth={2.2} className="text-foreground" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-extrabold">
                    {unread > 9 ? toFa(9) + "+" : toFa(unread)}
                  </span>
                )}
              </motion.button>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                whileTap={{ scale: 0.86 }}
                onClick={() => navigate({ view: "my-profile" })}
                className="relative"
                aria-label="پروفایل من"
              >
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.profile?.avatarUrl}
                  verified={user.isVerifiedBadge}
                  gender={user.profile?.gender}
                  size="md"
                  className="ring-2 ring-card"
                />
              </motion.button>
            </>
          ) : loading ? null : (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate({ view: "auth" })}
              className={cn(
                "grid place-items-center h-11 px-5 rounded-full bg-card font-extrabold text-sm text-foreground",
                SOFT_SHADOW
              )}
            >
              ورود
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mobile menu FAB + bottom sheet with nav grid ──
function MobileMenuFab({
  open,
  setOpen,
  isActive,
  user,
  loading,
  unread,
  chatUnread,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  isActive: (key: string) => boolean;
  user: any;
  loading: boolean;
  unread: number;
  chatUnread: number;
}) {
  // Build secondary items with badges
  const secondaryItems = [
    { key: "chat", label: "چت", icon: "chat" as const, badge: chatUnread },
    { key: "notifications", label: "اعلان‌ها", icon: "bell" as const, badge: unread },
    ...SECONDARY_NAV,
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe"
          >
            <div
              className="bg-card rounded-t-[32px] overflow-hidden"
              style={{ boxShadow: "0 -14px 60px rgba(20,20,40,0.18)" }}
            >
              {/* Drag handle */}
              <div className="pt-3 pb-1 grid place-items-center">
                <div className="w-10 h-1.5 rounded-full bg-foreground/15" />
              </div>

              {/* Header */}
              <div className="px-5 pb-4 pt-1 flex items-center justify-between">
                <div>
                  <p className="text-base font-extrabold text-foreground">منوی همتیم</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">یکی از بخش‌ها را انتخاب کنید</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="grid place-items-center w-9 h-9 rounded-full bg-muted text-muted-foreground"
                  aria-label="بستن"
                >
                  <Icon name="x" size={18} strokeWidth={2.6} />
                </button>
              </div>

              {/* Primary tiles — 5 in a row */}
              <div className="px-4">
                <div className="grid grid-cols-5 gap-1.5">
                  {PRIMARY_NAV.map((item, i) => {
                    const active = isActive(item.key);
                    return (
                      <motion.button
                        key={item.key}
                        initial={{ opacity: 0, y: 18, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: 0.06 + i * 0.04,
                          type: "spring",
                          stiffness: 400,
                          damping: 22,
                        }}
                        onClick={() => {
                          navigate({ view: item.key as Route["view"] } as Route);
                          setOpen(false);
                        }}
                        className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl active:scale-95 transition-transform"
                      >
                        <div
                          className={cn(
                            "w-12 h-12 grid place-items-center rounded-2xl transition-colors",
                            active ? "bg-rose text-white" : "bg-primary/5 text-primary"
                          )}
                          style={
                            active
                              ? { boxShadow: "0 6px 18px rgba(196,60,108,0.32)" }
                              : undefined
                          }
                        >
                          <Icon name={item.icon} size={22} strokeWidth={active ? 2.6 : 2.2} />
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-bold leading-tight text-center",
                            active ? "text-rose" : "text-foreground"
                          )}
                        >
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-5 my-3 h-px bg-border" />

              {/* Secondary tiles — 4-col grid */}
              <div className="px-4">
                <div className="grid grid-cols-4 gap-1.5">
                  {secondaryItems.map((item, i) => {
                    const active = isActive(item.key);
                    return (
                      <motion.button
                        key={item.key}
                        initial={{ opacity: 0, y: 14, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: 0.22 + i * 0.035,
                          type: "spring",
                          stiffness: 400,
                          damping: 22,
                        }}
                        onClick={() => {
                          navigate({ view: item.key as Route["view"] } as Route);
                          setOpen(false);
                        }}
                        className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl active:scale-95 transition-transform"
                      >
                        <div
                          className={cn(
                            "relative w-11 h-11 grid place-items-center rounded-2xl transition-colors",
                            active ? "bg-rose/15 text-rose" : "bg-muted text-foreground"
                          )}
                        >
                          <Icon name={item.icon} size={20} strokeWidth={active ? 2.6 : 2.2} />
                          {item.badge ? (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-extrabold ring-2 ring-card">
                              {item.badge > 9 ? toFa(9) + "+" : toFa(item.badge)}
                            </span>
                          ) : null}
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-bold leading-tight text-center",
                            active ? "text-rose" : "text-foreground"
                          )}
                        >
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Account section */}
              <div className="px-5 py-4 mt-2 border-t border-border flex items-center justify-between gap-3">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        navigate({ view: "my-profile" });
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 min-w-0"
                    >
                      <UserAvatar
                        name={user.name}
                        avatarUrl={user.profile?.avatarUrl}
                        verified={user.isVerifiedBadge}
                        gender={user.profile?.gender}
                        size="md"
                      />
                      <div className="text-right min-w-0">
                        <p className="text-sm font-extrabold text-foreground line-clamp-1">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground">مشاهده پروفایل من</p>
                      </div>
                    </button>
                    <button
                      onClick={async () => {
                        await apiPost("/api/auth/logout");
                        useUser.getState().setUser(null);
                        setOpen(false);
                        toast({ title: "خارج شدید" });
                        navigate({ view: "feed" });
                      }}
                      className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-rose/10 text-rose font-bold text-sm shrink-0"
                    >
                      <Icon name="logout" size={18} strokeWidth={2.4} className="text-rose" />
                      <span>خروج</span>
                    </button>
                  </>
                ) : loading ? null : (
                  <button
                    onClick={() => {
                      navigate({ view: "auth" });
                      setOpen(false);
                    }}
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-extrabold text-sm"
                  >
                    ورود / ثبت‌نام
                  </button>
                )}
              </div>

              {/* Bottom spacer to clear FAB */}
              <div className="h-20" aria-hidden />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The FAB itself — rotates + swaps icon */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 24 }}
        className={cn(
          "md:hidden fixed bottom-6 right-6 z-50 grid place-items-center rounded-full",
          open ? "bg-rose text-white" : "bg-primary text-primary-foreground"
        )}
        style={{
          width: "56px",
          height: "56px",
          boxShadow: open
            ? "0 14px 34px rgba(196,60,108,0.4)"
            : "0 14px 34px rgba(20,20,40,0.22)",
        }}
        aria-label={open ? "بستن منو" : "باز کردن منو"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className="grid place-items-center"
            >
              <Icon name="x" size={26} strokeWidth={2.6} />
            </motion.span>
          ) : (
            <motion.span
              key="grid"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className="grid place-items-center"
            >
              <Icon name="grid" size={24} strokeWidth={2.4} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
