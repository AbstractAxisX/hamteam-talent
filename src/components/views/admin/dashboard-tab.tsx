"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toFa } from "@/lib/format";
import {
  Users,
  FileText,
  Briefcase,
  MessageCircle,
  Link2,
  Ticket as TicketIcon,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

type Stats = {
  users: number;
  posts: number;
  openJobs: number;
  messages: number;
  connections: number;
  tickets: number;
  categories: number;
  skills: number;
};

type GrowthPoint = { date: string; count: number };

const chartConfig: ChartConfig = {
  count: { label: "ثبت‌نام", color: "var(--chart-1)" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div
        className="grid place-items-center w-11 h-11 rounded-xl shrink-0"
        style={{ backgroundColor: `var(--${color})`, opacity: 0.15 }}
      >
        <Icon className="w-5 h-5" style={{ color: `var(--${color})` }} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold leading-tight nums-fa">
          {toFa(value)}
        </div>
      </div>
    </Card>
  );
}

export function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{
          stats: Stats;
          growthData: GrowthPoint[];
        }>("/api/admin/stats");
        setStats(data.stats);
        setGrowth(data.growthData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  // Format growth data for chart (Persian short date)
  const chartData = growth.map((g) => {
    const d = new Date(g.date);
    const faDate = new Intl.DateTimeFormat("fa-IR", {
      month: "short",
      day: "numeric",
    }).format(d);
    return { date: faDate, count: g.count };
  });

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="کاربران" value={stats.users} color="chart-1" />
        <StatCard icon={FileText} label="پست‌ها" value={stats.posts} color="chart-2" />
        <StatCard icon={Briefcase} label="نیازمندی‌های باز" value={stats.openJobs} color="chart-3" />
        <StatCard icon={MessageCircle} label="پیام‌ها" value={stats.messages} color="chart-4" />
        <StatCard icon={Link2} label="ارتباطات" value={stats.connections} color="chart-5" />
        <StatCard icon={TicketIcon} label="تیکت‌ها" value={stats.tickets} color="warning" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="grid place-items-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">دسته‌بندی‌ها</div>
            <div className="text-xl font-bold nums-fa">{toFa(stats.categories)}</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="grid place-items-center w-11 h-11 rounded-xl bg-warning/10 text-warning">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">مهارت‌ها</div>
            <div className="text-xl font-bold nums-fa">{toFa(stats.skills)}</div>
          </div>
        </Card>
      </div>

      {/* Growth chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">رشد کاربران</h2>
            <p className="text-xs text-muted-foreground">ثبت‌نام روزانه در ۱۴ روز گذشته</p>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              style={{ fontSize: "11px" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              allowDecimals={false}
              style={{ fontSize: "11px" }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="count"
              type="monotone"
              stroke="var(--color-count)"
              strokeWidth={2}
              fill="url(#growthGradient)"
            />
          </AreaChart>
        </ChartContainer>
      </Card>
    </div>
  );
}
