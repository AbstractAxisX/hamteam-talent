"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  FileText,
  MessageCircle,
  Ticket as TicketIcon,
  Megaphone,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { DashboardTab } from "./admin/dashboard-tab";
import { UsersTab } from "./admin/users-tab";
import { CategoriesTab } from "./admin/categories-tab";
import { ContentTab } from "./admin/content-tab";
import { ChatsTab } from "./admin/chats-tab";
import { TicketsTab } from "./admin/tickets-tab";
import { BroadcastTab } from "./admin/broadcast-tab";

const TABS = [
  { value: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { value: "users", label: "کاربران", icon: Users },
  { value: "categories", label: "دسته‌بندی‌ها", icon: LayoutGrid },
  { value: "content", label: "محتوا", icon: FileText },
  { value: "chats", label: "چت‌ها", icon: MessageCircle },
  { value: "tickets", label: "تیکت‌ها", icon: TicketIcon },
  { value: "broadcast", label: "نوتیف سراسری", icon: Megaphone },
] as const;

export function AdminView() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ view: "auth" });
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    return (
      <Card className="p-0">
        <EmptyState
          icon={ShieldAlert}
          title="دسترسی غیرمجاز"
          description="این بخش فقط برای مدیران سیستم قابل مشاهده است."
          action={
            <button
              onClick={() => navigate({ view: "feed" })}
              className="text-primary hover:underline text-sm"
            >
              بازگشت به خانه
            </button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-warning/10 text-warning">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">پنل مدیریت</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            مدیریت کاربران، محتوا و تنظیمات پلتفرم
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="w-full sm:w-auto overflow-x-auto no-scrollbar h-auto p-1 flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1.5 flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="content" className="mt-4">
          <ContentTab />
        </TabsContent>
        <TabsContent value="chats" className="mt-4">
          <ChatsTab />
        </TabsContent>
        <TabsContent value="tickets" className="mt-4">
          <TicketsTab />
        </TabsContent>
        <TabsContent value="broadcast" className="mt-4">
          <BroadcastTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
