/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Fragment, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost, apiDelete, apiPut, apiPatch } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { toFa, formatFaDate, timeAgoFa } from "@/lib/format";
import {
  LayoutDashboard,
  Users as UsersIcon,
  FolderTree,
  FileText,
  Briefcase,
  Megaphone,
  Settings as SettingsIcon,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Ban,
  BadgeCheck,
  Trash2,
  Plus,
  Loader2,
  Lock,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  CheckSquare,
  Square,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  UserCircle,
  Eye,
  Send,
  PanelRightClose,
  PanelRightOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FolderPlus,
  Pencil,
  Tag,
  Crown,
  Image as ImageIcon,
  Palette,
  Sparkles,
  User as UserIcon,
  Megaphone as MegaphoneIcon,
  Flag,
  Ticket as TicketIcon,
  Compass as CompassIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  IdCard as IdCardIcon,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BannersTab } from "@/components/admin/banners-tab";
import { ReportsTab } from "@/components/admin/reports-tab";
import { TicketsTab } from "@/components/admin/tickets-tab";

// ═══════════════════════════════════════════════════════════════════
// Theme constants — White / Blue admin theme (separate from main site)
// ═══════════════════════════════════════════════════════════════════
const ADMIN_PRIMARY = "oklch(0.5 0.15 250)"; // strong blue
const ADMIN_PRIMARY_HOVER = "oklch(0.45 0.17 250)";
const ADMIN_PRIMARY_ACTIVE = "oklch(0.4 0.18 250)";
const ADMIN_FG = "#ffffff";

// Tailwind arbitrary value strings (spaces → underscores)
const TX = {
  primaryText: "text-[oklch(0.5_0.15_250)]",
  primaryBg: "bg-[oklch(0.5_0.15_250)]",
  tintBg: "bg-[oklch(0.96_0.03_250)]",
  tintBgHover: "hover:bg-[oklch(0.92_0.06_250)]",
  tintBorder: "border-[oklch(0.88_0.05_250)]",
  tintBorderHover: "hover:border-[oklch(0.7_0.1_250)]",
  ringPrimary: "focus-visible:ring-[oklch(0.5_0.15_250)]/30",
};

// Preset palette for category colors (30 colors)
const PRESET_CATEGORY_COLORS: string[] = [
  "#0d9488", // teal
  "#0f766e", // dark teal
  "#16a34a", // green
  "#15803d", // dark green
  "#65a30d", // lime
  "#84cc16", // light lime
  "#ca8a04", // gold
  "#eab308", // yellow
  "#f97316", // orange
  "#ea580c", // dark orange
  "#dc2626", // red
  "#b91c1c", // dark red
  "#e11d48", // rose
  "#be123c", // crimson
  "#db2777", // pink
  "#ec4899", // light pink
  "#9333ea", // purple
  "#7c3aed", // violet
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#0284c7", // sky blue
  "#0891b2", // cyan
  "#0e7490", // dark cyan
  "#14b8a6", // turquoise
  "#475569", // slate
  "#334155", // dark slate
  "#78716c", // stone
  "#a16207", // brown
  "#1f2937", // charcoal
  "#6b7280", // gray
];

type AdminInfo = { id: string; name: string; username: string } | null;

type AdminUser = {
  id: string;
  name: string;
  phone: string;
  isVerifiedBadge: boolean;
  isBanned: boolean;
  isTopTalent?: boolean;
  frame?: "silver" | "gold" | null;
  totalStars?: number;
  isAdminElite?: boolean;
  eliteLevel?: string;
  isScout?: boolean;
  scoutStatus?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
};

type AdminPost = {
  id: string;
  content: string;
  isFeatured?: boolean;
  createdAt: string;
  user: { name: string; isTopTalent?: boolean };
};

type AdminJob = {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  province?: string | null;
  city?: string | null;
  createdAt: string;
  updatedAt: string;
  applicationCount: number;
  category: { id: string; name: string } | null;
  skills: { id: string; name: string }[];
  user: {
    id: string;
    name: string;
    phone: string;
    isVerifiedBadge: boolean;
    avatarUrl: string | null;
  };
};

type CategoryRow = {
  id: string;
  name: string;
  iconUrl: string | null;
  color?: string | null;
  order: number;
  createdAt: string;
  skills: { id: string; name: string; createdAt: string }[];
};

/* ── چهره‌یاب‌ها — GET /api/admin/scouts ── */
type ScoutApplication = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  nationalCode: string;
  cardImageUrl: string | null;
  description: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type ActiveScout = {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  isBanned: boolean;
  needsCount: number;
  since: string;
};

/* ── درخواست‌های چهره برتر — GET /api/admin/elite-requests ── */
type EliteRequestRow = {
  id: string;
  source: "user" | "scout";
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string;
    phone: string;
    avatarUrl: string | null;
    totalStars: number;
    votes: number;
    frame: "silver" | "gold" | null;
  };
  nominator: { id: string; name: string; avatarUrl: string | null } | null;
};

type ReviewFilter = "all" | "pending" | "approved" | "rejected";

// ═══════════════════════════════════════════════════════════════════
// Top-level AdminView
// ═══════════════════════════════════════════════════════════════════
export function AdminView() {
  const [admin, setAdmin] = useState<AdminInfo | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setAdmin(d.admin || null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAdmin(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!admin) return <AdminLogin onLogin={setAdmin} />;

  return (
    <AdminDashboard
      admin={admin}
      onLogout={async () => {
        try {
          await apiPost("/api/admin/auth/logout");
        } catch {
          /* ignore */
        }
        setAdmin(null);
        toast({ title: "خارج شدید" });
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// Admin Login
// ═══════════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }: { onLogin: (a: AdminInfo) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiPost<{ ok: boolean; admin: AdminInfo; error?: string }>(
        "/api/admin/auth/login",
        { username, password }
      );
      onLogin(res.admin);
      toast({ title: `خوش آمدید ${res.admin?.name}` });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen grid place-items-center p-4"
      style={{
        background:
          "radial-gradient(circle at top right, oklch(0.96 0.04 250), white 60%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Card className="p-8 shadow-xl border-gray-200 rounded-2xl">
          <div className="text-center mb-6">
            <div
              className="grid place-items-center w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
            >
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">ورود به پنل مدیریت</h1>
            <p className="text-xs text-gray-500 mt-1.5">پلتفرم استعدادیابی فرصتینو</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">نام کاربری</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className={cn(
                  "h-11 rounded-xl border-gray-200 bg-white",
                  TX.ringPrimary
                )}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">رمز عبور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "h-11 rounded-xl border-gray-200 bg-white",
                  TX.ringPrimary
                )}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold shadow-md transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4 ml-1.5" /> ورود به پنل
                </>
              )}
            </Button>
          </form>
          <div className="mt-5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              دمو: <strong className="text-gray-700">admin</strong> /{" "}
              <strong className="text-gray-700">admin123</strong>
            </p>
          </div>
          <button
            onClick={() => navigate({ view: "feed" })}
            className="w-full mt-4 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← بازگشت به سایت
          </button>
        </Card>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Page metadata
// ═══════════════════════════════════════════════════════════════════
type PageKey =
  | "dashboard"
  | "users"
  | "categories"
  | "posts"
  | "needs"
  | "scouts"
  | "eliteRequests"
  | "broadcast"
  | "banners"
  | "reports"
  | "tickets"
  | "settings";

const PAGES: { key: PageKey; label: string; icon: typeof UsersIcon }[] = [
  { key: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { key: "users", label: "کاربران", icon: UsersIcon },
  { key: "reports", label: "گزارش‌های تخلف", icon: Flag },
  { key: "posts", label: "پست‌ها", icon: FileText },
  { key: "categories", label: "دسته‌بندی‌ها", icon: FolderTree },
  { key: "needs", label: "نیازمندی‌ها", icon: Briefcase },
  { key: "scouts", label: "چهره‌یاب‌ها", icon: CompassIcon },
  { key: "eliteRequests", label: "درخواست‌های چهره برتر", icon: StarIcon },
  { key: "tickets", label: "تیکت‌های پشتیبانی", icon: TicketIcon },
  { key: "banners", label: "بنرها و تبلیغات", icon: MegaphoneIcon },
  { key: "broadcast", label: "اعلان سراسری", icon: Megaphone },
  { key: "settings", label: "تنظیمات", icon: SettingsIcon },
];

// ═══════════════════════════════════════════════════════════════════
// AdminDashboard — layout with collapsible sidebar + topbar
// ═══════════════════════════════════════════════════════════════════
function AdminDashboard({
  admin,
  onLogout,
}: {
  admin: NonNullable<AdminInfo>;
  onLogout: () => void;
}) {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist sidebar collapse state
  useEffect(() => {
    const saved = localStorage.getItem("hamteam-admin-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("hamteam-admin-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  const currentPage = PAGES.find((p) => p.key === page)!;
  const CurrentIcon = currentPage.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* ═══ Sidebar (desktop) ═══ */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 right-0 z-30 bg-white border-l border-gray-200 transition-all duration-300 shadow-sm",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          page={page}
          setPage={setPage}
          toggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      {/* ═══ Mobile drawer ═══ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/40"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="md:hidden fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-gray-200 flex flex-col shadow-xl"
            >
              <SidebarContent
                collapsed={false}
                page={page}
                setPage={(p) => {
                  setPage(p);
                  setMobileOpen(false);
                }}
                onClose={() => setMobileOpen(false)}
                isMobile
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Main content area ═══ */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          collapsed ? "md:mr-16" : "md:mr-64"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden grid place-items-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="منو"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="grid place-items-center w-8 h-8 rounded-lg shrink-0"
                  style={{ backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
                >
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm text-gray-900 truncate">
                    {currentPage.label}
                  </h1>
                  <p className="text-[10px] text-gray-500 hidden sm:block">
                    پنل مدیریت فرصتینو
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Admin profile chip */}
              <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-gray-50 border border-gray-200">
                <div
                  className="grid place-items-center w-6 h-6 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
                >
                  {admin.name.slice(0, 1)}
                </div>
                <span className="text-xs font-semibold text-gray-700">
                  {admin.name}
                </span>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={onLogout}
                className="gap-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 h-9"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {page === "dashboard" && <DashboardTab />}
              {page === "users" && <UsersTab />}
              {page === "categories" && <CategoriesTab />}
              {page === "posts" && <PostsTab />}
              {page === "needs" && <NeedsTab />}
              {page === "scouts" && <ScoutsTab />}
              {page === "eliteRequests" && <EliteRequestsTab />}
              {page === "broadcast" && <BroadcastTab />}
              {page === "banners" && <BannersTab />}
              {page === "reports" && <ReportsTab />}
              {page === "tickets" && <TicketsTab />}
              {page === "settings" && <SettingsTab admin={admin} onLogout={onLogout} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sidebar content (shared between desktop + mobile)
// ═══════════════════════════════════════════════════════════════════
function SidebarContent({
  collapsed,
  page,
  setPage,
  toggleCollapse,
  onClose,
  isMobile,
}: {
  collapsed: boolean;
  page: PageKey;
  setPage: (p: PageKey) => void;
  toggleCollapse?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  return (
    <>
      {/* Brand header */}
      <div
        className={cn(
          "h-14 flex items-center border-b border-gray-200 shrink-0",
          collapsed ? "px-2 justify-center" : "px-4 justify-between"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="grid place-items-center w-9 h-9 rounded-xl shadow-md shrink-0"
            style={{ backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
          >
            <Shield className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-extrabold text-sm text-gray-900 leading-tight">
                فرصتینو
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">پنل مدیریت</p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="بستن"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {PAGES.map((p) => {
          const Icon = p.icon;
          const active = page === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setPage(p.key)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg transition-all relative group",
                collapsed ? "justify-center h-10" : "px-3 h-10",
                active
                  ? "shadow-sm"
                  : "hover:bg-gray-50 text-gray-700"
              )}
              style={
                active
                  ? {
                      backgroundColor: ADMIN_PRIMARY,
                      color: ADMIN_FG,
                    }
                  : undefined
              }
              title={collapsed ? p.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && (
                <span className="text-sm font-semibold flex-1 text-right truncate">
                  {p.label}
                </span>
              )}
              {active && !collapsed && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="border-t border-gray-200 p-2 shrink-0">
          <button
            onClick={toggleCollapse}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg hover:bg-gray-50 text-gray-600 h-10 transition-colors",
              collapsed ? "justify-center" : "px-3"
            )}
            title={collapsed ? "باز کردن منو" : "جمع کردن منو"}
          >
            {collapsed ? (
              <PanelRightOpen className="w-[18px] h-[18px]" />
            ) : (
              <>
                <PanelRightClose className="w-[18px] h-[18px]" />
                <span className="text-sm font-semibold">جمع کردن</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Shared UI primitives
// ═══════════════════════════════════════════════════════════════════

function PrimaryButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={cn(
        "transition-all hover:opacity-90 active:scale-[0.98]",
        className
      )}
      style={{ backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
    />
  );
}

function OutlineButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      {...props}
      className={cn(
        "border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        TX.tintBorderHover,
        className
      )}
    />
  );
}

function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden">
      {children}
    </Card>
  );
}

function TableToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-2">
      {children}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex-1 min-w-[200px]", className)}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "جستجو..."}
        className={cn(
          "h-9 rounded-lg border-gray-200 bg-white pr-9 text-sm",
          TX.ringPrimary
        )}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-9 rounded-lg border-gray-200 bg-white text-sm min-w-[120px]",
          TX.ringPrimary,
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Show up to 5 page numbers around current
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-gray-500">
        نمایش <span className="font-bold text-gray-700 nums-fa">{toFa(from)}</span> تا{" "}
        <span className="font-bold text-gray-700 nums-fa">{toFa(to)}</span> از{" "}
        <span className="font-bold text-gray-700 nums-fa">{toFa(total)}</span> مورد
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 w-8 p-0 border-gray-200"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        {start > 1 && (
          <>
            <PageBtn n={1} active={page === 1} onClick={() => onPageChange(1)} />
            {start > 2 && <span className="text-gray-400 px-1">…</span>}
          </>
        )}
        {pages.map((p) => (
          <PageBtn
            key={p}
            n={p}
            active={p === page}
            onClick={() => onPageChange(p)}
          />
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}
            <PageBtn
              n={totalPages}
              active={page === totalPages}
              onClick={() => onPageChange(totalPages)}
            />
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 w-8 p-0 border-gray-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function PageBtn({
  n,
  active,
  onClick,
}: {
  n: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 min-w-8 px-2 rounded-md text-xs font-bold transition-all nums-fa",
        active
          ? "shadow-sm"
          : "border border-gray-200 text-gray-700 hover:bg-gray-50"
      )}
      style={active ? { backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG } : undefined}
    >
      {toFa(n)}
    </button>
  );
}

function BulkActionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-3"
        >
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border shadow-sm"
            style={{
              backgroundColor: "oklch(0.96 0.04 250)",
              borderColor: "oklch(0.88 0.05 250)",
            }}
          >
            <span className="text-sm font-bold text-gray-900">
              <span className="nums-fa">{toFa(count)}</span> مورد انتخاب شده
            </span>
            <div className="flex-1" />
            {children}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClear}
              className="h-8 text-gray-600 hover:text-gray-900"
            >
              <X className="w-3.5 h-3.5 ml-1" />
              لغو انتخاب
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-12 text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="grid place-items-center w-12 h-12 rounded-full bg-gray-100">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

function StatusBadge({
  status,
  type,
}: {
  status: string;
  type: "ban" | "verify" | "job";
}) {
  if (type === "ban") {
    return status ? (
      <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50 text-[10px] h-5 rounded">
        مسدود
      </Badge>
    ) : (
      <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-50 text-[10px] h-5 rounded">
        فعال
      </Badge>
    );
  }
  if (type === "verify") {
    return status ? (
      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-[10px] h-5 rounded gap-1">
        <BadgeCheck className="w-3 h-3" /> تایید شده
      </Badge>
    ) : (
      <Badge className="bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-50 text-[10px] h-5 rounded">
        عادی
      </Badge>
    );
  }
  // job
  return status === "open" ? (
    <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-50 text-[10px] h-5 rounded">
      باز
    </Badge>
  ) : (
    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 text-[10px] h-5 rounded">
      بسته شده
    </Badge>
  );
}

/* ── نمایش ستارهٔ کاربر — فقط-خواندنی، مشتق از رأی‌ها (چهره برتر) ── */
function UserStarsCell({ user }: { user: AdminUser }) {
  if (!user.isTopTalent && !(user.totalStars ?? 0)) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const gold = user.frame === "gold";
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className="inline-flex items-center gap-1 text-xs font-bold nums-fa"
        title="مجموع ستاره‌های دریافتی"
      >
        <Sparkles className={gold ? "w-3.5 h-3.5 text-amber-500" : "w-3.5 h-3.5 text-slate-500"} />
        {toFa(user.totalStars ?? 0)}
      </span>
      {user.frame && (
        <Badge
          className={cn(
            "text-[10px] h-5 rounded gap-1",
            gold
              ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50"
              : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-100"
          )}
        >
          <Crown className="w-3 h-3" />
          {gold ? "طلایی" : "نقره‌ای"}
        </Badge>
      )}
    </div>
  );
}

function FeaturedStarBadge({ className }: { className?: string }) {
  return (
    <Badge
      className={cn(
        "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-[10px] h-5 rounded gap-1",
        className
      )}
    >
      <Sparkles className="w-3 h-3" /> ویترین
    </Badge>
  );
}

/* ── آواتار دایره‌ای ادمین (حرف اول یا عکس) — الگوی جدول کاربران ── */
function AdminAvatar({
  name,
  avatarUrl,
  size = 44,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  return (
    <div
      className="grid place-items-center rounded-full text-xs font-bold overflow-hidden shrink-0"
      style={{ width: size, height: size, backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.slice(0, 1)
      )}
    </div>
  );
}

/* ── چیپ وضعیت بررسی (در انتظار / تأیید / رد) — تب‌های چهره‌یاب و چهره برتر ── */
function ReviewStatusChip({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px] h-5 rounded gap-1">
        <CheckCircle2 className="w-3 h-3" /> تأیید شده
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50 text-[10px] h-5 rounded gap-1">
        <XCircle className="w-3 h-3" /> رد شده
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 text-[10px] h-5 rounded gap-1">
      <Clock className="w-3 h-3" /> در انتظار
    </Badge>
  );
}

/* ── چیپ‌های فیلتر وضعیت ── */
function StatusFilterChips({
  value,
  onChange,
  pendingCount,
}: {
  value: ReviewFilter;
  onChange: (v: ReviewFilter) => void;
  pendingCount: number;
}) {
  const opts: { value: ReviewFilter; label: string }[] = [
    { value: "all", label: "همه" },
    { value: "pending", label: "در انتظار" },
    { value: "approved", label: "تأییدشده" },
    { value: "rejected", label: "ردشده" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {opts.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-9 px-4 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5",
              active
                ? "shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            style={active ? { backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG } : undefined}
          >
            {o.label}
            {o.value === "pending" && pendingCount > 0 && (
              <span
                className={cn(
                  "nums-fa text-[10px] font-extrabold px-1.5 rounded",
                  active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
                )}
              >
                {toFa(pendingCount)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── حالت خالی برای لیست‌های کارتی ── */
function EmptyCardState({ icon: IconC, message }: { icon: typeof UsersIcon; message: string }) {
  return (
    <Card className="border-gray-200 shadow-sm rounded-xl py-12">
      <div className="flex flex-col items-center gap-2 text-gray-500">
        <div className="grid place-items-center w-12 h-12 rounded-full bg-gray-100">
          <IconC className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm">{message}</p>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 1. Dashboard Tab
// ═══════════════════════════════════════════════════════════════════
type Stats = {
  users: number;
  posts: number;
  categories: number;
  tickets: number;
  connections: number;
  notifications: number;
};

function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ stats: Stats }>("/api/admin/stats")
      .then((d) => {
        if (!cancelled) setStats(d.stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const items: {
    label: string;
    value: number;
    icon: typeof UsersIcon;
    tint: string;
    text: string;
  }[] = [
    {
      label: "کاربران",
      value: stats.users,
      icon: UsersIcon,
      tint: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "پست‌ها",
      value: stats.posts,
      icon: FileText,
      tint: "bg-sky-50",
      text: "text-sky-700",
    },
    {
      label: "دسته‌بندی‌ها",
      value: stats.categories,
      icon: FolderTree,
      tint: "bg-amber-50",
      text: "text-amber-700",
    },
    {
      label: "ارتباطات",
      value: stats.connections,
      icon: UsersIcon,
      tint: "bg-purple-50",
      text: "text-purple-700",
    },
    {
      label: "اعلان‌ها",
      value: stats.notifications,
      icon: Megaphone,
      tint: "bg-pink-50",
      text: "text-pink-700",
    },
    {
      label: "تیکت‌ها",
      value: stats.tickets,
      icon: FileText,
      tint: "bg-rose-50",
      text: "text-rose-700",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="داشبورد مدیریت"
        description="نمای کلی از وضعیت پلتفرم فرصتینو"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
                <div
                  className={cn(
                    "grid place-items-center w-9 h-9 rounded-lg mb-3",
                    s.tint
                  )}
                >
                  <Icon className={cn("w-4 h-4", s.text)} />
                </div>
                <p className="text-2xl font-extrabold text-gray-900 nums-fa leading-none mb-1">
                  {toFa(s.value)}
                </p>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Growth chart (visual bar chart of stat distribution) */}
      <Card className="p-5 border-gray-200 shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-700" />
            <h3 className="font-bold text-sm text-gray-900">توزیع داده‌ها</h3>
          </div>
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-[10px]">
            نمودار میله‌ای
          </Badge>
        </div>
        <div className="space-y-3">
          {items.map((s) => {
            const max = Math.max(...items.map((x) => x.value), 1);
            const pct = Math.round((s.value / max) * 100);
            return (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-24 text-xs text-gray-600 font-medium shrink-0">
                  {s.label}
                </div>
                <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-md"
                    style={{ backgroundColor: ADMIN_PRIMARY }}
                  />
                </div>
                <div className="w-12 text-xs font-bold text-gray-900 nums-fa text-left">
                  {toFa(s.value)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick actions */}
      <Card className="p-5 border-gray-200 shadow-sm rounded-xl">
        <h3 className="font-bold text-sm text-gray-900 mb-3">دسترسی سریع</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickAction
            icon={Megaphone}
            label="اعلان سراسری"
            onClick={() => {
              /* handled by sidebar nav */
            }}
          />
          <QuickAction icon={FolderPlus} label="دسته جدید" />
          <QuickAction icon={UsersIcon} label="مدیریت کاربران" />
          <QuickAction icon={FileText} label="مدیریت پست‌ها" />
        </div>
      </Card>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof UsersIcon;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
    >
      <div className="grid place-items-center w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-blue-100 transition-colors">
        <Icon className="w-4 h-4 text-gray-600 group-hover:text-blue-700 transition-colors" />
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. Users Tab — full table with search, filters, bulk actions, pagination
// ═══════════════════════════════════════════════════════════════════
const USERS_PAGE_SIZE = 10;

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState("all");
  const [filterBanned, setFilterBanned] = useState("all");
  const [filterTopTalent, setFilterTopTalent] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    api<{ users: AdminUser[] }>(
      `/api/admin/users?q=${encodeURIComponent(debouncedSearch)}`
    )
      .then((d) => setUsers(d.users))
      .catch(() => toast({ title: "خطا در بارگذاری", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(load, [load]);

  // Apply client-side filters
  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filterVerified === "yes" && !u.isVerifiedBadge) return false;
      if (filterVerified === "no" && u.isVerifiedBadge) return false;
      if (filterBanned === "yes" && !u.isBanned) return false;
      if (filterBanned === "no" && u.isBanned) return false;
      if (filterTopTalent === "yes" && !u.isTopTalent) return false;
      if (filterTopTalent === "no" && u.isTopTalent) return false;
      return true;
    });
  }, [users, filterVerified, filterBanned, filterTopTalent]);

  const paginated = useMemo(() => {
    const start = (page - 1) * USERS_PAGE_SIZE;
    return filtered.slice(start, start + USERS_PAGE_SIZE);
  }, [filtered, page]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const pageIds = new Set(paginated.map((u) => u.id));
  const allPageSelected =
    pageIds.size > 0 && [...pageIds].every((id) => selected.has(id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function patchUser(
    id: string,
    action: "ban" | "unban" | "verify" | "unverify" | "elite" | "unelite",
    level?: "silver" | "gold"
  ) {
    setActionLoading(id + action);
    try {
      const res = await apiPut<{ ok: boolean; eliteLevel?: string }>(`/api/admin/users/${id}`, { action, level });
      const verb =
        action === "ban"
          ? "مسدود شد"
          : action === "unban"
          ? "رفع مسدودیت شد"
          : action === "verify"
          ? "تایید شد"
          : action === "unverify"
          ? "تایید لغو شد"
          : action === "unelite"
          ? "قاب چهره برتر لغو شد"
          : level === "gold"
          ? "چهره برتر طلایی شد"
          : "چهره برتر نقره‌ای شد";
      toast({ title: verb });
      load();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function bulkAction(action: "ban" | "unban" | "verify" | "unverify") {
    if (selected.size === 0) return;
    setBulkLoading(true);
    let success = 0;
    let failed = 0;
    const ids = [...selected];
    for (const id of ids) {
      try {
        await apiPut(`/api/admin/users/${id}`, { action });
        success++;
      } catch {
        failed++;
      }
    }
    setBulkLoading(false);
    setSelected(new Set());
    if (success > 0) {
      toast({
        title: `${toFa(success)} کاربر با موفقیت تغییر یافت`,
      });
    }
    if (failed > 0) {
      toast({
        title: `${toFa(failed)} عملیات ناموفق`,
        variant: "destructive",
      });
    }
    load();
  }

  function clearFilters() {
    setSearch("");
    setFilterVerified("all");
    setFilterBanned("all");
    setFilterTopTalent("all");
  }

  const hasActiveFilters =
    debouncedSearch !== "" ||
    filterVerified !== "all" ||
    filterBanned !== "all" ||
    filterTopTalent !== "all";

  return (
    <div>
      <PageHeader
        title="مدیریت کاربران"
        description="مشاهده، مسدودسازی و تایید کاربران"
        actions={
          <OutlineButton size="sm" onClick={load} className="gap-1.5 h-9">
            <RotateCcw className="w-3.5 h-3.5" />
            به‌روزرسانی
          </OutlineButton>
        }
      />

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <PrimaryButton
          size="sm"
          onClick={() => bulkAction("ban")}
          disabled={bulkLoading}
          className="gap-1.5 h-8"
        >
          {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
          مسدودسازی
        </PrimaryButton>
        <PrimaryButton
          size="sm"
          onClick={() => bulkAction("unban")}
          disabled={bulkLoading}
          className="gap-1.5 h-8"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          رفع مسدودیت
        </PrimaryButton>
        <PrimaryButton
          size="sm"
          onClick={() => bulkAction("verify")}
          disabled={bulkLoading}
          className="gap-1.5 h-8"
        >
          <BadgeCheck className="w-3.5 h-3.5" />
          تایید
        </PrimaryButton>
        <OutlineButton
          size="sm"
          onClick={() => bulkAction("unverify")}
          disabled={bulkLoading}
          className="gap-1.5 h-8"
        >
          <XCircle className="w-3.5 h-3.5" />
          لغو تایید
        </OutlineButton>
      </BulkActionBar>

      <TableCard>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="جستجوی نام یا تلفن..."
          />
          <FilterSelect
            value={filterVerified}
            onChange={setFilterVerified}
            placeholder="وضعیت تایید"
            options={[
              { value: "all", label: "همه (تایید)" },
              { value: "yes", label: "تایید شده" },
              { value: "no", label: "تایید نشده" },
            ]}
          />
          <FilterSelect
            value={filterBanned}
            onChange={setFilterBanned}
            placeholder="وضعیت مسدودیت"
            options={[
              { value: "all", label: "همه (مسدود)" },
              { value: "yes", label: "مسدود شده" },
              { value: "no", label: "فعال" },
            ]}
          />
          <FilterSelect
            value={filterTopTalent}
            onChange={setFilterTopTalent}
            placeholder="قاب چهره برتر"
            options={[
              { value: "all", label: "همه (قاب)" },
              { value: "yes", label: "دارای قاب (چهره برتر)" },
              { value: "no", label: "بدون قاب" },
            ]}
          />
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="h-9 text-gray-500 hover:text-gray-900 gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              پاک کردن فیلترها
            </Button>
          )}
        </TableToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={toggleAll}
                    aria-label="انتخاب همه"
                  />
                </TableHead>
                <TableHead className="font-bold text-gray-700">کاربر</TableHead>
                <TableHead className="font-bold text-gray-700">تلفن</TableHead>
                <TableHead className="font-bold text-gray-700">ستاره</TableHead>
                <TableHead className="font-bold text-gray-700">تایید</TableHead>
                <TableHead className="font-bold text-gray-700">وضعیت</TableHead>
                <TableHead className="font-bold text-gray-700">عضویت</TableHead>
                <TableHead className="font-bold text-gray-700 text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-10 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <EmptyRow colSpan={8} message="کاربری پیدا نشد" />
              ) : (
                paginated.map((u) => {
                  const isSelected = selected.has(u.id);
                  return (
                    <TableRow
                      key={u.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={isSelected ? "bg-blue-50/40" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(u.id)}
                          aria-label={`انتخاب ${u.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5 min-w-[180px]">
                          <div className="shrink-0">
                            <div
                              className="grid place-items-center w-9 h-9 rounded-full text-xs font-bold overflow-hidden"
                              style={{ backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
                            >
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                u.name.slice(0, 1)
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {u.avatarUrl ? "دارای عکس" : "بدون عکس"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell dir="ltr" className="text-sm text-gray-700 font-mono">
                        {u.phone}
                      </TableCell>
                      <TableCell>
                        <UserStarsCell user={u} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          type="verify"
                          status={u.isVerifiedBadge ? "yes" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge type="ban" status={u.isBanned ? "yes" : ""} />
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {formatFaDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel className="text-xs text-gray-500">
                              عملیات کاربر
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                patchUser(
                                  u.id,
                                  u.isVerifiedBadge ? "unverify" : "verify"
                                )
                              }
                              disabled={actionLoading === u.id + "verify" || actionLoading === u.id + "unverify"}
                              className="gap-2 cursor-pointer"
                            >
                              <BadgeCheck className="w-4 h-4 text-blue-600" />
                              {u.isVerifiedBadge ? "لغو تایید" : "تایید کاربر"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                patchUser(u.id, u.isBanned ? "unban" : "ban")
                              }
                              disabled={actionLoading === u.id + "ban" || actionLoading === u.id + "unban"}
                              className="gap-2 cursor-pointer"
                            >
                              {u.isBanned ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                                  رفع مسدودیت
                                </>
                              ) : (
                                <>
                                  <Ban className="w-4 h-4 text-red-600" />
                                  مسدود کردن
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {u.isAdminElite ? (
                              <DropdownMenuItem
                                onClick={() => patchUser(u.id, "unelite")}
                                disabled={actionLoading === u.id + "unelite"}
                                className="gap-2 cursor-pointer"
                              >
                                <Crown className="w-4 h-4 text-gray-500" />
                                لغو قاب چهره برتر
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() => patchUser(u.id, "elite", "silver")}
                                  disabled={actionLoading === u.id + "elite"}
                                  className="gap-2 cursor-pointer"
                                >
                                  <Crown className="w-4 h-4 text-slate-500" />
                                  چهره برتر نقره‌ای (۵۰۰۰)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => patchUser(u.id, "elite", "gold")}
                                  disabled={actionLoading === u.id + "elite"}
                                  className="gap-2 cursor-pointer"
                                >
                                  <Crown className="w-4 h-4 text-amber-500" />
                                  چهره برتر طلایی (۱۰۰۰۰)
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({ view: "profile", id: u.id })
                              }
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              مشاهده پروفایل
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar
          page={page}
          pageSize={USERS_PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </TableCard>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. Categories Tab — table with expandable skills
// ═══════════════════════════════════════════════════════════════════
function CategoriesTab() {
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newSkill, setNewSkill] = useState<Record<string, string>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newColor, setNewColor] = useState<string>(PRESET_CATEGORY_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<CategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState<string>(PRESET_CATEGORY_COLORS[0]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    api<{ categories: CategoryRow[] }>("/api/categories")
      .then((d) => setCats(d.categories))
      .catch(() => toast({ title: "خطا در بارگذاری", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return cats;
    const q = debouncedSearch.trim().toLowerCase();
    return cats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.skills.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [cats, debouncedSearch]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addCategory() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await apiPost("/api/admin/categories", {
        name: newName.trim(),
        iconUrl: newIcon.trim() || null,
        color: newColor || null,
      });
      setNewName("");
      setNewIcon("");
      setNewColor(PRESET_CATEGORY_COLORS[0]);
      setAddDialogOpen(false);
      toast({ title: "دسته‌بندی اضافه شد" });
      load();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`حذف «${name}» و همه مهارت‌های زیرمجموعه آن؟`)) return;
    try {
      await apiDelete(`/api/admin/categories/${id}`);
      toast({ title: "دسته‌بندی حذف شد" });
      load();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  }

  async function addSkill(catId: string) {
    const name = (newSkill[catId] || "").trim();
    if (!name) return;
    try {
      await apiPost("/api/admin/skills", { categoryId: catId, name });
      setNewSkill((prev) => ({ ...prev, [catId]: "" }));
      toast({ title: "مهارت اضافه شد" });
      load();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  }

  async function deleteSkill(skillId: string, skillName: string) {
    if (!confirm(`حذف مهارت «${skillName}»؟`)) return;
    try {
      await apiDelete(`/api/admin/skills/${skillId}`);
      toast({ title: "مهارت حذف شد" });
      load();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  }

  function openEditDialog(c: CategoryRow) {
    setEditCat(c);
    setEditName(c.name);
    setEditIcon(c.iconUrl || "");
    setEditColor(c.color || PRESET_CATEGORY_COLORS[0]);
    setEditDialogOpen(true);
  }

  async function saveEdit() {
    if (!editCat || !editName.trim()) return;
    setEditing(true);
    try {
      await apiPut(`/api/admin/categories/${editCat.id}`, {
        name: editName.trim(),
        iconUrl: editIcon.trim() || null,
        color: editColor || null,
      });
      setEditDialogOpen(false);
      toast({ title: "دسته‌بندی ویرایش شد" });
      load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEditing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="دسته‌بندی‌ها و مهارت‌ها"
        description="مدیریت دسته‌بندی‌ها و مهارت‌های زیرمجموعه"
        actions={
          <PrimaryButton
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="gap-1.5 h-9"
          >
            <Plus className="w-4 h-4" />
            دسته جدید
          </PrimaryButton>
        }
      />

      <TableCard>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="جستجوی دسته یا مهارت..."
          />
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
            {toFa(filtered.length)} دسته
          </Badge>
        </TableToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="w-10" />
                <TableHead className="font-bold text-gray-700">آیکون</TableHead>
                <TableHead className="font-bold text-gray-700">نام دسته</TableHead>
                <TableHead className="font-bold text-gray-700">رنگ</TableHead>
                <TableHead className="font-bold text-gray-700">تعداد مهارت</TableHead>
                <TableHead className="font-bold text-gray-700">تاریخ ایجاد</TableHead>
                <TableHead className="font-bold text-gray-700 text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-12 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={7} message="دسته‌بندی پیدا نشد" />
              ) : (
                filtered.map((c) => {
                  const isExpanded = expanded.has(c.id);
                  return (
                    <Fragment key={c.id}>
                      <TableRow
                        className="hover:bg-gray-50/50 cursor-pointer"
                        onClick={() => toggleExpand(c.id)}
                      >
                        <TableCell className="text-gray-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-2xl">{c.iconUrl || "📁"}</span>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-gray-900">
                          {c.name}
                        </TableCell>
                        <TableCell>
                          {c.color ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="inline-block w-5 h-5 rounded-full border border-gray-200 shadow-sm"
                                style={{ backgroundColor: c.color }}
                                title={c.color}
                              />
                              <span className="text-[10px] text-gray-400 font-mono uppercase">
                                {c.color}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-[10px]">
                            {toFa(c.skills.length)} مهارت
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {formatFaDate(c.createdAt)}
                        </TableCell>
                        <TableCell className="text-left">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 text-gray-500"
                              onClick={() => openEditDialog(c)}
                              aria-label="ویرایش دسته"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 text-gray-500"
                              onClick={() => deleteCategory(c.id, c.name)}
                              aria-label="حذف دسته"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-gray-50/30">
                          <TableCell />
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Tag className="w-3.5 h-3.5 text-gray-500" />
                                <p className="text-xs font-bold text-gray-700">
                                  مهارت‌های {c.name}
                                </p>
                              </div>
                              {c.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {c.skills.map((s) => (
                                    <div
                                      key={s.id}
                                      className="group inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-white border border-gray-200 text-xs text-gray-700 hover:border-red-200 transition-colors"
                                    >
                                      {s.name}
                                      <button
                                        onClick={() => deleteSkill(s.id, s.name)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                        aria-label={`حذف ${s.name}`}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">
                                  مهارتی ثبت نشده
                                </p>
                              )}
                              <div className="flex gap-2 max-w-md">
                                <Input
                                  value={newSkill[c.id] || ""}
                                  onChange={(e) =>
                                    setNewSkill((prev) => ({
                                      ...prev,
                                      [c.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") addSkill(c.id);
                                  }}
                                  placeholder="نام مهارت جدید..."
                                  className={cn(
                                    "h-8 text-sm rounded-md border-gray-200",
                                    TX.ringPrimary
                                  )}
                                />
                                <PrimaryButton
                                  size="sm"
                                  onClick={() => addSkill(c.id)}
                                  className="h-8 gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  افزودن
                                </PrimaryButton>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TableCard>

      {/* Add category dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              افزودن دسته‌بندی جدید
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">آیکون (اموجی)</Label>
              <Input
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="🎨"
                maxLength={4}
                className={cn(
                  "h-10 text-center text-2xl rounded-lg border-gray-200",
                  TX.ringPrimary
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">نام دسته</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثلاً: موسیقی..."
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                className={cn(
                  "h-10 rounded-lg border-gray-200",
                  TX.ringPrimary
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  رنگ دسته
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  برای حلقه دور آواتار کاربران
                </span>
              </Label>
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/40">
                {PRESET_CATEGORY_COLORS.map((color) => {
                  const selected = newColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all",
                        selected
                          ? "border-gray-900 scale-110 shadow-md"
                          : "border-white shadow-sm hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`انتخاب رنگ ${color}`}
                      title={color}
                    />
                  );
                })}
                {/* Custom color input */}
                <div className="flex items-center gap-2 mr-auto">
                  <label
                    className="relative w-9 h-9 rounded-full border-2 border-gray-200 cursor-pointer overflow-hidden shadow-sm hover:scale-105 transition-transform"
                    style={{ backgroundColor: newColor }}
                    title="انتخاب رنگ دلخواه"
                  >
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="رنگ دلخواه"
                    />
                    <Palette className="absolute inset-0 m-auto w-3 h-3 text-white mix-blend-difference pointer-events-none" />
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono uppercase">
                    {newColor}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <OutlineButton
              onClick={() => setAddDialogOpen(false)}
              className="h-9"
            >
              انصراف
            </OutlineButton>
            <PrimaryButton
              onClick={addCategory}
              disabled={adding || !newName.trim()}
              className="h-9 gap-1.5"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              افزودن دسته
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit category dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>ویرایش دسته‌بندی</DialogTitle>
            <DialogDescription>نام، آیکون و رنگ دسته‌بندی را تغییر دهید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نام دسته</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={cn("h-10 rounded-lg", TX.ringPrimary)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">آیکون (اموجی)</Label>
              <Input
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value)}
                placeholder="🎵"
                className={cn("h-10 rounded-lg", TX.ringPrimary)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">رنگ دسته</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    className={cn(
                      "w-9 h-9 rounded-full border-2 transition-all",
                      editColor === color ? "border-gray-900 scale-110 shadow-md" : "border-gray-200"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-9 h-9 rounded-full border-2 border-gray-200 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-mono uppercase">{editColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <OutlineButton size="sm" onClick={() => setEditDialogOpen(false)} className="h-9">
              انصراف
            </OutlineButton>
            <PrimaryButton
              size="sm"
              onClick={saveEdit}
              disabled={editing || !editName.trim()}
              className="gap-1.5 h-9"
            >
              {editing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
              ذخیره تغییرات
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4. Posts Tab — table with search, bulk delete, pagination
// ═══════════════════════════════════════════════════════════════════
const POSTS_PAGE_SIZE = 10;

function PostsTab() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    ids: string[];
  }>({ open: false, ids: [] });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    api<{ posts: AdminPost[] }>("/api/admin/posts")
      .then((d) => setPosts(d.posts))
      .catch(() => toast({ title: "خطا در بارگذاری", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return posts;
    const q = debouncedSearch.trim().toLowerCase();
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.user.name.toLowerCase().includes(q)
    );
  }, [posts, debouncedSearch]);

  const paginated = useMemo(() => {
    const start = (page - 1) * POSTS_PAGE_SIZE;
    return filtered.slice(start, start + POSTS_PAGE_SIZE);
  }, [filtered, page]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const pageIds = new Set(paginated.map((p) => p.id));
  const allPageSelected =
    pageIds.size > 0 && [...pageIds].every((id) => selected.has(id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function doDelete(ids: string[]) {
    if (ids.length === 0) return;
    setBulkLoading(ids.length > 1);
    setActionLoading(ids[0]);
    let success = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await apiDelete(`/api/admin/posts/${id}`);
        success++;
      } catch {
        failed++;
      }
    }
    setBulkLoading(false);
    setActionLoading(null);
    setDeleteDialog({ open: false, ids: [] });
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (success > 0) toast({ title: `${toFa(success)} پست حذف شد` });
    if (failed > 0)
      toast({
        title: `${toFa(failed)} خطا در حذف`,
        variant: "destructive",
      });
    load();
  }

  async function toggleFeatured(id: string, current: boolean) {
    setActionLoading(id + "feature");
    try {
      const res = await apiPost<{ ok: boolean; isFeatured: boolean }>(
        `/api/admin/posts/${id}/feature`,
        {}
      );
      // Optimistically update local list so the badge updates immediately
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, isFeatured: res.isFeatured } : p
        )
      );
      toast({
        title: res.isFeatured
          ? "پست به ویترین چهره برتر اضافه شد"
          : "پست از ویترین چهره برتر حذف شد",
      });
    } catch (e) {
      toast({
        title: "خطا در تغییر وضعیت ویترین",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="مدیریت پست‌ها"
        description="مشاهده و حذف پست‌های کاربران"
        actions={
          <OutlineButton size="sm" onClick={load} className="gap-1.5 h-9">
            <RotateCcw className="w-3.5 h-3.5" />
            به‌روزرسانی
          </OutlineButton>
        }
      />

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setDeleteDialog({ open: true, ids: [...selected] })}
          disabled={bulkLoading}
          className="gap-1.5 h-8"
        >
          {bulkLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          حذف انتخاب‌شده‌ها
        </Button>
      </BulkActionBar>

      <TableCard>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="جستجوی محتوا یا نویسنده..."
          />
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
            {toFa(total)} پست
          </Badge>
        </TableToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={toggleAll}
                    aria-label="انتخاب همه"
                  />
                </TableHead>
                <TableHead className="font-bold text-gray-700">محتوا</TableHead>
                <TableHead className="font-bold text-gray-700">نویسنده</TableHead>
                <TableHead className="font-bold text-gray-700">ویترین</TableHead>
                <TableHead className="font-bold text-gray-700">تاریخ</TableHead>
                <TableHead className="font-bold text-gray-700 text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-12 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <EmptyRow colSpan={6} message="پستی پیدا نشد" />
              ) : (
                paginated.map((p) => {
                  const isSelected = selected.has(p.id);
                  return (
                    <TableRow
                      key={p.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={isSelected ? "bg-blue-50/40" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(p.id)}
                          aria-label="انتخاب"
                        />
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-gray-700 line-clamp-2 leading-5">
                          {p.content}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 min-w-[140px]">
                          <span className="text-sm font-bold text-gray-900">
                            {p.user.name}
                          </span>
                          {p.user.isTopTalent && (
                            <span
                              title="چهره برتر"
                              className="inline-grid place-items-center w-5 h-5 rounded-full"
                              style={{
                                backgroundColor: "oklch(0.92 0.07 80)",
                              }}
                            >
                              <Crown className="w-3 h-3 text-amber-600" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.isFeatured ? (
                          <FeaturedStarBadge />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {timeAgoFa(p.createdAt)}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFeatured(p.id, !!p.isFeatured)}
                            disabled={actionLoading === p.id + "feature"}
                            className={cn(
                              "h-8 px-2 gap-1 text-xs",
                              p.isFeatured
                                ? "text-blue-700 hover:bg-blue-50"
                                : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                            )}
                            title={
                              p.isFeatured
                                ? "حذف از ویترین"
                                : "ارسال به ویترین چهره برتر"
                            }
                          >
                            {actionLoading === p.id + "feature" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">
                              {p.isFeatured ? "حذف ویترین" : "ویترین"}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setDeleteDialog({ open: true, ids: [p.id] })
                            }
                            disabled={actionLoading === p.id}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 text-gray-500"
                            aria-label="حذف پست"
                          >
                            {actionLoading === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar
          page={page}
          pageSize={POSTS_PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </TableCard>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(o) => setDeleteDialog((s) => ({ ...s, open: o }))}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              تایید حذف پست
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف{" "}
              <strong className="text-gray-900">
                {toFa(deleteDialog.ids.length)}
              </strong>{" "}
              پست اطمینان دارید؟ این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg h-9">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doDelete(deleteDialog.ids)}
              className="rounded-lg h-9 bg-red-600 hover:bg-red-700 gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5. Needs Tab — table with search, filter by status, close/delete
// ═══════════════════════════════════════════════════════════════════
const NEEDS_PAGE_SIZE = 10;

function NeedsTab() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    api<{ jobs: AdminJob[] }>("/api/admin/jobs")
      .then((d) => setJobs(d.jobs))
      .catch(() => toast({ title: "خطا در بارگذاری", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (filterStatus !== "all" && j.status !== filterStatus) return false;
      if (!debouncedSearch) return true;
      const q = debouncedSearch.trim().toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.user.name.toLowerCase().includes(q) ||
        (j.category?.name || "").toLowerCase().includes(q)
      );
    });
  }, [jobs, debouncedSearch, filterStatus]);

  const paginated = useMemo(() => {
    const start = (page - 1) * NEEDS_PAGE_SIZE;
    return filtered.slice(start, start + NEEDS_PAGE_SIZE);
  }, [filtered, page]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / NEEDS_PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  async function toggleStatus(id: string, current: string) {
    setActionLoading(id);
    try {
      const next = current === "open" ? "closed" : "open";
      await apiPatch(`/api/admin/jobs/${id}`, { status: next });
      toast({
        title: next === "open" ? "نیازمندی باز شد" : "نیازمندی بسته شد",
      });
      load();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteJob(id: string, title: string) {
    if (!confirm(`حذف نیازمندی «${title}»؟`)) return;
    setActionLoading(id);
    try {
      await apiDelete(`/api/admin/jobs/${id}`);
      toast({ title: "نیازمندی حذف شد" });
      load();
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setFilterStatus("all");
  }
  const hasActiveFilters = debouncedSearch !== "" || filterStatus !== "all";

  return (
    <div>
      <PageHeader
        title="مدیریت نیازمندی‌ها"
        description="مشاهده، بستن و حذف آگهی‌های نیازمندی"
        actions={
          <OutlineButton size="sm" onClick={load} className="gap-1.5 h-9">
            <RotateCcw className="w-3.5 h-3.5" />
            به‌روزرسانی
          </OutlineButton>
        }
      />

      <TableCard>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="جستجوی عنوان، دسته یا نویسنده..."
          />
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="وضعیت"
            options={[
              { value: "all", label: "همه" },
              { value: "open", label: "باز" },
              { value: "closed", label: "بسته شده" },
            ]}
          />
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="h-9 text-gray-500 hover:text-gray-900 gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              پاک کردن
            </Button>
          )}
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
            {toFa(total)} آگهی
          </Badge>
        </TableToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="font-bold text-gray-700">عنوان</TableHead>
                <TableHead className="font-bold text-gray-700">نویسنده</TableHead>
                <TableHead className="font-bold text-gray-700">دسته</TableHead>
                <TableHead className="font-bold text-gray-700">وضعیت</TableHead>
                <TableHead className="font-bold text-gray-700">درخواست‌ها</TableHead>
                <TableHead className="font-bold text-gray-700">تاریخ</TableHead>
                <TableHead className="font-bold text-gray-700 text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-12 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <EmptyRow colSpan={7} message="نیازمندی پیدا نشد" />
              ) : (
                paginated.map((j) => (
                  <TableRow key={j.id} className="hover:bg-gray-50/50">
                    <TableCell className="max-w-xs">
                      <p className="font-bold text-sm text-gray-900 line-clamp-1">
                        {j.title}
                      </p>
                      {j.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {j.skills.slice(0, 2).map((s) => (
                            <span
                              key={s.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                            >
                              {s.name}
                            </span>
                          ))}
                          {j.skills.length > 2 && (
                            <span className="text-[10px] text-gray-400">
                              +{toFa(j.skills.length - 2)}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div
                          className="grid place-items-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0"
                          style={{
                            backgroundColor: ADMIN_PRIMARY,
                            color: ADMIN_FG,
                          }}
                        >
                          {j.user.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {j.user.name}
                          </p>
                          {(j.province || j.city) && (
                            <p className="text-[10px] text-gray-400 truncate">
                              {j.province}
                              {j.province && j.city ? " - " : ""}
                              {j.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {j.category ? (
                        <Badge className="bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-50 text-[10px]">
                          {j.category.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="job" status={j.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-gray-900 nums-fa">
                        {toFa(j.applicationCount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {timeAgoFa(j.createdAt)}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleStatus(j.id, j.status)}
                          disabled={actionLoading === j.id}
                          className="h-8 px-2 gap-1 hover:bg-amber-50 hover:text-amber-700 text-gray-600"
                          title={j.status === "open" ? "بستن" : "باز کردن"}
                        >
                          {actionLoading === j.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : j.status === "open" ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="text-xs hidden sm:inline">بستن</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-xs hidden sm:inline">باز کردن</span>
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteJob(j.id, j.title)}
                          disabled={actionLoading === j.id}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 text-gray-500"
                          aria-label="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar
          page={page}
          pageSize={NEEDS_PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </TableCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5b. Scouts Tab — چهره‌یاب‌ها (درخواست‌های چهره‌یابی + چهره‌یاب‌های فعال)
// ═══════════════════════════════════════════════════════════════════
function ScoutsTab() {
  const [status, setStatus] = useState<ReviewFilter>("all");
  const [applications, setApplications] = useState<ScoutApplication[]>([]);
  const [scouts, setScouts] = useState<ActiveScout[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    app: ScoutApplication | null;
  }>({ open: false, app: null });
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    scout: ActiveScout | null;
  }>({ open: false, scout: null });
  const [revoking, setRevoking] = useState(false);

  const [lightbox, setLightbox] = useState<{ open: boolean; src: string; name: string }>({
    open: false,
    src: "",
    name: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    api<{ applications: ScoutApplication[]; scouts: ActiveScout[]; pendingCount: number }>(
      `/api/admin/scouts?status=${status}`
    )
      .then((d) => {
        setApplications(d.applications || []);
        setScouts(d.scouts || []);
        setPendingCount(d.pendingCount || 0);
      })
      .catch(() => toast({ title: "خطا در بارگذاری", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [status]);
  useEffect(load, [load]);

  async function approveApp(app: ScoutApplication) {
    setActionLoading(app.id + "approve");
    try {
      const res = await apiPost<{ ok: boolean; message: string }>("/api/admin/scouts", {
        id: app.id,
        action: "approve",
      });
      toast({ title: res.message || `حساب «${app.name}» چهره‌یاب شد` });
      load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectApp() {
    const app = rejectDialog.app;
    if (!app || rejecting) return;
    setRejecting(true);
    try {
      const res = await apiPost<{ ok: boolean; message: string }>("/api/admin/scouts", {
        id: app.id,
        action: "reject",
        note: rejectNote.trim() || undefined,
      });
      toast({ title: res.message || "درخواست چهره‌یابی رد شد" });
      setRejectDialog({ open: false, app: null });
      setRejectNote("");
      load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRejecting(false);
    }
  }

  async function revokeScout() {
    const scout = revokeDialog.scout;
    if (!scout || revoking) return;
    setRevoking(true);
    try {
      const res = await apiPost<{ ok: boolean; message: string }>("/api/admin/scouts", {
        id: scout.id,
        userId: scout.id,
        action: "revoke",
      });
      toast({ title: res.message || "دسترسی چهره‌یاب لغو شد" });
      setRevokeDialog({ open: false, scout: null });
      load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="چهره‌یاب‌ها"
        description="بررسی درخواست‌های چهره‌یابی و مدیریت چهره‌یاب‌های فعال"
        actions={
          <>
            {pendingCount > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 h-9 px-3 rounded-lg gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5" />
                {toFa(pendingCount)} در انتظار بررسی
              </Badge>
            )}
            <OutlineButton size="sm" onClick={load} className="gap-1.5 h-9">
              <RotateCcw className="w-3.5 h-3.5" />
              به‌روزرسانی
            </OutlineButton>
          </>
        }
      />

      <StatusFilterChips value={status} onChange={setStatus} pendingCount={pendingCount} />

      {/* ═══ درخواست‌های چهره‌یابی ═══ */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CompassIcon className="w-4 h-4 text-gray-700" />
          <h3 className="font-bold text-sm text-gray-900">درخواست‌های چهره‌یابی</h3>
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-[10px]">
            {toFa(applications.length)} درخواست
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <EmptyCardState icon={CompassIcon} message="درخواستی در این وضعیت پیدا نشد" />
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="border-gray-200 shadow-sm rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AdminAvatar name={app.name} avatarUrl={app.avatarUrl} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-gray-900">{app.name}</p>
                    <ReviewStatusChip status={app.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <PhoneIcon className="w-3.5 h-3.5" />
                      <span dir="ltr" className="font-mono">
                        {app.phone}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IdCardIcon className="w-3.5 h-3.5" />
                      <span dir="ltr" className="font-mono tracking-wide">
                        {app.nationalCode}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatFaDate(app.createdAt)}
                    </span>
                  </div>
                </div>
                {app.cardImageUrl && (
                  <button
                    onClick={() =>
                      setLightbox({ open: true, src: app.cardImageUrl || "", name: app.name })
                    }
                    className="shrink-0 relative group rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors"
                    aria-label={`مشاهده تصویر کارت ملی ${app.name}`}
                    title="مشاهده تصویر بزرگ"
                  >
                    <img
                      src={app.cardImageUrl}
                      alt={`کارت ملی ${app.name}`}
                      className="w-20 h-14 object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/25 transition-colors">
                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-700 leading-6 rounded-lg bg-gray-50 border border-gray-100 p-3">
                {app.description}
              </p>

              {app.adminNote && (
                <div className="flex items-start gap-1.5 rounded-lg bg-gray-50 border border-gray-100 p-2.5 text-xs text-gray-500">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-700">یادداشت ادمین:</strong> {app.adminNote}
                  </span>
                </div>
              )}

              {app.status === "pending" && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                  <PrimaryButton
                    size="sm"
                    onClick={() => approveApp(app)}
                    disabled={actionLoading === app.id + "approve"}
                    className="gap-1.5 h-9"
                  >
                    {actionLoading === app.id + "approve" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    تأیید و فعال‌سازی
                  </PrimaryButton>
                  <OutlineButton
                    size="sm"
                    onClick={() => setRejectDialog({ open: true, app })}
                    className="gap-1.5 h-9 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    رد
                  </OutlineButton>
                </div>
              )}
            </Card>
          ))
        )}
      </section>

      {/* ═══ چهره‌یاب‌های فعال ═══ */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-gray-700" />
          <h3 className="font-bold text-sm text-gray-900">چهره‌یاب‌های فعال</h3>
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px]">
            {toFa(scouts.length)} چهره‌یاب
          </Badge>
        </div>

        {loading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : scouts.length === 0 ? (
          <EmptyCardState icon={UsersIcon} message="هنوز چهره‌یاب فعالی وجود ندارد" />
        ) : (
          <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden divide-y divide-gray-100">
            {scouts.map((scout) => (
              <div
                key={scout.id}
                className="flex flex-wrap items-center gap-3 p-3.5 hover:bg-gray-50/50 transition-colors"
              >
                <AdminAvatar name={scout.name} avatarUrl={scout.avatarUrl} size={36} />
                <div className="flex-1 min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-900 truncate">{scout.name}</p>
                    {scout.isBanned && <StatusBadge type="ban" status="yes" />}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-mono" dir="ltr">
                    {scout.phone}
                  </p>
                </div>
                <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-50 text-[10px] h-5 rounded gap-1">
                  <Briefcase className="w-3 h-3" />
                  {toFa(scout.needsCount)} نیازمندی
                </Badge>
                <span className="hidden sm:inline text-[10px] text-gray-400">
                  {formatFaDate(scout.since)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevokeDialog({ open: true, scout })}
                  className="h-9 gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Ban className="w-3.5 h-3.5" />
                  لغو دسترسی
                </Button>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* ═══ دیالوگ رد درخواست چهره‌یابی ═══ */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(o) => setRejectDialog((s) => ({ ...s, open: o }))}
      >
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              رد درخواست چهره‌یابی
            </DialogTitle>
            <DialogDescription>
              درخواست «{rejectDialog.app?.name}» رد می‌شود و به کاربر اطلاع داده خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs font-bold text-gray-700">
              یادداشت برای کاربر (اختیاری)
            </Label>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="دلیل رد — مثلاً: تصویر کارت ملی ناخواناست..."
              maxLength={500}
              className={cn(
                "rounded-lg border-gray-200 min-h-[90px] resize-y",
                TX.ringPrimary
              )}
            />
          </div>
          <DialogFooter>
            <OutlineButton
              onClick={() => setRejectDialog({ open: false, app: null })}
              className="h-9"
            >
              انصراف
            </OutlineButton>
            <Button
              onClick={rejectApp}
              disabled={rejecting}
              className="rounded-lg h-9 gap-1.5 bg-red-600 hover:bg-red-700 text-white"
            >
              {rejecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              رد درخواست
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ تأیید لغو دسترسی چهره‌یاب ═══ */}
      <AlertDialog
        open={revokeDialog.open}
        onOpenChange={(o) => setRevokeDialog((s) => ({ ...s, open: o }))}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              لغو دسترسی چهره‌یاب
            </AlertDialogTitle>
            <AlertDialogDescription>
              دسترسی چهره‌یابی «{revokeDialog.scout?.name}» لغو می‌شود؛ صفحهٔ چهره‌یاب برای او
              غیرفعال و درخواست‌هایش رد خواهند شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg h-9">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                revokeScout();
              }}
              disabled={revoking}
              className="rounded-lg h-9 bg-red-600 hover:bg-red-700 gap-1.5"
            >
              {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              لغو دسترسی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ نمایش تمام‌صفحهٔ تصویر کارت ملی ═══ */}
      <Dialog
        open={lightbox.open}
        onOpenChange={(o) => setLightbox((s) => ({ ...s, open: o }))}
      >
        <DialogContent className="rounded-xl max-w-2xl p-0 gap-0 overflow-hidden bg-gray-900 border-gray-700">
          <DialogHeader className="sr-only">
            <DialogTitle>تصویر کارت ملی {lightbox.name}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img
              src={lightbox.src}
              alt={`کارت ملی ${lightbox.name}`}
              className="w-full max-h-[70vh] object-contain bg-gray-900"
            />
            <p className="absolute top-2 right-3 text-xs font-bold text-white/90 bg-black/50 rounded-md px-2 py-1">
              کارت ملی {lightbox.name}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5c. Elite Requests Tab — درخواست‌های چهره برتر (مستقیم + معرفی چهره‌یاب)
// ═══════════════════════════════════════════════════════════════════
function EliteRequestsTab() {
  const [status, setStatus] = useState<ReviewFilter>("all");
  const [requests, setRequests] = useState<EliteRequestRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    req: EliteRequestRow | null;
  }>({ open: false, req: null });
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api<{ requests: EliteRequestRow[]; pendingCount: number }>(
      `/api/admin/elite-requests?status=${status}`
    )
      .then((d) => {
        setRequests(d.requests || []);
        setPendingCount(d.pendingCount || 0);
      })
      .catch(() => toast({ title: "خطا در بارگذاری", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [status]);
  useEffect(load, [load]);

  async function approveReq(r: EliteRequestRow, level: "silver" | "gold") {
    setActionLoading(r.id + "approve");
    try {
      const res = await apiPost<{ ok: boolean; message: string }>("/api/admin/elite-requests", {
        id: r.id,
        action: "approve",
        level,
      });
      toast({ title: res.message || `${r.user.name} چهره برتر شد` });
      load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectReq() {
    const r = rejectDialog.req;
    if (!r || rejecting) return;
    setRejecting(true);
    try {
      const res = await apiPost<{ ok: boolean; message: string }>("/api/admin/elite-requests", {
        id: r.id,
        action: "reject",
        note: rejectNote.trim() || undefined,
      });
      toast({ title: res.message || "درخواست رد شد" });
      setRejectDialog({ open: false, req: null });
      setRejectNote("");
      load();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="درخواست‌های چهره برتر"
        description="درخواست‌های مستقیم کاربران و معرفی‌های چهره‌یاب‌ها — تأیید = قاب طلایی فوری"
        actions={
          <>
            {pendingCount > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 h-9 px-3 rounded-lg gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5" />
                {toFa(pendingCount)} در انتظار بررسی
              </Badge>
            )}
            <OutlineButton size="sm" onClick={load} className="gap-1.5 h-9">
              <RotateCcw className="w-3.5 h-3.5" />
              به‌روزرسانی
            </OutlineButton>
          </>
        }
      />

      <StatusFilterChips value={status} onChange={setStatus} pendingCount={pendingCount} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <StarIcon className="w-4 h-4 text-gray-700" />
          <h3 className="font-bold text-sm text-gray-900">درخواست‌ها</h3>
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-[10px]">
            {toFa(requests.length)} مورد
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyCardState icon={StarIcon} message="درخواستی در این وضعیت پیدا نشد" />
        ) : (
          requests.map((r) => (
            <Card key={r.id} className="border-gray-200 shadow-sm rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AdminAvatar name={r.user.name} avatarUrl={r.user.avatarUrl} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-gray-900">{r.user.name}</p>
                    {r.user.frame && (
                      <Badge
                        className={cn(
                          "text-[10px] h-5 rounded gap-1",
                          r.user.frame === "gold"
                            ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50"
                            : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-100"
                        )}
                      >
                        <Crown className="w-3 h-3" />
                        {r.user.frame === "gold" ? "طلایی" : "نقره‌ای"}
                      </Badge>
                    )}
                    <ReviewStatusChip status={r.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <PhoneIcon className="w-3.5 h-3.5" />
                      <span dir="ltr" className="font-mono">
                        {r.user.phone}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatFaDate(r.createdAt)}
                    </span>
                  </div>
                  {/* آمار + منبع درخواست */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 text-[10px] h-5 rounded gap-1">
                      <StarIcon className="w-3 h-3" />
                      {toFa(r.user.totalStars)} ستاره
                    </Badge>
                    <Badge className="bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-50 text-[10px] h-5 rounded gap-1">
                      {toFa(r.user.votes)} رأی
                    </Badge>
                    {r.source === "scout" ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px] h-5 rounded gap-1">
                        <CompassIcon className="w-3 h-3" />
                        معرفی چهره‌یاب: {r.nominator?.name || "—"}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-50 text-[10px] h-5 rounded gap-1">
                        <UserIcon className="w-3 h-3" />
                        درخواست مستقیم کاربر
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-6 rounded-lg bg-gray-50 border border-gray-100 p-3">
                {r.reason}
              </p>

              {r.adminNote && (
                <div className="flex items-start gap-1.5 rounded-lg bg-gray-50 border border-gray-100 p-2.5 text-xs text-gray-500">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-700">یادداشت ادمین:</strong> {r.adminNote}
                  </span>
                </div>
              )}

              {r.status === "pending" && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    onClick={() => approveReq(r, "silver")}
                    disabled={actionLoading === r.id + "approve"}
                    className="h-9 gap-1.5 bg-slate-600 hover:bg-slate-700 text-white border border-slate-500 shadow-sm"
                  >
                    {actionLoading === r.id + "approve" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Crown className="w-3.5 h-3.5" />
                    )}
                    تأیید → قاب نقره‌ای (۵۰۰۰)
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveReq(r, "gold")}
                    disabled={actionLoading === r.id + "approve"}
                    className="h-9 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border border-amber-400 shadow-sm"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    تأیید → قاب طلایی (۱۰۰۰۰)
                  </Button>
                  <OutlineButton
                    size="sm"
                    onClick={() => setRejectDialog({ open: true, req: r })}
                    className="gap-1.5 h-9 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    رد
                  </OutlineButton>
                </div>
              )}
            </Card>
          ))
        )}
      </section>

      {/* ═══ دیالوگ رد درخواست چهره برتر ═══ */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(o) => setRejectDialog((s) => ({ ...s, open: o }))}
      >
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              رد درخواست چهره برتر
            </DialogTitle>
            <DialogDescription>
              درخواست «{rejectDialog.req?.user.name}» رد می‌شود و به کاربر اطلاع داده خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs font-bold text-gray-700">
              یادداشت برای کاربر (اختیاری)
            </Label>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="دلیل رد — مثلاً: سابقهٔ ارائه‌شده برای قاب طلایی کافی نیست..."
              maxLength={500}
              className={cn(
                "rounded-lg border-gray-200 min-h-[90px] resize-y",
                TX.ringPrimary
              )}
            />
          </div>
          <DialogFooter>
            <OutlineButton
              onClick={() => setRejectDialog({ open: false, req: null })}
              className="h-9"
            >
              انصراف
            </OutlineButton>
            <Button
              onClick={rejectReq}
              disabled={rejecting}
              className="rounded-lg h-9 gap-1.5 bg-red-600 hover:bg-red-700 text-white"
            >
              {rejecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              رد درخواست
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 6. Broadcast Tab — form for sending global notifications
// ═══════════════════════════════════════════════════════════════════
function BroadcastTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [lastCount, setLastCount] = useState<number | null>(null);

  async function send() {
    if (!title.trim() || !body.trim()) {
      toast({ title: "عنوان و متن را پر کنید", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await apiPost<{ count: number }>("/api/admin/broadcast", {
        title: title.trim(),
        body: body.trim(),
      });
      setLastCount(res.count);
      toast({
        title: `اعلان به ${toFa(res.count)} کاربر ارسال شد`,
      });
      setTitle("");
      setBody("");
    } catch (e) {
      toast({
        title: "خطا",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="اعلان سراسری"
        description="ارسال پیام همگانی به تمام کاربران غیرمسدود"
      />

      {lastCount !== null && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl border flex items-center gap-2"
          style={{
            backgroundColor: "oklch(0.96 0.04 250)",
            borderColor: "oklch(0.88 0.05 250)",
          }}
        >
          <CheckCircle2 className="w-4 h-4" style={{ color: ADMIN_PRIMARY }} />
          <p className="text-sm text-gray-700">
            آخرین اعلان به{" "}
            <strong className="nums-fa">{toFa(lastCount)}</strong> کاربر ارسال شد.
          </p>
        </motion.div>
      )}

      <Card className="p-5 border-gray-200 shadow-sm rounded-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="grid place-items-center w-9 h-9 rounded-lg"
            style={{ backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
          >
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">فرم ارسال اعلان</h3>
            <p className="text-[10px] text-gray-500">
              این پیام برای همه کاربران فعال ارسال می‌شود
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-700">
            عنوان اعلان <span className="text-red-500">*</span>
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: ویژگی جدید پلتفرم..."
            maxLength={100}
            className={cn("h-10 rounded-lg border-gray-200", TX.ringPrimary)}
          />
          <p className="text-[10px] text-gray-400 text-left nums-fa">
            {toFa(title.length)}/{toFa(100)}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-700">
            متن اعلان <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="متن کامل اعلان را اینجا بنویسید..."
            maxLength={2000}
            className={cn(
              "rounded-lg border-gray-200 min-h-[140px] resize-y",
              TX.ringPrimary
            )}
          />
          <p className="text-[10px] text-gray-400 text-left nums-fa">
            {toFa(body.length)}/{toFa(2000)}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            ارسال فوری به همه کاربران فعال
          </div>
          <PrimaryButton
            onClick={send}
            disabled={sending || !title.trim() || !body.trim()}
            className="gap-1.5 h-10 px-5"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            ارسال اعلان
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 7. Settings Tab — admin profile + system info
// ═══════════════════════════════════════════════════════════════════
function SettingsTab({
  admin,
  onLogout,
}: {
  admin: NonNullable<AdminInfo>;
  onLogout: () => void;
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title="تنظیمات"
        description="مدیریت حساب کاربری ادمین و اطلاعات سیستم"
      />

      <Card className="p-5 border-gray-200 shadow-sm rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="grid place-items-center w-14 h-14 rounded-2xl text-xl font-extrabold shadow-md"
            style={{ backgroundColor: ADMIN_PRIMARY, color: ADMIN_FG }}
          >
            {admin.name.slice(0, 1)}
          </div>
          <div>
            <p className="font-bold text-base text-gray-900">{admin.name}</p>
            <p className="text-xs text-gray-500">@{admin.username}</p>
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-[10px] mt-1">
              <Shield className="w-3 h-3 ml-1" /> مدیر سیستم
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-5 border-gray-200 shadow-sm rounded-xl">
        <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-gray-600" />
          اطلاعات سیستم
        </h3>
        <div className="space-y-2 text-xs">
          <InfoRow label="پلتفرم" value="فرصتینو (HamTeam)" />
          <InfoRow label="نسخه" value="2.0.0" />
          <InfoRow label="محیط" value="توسعه (Development)" />
          <InfoRow label="پایگاه داده" value="SQLite" />
          <InfoRow label="قالب" value="Next.js 16 + Tailwind 4" />
        </div>
      </Card>

      <Card className="p-5 border-gray-200 shadow-sm rounded-xl">
        <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-gray-600" />
          عملیات حساب
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <OutlineButton
            onClick={onLogout}
            className="gap-1.5 h-9 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            خروج از حساب کاربری
          </OutlineButton>
          <OutlineButton
            onClick={() => navigate({ view: "feed" })}
            className="gap-1.5 h-9"
          >
            <Eye className="w-4 h-4" />
            مشاهده سایت
          </OutlineButton>
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-900 nums-fa">{value}</span>
    </div>
  );
}
