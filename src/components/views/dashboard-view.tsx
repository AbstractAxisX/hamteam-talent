"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { navigate } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PostCard } from "@/components/shared/post-card";
import { EmptyState } from "@/components/shared/empty-state";
import { toFa, timeAgoFa, formatCount } from "@/lib/format";
import {
  Sparkles,
  Briefcase,
  Search,
  UserCheck,
  MessageCircle,
  Bell,
  Ticket,
  Settings,
  Plus,
  ArrowLeft,
  TrendingUp,
  Users,
  FileText,
  ChevronLeft,
} from "lucide-react";
import type { PostWithRelations, TalentListItem } from "@/lib/types";

type HomeData = {
  followedPosts: PostWithRelations[];
  relevantTalents: TalentListItem[];
  sameSkillPeople: TalentListItem[];
  followingCount: number;
};

export function DashboardView() {
  const { user } = useUser();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<HomeData>("/api/feed/home")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-sm text-muted-foreground">سلام 👋</p>
          <h1 className="text-xl font-extrabold">{user?.name}</h1>
        </div>
        <Button
          size="sm"
          onClick={() => navigate({ view: "create-need" })}
          className="gap-1.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> ثبت نیازمندی
        </Button>
      </motion.div>

      {/* Quick actions grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-2"
      >
        <QuickAction icon={Search} label="کشف" onClick={() => navigate({ view: "discover" })} />
        <QuickAction icon={Sparkles} label="استعدادها" onClick={() => navigate({ view: "talents" })} />
        <QuickAction icon={Briefcase} label="نیازمندی" onClick={() => navigate({ view: "needs" })} />
        <QuickAction icon={UserCheck} label="دنبال‌شده" onClick={() => navigate({ view: "following" })} />
      </motion.div>

      {/* Stats row */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          <StatCard icon={UserCheck} label="دنبال‌شده" value={data.followingCount} />
          <StatCard icon={TrendingUp} label="استعداد مرتبط" value={data.relevantTalents.length} />
          <StatCard icon={Users} label="هم‌مهارت" value={data.sameSkillPeople.length} />
        </motion.div>
      )}

      {/* Followed posts */}
      <Section
        title="پست‌های دنبال‌شوندگان"
        onMore={() => navigate({ view: "following" })}
        delay={0.15}
      >
        {data && data.followedPosts.length > 0 ? (
          <div className="space-y-3">
            {data.followedPosts.slice(0, 3).map((p, i) => (
              <PostCard key={p.id} post={p} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState
            kind="posts"
            title="هنوز پستی نیست"
            description="برای دیدن پست‌های دنبال‌شوندگان، ابتدا کسی را دنبال کنید."
            action={
              <Button size="sm" variant="outline" onClick={() => navigate({ view: "discover" })}>
                کشف استعدادها
              </Button>
            }
            className="py-6"
          />
        )}
      </Section>

      {/* Relevant talents */}
      {data && data.relevantTalents.length > 0 && (
        <Section title="استعدادهای مرتبط" delay={0.2}>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {data.relevantTalents.map((t, i) => (
              <TalentMiniCard key={t.id} talent={t} />
            ))}
          </div>
        </Section>
      )}

      {/* Same-skill people */}
      {data && data.sameSkillPeople.length > 0 && (
        <Section title="افراد هم‌مهارت" delay={0.25}>
          <div className="grid grid-cols-2 gap-2">
            {data.sameSkillPeople.slice(0, 4).map((t) => (
              <TalentGridCard key={t.id} talent={t} />
            ))}
          </div>
        </Section>
      )}

      {/* More actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-2"
      >
        <MoreCard icon={MessageCircle} label="چت‌ها" onClick={() => navigate({ view: "chat" })} />
        <MoreCard icon={Bell} label="اعلان‌ها" onClick={() => navigate({ view: "notifications" })} />
        <MoreCard icon={Briefcase} label="نیازمندی‌های من" onClick={() => navigate({ view: "my-needs" })} />
        <MoreCard icon={Ticket} label="تیکت‌ها" onClick={() => navigate({ view: "tickets" })} />
        <MoreCard icon={Settings} label="ویرایش پروفایل" onClick={() => navigate({ view: "edit-profile" })} />
        <MoreCard icon={Settings} label="تنظیمات" onClick={() => navigate({ view: "settings" })} />
      </motion.div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card border border-border hover:border-foreground/15 transition-all active:scale-95"
    >
      <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/8 text-primary">
        <Icon className="w-5 h-5" />
      </span>
      <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-3 border-border/60">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-extrabold nums-fa">{toFa(value)}</p>
    </Card>
  );
}

function Section({
  title,
  onMore,
  delay,
  children,
}: {
  title: string;
  onMore?: () => void;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-bold text-base">{title}</h2>
        {onMore && (
          <button onClick={onMore} className="flex items-center gap-0.5 text-xs text-primary font-bold">
            همه <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function TalentMiniCard({ talent }: { talent: TalentListItem }) {
  return (
    <button
      onClick={() => navigate({ view: "profile", id: talent.id })}
      className="shrink-0 w-36 p-3 rounded-2xl bg-card border border-border hover:border-foreground/15 transition-all active:scale-95 text-right"
    >
      <UserAvatar
        name={talent.name}
        avatarUrl={talent.avatarUrl}
        verified={talent.isVerifiedBadge}
        gender={talent.gender}
        size="md"
      />
      <p className="font-bold text-sm mt-2 truncate">{talent.name}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{talent.bioShort}</p>
      {talent.city && <p className="text-[10px] text-muted-foreground mt-1">{talent.city}</p>}
    </button>
  );
}

function TalentGridCard({ talent }: { talent: TalentListItem }) {
  return (
    <button
      onClick={() => navigate({ view: "profile", id: talent.id })}
      className="p-3 rounded-2xl bg-card border border-border hover:border-foreground/15 transition-all active:scale-95 text-right"
    >
      <div className="flex items-center gap-2.5">
        <UserAvatar
          name={talent.name}
          avatarUrl={talent.avatarUrl}
          verified={talent.isVerifiedBadge}
          gender={talent.gender}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs truncate">{talent.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{talent.bioShort}</p>
        </div>
      </div>
    </button>
  );
}

function MoreCard({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-card border border-border hover:border-foreground/15 transition-all active:scale-95"
    >
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-muted text-muted-foreground">
        <Icon className="w-4 h-4" />
      </span>
      <span className="font-bold text-sm">{label}</span>
      <ChevronLeft className="w-4 h-4 text-muted-foreground mr-auto" />
    </button>
  );
}
