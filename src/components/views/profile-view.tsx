"use client";

import { useEffect, useState, useCallback } from "react";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { ProfileDetail, PostWithRelations } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/views/feed-view";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount, formatFaDate } from "@/lib/format";
import { getProvinceName } from "@/lib/geo";
import {
  MapPin,
  Pencil,
  UserPlus,
  UserCheck,
  Clock,
  MessageCircle,
  FileText,
  Users,
  FileSignature,
  GraduationCap,
  Briefcase,
  Sparkles,
  Hash,
  Phone,
  CalendarDays,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 6 banner gradients (no blue/indigo)
const BANNER_GRADIENTS = [
  "from-emerald-500 via-emerald-600 to-teal-700",
  "from-amber-400 via-amber-500 to-orange-600",
  "from-rose-400 via-rose-500 to-pink-600",
  "from-teal-400 via-emerald-500 to-emerald-700",
  "from-fuchsia-500 via-rose-500 to-amber-500",
  "from-lime-400 via-emerald-500 to-teal-600",
];

function hashIdToIndex(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

export function ProfileView({ id }: { id: string }) {
  const { user: me } = useUser();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api<ProfileDetail>(`/api/profile/${id}`);
      setProfile(data);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("پیدا نشد") || msg.includes("404")) {
        setNotFound(true);
      } else {
        toast({ title: "خطا", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (notFound || !profile) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="کاربر پیدا نشد"
        description="این پروفایل ممکن است حذف شده باشد یا آدرس اشتباه باشد."
        action={<Button onClick={() => navigate({ view: "feed" })}>بازگشت به خانه</Button>}
      />
    );
  }

  const isSelf = me?.id === profile.userId;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
      <div className="space-y-4 min-w-0">
        <ProfileHeader
          profile={profile}
          isSelf={isSelf}
          onUpdated={load}
        />
        <ProfileTabs profile={profile} onUpdated={load} />
      </div>

      {/* Sidebar (desktop only, appears on the left in RTL = end side) */}
      <aside className="hidden lg:block lg:sticky lg:top-20 space-y-4">
        <QuickStatsCard profile={profile} />
        {profile.categories.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-primary" /> تخصص‌ها
            </h3>
            <div className="space-y-3">
              {profile.categories.map((c) => (
                <div key={c.id}>
                  <p className="text-xs font-medium text-foreground mb-1">{c.name}</p>
                  {c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.skills.map((s) => (
                        <Badge key={s.id} variant="secondary" className="text-[10px] h-5">
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
        {!isSelf && (
          <Card className="p-4">
            <h3 className="text-sm font-bold mb-3">دسترسی سریع</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => navigate({ view: "chat" })}
              >
                <MessageCircle className="w-4 h-4" /> شروع گفتگو
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => toast({ title: "قابلیت PDF به‌زودی" })}
              >
                <FileText className="w-4 h-4" /> دانلود رزومه PDF
              </Button>
            </div>
          </Card>
        )}
        {isSelf && (
          <Card className="p-4">
            <h3 className="text-sm font-bold mb-3">مدیریت پروفایل</h3>
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => navigate({ view: "edit-profile" })}
            >
              <Pencil className="w-4 h-4" /> ویرایش پروفایل
            </Button>
          </Card>
        )}
      </aside>
    </div>
  );
}

function ProfileHeader({
  profile,
  isSelf,
  onUpdated,
}: {
  profile: ProfileDetail;
  isSelf: boolean;
  onUpdated: () => void;
}) {
  const provinceName = getProvinceName(profile.province);
  const bannerIdx = hashIdToIndex(profile.userId, BANNER_GRADIENTS.length);
  const bannerUrl = profile.bannerUrl;
  const isDefaultBanner = !bannerUrl || bannerUrl.startsWith("default");

  return (
    <Card className="overflow-hidden p-0">
      {/* Banner */}
      <div className="relative h-40 md:h-56 w-full">
        {isDefaultBanner ? (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              BANNER_GRADIENTS[bannerIdx]
            )}
          >
            {/* subtle pattern overlay */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)]" />
          </div>
        ) : (
          <img
            src={bannerUrl!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {profile.isBanned && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-destructive/90 text-white text-xs font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> حساب مسدود
          </div>
        )}
      </div>

      {/* Avatar + identity */}
      <div className="px-4 md:px-6 pb-5 -mt-12 md:-mt-14">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Avatar */}
          <div className="relative inline-block shrink-0">
            <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-card rounded-2xl shadow-sm">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-3xl font-bold">
                {profile.name?.charAt(0) || "؟"}
              </AvatarFallback>
            </Avatar>
            {profile.isVerifiedBadge && (
              <span className="absolute -bottom-1 -left-1 bg-card rounded-full p-0.5">
                <VerifiedBadge className="w-6 h-6" />
              </span>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 md:pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                {profile.name}
              </h1>
              {profile.role === "admin" && (
                <Badge className="bg-warning/15 text-warning border-warning/30">
                  مدیر
                </Badge>
              )}
            </div>
            {profile.bioShort && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {profile.bioShort}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {(provinceName || profile.city) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[provinceName, profile.city].filter(Boolean).join("، ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                عضو از {formatFaDate(profile.createdAt)}
              </span>
              {profile.phone && (
                <span className="inline-flex items-center gap-1" dir="ltr">
                  <Phone className="w-3.5 h-3.5" />
                  {toFa(profile.phone)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 md:pb-1">
            {isSelf ? (
              <Button onClick={() => navigate({ view: "edit-profile" })} className="gap-1.5">
                <Pencil className="w-4 h-4" /> ویرایش پروفایل
              </Button>
            ) : (
              <>
                <ConnectionButton profile={profile} onUpdated={onUpdated} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate({ view: "chat" })}
                  aria-label="شروع گفتگو"
                  title="شروع گفتگو"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toast({ title: "قابلیت PDF به‌زودی" })}
                  aria-label="دانلود رزومه PDF"
                  title="دانلود رزومه PDF"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Counts row */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <button
            className="hover:underline text-right"
            onClick={() => navigate({ view: "connections" })}
          >
            <span className="font-bold">{formatCount(profile.followingCount)}</span>
            <span className="text-muted-foreground mr-1">دنبال‌شده</span>
          </button>
          <button
            className="hover:underline text-right"
            onClick={() => navigate({ view: "connections" })}
          >
            <span className="font-bold">{formatCount(profile.followersCount)}</span>
            <span className="text-muted-foreground mr-1">دنبال‌کننده</span>
          </button>
          <span className="text-muted-foreground">
            <span className="font-bold text-foreground">{formatCount(profile.postCount)}</span>
            <span className="mr-1">پست</span>
          </span>
        </div>
      </div>
    </Card>
  );
}

function ConnectionButton({
  profile,
  onUpdated,
}: {
  profile: ProfileDetail;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const status = profile.connectionStatus;

  async function handle() {
    if (status === "accepted") {
      toast({ title: "شما قبلاً متصل شده‌اید" });
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ status: string }>("/api/connections", {
        receiverId: profile.userId,
      });
      if (res.status === "accepted") {
        toast({ title: "ارتباط برقرار شد ✅" });
      } else if (res.status === "pending-sent") {
        toast({ title: "درخواست ارتباط ارسال شد 📨" });
      }
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  if (status === "accepted") {
    return (
      <Button variant="outline" onClick={handle} disabled className="gap-1.5">
        <UserCheck className="w-4 h-4 text-primary" /> متصل
      </Button>
    );
  }
  if (status === "pending-sent") {
    return (
      <Button variant="outline" onClick={handle} disabled className="gap-1.5">
        <Clock className="w-4 h-4" /> در انتظار پاسخ
      </Button>
    );
  }
  if (status === "pending-received") {
    return (
      <Button onClick={handle} disabled={busy} className="gap-1.5">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
        پذیرش درخواست
      </Button>
    );
  }
  return (
    <Button onClick={handle} disabled={busy} className="gap-1.5">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      دنبال کردن
    </Button>
  );
}

function ProfileTabs({
  profile,
  onUpdated: _onUpdated,
}: {
  profile: ProfileDetail;
  onUpdated: () => void;
}) {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="w-full grid grid-cols-3 h-10">
        <TabsTrigger value="about">درباره</TabsTrigger>
        <TabsTrigger value="resume">رزومه</TabsTrigger>
        <TabsTrigger value="posts">پست‌ها</TabsTrigger>
      </TabsList>

      <TabsContent value="about" className="mt-4 space-y-4">
        <AboutTab profile={profile} />
      </TabsContent>
      <TabsContent value="resume" className="mt-4 space-y-4">
        <ResumeTab profile={profile} />
      </TabsContent>
      <TabsContent value="posts" className="mt-4 space-y-4">
        <PostsTab userId={profile.userId} isSelf={profile.connectionStatus === "self"} />
      </TabsContent>
    </Tabs>
  );
}

function AboutTab({ profile }: { profile: ProfileDetail }) {
  const hasBio = profile.bioLong.trim().length > 0;
  const hasCategories = profile.categories.length > 0;

  if (!hasBio && !hasCategories) {
    return (
      <Card className="p-4">
        <EmptyState
          icon={Sparkles}
          title="هنوز توضیحاتی ثبت نشده"
          description="درباره‌ی تخصص، تجربه و علاقه‌مندی‌های خود بنویسید."
        />
      </Card>
    );
  }

  return (
    <>
      {hasBio && (
        <Card className="p-5">
          <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
            <FileSignature className="w-4 h-4 text-primary" /> درباره
          </h2>
          <p className="text-sm leading-7 whitespace-pre-wrap break-words text-foreground/90">
            {profile.bioLong}
          </p>
        </Card>
      )}

      {hasCategories && (
        <Card className="p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-primary" /> تخصص‌ها و مهارت‌ها
          </h2>
          <div className="space-y-4">
            {profile.categories.map((c) => (
              <div key={c.id}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">{c.name}</Badge>
                  <Separator className="flex-1" />
                </div>
                {c.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {c.skills.map((s) => (
                      <Badge
                        key={s.id}
                        variant="outline"
                        className="border-primary/30 text-primary text-xs"
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">مهارتی ثبت نشده</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function ResumeTab({ profile }: { profile: ProfileDetail }) {
  const hasExp = profile.experiences.length > 0;
  const hasEdu = profile.educations.length > 0;

  if (!hasExp && !hasEdu) {
    return (
      <Card className="p-4">
        <EmptyState
          icon={FileText}
          title="رزومه‌ای ثبت نشده"
          description="سوابق کاری و تحصیلی هنوز اضافه نشده‌اند."
        />
      </Card>
    );
  }

  return (
    <>
      {hasExp && (
        <Card className="p-5">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-primary" /> سوابق کاری
          </h2>
          <div className="space-y-5">
            {profile.experiences.map((e) => (
              <div key={e.id} className="relative pr-4 border-r-2 border-border last:border-transparent">
                <div className="absolute -right-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <h3 className="font-bold text-sm">
                    {e.jobTitle}{" "}
                    <span className="text-muted-foreground font-normal">
                      @ {e.organization}
                    </span>
                  </h3>
                  {(e.startDate || e.endDate) && (
                    <span className="text-[11px] text-muted-foreground" dir="ltr">
                      {[e.startDate, e.endDate || "تاکنون"].filter(Boolean).join(" — ")}
                    </span>
                  )}
                </div>
                {e.description && (
                  <p className="text-xs leading-6 mt-2 text-muted-foreground whitespace-pre-wrap">
                    {e.description}
                  </p>
                )}
                {(e.categoryName || e.skillName) && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {e.categoryName && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {e.categoryName}
                      </Badge>
                    )}
                    {e.skillName && (
                      <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">
                        {e.skillName}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {hasEdu && (
        <Card className="p-5">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-primary" /> تحصیلات
          </h2>
          <div className="space-y-4">
            {profile.educations.map((e) => (
              <div key={e.id} className="pr-4 border-r-2 border-border">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <h3 className="font-bold text-sm">{e.degree}</h3>
                  {e.year && (
                    <span className="text-[11px] text-muted-foreground" dir="ltr">
                      {toFa(e.year)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{e.institution}</p>
                {e.description && (
                  <p className="text-xs leading-6 mt-1 text-muted-foreground whitespace-pre-wrap">
                    {e.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function PostsTab({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  const [posts, setPosts] = useState<PostWithRelations[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ posts: PostWithRelations[] }>(`/api/posts?userId=${userId}`);
      setPosts(data.posts);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className="p-4">
        <EmptyState
          icon={FileText}
          title="پستی منتشر نشده"
          description={
            isSelf
              ? "پست‌های شما اینجا نمایش داده می‌شوند."
              : "این کاربر هنوز پستی منتشر نکرده است."
          }
          action={
            isSelf ? (
              <Button size="sm" onClick={() => navigate({ view: "feed" })}>
                رفتن به فید
              </Button>
            ) : undefined
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onLike={load} />
      ))}
    </div>
  );
}

function QuickStatsCard({ profile }: { profile: ProfileDetail }) {
  const stats = [
    { label: "پست", value: profile.postCount, icon: FileText },
    { label: "دنبال‌کننده", value: profile.followersCount, icon: Users },
    { label: "دنبال‌شده", value: profile.followingCount, icon: UserCheck },
    { label: "تخصص", value: profile.categories.length, icon: Hash },
  ];
  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold mb-3">آمار سریع</h3>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-lg bg-muted/50 p-3 flex flex-col items-center text-center"
            >
              <Icon className="w-4 h-4 text-primary mb-1" />
              <span className="text-lg font-extrabold nums-fa">{formatCount(s.value)}</span>
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <Skeleton className="h-40 md:h-56 w-full rounded-none" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4">
            <Skeleton className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-card" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <Skeleton className="h-9 w-full mb-3" />
        <Skeleton className="h-32 w-full" />
      </Card>
    </div>
  );
}
