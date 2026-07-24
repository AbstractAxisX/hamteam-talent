"use client";

import { useEffect, useState, useCallback } from "react";
import { api, apiDelete } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";
import { toFa, timeAgoFa, formatCount } from "@/lib/format";
import { navigate } from "@/lib/nav";
import {
  FileText,
  Briefcase,
  Trash2,
  Lock,
  Unlock,
  Heart,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type AdminPost = {
  id: string;
  content: string;
  createdAt: string;
  categoryName: string | null;
  likeCount: number;
  mediaCount: number;
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    isBanned: boolean;
    avatarUrl: string | null;
  };
};

type AdminJob = {
  id: string;
  title: string;
  description: string;
  status: string;
  province: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  categoryName: string | null;
  applicationCount: number;
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    isVerifiedBadge: boolean;
    isBanned: boolean;
    avatarUrl: string | null;
  };
};

export function ContentTab() {
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="posts" className="gap-1.5 flex-1 sm:flex-none">
          <FileText className="w-4 h-4" />
          پست‌ها
        </TabsTrigger>
        <TabsTrigger value="jobs" className="gap-1.5 flex-1 sm:flex-none">
          <Briefcase className="w-4 h-4" />
          نیازمندی‌ها
        </TabsTrigger>
      </TabsList>
      <TabsContent value="posts" className="mt-4">
        <PostsPanel />
      </TabsContent>
      <TabsContent value="jobs" className="mt-4">
        <JobsPanel />
      </TabsContent>
    </Tabs>
  );
}

function PostsPanel() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{
        posts: AdminPost[];
        total: number;
        pages: number;
      }>(`/api/admin/posts?page=${page}&limit=30`);
      setPosts(data.posts);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/admin/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast({ title: "پست حذف شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState icon={FileText} title="پستی موجود نیست" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">{toFa(total)} پست</div>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pr-4">محتوا</TableHead>
              <TableHead>نویسنده</TableHead>
              <TableHead>دسته</TableHead>
              <TableHead className="text-center">لایک</TableHead>
              <TableHead>تاریخ</TableHead>
              <TableHead className="pl-4 text-left">اقدام</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pr-4 max-w-xs">
                  <div className="text-sm line-clamp-2">{p.content}</div>
                  {p.mediaCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {toFa(p.mediaCount)} رسانه
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => navigate({ view: "profile", id: p.user.id })}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <UserAvatar
                      name={p.user.name}
                      avatarUrl={p.user.avatarUrl}
                      size="sm"
                    />
                    <span className="text-sm font-medium">{p.user.name}</span>
                  </button>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.categoryName ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Heart className="w-3 h-3 text-destructive" />
                    {toFa(p.likeCount)}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgoFa(p.createdAt)}
                </TableCell>
                <TableCell className="pl-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="حذف پست"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف پست</AlertDialogTitle>
                        <AlertDialogDescription>
                          این پست به‌همراه تمام لایک‌ها و رسانه‌های آن حذف خواهد شد.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(p.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            صفحه {toFa(page)} از {toFa(pages)}
          </div>
          <div className="flex gap-1">
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
    </div>
  );
}

function JobsPanel() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ jobs: AdminJob[] }>("/api/admin/jobs");
      setJobs(data.jobs);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/admin/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast({ title: "نیازمندی حذف شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleToggleStatus(j: AdminJob) {
    const next = j.status === "open" ? "closed" : "open";
    try {
      await api(`/api/admin/jobs/${j.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
        headers: { "Content-Type": "application/json" },
      });
      setJobs((prev) =>
        prev.map((x) => (x.id === j.id ? { ...x, status: next } : x))
      );
      toast({
        title: next === "open" ? "نیازمندی باز شد" : "نیازمندی بسته شد",
      });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState icon={Briefcase} title="نیازمندی‌ای موجود نیست" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">{toFa(jobs.length)} نیازمندی</div>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pr-4">عنوان</TableHead>
              <TableHead>صاحب</TableHead>
              <TableHead>دسته</TableHead>
              <TableHead className="text-center">وضعیت</TableHead>
              <TableHead className="text-center">درخواست</TableHead>
              <TableHead>تاریخ</TableHead>
              <TableHead className="pl-4 text-left">اقدامات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((j) => {
              const isOpen = j.status === "open";
              return (
                <TableRow key={j.id} className="cursor-pointer" onClick={() => navigate({ view: "job", id: j.id })}>
                  <TableCell className="pr-4 max-w-xs">
                    <div className="font-medium text-sm line-clamp-1">{j.title}</div>
                    {j.city && (
                      <div className="text-xs text-muted-foreground">
                        {j.city}
                      </div>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate({ view: "profile", id: j.user.id })}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <UserAvatar
                        name={j.user.name}
                        avatarUrl={j.user.avatarUrl}
                        verified={j.user.isVerifiedBadge}
                        size="sm"
                      />
                      <span className="text-sm font-medium">{j.user.name}</span>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {j.categoryName ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={isOpen ? "default" : "secondary"}
                      className={
                        isOpen
                          ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px]"
                          : "text-[10px]"
                      }
                    >
                      {isOpen ? "باز" : "بسته"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Send className="w-3 h-3 text-muted-foreground" />
                      {toFa(j.applicationCount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgoFa(j.createdAt)}
                  </TableCell>
                  <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleStatus(j)}
                        aria-label={isOpen ? "بستن" : "باز کردن"}
                        title={isOpen ? "بستن نیازمندی" : "باز کردن نیازمندی"}
                      >
                        {isOpen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف نیازمندی «{j.title}»؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              این عمل تمام درخواست‌های مرتبط را نیز حذف می‌کند.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(j.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// silence unused
void formatCount;
