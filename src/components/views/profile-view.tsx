"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type {
  ProfileDetail,
  ProfileMeta,
  PostWithRelations,
  CategoryWithSkills,
} from "@/lib/types";
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
  Heart,
  Award,
  Star,
  VenusAndMars,
  Crown,
} from "lucide-react";

export function ProfileView({ id }: { id: string }) {
  const { user: me } = useUser();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [cats, setCats] = useState<CategoryWithSkills[]>([]);
  const [meta, setMeta] = useState<ProfileMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      // Fetch the profile and the categories list in parallel; the meta call
      // is best-effort (older API may not expose it, but our new endpoint
      // returns it cleanly).
      const [profileData, catsData] = await Promise.all([
        api<ProfileDetail>(`/api/profile/${id}`),
        api<{ categories: CategoryWithSkills[] }>("/api/categories").catch(
          () => ({ categories: [] as CategoryWithSkills[] })
        ),
      ]);
      setProfile(profileData);
      setCats(catsData.categories);

      // Best-effort meta fetch (supplementary: mainCategoryId + isTopTalent)
      api<ProfileMeta>(`/api/profile/${id}/meta`)
        .then(setMeta)
        .catch(() => setMeta(null));
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
          <Button
            onClick={() => navigate({ view: "feed" })}
            className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
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
        <ProfileHeader
          profile={profile}
          meta={meta}
          cats={cats}
          isSelf={isSelf}
          onUpdated={load}
        />
        <ProfileTabs profile={profile} isSelf={isSelf} />
      </div>

      {/* Sidebar (desktop only, appears on the left in RTL = end side) */}
      <aside className="hidden lg:block lg:sticky lg:top-20 space-y-4">
        <QuickStatsCard profile={profile} meta={meta} />

        {profile.categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="p-5 border-border/60 shadow-card">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-primary" /> تخصص‌ها
              </h3>
              <div className="space-y-3">
                {profile.categories.map((c) => {
                  const isMain =
                    meta?.mainCategoryId === c.id ||
                    (!meta?.mainCategoryId && c.id === profile.categories[0]?.id);
                  return (
                    <div key={c.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <CategoryIcon emoji={c.iconUrl} className="w-6 h-6 text-sm" />
                        <p className="text-xs font-bold text-foreground">{c.name}</p>
                        {isMain && (
                          <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] h-4 rounded-sm px-1 font-bold">
                            اصلی
                          </Badge>
                        )}
                      </div>
                      {c.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pr-8">
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
                        <p className="text-xs text-muted-foreground pr-8">مهارتی ثبت نشده</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5 border-border/60 shadow-card space-y-2">
            <h3 className="text-sm font-bold mb-2">دسترسی سریع</h3>
            {isSelf ? (
              <Button
                size="sm"
                className="w-full justify-start gap-2 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                onClick={() => navigate({ view: "edit-profile" })}
              >
                <Pencil className="w-4 h-4" /> ویرایش پروفایل
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                  onClick={async () => {
                    try {
                      const r = await apiPost<{ conversationId: string; status: string }>(
                        "/api/chat/start",
                        { userId: profile.userId }
                      );
                      if (r.status === "active") {
                        navigate({ view: "chat", conversationId: r.conversationId });
                      } else {
                        toast({
                          title: "درخواست پیام ارسال شد 📨",
                          description: "پس از تأیید طرف مقابل، گفتگو باز خواهد شد.",
                        });
                      }
                    } catch (e) {
                      toast({
                        title: "خطا",
                        description: (e as Error).message,
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <MessageCircle className="w-4 h-4" /> شروع گفتگو
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-2xl font-semibold text-muted-foreground"
                  onClick={() => window.open(`/api/resume/${profile.userId}`, "_blank")}
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
  meta,
  cats,
  isSelf,
  onUpdated,
}: {
  profile: ProfileDetail;
  meta: ProfileMeta | null;
  cats: CategoryWithSkills[];
  isSelf: boolean;
  onUpdated: () => void;
}) {
  const provinceName = getProvinceName(profile.province);
  const genderLabel =
    profile.gender === "male" ? "مرد" : profile.gender === "female" ? "زن" : null;

  // ─── Resolve the avatar ring color ─────────────────────────────────
  // Build a Map<categoryId, color> from the categories endpoint (which now
  // includes `color`). Then resolve the user's main category id: prefer
  // meta.mainCategoryId, fall back to the first category id the user has.
  const colorMap = new Map<string, string | null>();
  for (const c of cats) colorMap.set(c.id, c.color ?? null);

  const mainCatId =
    meta?.mainCategoryId ??
    profile.mainCategoryId ??
    profile.categories[0]?.id ??
    null;
  const mainCatColor = mainCatId ? colorMap.get(mainCatId) ?? null : null;
  const isTopTalent = meta?.isTopTalent ?? profile.isTopTalent ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* overflow-visible on Card so avatar can overlap banner; banner div clips itself */}
      <Card className="p-0 border-border/60 shadow-card overflow-visible rounded-2xl">
        {/* Banner — solid petrol-teal color OR uploaded image */}
        <div className="relative h-40 md:h-44 w-full rounded-t-2xl overflow-hidden bg-primary">
          {profile.bannerUrl && !profile.bannerUrl.startsWith("default") ? (
            <img
              src={profile.bannerUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              {/* Subtle radial highlight (not a gradient) */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_50%)]" />
              {/* Dotted pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </>
          )}
          {profile.isBanned && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose/90 text-white text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> حساب مسدود
            </div>
          )}
          {profile.isVerifiedBadge && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gold/95 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
              <Award className="w-3.5 h-3.5" /> تأیید شده
            </div>
          )}
          {isTopTalent && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gold/95 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
              <Crown className="w-3.5 h-3.5" /> استعداد برتر
            </div>
          )}
        </div>

        {/* Identity row */}
        <div className="px-4 md:px-6 pb-5">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-14 md:-mt-16">
            {/* Avatar with category color ring (wrapper div approach) */}
            <div className="relative shrink-0">
                <UserAvatar
                  name={profile.name}
                  avatarUrl={profile.avatarUrl}
                  verified={profile.isVerifiedBadge}
                  gender={profile.gender}
                  ringColor={mainCatColor}
                  size="2xl"
                />
              {/* Top-talent crown on the avatar (in addition to the banner badge) */}
              {isTopTalent && (
                <span className="absolute -top-2 -right-2 grid place-items-center w-9 h-9 rounded-full bg-gold text-white shadow-md ring-2 ring-background">
                  <Crown className="w-5 h-5" />
                </span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 md:pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                  {profile.name}
                </h1>
                {profile.isVerifiedBadge && (
                  <Badge className="bg-gold/15 text-gold border border-gold/30 rounded-md gap-1">
                    <Sparkles className="w-3 h-3" /> تأیید شده
                  </Badge>
                )}
                {isTopTalent && (
                  <Badge className="bg-gold/15 text-gold border border-gold/30 rounded-md gap-1">
                    <Crown className="w-3 h-3" /> استعداد برتر
                  </Badge>
                )}
                {genderLabel && (
                  <Badge
                    variant="outline"
                    className="rounded-md gap-1 border-primary/25 text-primary font-medium"
                  >
                    <VenusAndMars className="w-3 h-3" />
                    {genderLabel}
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
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {[provinceName, profile.city].filter(Boolean).join("، ")}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-primary" />
                  عضو از {formatFaDate(profile.createdAt)}
                </span>
                {profile.phoneVisible && profile.phone && (
                  <span className="inline-flex items-center gap-1" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-primary" />
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
                  className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-bold"
                >
                  <Pencil className="w-4 h-4" /> ویرایش پروفایل
                </Button>
              ) : (
                <>
                  <ConnectionButton profile={profile} onUpdated={onUpdated} />
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const r = await apiPost<{ conversationId: string; status: string }>(
                          "/api/chat/start",
                          { userId: profile.userId }
                        );
                        if (r.status === "active") {
                          navigate({ view: "chat", conversationId: r.conversationId });
                        } else {
                          toast({
                            title: "درخواست پیام ارسال شد 📨",
                            description: "پس از تأیید طرف مقابل، گفتگو باز خواهد شد.",
                          });
                        }
                      } catch (e) {
                        toast({
                          title: "خطا",
                          description: (e as Error).message,
                          variant: "destructive",
                        });
                      }
                    }}
                    className="gap-1.5 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-bold"
                  >
                    <MessageCircle className="w-4 h-4" /> پیام
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => window.open(`/api/resume/${profile.userId}`, "_blank")}
                    className="gap-1.5 rounded-2xl font-semibold text-muted-foreground"
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
              <span className="font-extrabold text-primary">
                {formatCount(profile.followingCount)}
              </span>
              <span className="text-muted-foreground mr-1">دنبال‌شده</span>
            </button>
            <button
              className="hover:opacity-80 transition-opacity text-right"
              onClick={() => navigate({ view: "connections" })}
            >
              <span className="font-extrabold text-primary">
                {formatCount(profile.followersCount)}
              </span>
              <span className="text-muted-foreground mr-1">دنبال‌کننده</span>
            </button>
            <span className="text-muted-foreground">
              <span className="font-extrabold text-primary">
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
      <Button
        onClick={handle}
        disabled
        className="gap-1.5 rounded-2xl bg-primary/15 text-primary border border-primary/40 font-bold"
      >
        <UserCheck className="w-4 h-4" /> متصل
      </Button>
    );
  }
  if (status === "pending-sent") {
    return (
      <Button
        variant="outline"
        onClick={handle}
        disabled
        className="gap-1.5 rounded-2xl border-gold/40 text-gold font-bold"
      >
        <Clock className="w-4 h-4" /> در انتظار
      </Button>
    );
  }
  if (status === "pending-received") {
    return (
      <Button
        onClick={handle}
        disabled={busy}
        className="gap-1.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
        پذیرش درخواست
      </Button>
    );
  }
  return (
    <Button
      onClick={handle}
      disabled={busy}
      className="gap-1.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm"
    >
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
      <TabsList className="w-full grid grid-cols-3 h-11 rounded-2xl bg-muted/60 p-1">
        <TabsTrigger
          value="about"
          className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          درباره
        </TabsTrigger>
        <TabsTrigger
          value="resume"
          className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          رزومه
        </TabsTrigger>
        <TabsTrigger
          value="posts"
          className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          پست‌ها
        </TabsTrigger>
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
  const genderLabel =
    profile.gender === "male" ? "مرد" : profile.gender === "female" ? "زن" : null;

  if (!hasBio && !hasCategories && !genderLabel) {
    return (
      <Card className="p-5 border-border/60 shadow-card">
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
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                <FileSignature className="w-4 h-4" />
              </span>
              درباره
            </h2>
            <p className="text-sm leading-8 whitespace-pre-wrap break-words text-foreground/90">
              {profile.bioLong}
            </p>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-5 border-border/60 shadow-card hover:shadow-lift transition-shadow duration-300">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-1.5">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
              <VenusAndMars className="w-4 h-4" />
            </span>
            اطلاعات کلی
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {genderLabel && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40">
                <VenusAndMars className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">جنسیت:</span>
                <span className="text-sm font-semibold">{genderLabel}</span>
              </div>
            )}
            {(getProvinceName(profile.province) || profile.city) && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">موقعیت:</span>
                <span className="text-sm font-semibold">
                  {[getProvinceName(profile.province), profile.city].filter(Boolean).join("، ")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">عضو از:</span>
              <span className="text-sm font-semibold">{formatFaDate(profile.createdAt)}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {hasCategories && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5 border-border/60 shadow-card hover:shadow-lift transition-shadow duration-300">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-1.5">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                <Hash className="w-4 h-4" />
              </span>
              تخصص‌ها و مهارت‌ها
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
                    <CategoryIcon emoji={c.iconUrl} className="w-8 h-8 text-base" />
                    <span className="font-bold text-sm">{c.name}</span>
                    <Separator className="flex-1" />
                  </div>
                  {c.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pr-10">
                      {c.skills.map((s) => (
                        <Badge
                          key={s.id}
                          className="bg-primary/10 text-primary border border-primary/20 text-xs rounded-md font-medium hover:bg-primary/20"
                        >
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground pr-10">مهارتی ثبت نشده</p>
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
      <Card className="p-5 border-border/60 shadow-card">
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
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                <Briefcase className="w-4 h-4" />
              </span>
              سوابق کاری
            </h2>
            <div className="space-y-3">
              {profile.experiences.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="relative pr-4 border-r-2 border-primary/30 last:border-transparent pb-3 last:pb-0"
                >
                  <div className="absolute -right-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card" />
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h3 className="font-bold text-sm">
                      {e.jobTitle}{" "}
                      <span className="text-muted-foreground font-normal">@ {e.organization}</span>
                    </h3>
                    {(e.startDate || e.endDate) && (
                      <span className="text-[11px] text-muted-foreground" dir="ltr">
                        {toFa([e.startDate, e.endDate || "تاکنون"].filter(Boolean).join(" — "))}
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
                        <Badge className="text-[10px] h-5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium">
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
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-gold/15 text-gold">
                <GraduationCap className="w-4 h-4" />
              </span>
              تحصیلات
            </h2>
            <div className="space-y-3">
              {profile.educations.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="relative pr-4 border-r-2 border-gold/40 last:border-transparent pb-3 last:pb-0"
                >
                  <div className="absolute -right-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold ring-4 ring-card" />
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
      <Card className="p-5 border-border/60 shadow-card">
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
                onClick={() => navigate({ view: "feed" })}
                className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-bold"
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

function QuickStatsCard({
  profile,
  meta,
}: {
  profile: ProfileDetail;
  meta: ProfileMeta | null;
}) {
  const isTopTalent = meta?.isTopTalent ?? profile.isTopTalent ?? false;
  const stats = [
    { label: "پست", value: profile.postCount, icon: FileText, tint: "bg-primary/10 text-primary" },
    { label: "دنبال‌کننده", value: profile.followersCount, icon: Users, tint: "bg-primary/10 text-primary" },
    { label: "دنبال‌شده", value: profile.followingCount, icon: UserCheck, tint: "bg-gold/15 text-gold" },
    { label: "تخصص", value: profile.categories.length, icon: Star, tint: "bg-rose/15 text-rose" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="p-5 border-border/60 shadow-card">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-rose" /> آمار سریع
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-2xl bg-muted/40 p-3 flex flex-col items-center text-center hover:bg-muted transition-colors"
              >
                <div className={`grid place-items-center w-8 h-8 rounded-lg ${s.tint} mb-1.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold">{formatCount(s.value)}</span>
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
              </div>
            );
          })}
        </div>

        {isTopTalent && (
          <div className="mt-3 p-3 rounded-2xl bg-gold/8 border border-gold/20 flex items-center gap-2">
            <Crown className="w-4 h-4 text-gold shrink-0" />
            <div>
              <p className="text-xs font-bold text-gold">استعداد برتر</p>
              <p className="text-[10px] text-gold/80 mt-0.5 leading-4">
                این کاربر توسط تیم همتیم تأیید شده است.
              </p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="overflow-visible p-0 border-border/60 shadow-card rounded-2xl">
        <Skeleton className="h-40 md:h-44 w-full rounded-none rounded-t-2xl" />
        <div className="px-6 pb-6 -mt-14 md:-mt-16">
          <div className="flex items-end gap-4">
            <Skeleton className="w-28 h-28 rounded-full ring-4 ring-card" />
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
        <Skeleton className="h-11 w-full mb-3 rounded-2xl" />
        <Skeleton className="h-32 w-full rounded" />
      </Card>
    </div>
  );
}
