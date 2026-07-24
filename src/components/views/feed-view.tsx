"use client";

import { useEffect, useState, useCallback } from "react";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { PostWithRelations, CategoryWithSkills } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatCount } from "@/lib/format";
import { Heart, Loader2, MessageSquare, Share2, Sparkles, Flame, Clock, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedView() {
  const { user } = useUser();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ posts: PostWithRelations[] }>(`/api/posts?sort=${sort}`);
      setPosts(data.posts);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {user && <CreatePostBox onCreated={load} />}
      {!user && (
        <Card className="p-5 bg-gradient-to-l from-primary/5 to-transparent border-primary/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg">به همتیم خوش آمدید 👋</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                برای پست‌گذاری، تیم‌سازی و ارتباطات حرفه‌ای وارد شوید.
              </p>
            </div>
            <Button onClick={() => navigate({ view: "auth" })}>شروع کنید</Button>
          </div>
        </Card>
      )}

      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={sort === "recent" ? "default" : "outline"}
          size="sm"
          onClick={() => setSort("recent")}
          className="gap-1.5"
        >
          <Clock className="w-4 h-4" /> جدیدترین
        </Button>
        <Button
          variant={sort === "popular" ? "default" : "outline"}
          size="sm"
          onClick={() => setSort("popular")}
          className="gap-1.5"
        >
          <Flame className="w-4 h-4" /> محبوب‌ترین
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="هنوز پستی وجود ندارد"
          description="اولین پست را شما منتشر کنید و بحث را شروع کنید."
        />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onLike={() => load()} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePostBox({ onCreated }: { onCreated: () => void }) {
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [cats, setCats] = useState<{ id: string; name: string; skills: { id: string; name: string }[] }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    api<{ categories: { id: string; name: string; skills: { id: string; name: string }[] }[] }>(
      "/api/me/skills"
    ).then((d) => setCats(d.categories)).catch(() => {});
  }, []);

  const currentCat = cats.find((c) => c.id === categoryId);

  async function submit() {
    if (!content.trim() || !categoryId || !skillId) {
      toast({ title: "خطا", description: "متن، دسته‌بندی و مهارت را تکمیل کنید", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/posts", { content, categoryId, skillId });
      setContent("");
      setCategoryId("");
      setSkillId("");
      setFocused(false);
      toast({ title: "پست منتشر شد ✅" });
      onCreated();
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (cats.length === 0) {
    return (
      <Card className="p-4">
        <Textarea
          placeholder="برای پست‌گذاری ابتدا مهارت‌های خود را در پروفایل ثبت کنید..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          className="border-0 resize-none focus-visible:ring-0"
          rows={focused ? 4 : 2}
          id="create-post-trigger"
          onClick={() => navigate({ view: "edit-profile" })}
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground">ابتدا دسته و مهارت انتخاب کنید</p>
          <Button size="sm" variant="outline" onClick={() => navigate({ view: "edit-profile" })}>
            تکمیل پروفایل
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Textarea
          placeholder="چه چیزی در ذهن دارید؟ پروژه‌ای، همکاری، ایده..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          className="border-0 resize-none focus-visible:ring-0 bg-transparent"
          rows={focused ? 4 : 2}
          id="create-post-trigger"
        />
      </div>
      {focused && (
        <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSkillId(""); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={skillId} onValueChange={setSkillId} disabled={!categoryId}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="مهارت" />
              </SelectTrigger>
              <SelectContent>
                {currentCat?.skills.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" disabled>
              <ImageIcon className="w-4 h-4" /> افزودن تصویر (به‌زودی)
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{toFa(content.length)}/{toFa(2000)}</span>
              <Button size="sm" onClick={submit} disabled={submitting || !content.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "انتشار"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function PostCard({ post, onLike }: { post: PostWithRelations; onLike?: () => void }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liking, setLiking] = useState(false);

  async function toggleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    setLiking(true);
    try {
      await apiPost(`/api/posts/${post.id}/like`);
      onLike?.();
    } catch (e) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLiking(false);
    }
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate({ view: "profile", id: post.user.id })}>
          <UserAvatar name={post.user.name} avatarUrl={post.user.avatarUrl} verified={post.user.isVerifiedBadge} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => navigate({ view: "profile", id: post.user.id })}
              className="font-bold text-sm hover:underline"
            >
              {post.user.name}
            </button>
            {post.user.isVerifiedBadge && <span className="text-warning">✓</span>}
            <span className="text-xs text-muted-foreground">• {timeAgoFa(post.createdAt)}</span>
          </div>
          {(post.categoryName || post.skillName) && (
            <div className="flex items-center gap-1 mt-1">
              {post.categoryName && (
                <Badge variant="secondary" className="text-[10px] py-0 h-5">{post.categoryName}</Badge>
              )}
              {post.skillName && (
                <Badge variant="outline" className="text-[10px] py-0 h-5 border-primary/30 text-primary">{post.skillName}</Badge>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 whitespace-pre-wrap break-words">{post.content}</p>
      <div className="mt-3 flex items-center gap-1 -mx-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          disabled={liking}
          className={cn("gap-1.5 text-muted-foreground hover:text-destructive", liked && "text-destructive")}
        >
          <Heart className={cn("w-4 h-4", liked && "fill-current")} />
          {formatCount(likeCount)}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" disabled title="کامنت در فاز اول فعال نیست">
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" disabled>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
