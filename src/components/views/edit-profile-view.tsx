"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { ProfileDetail, CategoryWithSkills } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CategoryIcon } from "@/components/shared/illustrations";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";
import { PROVINCES } from "@/lib/geo";
import { toFa } from "@/lib/format";
import {
  Loader2,
  Plus,
  X,
  Briefcase,
  GraduationCap,
  Hash,
  MapPin,
  Image as ImageIcon,
  Save,
  Phone,
  Trash2,
  Lock,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const SECTIONS = [
  { key: "photos", label: "عکس‌ها و بیو" },
  { key: "location", label: "موقعیت" },
  { key: "categories", label: "دسته‌بندی و مهارت‌ها" },
  { key: "experience", label: "سوابق کاری" },
  { key: "education", label: "تحصیلات" },
] as const;

export function EditProfileView() {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCats, setAllCats] = useState<CategoryWithSkills[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api<ProfileDetail>("/api/profile/me"),
        api<{ categories: CategoryWithSkills[] }>("/api/categories"),
      ]);
      setProfile(p);
      setAllCats(c.categories);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      navigate({ view: "auth" });
      return;
    }
    load();
  }, [user, userLoading, load]);

  if (userLoading || loading) return <EditSkeleton />;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 text-center space-y-3 border-border/60 shadow-card">
          <div className="grid place-items-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg">برای ویرایش پروفایل وارد شوید</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            برای مدیریت پروفایل، مهارت‌ها و سوابق خود ابتدا وارد حساب کاربری خود شوید.
          </p>
          <Button
            onClick={() => navigate({ view: "auth" })}
            className="rounded-xl gap-1.5 mx-auto"
          >
            ورود / ثبت‌نام
          </Button>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          kind="generic"
          title="پروفایل بارگذاری نشد"
          description="لطفاً دوباره تلاش کنید."
          action={<Button onClick={load} className="rounded-xl">تلاش مجدد</Button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">ویرایش پروفایل</h1>
          <p className="text-xs text-muted-foreground mt-1">
            پروفایل خود را کامل کنید تا شبکه‌ی حرفه‌ای شما را پیدا کنند.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ view: "my-profile" })}
          className="rounded-xl gap-1.5 font-semibold"
        >
          مشاهده پروفایل
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Section quick-nav (mobile-friendly chips) */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.key}
            href={`#section-${s.key}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(`section-${s.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors font-medium"
          >
            {s.label}
          </a>
        ))}
      </div>

      <SectionWrapper id="section-photos" delay={0.05}>
        <PhotosBioSection profile={profile} onUpdated={load} />
      </SectionWrapper>
      <SectionWrapper id="section-location" delay={0.1}>
        <LocationSection profile={profile} onUpdated={load} />
      </SectionWrapper>
      <SectionWrapper id="section-categories" delay={0.15}>
        <CategoriesSection profile={profile} allCats={allCats} onUpdated={load} />
      </SectionWrapper>
      <SectionWrapper id="section-experience" delay={0.2}>
        <ExperienceSection profile={profile} allCats={allCats} onUpdated={load} />
      </SectionWrapper>
      <SectionWrapper id="section-education" delay={0.25}>
        <EducationSection profile={profile} onUpdated={load} />
      </SectionWrapper>
    </div>
  );
}

function SectionWrapper({
  id,
  delay,
  children,
}: {
  id: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Section 1: Photos + Bio ──────────────────────────────────────
function PhotosBioSection({
  profile,
  onUpdated,
}: {
  profile: ProfileDetail;
  onUpdated: () => void;
}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? "");
  const [bioShort, setBioShort] = useState(profile.bioShort);
  const [bioLong, setBioLong] = useState(profile.bioLong);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAvatarUrl(profile.avatarUrl ?? "");
    setBannerUrl(profile.bannerUrl ?? "");
    setBioShort(profile.bioShort);
    setBioLong(profile.bioLong);
  }, [profile]);

  const isDefaultBanner = !bannerUrl || bannerUrl.startsWith("default");
  const defaultIdx = isDefaultBanner
    ? bannerUrl
      ? Math.max(0, Number(bannerUrl.replace("default-", "")) - 1)
      : hashIdToIndex(profile.userId, BANNER_GRADIENTS.length)
    : 0;

  async function save() {
    setSaving(true);
    try {
      await apiPut("/api/profile/me", {
        avatarUrl: avatarUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
        bioShort,
        bioLong,
      });
      toast({ title: "ذخیره شد ✅" });
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5 md:p-6 space-y-5 border-border/60 shadow-card">
      <SectionTitle icon={ImageIcon} title="عکس‌ها و بیو" />

      {/* Banner preview */}
      <div className="space-y-2">
        <Label>پیش‌نمایش بنر</Label>
        <div className="h-28 md:h-32 rounded-2xl overflow-hidden relative border border-border/60">
          {isDefaultBanner ? (
            <div
              className="absolute inset-0"
              style={{ background: BANNER_GRADIENTS[defaultIdx] }}
            >
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_45%)]" />
            </div>
          ) : (
            <img src={bannerUrl} alt="بنر" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
        <RadioGroup
          value={isDefaultBanner ? `default-${defaultIdx + 1}` : "custom"}
          onValueChange={(v) => {
            if (v === "custom") {
              setBannerUrl("");
            } else {
              setBannerUrl(v);
            }
          }}
          className="grid grid-cols-3 sm:grid-cols-7 gap-2"
        >
          {BANNER_GRADIENTS.map((g, i) => (
            <Label
              key={i}
              htmlFor={`banner-${i}`}
              className="cursor-pointer flex flex-col items-center gap-1"
            >
              <RadioGroupItem id={`banner-${i}`} value={`default-${i + 1}`} className="sr-only" />
              <div
                className={cn(
                  "h-10 w-full rounded-lg border-2",
                  isDefaultBanner && defaultIdx === i ? "border-foreground" : "border-transparent"
                )}
                style={{ background: g }}
              />
              <span className="text-[10px] text-muted-foreground nums-fa">{toFa(i + 1)}</span>
            </Label>
          ))}
          <Label htmlFor="banner-custom" className="cursor-pointer flex flex-col items-center gap-1">
            <RadioGroupItem id="banner-custom" value="custom" className="sr-only" />
            <div
              className={cn(
                "h-10 w-full rounded-lg border-2 grid place-items-center bg-muted",
                !isDefaultBanner ? "border-foreground" : "border-transparent"
              )}
            >
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">سفارشی</span>
          </Label>
        </RadioGroup>
        {!isDefaultBanner && (
          <Input
            placeholder="آدرس تصویر بنر (URL)"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            dir="ltr"
            className="rounded-xl"
          />
        )}
      </div>

      {/* Avatar */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar
            name={profile.name}
            avatarUrl={avatarUrl}
            verified={profile.isVerifiedBadge}
            size="xl"
          />
          <span className="text-[11px] text-muted-foreground">پیش‌نمایش</span>
        </div>
        <div className="space-y-2 flex-1">
          <Label htmlFor="avatar-url">آدرس تصویر پروفایل</Label>
          <Input
            id="avatar-url"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            dir="ltr"
            className="rounded-xl"
          />
          <p className="text-[11px] text-muted-foreground leading-5">
            برای بهترین نتیجه تصویر مربعی با ابعاد حداقل ۲۰۰×۲۰۰ پیکسل.
          </p>
        </div>
      </div>

      {/* Bio Short */}
      <div className="space-y-2">
        <Label htmlFor="bio-short">معرفی کوتاه</Label>
        <Input
          id="bio-short"
          placeholder="مثلاً: توسعه‌دهنده فرانت‌اند و علاقه‌مند به طراحی محصول"
          value={bioShort}
          onChange={(e) => setBioShort(e.target.value.slice(0, 200))}
          maxLength={200}
          className="rounded-xl"
        />
        <p className="text-[11px] text-muted-foreground text-left nums-fa">
          {toFa(bioShort.length)}/{toFa(200)}
        </p>
      </div>

      {/* Bio Long */}
      <div className="space-y-2">
        <Label htmlFor="bio-long">درباره من</Label>
        <Textarea
          id="bio-long"
          placeholder="تجربه‌ها، علاقه‌مندی‌ها و آنچه می‌خواهید دیگران بدانند..."
          value={bioLong}
          onChange={(e) => setBioLong(e.target.value.slice(0, 4000))}
          rows={6}
          maxLength={4000}
          className="rounded-xl resize-none leading-7"
        />
        <p className="text-[11px] text-muted-foreground text-left nums-fa">
          {toFa(bioLong.length)}/{toFa(4000)}
        </p>
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={save} disabled={saving} className="gap-1.5 rounded-xl font-semibold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ذخیره
        </Button>
      </div>
    </Card>
  );
}

// ─── Section 2: Location ───────────────────────────────────────────
function LocationSection({
  profile,
  onUpdated,
}: {
  profile: ProfileDetail;
  onUpdated: () => void;
}) {
  const [province, setProvince] = useState(profile.province ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [phoneVisible, setPhoneVisible] = useState(profile.phoneVisible);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProvince(profile.province ?? "");
    setCity(profile.city ?? "");
    setPhoneVisible(profile.phoneVisible);
  }, [profile]);

  const provinceObj = PROVINCES.find((p) => p.id === province);
  const cities = provinceObj?.cities ?? [];

  async function save() {
    setSaving(true);
    try {
      await apiPut("/api/profile/me", {
        province: province || null,
        city: city || null,
        phoneVisible,
      });
      toast({ title: "ذخیره شد ✅" });
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5 md:p-6 space-y-4 border-border/60 shadow-card">
      <SectionTitle icon={MapPin} title="موقعیت و تماس" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>استان</Label>
          <Select
            value={province}
            onValueChange={(v) => {
              setProvince(v);
              setCity("");
            }}
          >
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="انتخاب استان" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>شهر</Label>
          <Select value={city} onValueChange={setCity} disabled={!province}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="انتخاب شهر" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 rounded-2xl bg-muted/40 p-4">
        <div className="flex items-start gap-2.5">
          <div className="grid place-items-center w-8 h-8 rounded-xl bg-primary/10 text-primary shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">نمایش شماره تلفن</p>
            <p className="text-xs text-muted-foreground leading-5 mt-0.5">
              {phoneVisible
                ? `شماره ${toFa(profile.phone || "")} برای بازدیدکنندگان قابل مشاهده است.`
                : "شماره تلفن شما در پروفایل عمومی پنهان است."}
            </p>
          </div>
        </div>
        <Switch checked={phoneVisible} onCheckedChange={setPhoneVisible} />
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={save} disabled={saving} className="gap-1.5 rounded-xl font-semibold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ذخیره
        </Button>
      </div>
    </Card>
  );
}

// ─── Section 3: Categories & Skills ───────────────────────────────
function CategoriesSection({
  profile,
  allCats,
  onUpdated,
}: {
  profile: ProfileDetail;
  allCats: CategoryWithSkills[];
  onUpdated: () => void;
}) {
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [addSkillCatId, setAddSkillCatId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedCatIds = new Set(profile.categories.map((c) => c.id));
  const availableCats = allCats.filter((c) => !selectedCatIds.has(c.id));

  async function addCategory(categoryId: string) {
    setBusy(true);
    try {
      await apiPost("/api/profile/me/categories", { categoryId });
      toast({ title: "دسته‌بندی اضافه شد ✅" });
      setAddCatOpen(false);
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function removeCategory(categoryId: string) {
    setBusy(true);
    try {
      await apiDelete(`/api/profile/me/categories/${categoryId}`);
      toast({ title: "حذف شد" });
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function addSkill(skillId: string) {
    if (!addSkillCatId) return;
    setBusy(true);
    try {
      await apiPost("/api/profile/me/skills", { skillId });
      toast({ title: "مهارت اضافه شد ✅" });
      setAddSkillCatId(null);
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function removeSkill(skillId: string) {
    setBusy(true);
    try {
      await apiDelete(`/api/profile/me/skills/${skillId}`);
      toast({ title: "حذف شد" });
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  const addSkillCat = profile.categories.find((c) => c.id === addSkillCatId);
  const addSkillCatFull = allCats.find((c) => c.id === addSkillCatId);
  const selectedSkillIds = new Set(addSkillCat?.skills.map((s) => s.id) ?? []);
  const availableSkills = (addSkillCatFull?.skills ?? []).filter(
    (s) => !selectedSkillIds.has(s.id)
  );

  return (
    <Card className="p-5 md:p-6 space-y-4 border-border/60 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle icon={Hash} title="دسته‌بندی و مهارت‌ها" />
        <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl font-semibold"
              disabled={availableCats.length === 0}
            >
              <Plus className="w-4 h-4" /> افزودن دسته‌بندی
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>افزودن دسته‌بندی</DialogTitle>
              <DialogDescription>
                یک دسته‌بندی تخصصی به پروفایل خود اضافه کنید.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-72 overflow-y-auto slim-scroll space-y-1 pr-1">
              {availableCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addCategory(c.id)}
                  disabled={busy}
                  className="w-full text-right px-3 py-2 rounded-lg hover:bg-accent text-sm flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CategoryIcon className="w-7 h-7 text-base" />
                    {c.name}
                  </span>
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {profile.categories.length === 0 ? (
        <EmptyState
          kind="generic"
          title="هنوز تخصصی ثبت نشده"
          description="برای نمایش در پروفایل و انتشار پست، حداقل یک دسته‌بندی و مهارت اضافه کنید."
        />
      ) : (
        <div className="space-y-3">
          {profile.categories.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="p-4 border-border/60 shadow-soft hover:shadow-lift transition-shadow">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <CategoryIcon className="w-7 h-7 text-base" />
                    {c.name}
                  </h4>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs rounded-lg font-semibold"
                      onClick={() => setAddSkillCatId(c.id)}
                      disabled={busy}
                    >
                      <Plus className="w-3.5 h-3.5" /> مهارت
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-rose rounded-lg"
                      onClick={() => removeCategory(c.id)}
                      disabled={busy}
                      aria-label="حذف دسته‌بندی"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {c.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {c.skills.map((s) => (
                      <Badge
                        key={s.id}
                        variant="outline"
                        className="border-primary/30 text-primary gap-1 pr-1 pl-2.5 py-1 rounded-md text-xs font-medium"
                      >
                        {s.name}
                        <button
                          onClick={() => removeSkill(s.id)}
                          disabled={busy}
                          className="grid place-items-center w-4 h-4 rounded-full hover:bg-rose/15 hover:text-rose transition-colors"
                          aria-label={`حذف ${s.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    هنوز مهارتی اضافه نشده. روی «مهارت» بزنید.
                  </p>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Skill Dialog */}
      <Dialog open={!!addSkillCatId} onOpenChange={(o) => !o && setAddSkillCatId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن مهارت{addSkillCat ? ` به ${addSkillCat.name}` : ""}</DialogTitle>
            <DialogDescription>مهارت‌هایی که به آن‌ها مسلط هستید را اضافه کنید.</DialogDescription>
          </DialogHeader>
          {availableSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              همه‌ی مهارت‌های این دسته را قبلاً اضافه کرده‌اید.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto slim-scroll space-y-1 pr-1">
              {availableSkills.map((s) => (
                <button
                  key={s.id}
                  onClick={() => addSkill(s.id)}
                  disabled={busy}
                  className="w-full text-right px-3 py-2 rounded-lg hover:bg-accent text-sm flex items-center justify-between transition-colors"
                >
                  <span>{s.name}</span>
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Section 4: Experience ────────────────────────────────────────
function ExperienceSection({
  profile,
  allCats,
  onUpdated,
}: {
  profile: ProfileDetail;
  allCats: CategoryWithSkills[];
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");

  const selectedCat = allCats.find((c) => c.id === categoryId);
  const skills = selectedCat?.skills ?? [];

  function resetForm() {
    setJobTitle("");
    setOrganization("");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setCategoryId("");
    setSkillId("");
  }

  async function submit() {
    if (!jobTitle.trim() || !organization.trim()) {
      toast({ title: "خطا", description: "عنوان شغلی و نام سازمان الزامی است", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await apiPost("/api/profile/me/experience", {
        jobTitle,
        organization,
        startDate: startDate || null,
        endDate: endDate || null,
        description,
        categoryId: categoryId || null,
        skillId: skillId || null,
      });
      toast({ title: "سابقه کاری اضافه شد ✅" });
      resetForm();
      setOpen(false);
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await apiDelete(`/api/profile/me/experience/${id}`);
      toast({ title: "حذف شد" });
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 md:p-6 space-y-4 border-border/60 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle icon={Briefcase} title="سوابق کاری" />
        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl font-semibold" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> افزودن
        </Button>
      </div>

      {profile.experiences.length === 0 ? (
        <EmptyState
          kind="generic"
          title="سابقه‌ای ثبت نشده"
          description="تجربه‌های کاری خود را اضافه کنید تا در رزومه‌ی شما نمایش داده شوند."
        />
      ) : (
        <div className="space-y-2.5">
          {profile.experiences.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-xl border border-border/60 p-3.5 flex items-start justify-between gap-2 hover:shadow-soft transition-shadow bg-card"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="grid place-items-center w-8 h-8 rounded-lg bg-brand-gradient-soft text-primary shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-sm">
                    {e.jobTitle}{" "}
                    <span className="text-muted-foreground font-normal">@ {e.organization}</span>
                  </p>
                </div>
                {(e.startDate || e.endDate) && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 nums-fa" dir="ltr">
                    {[e.startDate, e.endDate || "تاکنون"].filter(Boolean).join(" — ")}
                  </p>
                )}
                {e.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-5">{e.description}</p>
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
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose rounded-lg"
                onClick={() => remove(e.id)}
                disabled={busy}
                aria-label="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>افزودن سابقه کاری</DialogTitle>
            <DialogDescription>
              آخرین تجربه‌های مرتبط خود را ابتدا وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto slim-scroll pl-1">
            <div className="space-y-2">
              <Label>عنوان شغلی *</Label>
              <Input
                placeholder="مثلاً: توسعه‌دهنده ارشد فرانت‌اند"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>نام سازمان *</Label>
              <Input
                placeholder="مثلاً: شرکت همتیم"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاریخ شروع</Label>
                <Input
                  placeholder="مثلاً: ۱۴۰۲/۰۳"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  dir="ltr"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>تاریخ پایان</Label>
                <Input
                  placeholder="خالی = تاکنون"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  dir="ltr"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                rows={3}
                placeholder="خلاصه‌ای از دستاوردها و مسئولیت‌ها..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>دسته‌بندی (اختیاری)</Label>
                <Select
                  value={categoryId}
                  onValueChange={(v) => { setCategoryId(v); setSkillId(""); }}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="انتخاب..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allCats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مهارت (اختیاری)</Label>
                <Select value={skillId} onValueChange={setSkillId} disabled={!categoryId}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="انتخاب..." />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">انصراف</Button>
            <Button onClick={submit} disabled={busy} className="gap-1.5 rounded-xl font-semibold">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Section 5: Education ─────────────────────────────────────────
function EducationSection({
  profile,
  onUpdated,
}: {
  profile: ProfileDetail;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [degree, setDegree] = useState("");
  const [institution, setInstitution] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");

  function resetForm() {
    setDegree("");
    setInstitution("");
    setYear("");
    setDescription("");
  }

  async function submit() {
    if (!degree.trim() || !institution.trim()) {
      toast({ title: "خطا", description: "مدرک و نام موسسه الزامی است", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await apiPost("/api/profile/me/education", {
        degree,
        institution,
        year: year || null,
        description,
      });
      toast({ title: "تحصیلات اضافه شد ✅" });
      resetForm();
      setOpen(false);
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await apiDelete(`/api/profile/me/education/${id}`);
      toast({ title: "حذف شد" });
      onUpdated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 md:p-6 space-y-4 border-border/60 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle icon={GraduationCap} title="تحصیلات" />
        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl font-semibold" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> افزودن
        </Button>
      </div>

      {profile.educations.length === 0 ? (
        <EmptyState
          kind="generic"
          title="تحصیلی ثبت نشده"
          description="آخرین مدرک تحصیلی خود را اضافه کنید."
        />
      ) : (
        <div className="space-y-2.5">
          {profile.educations.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-xl border border-border/60 p-3.5 flex items-start justify-between gap-2 hover:shadow-soft transition-shadow bg-card"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="grid place-items-center w-8 h-8 rounded-lg bg-gold/15 text-gold shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-sm">{e.degree}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 pr-10">{e.institution}</p>
                {e.year && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 pr-10 nums-fa" dir="ltr">{toFa(e.year)}</p>
                )}
                {e.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-5 pr-10">{e.description}</p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose rounded-lg"
                onClick={() => remove(e.id)}
                disabled={busy}
                aria-label="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>افزودن تحصیلات</DialogTitle>
            <DialogDescription>آخرین تحصیلات خود را ابتدا وارد کنید.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>مدرک تحصیلی *</Label>
              <Input
                placeholder="مثلاً: کارشناسی ارشد مهندسی کامپیوتر"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>نام موسسه *</Label>
              <Input
                placeholder="مثلاً: دانشگاه تهران"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>سال فارغ‌التحصیلی</Label>
              <Input
                placeholder="مثلاً: ۱۴۰۲"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                dir="ltr"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                rows={3}
                placeholder="زمینه تخصص، معدل یا دستاوردها..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">انصراف</Button>
            <Button onClick={submit} disabled={busy} className="gap-1.5 rounded-xl font-semibold">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────
function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <h2 className="text-sm font-bold flex items-center gap-2">
      <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-4 h-4" />
      </span>
      {title}
    </h2>
  );
}

function EditSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-8 w-32 rounded" />
      </div>
      <Card className="p-6 space-y-4 border-border/60 shadow-card">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </Card>
      <Card className="p-6 space-y-3 border-border/60 shadow-card">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </Card>
    </div>
  );
}
