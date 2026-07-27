"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
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
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { CategoryIcon } from "@/components/shared/illustrations";
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
  Loader2,
  Download,
  AlertTriangle,
} from "lucide-react";

/* Petrol + Saffron banner gradients (NO blue/indigo) */
const BANNER_GRADIENTS = [
  "linear-gradient(135deg, oklch(0.42 0.06 215) 0%, oklch(0.38 0.07 230) 100%)",
  "linear-gradient(135deg, oklch(0.72 0.16 75) 0%, oklch(0.62 0.17 55) 100%)",
  "linear-gradient(135deg, oklch(0.42 0.06 215) 0%, oklch(0.65 0.15 75) 100%)",
  "linear-gradient(135deg, oklch(0.62 0.2 15) 0%, oklch(0.72 0.16 75) 100%)",
  "linear-gradient(135deg, oklch(0.38 0.07 230) 0%, oklch(0.55 0.18 15) 100%)",
  "linear-gradient(135deg, oklch(0.55 0.1 195) 0%, oklch(0.42 0.06 215) 100%)",
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

  if (loading) return <ProfileSkeleton />;

  if (notFound || !profile) {
    return (
      <EmptyState
        kind="people"
        title="کاربر پیدا نشد"
        description="این پروفایل ممکن است حذف شده باشد یا آدرس اشتباه باشد."
        action={
          <Button onClick={() => navigate({ view: "feed" })} className="rounded-xl">
            بازگشت به خانه
          </Button>
        }
      />
    );
  }

  const isSelf = me?.id === profile.userId;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
      <div className="space-y-4 min-w-0">
        <ProfileHeader profile={profile} isSelf={isSelf} onUpdated={load} />
        <ProfileTabs profile={profile} isSelf={isSelf} />
      </div>

      {/* Sidebar (desktop only, appears on the left in RTL = end side) */}
      <aside className="hidden lg:block lg:sticky lg:top-20 space-y-4">
        <QuickStatsCard profile={profile} />

        {profile.categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="p-4 border-border/60 shadow-card">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-primary" /> تخصص‌ها
              </h3>
              <div className="space-y-3">
                {profile.categories.map((c) => (
                  <div key={c.id}>
                    <p className="text-xs font-semibold text-foreground mb-1.5">{c.name}</p>
                    {c.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.skills.map((s) => (
                          <Badge
                            key={s.id}
                            variant="secondary"
                            className="text-[10px] h-5 rounded-md font-medium"
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
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-4 border-border/60 shadow-card space-y-2">
            <h3 className="text-sm font-bold mb-2">دسترسی سریع</h3>
            {isSelf ? (
              <Button
                variant="default"
                size="sm"
                className="w-full justify-start gap-2 rounded-xl font-semibold"
                onClick={() => navigate({ view: "edit-profile" })}
              >
                <Pencil className="w-4 h-4" /> ویرایش پروفایل
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-xl font-semibold"
                  onClick={() => navigate({ view: "chat" })}
                >
                  <MessageCircle className="w-4 h-4" /> شروع گفتگو
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-xl font-semibold text-muted-foreground"
                  onClick={() => toast({ title: "قابلیت PDF به‌زودی" })}
                >
                  <Download className="w-4 h-4" /> دانلود رزومه PDF
                </Button>
              </>
            )}
          </Card>
        </motion.div>
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
  const isDefaultBanner = !profile.bannerUrl || profile.bannerUrl.startsWith("default");
  const defaultIdx = isDefaultBanner
    ? profile.bannerUrl
      ? Math.max(0, Number(profile.bannerUrl.replace("default-", "")) - 1)
      : hashIdToIndex(profile.userId, BANNER_GRADIENTS.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="overflow-hidden p-0 border-border/60 shadow-card">
        {/* Banner */}
        <div className="relative h-36 md:h-52 w-full">
          {isDefaultBanner ? (
            <div
              className="absolute inset-0"
              style={{ background: BANNER_GRADIENTS[defaultIdx] }}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_45%)]" />
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>
          ) : (
            <img
              src={profile.bannerUrl!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {profile.isBanned && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose/90 text-white text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> حساب مسدود
            </div>
          )}
        </div>

        {/* Identity row */}
        <div className="px-4 md:px-6 pb-5">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-14 md:-mt-16">
            {/* Avatar (overlaps banner; in RTL appears at start = right) */}
            <UserAvatar
              name={profile.name}
              avatarUrl={profile.avatarUrl}
              verified={profile.isVerifiedBadge}
              size="2xl"
              className="ring-4 ring-card rounded-3xl"
            />

            {/* Name + meta */}
            <div className="flex-1 min-w-0 md:pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                  {profile.name}
                </h1>
                {profile.role === "admin" && (
                  <Badge className="bg-gold/15 text-gold border border-gold/30 rounded-md gap-1">
                    <Sparkles className="w-3 h-3" /> مدیر
                  </Badge>
                )}
              </div>
              {profile.bioShort && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-6">
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
                {profile.phoneVisible && profile.phone && (
                  <span className="inline-flex items-center gap-1" dir="ltr">
                    <Phone className="w-3.5 h-3.5" />
                    {toFa(profile.phone)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 md:pb-2">
              {isSelf ? (
                <Button
                  variant="outline"
                  onClick={() => navigate({ view: "edit-profile" })}
                  className="gap-1.5 rounded-xl font-semibold"
                >
                  <Pencil className="w-4 h-4" /> ویرایش پروفایل
                </Button>
              ) : (
                <>
                  <ConnectionButton profile={profile} onUpdated={onUpdated} />
                  <Button
                    variant="outline"
                    onClick={() => navigate({ view: "chat" })}
                    className="gap-1.5 rounded-xl font-semibold"
                  >
                    <MessageCircle className="w-4 h-4" /> چت
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => toast({ title: "قابلیت PDF به‌زودی" })}
                    className="gap-1.5 rounded-xl font-semibold text-muted-foreground"
                  >
                    <Download className="w-4 h-4" /> رزومه
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Counts row */}
          <div className="flex items-center gap-5 mt-5 pt-4 border-t border-border/60 text-sm">
            <button
              className="hover:opacity-80 transition-opacity text-right"
              onClick={() => navigate({ view: "connections" })}
            >
              <span className="font-bold text-foreground nums-fa">
                {formatCount(profile.followingCount)}
              </span>
              <span className="text-muted-foreground mr-1">دنبال‌شده</span>
            </button>
            <button
              className="hover:opacity-80 transition-opacity text-right"
              onClick={() => navigate({ view: "connections" })}
            >
              <span className="font-bold text-foreground nums-fa">
                {formatCount(profile.followersCount)}
              </span>
              <span className="text-muted-foreground mr-1">دنبال‌کننده</span>
            </button>
            <span className="text-muted-foreground">
              <span className="font-bold text-foreground nums-fa">
                {formatCount(profile.postCount)}
              </span>
              <span className="mr-1">پست</span>
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
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
      <Button variant="outline" onClick={handle} disabled className="gap-1.5 rounded-xl font-semibold">
        <UserCheck className="w-4 h-4 text-primary" /> متصل
      </Button>
    );
  }
  if (status === "pending-sent") {
    return (
      <Button variant="outline" onClick={handle} disabled className="gap-1.5 rounded-xl font-semibold">
        <Clock className="w-4 h-4" /> در انتظار
      </Button>
    );
  }
  if (status === "pending-received") {
    return (
      <Button onClick={handle} disabled={busy} className="gap-1.5 rounded-xl font-semibold">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
        پذیرش درخواست
      </Button>
    );
  }
  return (
    <Button onClick={handle} disabled={busy} className="gap-1.5 rounded-xl font-semibold">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      دنبال کردن
    </Button>
  );
}

function ProfileTabs({
  profile,
  isSelf,
}: {
  profile: ProfileDetail;
  isSelf: boolean;
}) {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="w-full grid grid-cols-3 h-10 rounded-xl">
        <TabsTrigger value="about" className="rounded-lg font-semibold">درباره</TabsTrigger>
        <TabsTrigger value="resume" className="rounded-lg font-semibold">رزومه</TabsTrigger>
        <TabsTrigger value="posts" className="rounded-lg font-semibold">پست‌ها</TabsTrigger>
      </TabsList>

      <TabsContent value="about" className="mt-4 space-y-4">
        <AboutTab profile={profile} />
      </TabsContent>
      <TabsContent value="resume" className="mt-4 space-y-4">
        <ResumeTab profile={profile} />
      </TabsContent>
      <TabsContent value="posts" className="mt-4 space-y-4">
        <PostsTab userId={profile.userId} isSelf={isSelf} />
      </TabsContent>
    </Tabs>
  );
}

function AboutTab({ profile }: { profile: ProfileDetail }) {
  const hasBio = profile.bioLong.trim().length > 0;
  const hasCategories = profile.categories.length > 0;

  if (!hasBio && !hasCategories) {
    return (
      <Card className="p-4 border-border/60 shadow-card">
        <EmptyState
          kind="generic"
          title="هنوز توضیحاتی ثبت نشده"
          description="درباره‌ی تخصص، تجربه و علاقه‌مندی‌های خود بنویسید."
        />
      </Card>
    );
  }

  return (
    <>
      {hasBio && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5 border-border/60 shadow-card hover:shadow-lift transition-shadow duration-300">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
              <FileSignature className="w-4 h-4 text-primary" /> درباره
            </h2>
            <p className="text-sm leading-8 whitespace-pre-wrap break-words text-foreground/90">
              {profile.bioLong}
            </p>
          </Card>
        </motion.div>
      )}

      {hasCategories && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5 border-border/60 shadow-card hover:shadow-lift transition-shadow duration-300">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-primary" /> تخصص‌ها و مهارت‌ها
            </h2>
            <div className="space-y-5">
              {profile.categories.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <CategoryIcon className="w-7 h-7 text-base" />
                    <span className="font-bold text-sm">{c.name}</span>
                    <Separator className="flex-1" />
                  </div>
                  {c.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pr-9">
                      {c.skills.map((s) => (
                        <Badge
                          key={s.id}
                          variant="outline"
                          className="border-primary/30 text-primary text-xs rounded-md font-medium"
                        >
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground pr-9">مهارتی ثبت نشده</p>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </>
  );
}

function ResumeTab({ profile }: { profile: ProfileDetail }) {
  const hasExp = profile.experiences.length > 0;
  const hasEdu = profile.educations.length > 0;

  if (!hasExp && !hasEdu) {
    return (
      <Card className="p-4 border-border/60 shadow-card">
        <EmptyState
          kind="generic"
          title="رزومه‌ای ثبت نشده"
          description="سوابق کاری و تحصیلی هنوز اضافه نشده‌اند."
        />
      </Card>
    );
  }

  return (
    <>
      {hasExp && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5 border-border/60 shadow-card hover:shadow-lift transition-shadow duration-300">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-primary" /> سوابق کاری
            </h2>
            <div className="space-y-3">
              {profile.experiences.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="relative pr-4 border-r-2 border-border last:border-transparent pb-3 last:pb-0"
                >
                  <div className="absolute -right-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card" />
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h3 className="font-bold text-sm">
                      {e.jobTitle}{" "}
                      <span className="text-muted-foreground font-normal">@ {e.organization}</span>
                    </h3>
                    {(e.startDate || e.endDate) && (
                      <span className="text-[11px] text-muted-foreground nums-fa" dir="ltr">
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
                        <Badge variant="secondary" className="text-[10px] h-5 rounded-md">
                          {e.categoryName}
                        </Badge>
                      )}
                      {e.skillName && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 rounded-md border-primary/30 text-primary font-medium"
                        >
                          {e.skillName}
                        </Badge>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {hasEdu && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5 border-border/60 shadow-card hover:shadow-lift transition-shadow duration-300">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary" /> تحصیلات
            </h2>
            <div className="space-y-3">
              {profile.educations.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="relative pr-4 border-r-2 border-border last:border-transparent pb-3 last:pb-0"
                >
                  <div className="absolute -right-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold ring-4 ring-card" />
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h3 className="font-bold text-sm">{e.degree}</h3>
                    {e.year && (
                      <span className="text-[11px] text-muted-foreground nums-fa" dir="ltr">
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
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
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
          <Card key={i} className="p-4 space-y-3 border-border/60 shadow-card">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-32 rounded" />
                <Skeleton className="h-2.5 w-20 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className="p-4 border-border/60 shadow-card">
        <EmptyState
          kind="posts"
          title="پستی منتشر نشده"
          description={
            isSelf
              ? "پست‌های شما اینجا نمایش داده می‌شوند."
              : "این کاربر هنوز پستی منتشر نکرده است."
          }
          action={
            isSelf ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate({ view: "feed" })}
                className="rounded-xl gap-1.5"
              >
                <FileText className="w-4 h-4" /> رفتن به فید
              </Button>
            ) : undefined
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((p, i) => (
        <PostCard key={p.id} post={p} index={i} />
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="p-4 border-border/60 shadow-card">
        <h3 className="text-sm font-bold mb-3">آمار سریع</h3>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-xl bg-muted/50 p-3 flex flex-col items-center text-center hover:bg-muted transition-colors"
              >
                <Icon className="w-4 h-4 text-primary mb-1" />
                <span className="text-lg font-extrabold nums-fa">{formatCount(s.value)}</span>
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0 border-border/60 shadow-card">
        <Skeleton className="h-36 md:h-52 w-full rounded-none" />
        <div className="px-6 pb-6 -mt-14 md:-mt-16">
          <div className="flex items-end gap-4">
            <Skeleton className="w-28 h-28 rounded-3xl ring-4 ring-card" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
          <div className="flex gap-4 mt-5 pt-4 border-t border-border/60">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      </Card>
      <Card className="p-4 border-border/60 shadow-card">
        <Skeleton className="h-10 w-full mb-3 rounded-xl" />
        <Skeleton className="h-32 w-full rounded" />
      </Card>
    </div>
  );
}
