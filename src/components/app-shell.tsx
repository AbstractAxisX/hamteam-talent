"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useNav, navigate, type Route } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Sparkles,
  UserCheck,
  ChevronUp,
  Bell,
  MessageCircle,
  User as UserIcon,
  UserPlus,
  Ticket,
  LogOut,
  Settings,
  X,
  ChevronRight,
  Briefcase,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Mobile bottom nav: Home, Discover, Talents, Needs
const BOTTOM_NAV = [
  { key: "feed", label: "خانه", icon: Home },
  { key: "explore", label: "استعدادهای برتر", icon: Sparkles },
  { key: "discover", label: "کشف", icon: Search },
  { key: "talents", label: "استعدادها", icon: Users },
] as const;

const TOP_LEVEL = new Set(["feed", "explore", "discover", "talents", "needs", "following", "dashboard", "settings"]);

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

  // Auth / Onboarding = full screen
  if (route.view === "auth" || route.view === "onboarding") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{renderView(route)}</main>
      </div>
    );
  }

  // Admin = full screen
  if (route.view === "admin") {
    return <div className="min-h-screen"><main>{renderView(route)}</main></div>;
  }

  const activeView = route.view;
  const showBack = !TOP_LEVEL.has(activeView) && activeView !== "auth";

  function goBack() {
    if (typeof window !== "undefined") window.history.back();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ═══ Mobile floating pills (top) ═══ */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 px-4 pt-3 pt-safe pointer-events-none">
        <div className="flex items-center justify-between">
          {/* Right pill (RTL start) = Back button (small, with margin) */}
          {showBack ? (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goBack}
              className="pointer-events-auto grid place-items-center w-10 h-10 rounded-full glass shadow-sm text-foreground active:scale-90 transition-transform"
              aria-label="بازگشت"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          ) : null}

          {/* Left pill (RTL end) = Profile/Login + Notifications */}
          <div className="flex items-center gap-2 mr-auto ">
            {user ? (
              <>
                <button
                  onClick={() => navigate({ view: "notifications" })}
                  className="pointer-events-auto relative grid place-items-center w-10 h-10 rounded-full glass shadow-sm active:scale-90 transition-transform"
                  aria-label="اعلان‌ها"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-rose text-white text-[9px] font-bold animate-bounce-small">
                      {unread > 9 ? "۹+" : unread}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => navigate({ view: "my-profile" })}
                  className="pointer-events-auto active:scale-90 transition-transform"
                  aria-label="پروفایل"
                >
                  <UserAvatar
                    name={user.name}
                    avatarUrl={user.profile?.avatarUrl}
                    verified={user.isVerifiedBadge}
                    gender={user.profile?.gender}
                    size="md"
                    className="pt-2"
                  />
                </button>
              </>
            ) : (
              !loading && (
                <button
                  onClick={() => navigate({ view: "auth" })}
                  className="pointer-events-auto h-10 px-5 rounded-full glass shadow-sm font-bold text-sm active:scale-95 transition-transform mt-2"
                >
                  ورود
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <main ref={mainRef} className="flex-1 mx-auto w-full max-w-6xl px-4 md:px-6 pt-16 md:pt-8 pb-32 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={route.view + (route.view === "profile" ? route.id : "") + (route.view === "category" ? route.id : "") + (route.view === "ticket" ? route.id : "") + (route.view === "chat" ? route.conversationId || "" : "")}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderView(route)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ═══ Mobile Bottom Dock — iOS liquid glass, floating with margin, swipe-up ═══ */}
      <SwipeUpDock
        activeView={activeView}
        unread={unread}
        chatUnread={chatUnread}
        user={user}
      />

      {/* ═══ Floating Chat FAB (with unread badge) ═══ */}
      {user && activeView !== "chat" && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          onClick={() => navigate({ view: "chat" })}
          className="md:hidden fixed bottom-24 left-4 z-30 grid place-items-center w-13 h-13 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-90 transition-transform"
          style={{ width: "52px", height: "52px" }}
          aria-label="چت"
        >
          <MessageCircle className="w-5 h-5" />
          {chatUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-bold animate-bounce-small">
              {chatUnread > 9 ? "۹+" : chatUnread}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}

// ── Swipe-up dock (iOS-style) ──
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
    { key: "dashboard", label: "داشبورد", icon: Home },
    { key: "chat", label: "چت", icon: MessageCircle, badge: chatUnread },
    { key: "following", label: "دنبال‌شده", icon: UserCheck },
    { key: "needs", label: "نیازمندی‌ها", icon: Briefcase },
    { key: "my-needs", label: "نیازمندی‌های من", icon: Briefcase },
    { key: "connections", label: "ارتباطات", icon: UserPlus },
    { key: "notifications", label: "اعلان‌ها", icon: Bell, badge: unread },
    { key: "edit-profile", label: "ویرایش", icon: UserIcon },
    { key: "tickets", label: "تیکت‌ها", icon: Ticket },
    { key: "settings", label: "تنظیمات", icon: Settings },
  ];

  return (
    <>
      {/* Expanded overlay */}
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="md:hidden fixed inset-0 z-30 bg-black/30"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              drag="y"
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setExpanded(false);
              }}
              className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe"
            >
              <div className="glass-strong rounded-t-3xl border-t border-border/30 shadow-2xl overflow-hidden">
                {/* Drag handle */}
                <div className="pt-2.5 pb-1 grid place-items-center cursor-grab active:cursor-grabbing" onPointerDown={(e) => controls.start(e)}>
                  <div className="w-10 h-1 rounded-full bg-foreground/20" />
                </div>
                {/* More items grid */}
                <div className="px-4 pb-5 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    {moreItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            navigate({ view: item.key as Route["view"] } as Route);
                            setExpanded(false);
                          }}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-foreground/5 transition-colors active:scale-95 relative"
                        >
                          <div className="relative grid place-items-center w-12 h-12 rounded-2xl bg-primary/8 text-primary">
                            <Icon className="w-5 h-5" />
                            {item.badge ? (
                              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose text-white text-[10px] font-bold">
                                {item.badge > 9 ? "۹+" : item.badge}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] font-medium">{item.label}</span>
                        </button>
                      );
                    })}
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
                        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-rose/8 text-rose">
                          <LogOut className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-medium text-rose">خروج</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* The dock itself — floating, liquid glass */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-30">
        <div className="glass rounded-full shadow-lg border border-white/20 px-2 py-1.5">
          <div className="grid grid-cols-5 gap-1">
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate({ view: item.key as Route["view"] } as Route)}
                  className="relative flex flex-col items-center justify-center gap-0.5 h-11 transition-colors"
                >
                  <div className={cn(
                    "grid place-items-center w-9 h-8 rounded-full transition-all",
                    active ? "bg-primary text-primary-foreground scale-105" : "text-muted-foreground"
                  )}>
                    <Icon className="w-[21px] h-[21px]" strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold transition-colors leading-none",
                    active ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            {/* More button — swipe up indicator */}
            <button
              onClick={() => setExpanded(true)}
              className="flex flex-col items-center justify-center gap-0.5 h-11 transition-colors"
            >
              <div className="grid place-items-center w-9 h-8 rounded-full text-muted-foreground active:scale-90 transition-transform">
                <ChevronUp className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground leading-none">بیشتر</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
