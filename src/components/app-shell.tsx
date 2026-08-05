"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNav, navigate, type Route } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Sparkles,
  MoreHorizontal,
  Bell,
  MessageCircle,
  User as UserIcon,
  UserPlus,
  Ticket,
  LogOut,
  Settings,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/illustrations";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AuthView } from "@/components/views/auth-view";
import { FeedView } from "@/components/views/feed-view";
import { DiscoverView } from "@/components/views/discover-view";
import { TalentsView } from "@/components/views/talents-view";
import { CategoryView } from "@/components/views/category-view";
import { ProfileView } from "@/components/views/profile-view";
import { EditProfileView } from "@/components/views/edit-profile-view";
import { ConnectionsView } from "@/components/views/connections-view";
import { ChatView } from "@/components/views/chat-view";
import { NotificationsView } from "@/components/views/notifications-view";
import { TicketsView } from "@/components/views/tickets-view";
import { TicketDetailView } from "@/components/views/ticket-detail-view";
import { SettingsView } from "@/components/views/settings-view";
import { AdminView } from "@/components/views/admin-view";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

function renderView(route: Route) {
  switch (route.view) {
    case "feed": return <FeedView />;
    case "discover": return <DiscoverView />;
    case "talents": return <TalentsView />;
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
    case "admin": return <AdminView />;
    case "auth": return <AuthView />;
    default: return <FeedView />;
  }
}

// Mobile bottom nav: Home, Discover, Talents, More
const BOTTOM_NAV = [
  { key: "feed", label: "خانه", icon: Home },
  { key: "discover", label: "کشف", icon: Search },
  { key: "talents", label: "استعدادها", icon: Sparkles },
] as const;

const TOP_LEVEL = new Set(["feed", "discover", "talents", "settings"]);

export function AppShell({ children }: { children?: React.ReactNode }) {
  const route = useNav((s) => s.route);
  const init = useNav((s) => s.init);
  const { user, fetchUser, loading } = useUser();
  const [moreOpen, setMoreOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const cleanup = init();
    fetchUser();
    return cleanup;
  }, [init, fetchUser]);

  useEffect(() => {
    if (!user) return;
    const tick = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnread(data.unreadCount || 0);
        }
      } catch { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [user, route]);

  // Auth = full screen
  if (route.view === "auth") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{renderView(route)}</main>
      </div>
    );
  }

  // Admin = full screen (separate UX)
  if (route.view === "admin") {
    return (
      <div className="min-h-screen">
        <main>{renderView(route)}</main>
      </div>
    );
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
          {/* Right pill (RTL start) = Back or Logo */}
          {showBack ? (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goBack}
              className="pointer-events-auto grid place-items-center w-11 h-11 rounded-full glass bg-card/90 shadow-md text-foreground active:scale-90 transition-transform"
              aria-label="بازگشت"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate({ view: "feed" })}
              className="pointer-events-auto flex items-center gap-2 h-11 px-3 rounded-full glass bg-card/90 shadow-md active:scale-95 transition-transform"
            >
              <LogoMark className="w-7 h-7" />
              <span className="font-extrabold text-sm">همتیم</span>
            </motion.button>
          )}

          {/* Left pill (RTL end) = Profile/Login + Notifications */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={() => navigate({ view: "notifications" })}
                  className="pointer-events-auto relative grid place-items-center w-11 h-11 rounded-full glass bg-card/90 shadow-md active:scale-90 transition-transform"
                  aria-label="اعلان‌ها"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-rose text-white text-[9px] font-bold">
                      {unread > 9 ? "۹" : unread}
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
                    size="md"
                    className="shadow-md"
                  />
                </button>
              </>
            ) : (
              !loading && (
                <button
                  onClick={() => navigate({ view: "auth" })}
                  className="pointer-events-auto h-11 px-5 rounded-full bg-lime text-forest shadow-md font-extrabold text-sm active:scale-95 transition-transform"
                >
                  ورود
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 md:px-6 pt-16 md:pt-8 pb-28 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={route.view + (route.view === "profile" ? route.id : "") + (route.view === "category" ? route.id : "") + (route.view === "ticket" ? route.id : "") + (route.view === "chat" ? route.conversationId || "" : "")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderView(route)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ═══ Mobile Bottom Navigation ═══ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 pb-safe">
        <div className="glass bg-card/90 border-t border-border">
          <div className="grid grid-cols-4 h-16 max-w-md mx-auto">
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.key || (item.key === "feed" && activeView === "profile");
              return (
                <button
                  key={item.key}
                  onClick={() => navigate({ view: item.key as Route["view"] } as Route)}
                  className="relative flex flex-col items-center justify-center gap-0.5 transition-colors"
                >
                  <div className={cn(
                    "grid place-items-center w-10 h-8 rounded-full transition-all",
                    active ? "bg-lime text-forest scale-110" : "text-muted-foreground"
                  )}>
                    <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold transition-colors",
                    active ? "text-forest" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            {/* More button */}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground"
            >
              <div className="grid place-items-center w-10 h-8">
                <MoreHorizontal className="w-[22px] h-[22px]" />
              </div>
              <span className="text-[10px] font-bold">بیشتر</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ Floating Chat FAB ═══ */}
      {user && activeView !== "chat" && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          onClick={() => navigate({ view: "chat" })}
          className="md:hidden fixed bottom-20 left-4 z-30 grid place-items-center w-14 h-14 rounded-full bg-forest text-lime shadow-lg active:scale-90 transition-transform"
          aria-label="چت"
        >
          <MessageCircle className="w-6 h-6" />
          <motion.span
            className="absolute inset-0 rounded-full bg-lime"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      )}

      {/* ═══ More Sheet ═══ */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe"
            >
              <div className="bg-card rounded-t-3xl border-t border-border shadow-lg overflow-hidden">
                <div className="pt-3 pb-1 grid place-items-center">
                  <div className="w-10 h-1 rounded-full bg-border" />
                </div>
                <div className="px-5 pt-2 pb-3 flex items-center justify-between">
                  <h3 className="font-extrabold text-base">منوی بیشتر</h3>
                  <button onClick={() => setMoreOpen(false)} className="grid place-items-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {user && (
                  <button
                    onClick={() => { navigate({ view: "my-profile" }); setMoreOpen(false); }}
                    className="mx-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-cream-gradient w-[calc(100%-2rem)] text-right"
                  >
                    <UserAvatar name={user.name} avatarUrl={user.profile?.avatarUrl} verified={user.isVerifiedBadge} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.profile?.bioShort || "مشاهده پروفایل من"}</p>
                    </div>
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <div className="px-4 pb-5 grid grid-cols-4 gap-2">
                  <MoreItem icon={UserPlus} label="ارتباطات" onClick={() => { navigate({ view: "connections" }); setMoreOpen(false); }} />
                  <MoreItem icon={Settings} label="ویرایش پروفایل" onClick={() => { navigate({ view: "edit-profile" }); setMoreOpen(false); }} />
                  <MoreItem icon={Ticket} label="تیکت‌ها" onClick={() => { navigate({ view: "tickets" }); setMoreOpen(false); }} />
                  <MoreItem icon={Settings} label="تنظیمات" onClick={() => { navigate({ view: "settings" }); setMoreOpen(false); }} />
                  {user && (
                    <MoreItem icon={LogOut} label="خروج" danger onClick={async () => {
                      await apiPost("/api/auth/logout");
                      useUser.getState().setUser(null);
                      setMoreOpen(false);
                      toast({ title: "خارج شدید" });
                      navigate({ view: "feed" });
                    }} />
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MoreItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-muted transition-colors active:scale-95"
    >
      <div className={cn(
        "grid place-items-center w-12 h-12 rounded-2xl",
        danger ? "bg-rose/10 text-rose" : "bg-lime/20 text-forest"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn("text-[11px] font-medium text-center leading-tight", danger && "text-rose")}>{label}</span>
    </button>
  );
}
