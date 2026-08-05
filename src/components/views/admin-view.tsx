/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost, apiDelete, apiPut } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toFa, formatFaDate, timeAgoFa } from "@/lib/format";
import { LogOut, Shield, Users, FolderTree, FileText, Megaphone, Loader2, Lock, Trash2, Check, X, Ban, BadgeCheck, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminInfo = { id: string; name: string; username: string } | null;

export function AdminView() {
  const [admin, setAdmin] = useState<AdminInfo>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setAdmin(d.admin || null);
        setLoading(false);
      })
      .catch(() => { setAdmin(null); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!admin) return <AdminLogin onLogin={setAdmin} />;

  return <AdminDashboard admin={admin} onLogout={async () => {
    await apiPost("/api/admin/auth/logout");
    setAdmin(null);
    toast({ title: "خارج شدید" });
  }} />;
}

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
      toast({ title: `خوش آمدید ${res.admin.name}` });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-forest-gradient p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Card className="p-6 shadow-xl">
          <div className="text-center mb-6">
            <div className="grid place-items-center w-16 h-16 rounded-2xl bg-forest text-lime mx-auto mb-3">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold">ورود ادمین</h1>
            <p className="text-xs text-muted-foreground mt-1">پنل مدیریت همتیم</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نام کاربری</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="h-11 rounded-xl"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">رمز عبور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl bg-forest hover:bg-forest/90" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4 ml-1" /> ورود</>}
            </Button>
          </form>
          <div className="mt-4 p-3 rounded-xl bg-muted/60 text-center">
            <p className="text-xs text-muted-foreground">دمو: <strong>admin</strong> / <strong>admin123</strong></p>
          </div>
          <button
            onClick={() => navigate({ view: "feed" })}
            className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground"
          >
            ← بازگشت به سایت
          </button>
        </Card>
      </motion.div>
    </div>
  );
}

function AdminDashboard({ admin, onLogout }: { admin: NonNullable<AdminInfo>; onLogout: () => void }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Simple header */}
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-forest text-lime">
              <Shield className="w-4 h-4" />
            </span>
            <span className="font-extrabold">پنل مدیریت</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium hidden sm:inline">{admin.name}</span>
            <Button size="sm" variant="ghost" onClick={onLogout} className="gap-1.5 text-muted-foreground">
              <LogOut className="w-4 h-4" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-5 w-full mb-6 h-auto rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg py-2 text-xs gap-1"><Megaphone className="w-3.5 h-3.5" /> <span className="hidden sm:inline">آمار</span></TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg py-2 text-xs gap-1"><Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">کاربران</span></TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg py-2 text-xs gap-1"><FolderTree className="w-3.5 h-3.5" /> <span className="hidden sm:inline">دسته‌ها</span></TabsTrigger>
            <TabsTrigger value="posts" className="rounded-lg py-2 text-xs gap-1"><FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">پست‌ها</span></TabsTrigger>
            <TabsTrigger value="broadcast" className="rounded-lg py-2 text-xs gap-1"><Megaphone className="w-3.5 h-3.5" /> <span className="hidden sm:inline">اعلان</span></TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="posts"><PostsTab /></TabsContent>
          <TabsContent value="broadcast"><BroadcastTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<{ users: number; posts: number; categories: number; tickets: number; connections: number; notifications: number } | null>(null);
  useEffect(() => {
    api<{ stats: any }>("/api/admin/stats").then((d) => setStats(d.stats)).catch(() => {});
  }, []);
  if (!stats) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  const items = [
    { label: "کاربران", value: stats.users, icon: Users },
    { label: "پست‌ها", value: stats.posts, icon: FileText },
    { label: "دسته‌بندی‌ها", value: stats.categories, icon: FolderTree },
    { label: "ارتباطات", value: stats.connections, icon: Users },
    { label: "اعلان‌ها", value: stats.notifications, icon: Megaphone },
    { label: "تیکت‌ها", value: stats.tickets, icon: FileText },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-lime/20 text-forest"><s.icon className="w-4 h-4" /></span>
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-extrabold nums-fa">{toFa(s.value)}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    api<{ users: any[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`).then((d) => setUsers(d.users)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function toggleBan(id: string, banned: boolean) {
    try {
      await apiPut(`/api/admin/users/${id}`, { action: banned ? "unban" : "ban" });
      toast({ title: banned ? "رفع مسدودیت" : "مسدود شد" });
      load();
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
  }
  async function toggleVerify(id: string, verified: boolean) {
    try {
      await apiPut(`/api/admin/users/${id}`, { action: verified ? "unverify" : "verify" });
      toast({ title: verified ? "تیک لغو شد" : "تیک اعطا شد" });
      load();
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی نام یا تلفن..." className="h-10 rounded-xl" onKeyDown={(e) => e.key === "Enter" && load()} />
        <Button onClick={load} size="sm" className="rounded-xl">جستجو</Button>
      </div>
      {loading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div> :
        users.length === 0 ? <EmptyState kind="people" title="کاربری پیدا نشد" /> :
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="p-3 flex items-center gap-3">
              <UserAvatar name={u.name} avatarUrl={u.avatarUrl} verified={u.isVerifiedBadge} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm truncate">{u.name}</p>
                  {u.isBanned && <Badge variant="destructive" className="text-[10px] h-5">مسدود</Badge>}
                </div>
                <p className="text-xs text-muted-foreground" dir="ltr">{u.phone}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => toggleVerify(u.id, u.isVerifiedBadge)} title={u.isVerifiedBadge ? "لغو تیک" : "اعطای تیک"}>
                  <BadgeCheck className={cn("w-4 h-4", u.isVerifiedBadge ? "text-gold" : "text-muted-foreground")} />
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => toggleBan(u.id, u.isBanned)} title={u.isBanned ? "رفع مسدودیت" : "مسدود کردن"}>
                  <Ban className={cn("w-4 h-4", u.isBanned ? "text-rose" : "text-muted-foreground")} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

function CategoriesTab() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState("");

  const load = () => {
    setLoading(true);
    api<{ categories: any[] }>("/api/categories").then((d) => setCats(d.categories)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function addCategory() {
    if (!newName.trim()) return;
    try {
      await apiPost("/api/admin/categories", { name: newName.trim(), iconUrl: newIcon.trim() || null });
      setNewName(""); setNewIcon("");
      toast({ title: "دسته‌بندی اضافه شد" });
      load();
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
  }
  async function deleteCategory(id: string) {
    if (!confirm("حذف این دسته و همه مهارت‌هایش؟")) return;
    try {
      await apiDelete(`/api/admin/categories/${id}`);
      toast({ title: "حذف شد" });
      load();
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
  }
  async function addSkill(catId: string) {
    if (!newSkill.trim()) return;
    try {
      await apiPost("/api/admin/skills", { categoryId: catId, name: newSkill.trim() });
      setNewSkill("");
      toast({ title: "مهارت اضافه شد" });
      load();
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
  }
  async function deleteSkill(id: string) {
    try {
      await apiDelete(`/api/admin/skills/${id}`);
      toast({ title: "حذف شد" });
      load();
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
  }

  if (loading) return <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <p className="text-xs font-bold mb-2">افزودن دسته‌بندی جدید</p>
        <div className="flex gap-2">
          <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="🎨" className="w-16 h-9 text-center rounded-xl" maxLength={4} />
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="نام دسته..." className="flex-1 h-9 rounded-xl" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
          <Button onClick={addCategory} size="sm" className="rounded-xl gap-1"><Plus className="w-4 h-4" /></Button>
        </div>
      </Card>
      <div className="space-y-2">
        {cats.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <div className="p-3 flex items-center gap-3">
              <span className="text-xl">{c.iconUrl || "📁"}</span>
              <span className="font-bold text-sm flex-1">{c.name}</span>
              <Badge variant="secondary" className="text-[10px]">{toFa(c.skills.length)} مهارت</Badge>
              <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                {expandedId === c.id ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="w-7 h-7 text-rose" onClick={() => deleteCategory(c.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            {expandedId === c.id && (
              <div className="px-3 pb-3 border-t border-border/50 pt-2 space-y-2 animate-fade-in">
                <div className="flex flex-wrap gap-1.5">
                  {c.skills.map((s: any) => (
                    <Badge key={s.id} variant="outline" className="gap-1 pr-1 py-1">
                      {s.name}
                      <button onClick={() => deleteSkill(s.id)} className="grid place-items-center w-4 h-4 rounded-full hover:bg-rose/10"><X className="w-3 h-3 text-rose" /></button>
                    </Badge>
                  ))}
                  {c.skills.length === 0 && <p className="text-xs text-muted-foreground">مهارتی ثبت نشده</p>}
                </div>
                <div className="flex gap-2">
                  <Input value={expandedId === c.id ? newSkill : ""} onChange={(e) => setNewSkill(e.target.value)} placeholder="نام مهارت..." className="h-8 text-sm rounded-lg" onKeyDown={(e) => e.key === "Enter" && addSkill(c.id)} />
                  <Button onClick={() => addSkill(c.id)} size="sm" className="h-8 rounded-lg gap-1"><Plus className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function PostsTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api<{ posts: any[] }>("/api/admin/posts").then((d) => setPosts(d.posts)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function deletePost(id: string) {
    if (!confirm("حذف این پست؟")) return;
    try {
      await apiDelete(`/api/admin/posts/${id}`);
      toast({ title: "پست حذف شد" });
      load();
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
  }

  if (loading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (posts.length === 0) return <EmptyState kind="posts" title="پستی وجود ندارد" />;

  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <Card key={p.id} className="p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-bold text-xs">{p.user?.name || "نامشخص"}</span>
                <span className="text-[10px] text-muted-foreground">{timeAgoFa(p.createdAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-5">{p.content}</p>
            </div>
            <Button size="icon" variant="ghost" className="w-7 h-7 text-rose shrink-0" onClick={() => deletePost(p.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function BroadcastTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!title.trim() || !body.trim()) {
      toast({ title: "عنوان و متن را پر کنید", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await apiPost<{ count: number }>("/api/admin/broadcast", { title: title.trim(), body: body.trim() });
      toast({ title: `اعلان به ${toFa(res.count)} کاربر ارسال شد` });
      setTitle(""); setBody("");
    } catch (e) { toast({ title: "خطا", description: (e as Error).message, variant: "destructive" }); }
    finally { setSending(false); }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-lime/20 text-forest"><Megaphone className="w-4 h-4" /></span>
          <h3 className="font-bold text-sm">اعلان سراسری</h3>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">عنوان</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: ویژگی جدید..." className="h-10 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">متن</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="متن اعلان..." className="rounded-xl min-h-[100px]" />
        </div>
        <Button onClick={send} className="w-full rounded-xl bg-forest hover:bg-forest/90" disabled={sending}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4 ml-1" />} ارسال به همه کاربران
        </Button>
      </Card>
    </div>
  );
}
