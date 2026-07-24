"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  if (!user) return null;
  if (!profile) {
    return (
      <EmptyState
        title="پروفایل بارگذاری نشد"
        description="لطفاً دوباره تلاش کنید."
        action={<Button onClick={load}>تلاش مجدد</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">ویرایش پروفایل</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate({ view: "my-profile" })}>
          مشاهده پروفایل
        </Button>
      </div>

      <PhotosBioSection profile={profile} onUpdated={load} />
      <LocationSection profile={profile} onUpdated={load} />
      <CategoriesSection profile={profile} allCats={allCats} onUpdated={load} />
      <ExperienceSection profile={profile} allCats={allCats} onUpdated={load} />
      <EducationSection profile={profile} onUpdated={load} />
    </div>
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

  // Sync when profile reloads
  useEffect(() => {
    setAvatarUrl(profile.avatarUrl ?? "");
    setBannerUrl(profile.bannerUrl ?? "");
    setBioShort(profile.bioShort);
    setBioLong(profile.bioLong);
  }, [profile]);

  // Determine banner choice
  const isDefaultBanner = !bannerUrl || bannerUrl.startsWith("default");
  const defaultIdx = isDefaultBanner
    ? bannerUrl
      ? Number(bannerUrl.replace("default-", "")) - 1
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
    <Card className="p-5 md:p-6 space-y-5">
      <SectionTitle icon={ImageIcon} title="عکس‌ها و توضیحات" />

      {/* Banner preview */}
      <div className="space-y-2">
        <Label>پیش‌نمایش بنر</Label>
        <div className="h-28 md:h-32 rounded-xl overflow-hidden relative">
          {isDefaultBanner ? (
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br",
                BANNER_GRADIENTS[defaultIdx]
              )}
            />
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
          className="grid grid-cols-3 sm:grid-cols-6 gap-2"
        >
          {BANNER_GRADIENTS.map((g, i) => (
            <Label
              key={i}
              htmlFor={`banner-${i}`}
              className="cursor-pointer flex flex-col items-center gap-1"
            >
              <RadioGroupItem
                id={`banner-${i}`}
                value={`default-${i + 1}`}
                className="sr-only"
              />
              <div
                className={cn(
                  "h-10 w-full rounded-md bg-gradient-to-br border-2",
                  g,
                  isDefaultBanner && defaultIdx === i
                    ? "border-foreground"
                    : "border-transparent"
                )}
              />
              <span className="text-[10px] text-muted-foreground">{toFa(i + 1)}</span>
            </Label>
          ))}
          <Label htmlFor="banner-custom" className="cursor-pointer flex flex-col items-center gap-1">
            <RadioGroupItem id="banner-custom" value="custom" className="sr-only" />
            <div
              className={cn(
                "h-10 w-full rounded-md border-2 grid place-items-center bg-muted",
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
          />
        )}
      </div>

      {/* Avatar */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start">
        <div className="flex flex-col items-center gap-2">
          <Avatar className="w-24 h-24 rounded-2xl border-2 border-border">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-3xl font-bold">
              {profile.name?.charAt(0) || "؟"}
            </AvatarFallback>
          </Avatar>
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
          />
          <p className="text-[11px] text-muted-foreground">
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
        />
        <p className="text-[11px] text-muted-foreground text-left">
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
        />
        <p className="text-[11px] text-muted-foreground text-left">
          {toFa(bioLong.length)}/{toFa(4000)}
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5">
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
    <Card className="p-5 md:p-6 space-y-4">
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
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
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

      <div className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 p-3">
        <div className="flex items-start gap-2">
          <Phone className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">نمایش شماره تلفن</p>
            <p className="text-xs text-muted-foreground">
              {phoneVisible
                ? `شماره ${toFa(profile.phone || "")} برای بازدیدکنندگان قابل مشاهده است.`
                : "شماره تلفن شما در پروفایل عمومی پنهان است."}
            </p>
          </div>
        </div>
        <Switch checked={phoneVisible} onCheckedChange={setPhoneVisible} />
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5">
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

  // Compute available skills for "add skill" dialog
  const addSkillCat = profile.categories.find((c) => c.id === addSkillCatId);
  const addSkillCatFull = allCats.find((c) => c.id === addSkillCatId);
  const selectedSkillIds = new Set(addSkillCat?.skills.map((s) => s.id) ?? []);
  const availableSkills = (addSkillCatFull?.skills ?? []).filter(
    (s) => !selectedSkillIds.has(s.id)
  );

  return (
    <Card className="p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle icon={Hash} title="دسته‌بندی و مهارت‌ها" />
        <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={availableCats.length === 0}>
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
                  className="w-full text-right px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center justify-between"
                >
                  <span>{c.name}</span>
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {profile.categories.length === 0 ? (
        <EmptyState
          icon={Hash}
          title="هنوز تخصصی ثبت نشده"
          description="برای نمایش در پروفایل و انتشار پست، حداقل یک دسته‌بندی و مهارت اضافه کنید."
        />
      ) : (
        <div className="space-y-3">
          {profile.categories.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="font-bold text-sm">{c.name}</h4>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    onClick={() => setAddSkillCatId(c.id)}
                    disabled={busy}
                  >
                    <Plus className="w-3.5 h-3.5" /> مهارت
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
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
                      className="border-primary/30 text-primary gap-1 pr-1"
                    >
                      {s.name}
                      <button
                        onClick={() => removeSkill(s.id)}
                        disabled={busy}
                        className="grid place-items-center w-4 h-4 rounded-full hover:bg-destructive/15 hover:text-destructive"
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
          ))}
        </div>
      )}

      {/* Add Skill Dialog */}
      <Dialog
        open={!!addSkillCatId}
        onOpenChange={(o) => !o && setAddSkillCatId(null)}
      >
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
                  className="w-full text-right px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center justify-between"
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

  // Form state
  const [jobTitle, setJobTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");

  // Filter skills by selected category from user's already-selected cats.
  // We allow any category/skill that exists (admin-managed list).
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
    <Card className="p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle icon={Briefcase} title="سوابق کاری" />
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> افزودن
        </Button>
      </div>

      {profile.experiences.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="سابقه‌ای ثبت نشده"
          description="تجربه‌های کاری خود را اضافه کنید تا در رزومه‌ی شما نمایش داده شوند."
        />
      ) : (
        <div className="space-y-3">
          {profile.experiences.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border border-border p-3 flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm">
                  {e.jobTitle}{" "}
                  <span className="text-muted-foreground font-normal">@ {e.organization}</span>
                </p>
                {(e.startDate || e.endDate) && (
                  <p className="text-[11px] text-muted-foreground mt-0.5" dir="ltr">
                    {[e.startDate, e.endDate || "تاکنون"].filter(Boolean).join(" — ")}
                  </p>
                )}
                {e.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
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
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(e.id)}
                disabled={busy}
                aria-label="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
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
              />
            </div>
            <div className="space-y-2">
              <Label>نام سازمان *</Label>
              <Input
                placeholder="مثلاً: شرکت همتیم"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
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
                />
              </div>
              <div className="space-y-2">
                <Label>تاریخ پایان</Label>
                <Input
                  placeholder="خالی = تاکنون"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  dir="ltr"
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
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>دسته‌بندی (اختیاری)</Label>
                <Select
                  value={categoryId}
                  onValueChange={(v) => { setCategoryId(v); setSkillId(""); }}
                >
                  <SelectTrigger className="w-full">
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
                <Select
                  value={skillId}
                  onValueChange={setSkillId}
                  disabled={!categoryId}
                >
                  <SelectTrigger className="w-full">
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
            <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={submit} disabled={busy} className="gap-1.5">
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
    <Card className="p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle icon={GraduationCap} title="تحصیلات" />
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> افزودن
        </Button>
      </div>

      {profile.educations.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="تحصیلی ثبت نشده"
          description="آخرین مدرک تحصیلی خود را اضافه کنید."
        />
      ) : (
        <div className="space-y-3">
          {profile.educations.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border border-border p-3 flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm">{e.degree}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{e.institution}</p>
                {e.year && (
                  <p className="text-[11px] text-muted-foreground mt-0.5" dir="ltr">{toFa(e.year)}</p>
                )}
                {e.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(e.id)}
                disabled={busy}
                aria-label="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
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
              />
            </div>
            <div className="space-y-2">
              <Label>نام موسسه *</Label>
              <Input
                placeholder="مثلاً: دانشگاه تهران"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>سال فارغ‌التحصیلی</Label>
              <Input
                placeholder="مثلاً: ۱۴۰۲"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                rows={3}
                placeholder="زمینه تخصص، معدل یا دستاوردها..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={submit} disabled={busy} className="gap-1.5">
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
    <h2 className="text-sm font-bold flex items-center gap-1.5">
      <Icon className="w-4 h-4 text-primary" /> {title}
    </h2>
  );
}

function EditSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Card className="p-6 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-24 rounded-2xl" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </Card>
      <Card className="p-6 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </Card>
    </div>
  );
}
