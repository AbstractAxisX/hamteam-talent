"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { AdminUserItem } from "@/app/api/admin/users/route";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";
import { toFa, formatFaDate, formatFaDateTime } from "@/lib/format";
import { getProvinceName, PROVINCES } from "@/lib/geo";
import { navigate } from "@/lib/nav";
import {
  Search,
  Users as UsersIcon,
  MoreVertical,
  ExternalLink,
  BadgeCheck,
  Ban,
  CheckCircle2,
  X,
  Filter,
  Shield,
  Phone,
  IdCard,
  MapPin,
  FileText,
  Briefcase,
  Send,
  Link2,
  MessageCircle,
  Ticket as TicketIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AdminUserDetail = {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  role: string;
  isVerifiedBadge: boolean;
  isBanned: boolean;
  createdAt: string;
  profile: {
    id: string;
    bioShort: string;
    bioLong: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    province: string | null;
    city: string | null;
    phoneVisible: boolean;
  } | null;
  counts: {
    posts: number;
    jobPosts: number;
    applications: number;
    connections: number;
    conversations: number;
    tickets: number;
    followers: number;
    following: number;
  };
  categories: { id: string; name: string; iconUrl: string | null }[];
  skills: { id: string; name: string; categoryName: string }[];
  experiences: unknown[];
  educations: unknown[];
};

export function UsersTab() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [banned, setBanned] = useState("");
  const [verified, setVerified] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 320);
    return () => clearTimeout(t);
  }, [q]);

  // Load categories for filter
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    api<{ categories: { id: string; name: string }[] }>("/api/categories")
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (city) params.set("city", city);
      if (categoryId) params.set("categoryId", categoryId);
      if (banned) params.set("banned", banned);
      if (verified) params.set("verified", verified);
      params.set("page", String(page));
      params.set("limit", "20");
      const data = await api<{
        users: AdminUserItem[];
        total: number;
        pages: number;
      }>(`/api/admin/users?${params.toString()}`);
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, city, categoryId, banned, verified, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, city, categoryId, banned, verified]);

  const activeFilters =
    (city ? 1 : 0) + (categoryId ? 1 : 0) + (banned ? 1 : 0) + (verified ? 1 : 0);

  async function handleAction(u: AdminUserItem, action: "ban" | "unban" | "verify" | "unverify") {
    try {
      const res = await api(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
        headers: { "Content-Type": "application/json" },
      }) as { ok: boolean; user: { isBanned: boolean; isVerifiedBadge: boolean } };
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id
            ? {
                ...x,
                isBanned: res.user.isBanned,
                isVerifiedBadge: res.user.isVerifiedBadge,
              }
            : x
        )
      );
      toast({
        title: "عملیات انجام شد",
        description:
          action === "ban" ? "کاربر مسدود شد"
          : action === "unban" ? "مسدودیت لغو شد"
          : action === "verify" ? "تیک آبی اعطا شد"
          : "تیک آبی لغو شد",
      });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  function clearFilters() {
    setCity("");
    setCategoryId("");
    setBanned("");
    setVerified("");
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو بر اساس نام، تلفن یا کد ملی..."
            className="pr-9"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setShowFilters((s) => !s)}
        >
          <Filter className="w-4 h-4" />
          فیلترها
          {activeFilters > 0 && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-1">
              {toFa(activeFilters)}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">استان</Label>
            <Select
              value={city ? PROVINCES.find((p) => p.cities.includes(city))?.id ?? "" : ""}
              onValueChange={(v) => setCity("")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="همه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {PROVINCES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">شهر</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="نام شهر" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">دسته‌بندی</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="همه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">وضعیت</Label>
            <div className="flex gap-2">
              <Select value={banned} onValueChange={(v) => setBanned(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="مسدودیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="true">مسدود</SelectItem>
                  <SelectItem value="false">عادی</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verified} onValueChange={(v) => setVerified(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="تایید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="true">تاییدشده</SelectItem>
                  <SelectItem value="false">تاییدنشده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {activeFilters > 0 && (
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                <X className="w-4 h-4" />
                پاک کردن فیلترها
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="text-xs text-muted-foreground">
        {toFa(total)} کاربر یافت شد
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={UsersIcon}
            title="کاربری یافت نشد"
            description="با فیلترهای فعلی کاربری موجود نیست."
          />
        </Card>
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="pr-4">کاربر</TableHead>
                <TableHead>تماس</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead>محل</TableHead>
                <TableHead>عضویت</TableHead>
                <TableHead className="text-center">وضعیت</TableHead>
                <TableHead className="pl-4 text-left">اقدامات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => setDetailId(u.id)}
                >
                  <TableCell className="pr-4">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        name={u.name}
                        avatarUrl={u.avatarUrl}
                        verified={u.isVerifiedBadge}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{u.name}</div>
                        {u.bioShort && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {u.bioShort}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono" dir="ltr">
                    {toFa(u.phone)}
                  </TableCell>
                  <TableCell>
                    {u.role === "admin" ? (
                      <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/15 text-[10px]">
                        <Shield className="w-3 h-3" />
                        مدیر
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">کاربر</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.province ? (
                      <>
                        {getProvinceName(u.province)}
                        {u.city ? `، ${u.city}` : ""}
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatFaDate(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {u.isBanned && (
                        <Badge variant="destructive" className="text-[10px]">مسدود</Badge>
                      )}
                      {u.isVerifiedBadge && (
                        <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/15 text-[10px]">
                          تایید
                        </Badge>
                      )}
                      {!u.isBanned && !u.isVerifiedBadge && (
                        <span className="text-xs text-muted-foreground">عادی</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailId(u.id)}>
                          <ExternalLink className="w-4 h-4 ml-2" />
                          جزئیات کامل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ view: "profile", id: u.id })}>
                          <ExternalLink className="w-4 h-4 ml-2" />
                          مشاهده پروفایل
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!u.isVerifiedBadge ? (
                          <DropdownMenuItem onClick={() => handleAction(u, "verify")}>
                            <BadgeCheck className="w-4 h-4 ml-2" />
                            اعطای تیک آبی
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleAction(u, "unverify")}>
                            <BadgeCheck className="w-4 h-4 ml-2" />
                            لغو تیک آبی
                          </DropdownMenuItem>
                        )}
                        {!u.isBanned ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="w-full flex items-center px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-sm">
                                <Ban className="w-4 h-4 ml-2" />
                                مسدود کردن
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>مسدود کردن {u.name}؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  این کاربر دیگر نمی‌تواند وارد سیستم شود.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleAction(u, "ban")}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  مسدود کردن
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <DropdownMenuItem onClick={() => handleAction(u, "unban")}>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            رفع مسدودیت
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            صفحه {toFa(page)} از {toFa(pages)}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages || loading}
              className="gap-1"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User detail dialog */}
      <UserDetailDialog
        id={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        onAction={handleAction}
        users={users}
        setUsers={setUsers}
      />
    </div>
  );
}

function UserDetailDialog({
  id,
  onOpenChange,
  onAction,
  users,
  setUsers,
}: {
  id: string | null;
  onOpenChange: (open: boolean) => void;
  onAction: (u: AdminUserItem, action: "ban" | "unban" | "verify" | "unverify") => Promise<void>;
  users: AdminUserItem[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUserItem[]>>;
}) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      queueMicrotask(() => setDetail(null));
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    api<{ user: AdminUserDetail }>(`/api/admin/users/${id}`)
      .then((d) => {
        if (!cancelled) setDetail(d.user);
      })
      .catch((e) => toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const user = id ? users.find((u) => u.id === id) : null;

  async function handleAction(action: "ban" | "unban" | "verify" | "unverify") {
    if (!user) return;
    await onAction(user, action);
    // refresh detail
    if (id) {
      api<{ user: AdminUserDetail }>(`/api/admin/users/${id}`)
        .then((d) => setDetail(d.user))
        .catch(() => {});
    }
  }

  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto slim-scroll">
        <DialogHeader>
          <DialogTitle>جزئیات کاربر</DialogTitle>
          <DialogDescription>
            مشاهده و مدیریت کامل حساب کاربر
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !detail ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            اطلاعات یافت نشد
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <UserAvatar
                name={detail.name}
                avatarUrl={detail.profile?.avatarUrl ?? null}
                verified={detail.isVerifiedBadge}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold">{detail.name}</h3>
                  {detail.role === "admin" && (
                    <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/15">
                      <Shield className="w-3 h-3" />
                      مدیر
                    </Badge>
                  )}
                  {detail.isBanned && (
                    <Badge variant="destructive">مسدود</Badge>
                  )}
                </div>
                {detail.profile?.bioShort && (
                  <p className="text-sm text-muted-foreground mt-1">{detail.profile.bioShort}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-1.5"
                  onClick={() => navigate({ view: "profile", id: detail.id })}
                >
                  <ExternalLink className="w-4 h-4" />
                  مشاهده پروفایل عمومی
                </Button>
              </div>
            </div>

            {/* Contact + meta */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">موبایل</div>
                  <div className="font-mono" dir="ltr">{toFa(detail.phone)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                <IdCard className="w-4 h-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">کد ملی</div>
                  <div className="font-mono" dir="ltr">{toFa(detail.nationalId)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">موقعیت</div>
                  <div className="truncate">
                    {detail.profile?.province ? getProvinceName(detail.profile.province) : "—"}
                    {detail.profile?.city ? `، ${detail.profile.city}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">عضویت</div>
                  <div className="truncate">{formatFaDateTime(detail.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-4 gap-2">
              <CountTile icon={FileText} label="پست" value={detail.counts.posts} />
              <CountTile icon={Briefcase} label="نیازمندی" value={detail.counts.jobPosts} />
              <CountTile icon={Send} label="درخواست" value={detail.counts.applications} />
              <CountTile icon={Link2} label="ارتباط" value={detail.counts.connections} />
              <CountTile icon={MessageCircle} label="چت" value={detail.counts.conversations} />
              <CountTile icon={TicketIcon} label="تیکت" value={detail.counts.tickets} />
              <CountTile icon={UsersIcon} label="دنبال‌کننده" value={detail.counts.followers} />
              <CountTile icon={UsersIcon} label="دنبال‌شده" value={detail.counts.following} />
            </div>

            {/* Categories + skills */}
            {detail.categories.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  دسته‌بندی‌ها و مهارت‌ها
                </div>
                <div className="space-y-2">
                  {detail.categories.map((c) => {
                    const catSkills = detail.skills.filter((s) => s.categoryName === c.name);
                    return (
                      <div key={c.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
                        <span className="text-sm font-medium shrink-0">{c.iconUrl} {c.name}</span>
                        <div className="flex flex-wrap gap-1">
                          {catSkills.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            catSkills.map((s) => (
                              <Badge key={s.id} variant="secondary" className="text-[10px]">
                                {s.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {!detail.isVerifiedBadge ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                  onClick={() => handleAction("verify")}
                  disabled={detail.id === users.find((u) => u.role === "admin")?.id && detail.role === "admin"}
                >
                  <BadgeCheck className="w-4 h-4" />
                  اعطای تیک آبی
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleAction("unverify")}
                >
                  <BadgeCheck className="w-4 h-4" />
                  لغو تیک آبی
                </Button>
              )}
              {!detail.isBanned ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Ban className="w-4 h-4" />
                      مسدود کردن
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>مسدود کردن {detail.name}؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        این کاربر دیگر نمی‌تواند وارد سیستم شود.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleAction("ban")}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        مسدود کردن
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-success/40 text-success hover:bg-success/10 hover:text-success"
                  onClick={() => handleAction("unban")}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  رفع مسدودیت
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CountTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="p-2 rounded-md bg-muted/40 text-center">
      <Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
      <div className="text-sm font-bold nums-fa">{toFa(value)}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

// silence unused import in case tree-shaking removes it
void IdCard;
