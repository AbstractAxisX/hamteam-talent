"use client";

import { useEffect } from "react";
import { useNav, navigate, type Route } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import { cn } from "@/lib/utils";
import {
  Home,
  Compass,
  Briefcase,
  MessageCircle,
  User as UserIcon,
  Bell,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  Plus,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { AuthView } from "@/components/views/auth-view";
import { FeedView } from "@/components/views/feed-view";
import { ExploreView } from "@/components/views/explore-view";
import { PeopleView } from "@/components/views/people-view";
import { JobsView } from "@/components/views/jobs-view";
import { JobDetailView } from "@/components/views/job-detail-view";
import { CreateJobView } from "@/components/views/create-job-view";
import { MyJobsView } from "@/components/views/my-jobs-view";
import { ProfileView } from "@/components/views/profile-view";
import { EditProfileView } from "@/components/views/edit-profile-view";
import { ConnectionsView } from "@/components/views/connections-view";
import { ChatView } from "@/components/views/chat-view";
import { NotificationsView } from "@/components/views/notifications-view";
import { TicketsView } from "@/components/views/tickets-view";
import { TicketDetailView } from "@/components/views/ticket-detail-view";
import { AdminView } from "@/components/views/admin-view";
import { apiPost } from "@/lib/api-client";

const NAV_ITEMS = [
  { key: "feed", label: "خانه", icon: Home },
  { key: "explore", label: "اکسپلور", icon: Compass },
  { key: "jobs", label: "نیازمندی‌ها", icon: Briefcase },
  { key: "people", label: "افراد", icon: Users },
  { key: "chat", label: "چت", icon: MessageCircle },
] as const;

function renderView(route: Route) {
  switch (route.view) {
    case "feed":
      return <FeedView />;
    case "explore":
      return <ExploreView />;
    case "people":
      return <PeopleView />;
    case "jobs":
      return <JobsView />;
    case "job":
      return <JobDetailView id={route.id} />;
    case "create-job":
      return <CreateJobView />;
    case "my-jobs":
      return <MyJobsView />;
    case "profile":
      return <ProfileView id={route.id} />;
    case "my-profile":
      return <ProfileView id="me" />;
    case "edit-profile":
      return <EditProfileView />;
    case "connections":
      return <ConnectionsView />;
    case "chat":
      return <ChatView conversationId={route.conversationId} />;
    case "notifications":
      return <NotificationsView />;
    case "tickets":
      return <TicketsView />;
    case "ticket":
      return <TicketDetailView id={route.id} />;
    case "admin":
      return <AdminView />;
    case "auth":
      return <AuthView />;
    default:
      return <FeedView />;
  }
}

function Logo() {
  return (
    <button
      onClick={() => navigate({ view: "feed" })}
      className="flex items-center gap-2 group"
    >
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-emerald text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v6c0 5 3.5 8.5 9 10 5.5-1.5 9-5 9-10V7l-9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
          <circle cx="12" cy="11" r="2.5" fill="currentColor"/>
          <path d="M9 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        همتیم
      </span>
    </button>
  );
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const route = useNav((s) => s.route);
  const init = useNav((s) => s.init);
  const { user, fetchUser, loading } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const cleanup = init();
    fetchUser();
    return cleanup;
  }, [init, fetchUser]);

  // If route is auth, render full-screen auth
  if (route.view === "auth") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{renderView(route)}</main>
      </div>
    );
  }

  const activeView = route.view;
  const unreadNotifs = 0; // could be wired up

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass bg-card/80 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          {/* Right (RTL start): logo + desktop nav */}
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  activeView === item.key ||
                  (item.key === "jobs" && (activeView === "job" || activeView === "create-job" || activeView === "my-jobs")) ||
                  (item.key === "feed" && activeView === "profile");
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate({ view: item.key as Route["view"] } as Route)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
              {user?.role === "admin" && (
                <button
                  onClick={() => navigate({ view: "admin" })}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    activeView === "admin"
                      ? "bg-warning/15 text-warning"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Shield className="w-4 h-4" />
                  مدیریت
                </button>
              )}
            </nav>
          </div>

          {/* Left (RTL end): search + actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate({ view: "notifications" })}
                  aria-label="اعلان‌ها"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-muted transition-colors">
                      <Avatar className="w-9 h-9 border border-border">
                        <AvatarImage src={user.profile?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                        {user.name}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ view: "my-profile" })}>
                      <UserIcon className="w-4 h-4 ml-2" /> پروفایل من
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ view: "edit-profile" })}>
                      <UserIcon className="w-4 h-4 ml-2" /> ویرایش پروفایل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ view: "connections" })}>
                      <Users className="w-4 h-4 ml-2" /> ارتباطات
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ view: "my-jobs" })}>
                      <Briefcase className="w-4 h-4 ml-2" /> نیازمندی‌های من
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ view: "tickets" })}>
                      <Ticket className="w-4 h-4 ml-2" /> تیکت‌ها
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => navigate({ view: "admin" })}>
                        <Shield className="w-4 h-4 ml-2" /> پنل مدیریت
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={async () => {
                        await apiPost("/api/auth/logout");
                        useUser.getState().setUser(null);
                        navigate({ view: "feed" });
                      }}
                    >
                      <LogOut className="w-4 h-4 ml-2" /> خروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              !loading && (
                <Button onClick={() => navigate({ view: "auth" })} className="gap-1.5">
                  ورود / ثبت‌نام
                </Button>
              )
            )}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="منو"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu sheet */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate({ view: item.key as Route["view"] } as Route);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
            {user?.role === "admin" && (
              <button
                onClick={() => {
                  navigate({ view: "admin" });
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
              >
                <Shield className="w-5 h-5" /> مدیریت
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-4 md:py-6 pb-24 md:pb-8">
        {renderView(route)}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© ۱۴۰۳ همتیم — شبکه تخصصی مشاغل و تیم‌سازی</p>
          <p className="text-xs">ساخته‌شده با ❤️ برای جامعه‌ی حرفه‌ای فارسی</p>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass bg-card/90 border-t border-border pb-safe">
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              activeView === item.key ||
              (item.key === "jobs" && (activeView === "job" || activeView === "create-job" || activeView === "my-jobs"));
            return (
              <button
                key={item.key}
                onClick={() => navigate({ view: item.key as Route["view"] } as Route)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors relative",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating create button (mobile) */}
      {user && activeView === "feed" && (
        <button
          onClick={() => {
            const el = document.getElementById("create-post-trigger");
            el?.click();
          }}
          className="md:hidden fixed bottom-20 left-4 z-30 grid place-items-center w-14 h-14 rounded-full bg-gradient-emerald text-primary-foreground shadow-lg active:scale-95 transition-transform"
          aria-label="ایجاد پست"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
