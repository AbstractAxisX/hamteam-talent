"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
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

// Mobile floating bottom nav: Home, Explore, Discover, Talents + More
const BOTTOM_NAV = [
  { key: "feed", label: "خانه", icon: "home" as const },
  { key: "explore", label: "استعدادهای برتر", icon: "sparkles" as const },
  { key: "discover", label: "کشف", icon: "compass" as const },
  { key: "talents", label: "استعدادها", icon: "users" as const },
] as const;

const TOP_LEVEL = new Set([
  "feed", "explore", "discover", "talents", "needs", "following", "dashboard", "settings",
]);

// Soft premium shadow — diffuse, no border
const SOFT_SHADOW = "shadow-[0_4px_24px_rgba(20,20,40,0.08)]";
const FLOAT_SHADOW = "shadow-[0_8px_32px_rgba(20,20,40,0.12)]";

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ═══ Mobile floating top pills ═══ */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 px-4 pt-4 pt-safe pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          {/* Right (RTL start) = Back button — small circular pill */}
          {showBack ? (
            <motion.button
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              onClick={goBack}
              whileTap={{ scale: 0.88 }}
              className={cn(
                "pointer-events-auto grid place-items-center w-11 h-11 rounded-full bg-card",
                SOFT_SHADOW
              )}
              aria-label="بازگشت"
            >
              <Icon name="chevronRight" className="text-foreground" size={22} strokeWidth={2.4} />
            </motion.button>
          ) : (
            // When no back, show a small logo mark pill on the right (RTL start)
            <motion.button
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate({ view: "feed" })}
              className={cn(
                "pointer-events-auto grid place-items-center w-11 h-11 rounded-full bg-card",
                SOFT_SHADOW
              )}
              aria-label="همتیم"
            >
              <LogoMark className="w-7 h-7" />
            </motion.button>
          )}

          {/* Left (RTL end) = Notifications + Profile/Login */}
          <div className="flex items-center gap-2 mr-auto">
            {user ? (
              <>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => navigate({ view: "notifications" })}
                  className={cn(
                    "pointer-events-auto relative grid place-items-center w-11 h-11 rounded-full bg-card",
                    SOFT_SHADOW
                  )}
                  aria-label="اعلان‌ها"
                >
                  <Icon name="bell" className="text-foreground" size={20} strokeWidth={2.2} />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-extrabold">
                      {unread > 9 ? toFa(9) + "+" : toFa(unread)}
                    </span>
                  )}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => navigate({ view: "my-profile" })}
                  className="pointer-events-auto"
                  aria-label="پروفایل"
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
            ) : (
              !loading && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => navigate({ view: "auth" })}
                  className={cn(
                    "pointer-events-auto h-11 px-5 rounded-full bg-card font-extrabold text-sm",
                    SOFT_SHADOW
                  )}
                >
                  ورود
                </motion.button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ═══ Desktop floating top bar ═══ */}
      <div className="hidden md:block fixed top-4 inset-x-4 z-30">
        <div className={cn("mx-auto max-w-6xl rounded-full bg-card px-5 py-2.5", FLOAT_SHADOW)}>
          <div className="flex items-center justify-between gap-4">
            {/* Right (RTL start) = logo + primary nav */}
            <div className="flex items-center gap-6">
              <button onClick={() => navigate({ view: "feed" })} className="flex items-center gap-2 shrink-0">
                <LogoMark className="w-9 h-9" />
                <span className="text-xl font-extrabold tracking-tight">همتیم</span>
              </button>
              <nav className="flex items-center gap-1">
                {BOTTOM_NAV.map((item) => {
                  const active = activeView === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => navigate({ view: item.key as Route["view"] } as Route)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 h-10 rounded-full text-sm font-bold transition-all",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon name={item.icon} size={18} strokeWidth={active ? 2.6 : 2.2} />
                      <span className="hidden lg:inline">{item.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => navigate({ view: "needs" } as Route)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 h-10 rounded-full text-sm font-bold transition-all",
                    activeView === "needs" || activeView === "my-needs" || activeView === "create-need"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon name="briefcase" size={18} strokeWidth={activeView === "needs" ? 2.6 : 2.2} />
                  <span className="hidden lg:inline">نیازمندی‌ها</span>
                </button>
              </nav>
            </div>

            {/* Left (RTL end) = actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => navigate({ view: "chat" })}
                    className="relative grid place-items-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
                    aria-label="چت"
                  >
                    <Icon name="chat" size={20} className="text-foreground" strokeWidth={2.2} />
                    {chatUnread > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-extrabold">
                        {chatUnread > 9 ? toFa(9) + "+" : toFa(chatUnread)}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => navigate({ view: "notifications" })}
                    className="relative grid place-items-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
                    aria-label="اعلان‌ها"
                  >
                    <Icon name="bell" size={20} className="text-foreground" strokeWidth={2.2} />
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-extrabold">
                        {unread > 9 ? toFa(9) + "+" : toFa(unread)}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => navigate({ view: "my-profile" })}
                    className="ms-1"
                    aria-label="پروفایل من"
                  >
                    <UserAvatar
                      name={user.name}
                      avatarUrl={user.profile?.avatarUrl}
                      verified={user.isVerifiedBadge}
                      gender={user.profile?.gender}
                      size="sm"
                      className="ring-2 ring-card"
                    />
                  </button>
                </>
              ) : (
                !loading && (
                  <button
                    onClick={() => navigate({ view: "auth" })}
                    className="h-10 px-6 rounded-full bg-primary text-primary-foreground font-extrabold text-sm hover:bg-primary/90 transition-colors"
                  >
                    ورود / ثبت‌نام
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <main
        ref={mainRef}
        className="flex-1 mx-auto w-full max-w-6xl px-4 md:px-6 pt-20 md:pt-24 pb-36 md:pb-16"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={routeKey}
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderView(route)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ═══ Mobile floating pill bottom nav + swipe-up dock ═══ */}
      <SwipeUpDock
        activeView={activeView}
        unread={unread}
        chatUnread={chatUnread}
        user={user}
      />

      {/* ═══ Mobile floating chat FAB (bottom-left, primary color) ═══ */}
      {user && activeView !== "chat" && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.15 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate({ view: "chat" })}
          className="md:hidden fixed bottom-28 left-4 z-30 grid place-items-center rounded-full bg-primary text-primary-foreground"
          style={{ width: "56px", height: "56px", boxShadow: "0 10px 30px rgba(79, 56, 165, 0.35)" }}
          aria-label="چت"
        >
          <Icon name="chat" size={24} className="text-primary-foreground" strokeWidth={2.4} />
          {chatUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 grid place-items-center rounded-full bg-rose text-white text-[11px] font-extrabold ring-2 ring-primary-foreground">
              {chatUnread > 9 ? toFa(9) + "+" : toFa(chatUnread)}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}

// ── Premium iOS-style swipe-up dock ──
function SwipeUpDock({
  activeView,
  unread,
  chatUnread,
  user,
}: {
  activeView: string;
  unread: number;
  chatUnread: number;
  user: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const controls = useDragControls();

  const moreItems = [
    { key: "dashboard", label: "داشبورد", icon: "grid" as const },
    { key: "chat", label: "چت", icon: "chat" as const, badge: chatUnread },
    { key: "following", label: "دنبال‌شده", icon: "userCheck" as const },
    { key: "needs", label: "نیازمندی‌ها", icon: "briefcase" as const },
    { key: "my-needs", label: "نیازمندی‌های من", icon: "briefcase" as const },
    { key: "connections", label: "ارتباطات", icon: "userPlus" as const },
    { key: "notifications", label: "اعلان‌ها", icon: "bell" as const, badge: unread },
    { key: "edit-profile", label: "ویرایش", icon: "pencil" as const },
    { key: "tickets", label: "تیکت‌ها", icon: "ticket" as const },
    { key: "settings", label: "تنظیمات", icon: "settings" as const },
  ];

  return (
    <>
      {/* Expanded overlay + sheet */}
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              drag="y"
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setExpanded(false);
              }}
              className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe"
            >
              <div className="bg-card rounded-t-[28px] overflow-hidden" style={{ boxShadow: "0 -8px 40px rgba(20,20,40,0.18)" }}>
                {/* Drag handle */}
                <div
                  className="pt-3 pb-1.5 grid place-items-center cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => controls.start(e)}
                >
                  <div className="w-10 h-1.5 rounded-full bg-foreground/20" />
                </div>
                {/* Title */}
                <div className="px-5 pb-3 pt-1">
                  <p className="text-sm font-extrabold text-foreground">بیشتر</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">سایر بخش‌های همتیم</p>
                </div>
                {/* More items grid */}
                <div className="px-4 pb-6 pt-1">
                  <div className="grid grid-cols-3 gap-2">
                    {moreItems.map((item, i) => (
                      <motion.button
                        key={item.key}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.04 + i * 0.03 }}
                        onClick={() => {
                          navigate({ view: item.key as Route["view"] } as Route);
                          setExpanded(false);
                        }}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-muted/60 transition-colors active:scale-95 relative"
                      >
                        <div className="relative grid place-items-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
                          <Icon name={item.icon} size={22} strokeWidth={2.2} />
                          {item.badge ? (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-extrabold ring-2 ring-card">
                              {item.badge > 9 ? toFa(9) + "+" : toFa(item.badge)}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[11px] font-bold text-foreground leading-tight text-center">{item.label}</span>
                      </motion.button>
                    ))}
                    {user && (
                      <button
                        onClick={async () => {
                          await apiPost("/api/auth/logout");
                          useUser.getState().setUser(null);
                          setExpanded(false);
                          toast({ title: "خارج شدید" });
                          navigate({ view: "feed" });
                        }}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-rose/5 transition-colors active:scale-95"
                      >
                        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-rose/10 text-rose">
                          <Icon name="logout" size={22} strokeWidth={2.2} className="text-rose" />
                        </div>
                        <span className="text-[11px] font-bold text-rose leading-tight">خروج</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* The dock itself — floating pill, NOT edge-to-edge */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 z-30">
        <div
          className={cn("rounded-full bg-card px-2 py-1.5", FLOAT_SHADOW)}
        >
          <div className="grid grid-cols-5 gap-0.5">
            {BOTTOM_NAV.map((item) => {
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate({ view: item.key as Route["view"] } as Route)}
                  className="relative flex flex-col items-center justify-center gap-0.5 h-12 transition-colors"
                >
                  <motion.div
                    initial={false}
                    animate={{
                      scale: active ? 1.05 : 1,
                      backgroundColor: active ? "var(--primary)" : "rgba(0,0,0,0)",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "grid place-items-center w-10 h-8 rounded-full",
                      active ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Icon name={item.icon} size={22} strokeWidth={active ? 2.6 : 2.2} />
                  </motion.div>
                  <span
                    className={cn(
                      "text-[9px] font-extrabold leading-none transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
            {/* More button — chevron up indicator */}
            <button
              onClick={() => setExpanded(true)}
              className="flex flex-col items-center justify-center gap-0.5 h-12 transition-colors"
              aria-label="بیشتر"
            >
              <div className="grid place-items-center w-10 h-8 rounded-full text-muted-foreground active:scale-90 transition-transform">
                <Icon name="chevronUp" size={22} strokeWidth={2.4} />
              </div>
              <span className="text-[9px] font-extrabold text-muted-foreground leading-none">بیشتر</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
