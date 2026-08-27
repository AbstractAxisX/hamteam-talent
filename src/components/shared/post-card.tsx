"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import type { PostWithRelations } from "@/lib/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, formatCount, formatFaDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   PostCard — کارت پست داخل پروفایل (نسخه بازطراحی‌شده)
   • رسانه (تصویر/ویدیو/صدا/سند) پشتیبانی می‌شود
   • کامنت و اشتراک فعال‌اند → صفحه‌ی کامل پست باز می‌شود
   ════════════════════════════════════════════════════════════════════ */

function MediaBlock({ media }: { media: { id: string; url: string; type: string }[] }) {
  if (!media || media.length === 0) return null;

  const images = media.filter((m) => m.type === "image");
  const others = media.filter((m) => m.type !== "image");

  return (
    <div className="px-4 pb-3 space-y-2">
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-1.5 rounded-2xl overflow-hidden",
            images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          {images.slice(0, 4).map((m) => (
            <img
              key={m.id}
              src={m.url}
              alt="رسانه پست"
              loading="lazy"
              className={cn(
                "w-full object-cover bg-muted",
                images.length === 1 ? "max-h-[420px] rounded-2xl" : "h-36 rounded-xl"
              )}
            />
          ))}
        </div>
      )}
      {others.map((m) => (
        <a
          key={m.id}
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-2xl bg-muted/70 hover:bg-muted transition-colors"
          aria-label={`رسانه ${m.type}`}
        >
          <span className="grid place-items-center w-10 h-10 rounded-xl grad-brand text-white shrink-0">
            <Icon name={m.type === "audio" ? "music" : m.type === "video" ? "play" : "file"} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold truncate">
              {m.type === "audio" ? "فایل صوتی" : m.type === "video" ? "ویدیو" : "سند پیوست"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{(m as { fileName?: string }).fileName || m.url.split("/").pop()}</p>
          </div>
          <Icon name="download" size={16} className="text-muted-foreground shrink-0" />
        </a>
      ))}
    </div>
  );
}

export function PostCard({ post, index = 0 }: { post: PostWithRelations; index?: number }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liking, setLiking] = useState(false);
  const [likeBounce, setLikeBounce] = useState(false);

  function openDetail() {
    navigate({ view: "post", id: post.id });
  }

  async function toggleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    if (!wasLiked) {
      setLikeBounce(true);
      setTimeout(() => setLikeBounce(false), 600);
    }
    setLiking(true);
    try {
      await apiPost(`/api/posts/${post.id}/like`);
    } catch (e) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLiking(false);
    }
  }

  function sharePost() {
    const url = `${window.location.origin}/#/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ url, title: post.user.name }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast({ title: "لینک پست کپی شد" });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <article className="relative bg-card rounded-[24px] overflow-hidden border border-border/50 shadow-card">
        {/* خط گرادیانی امضای برند */}
        <div className="absolute top-0 inset-x-0 h-[3px] grad-brand opacity-80" />

        {/* Header */}
        <div className="p-4 pt-4 flex items-start gap-3">
          <button
            onClick={() => navigate({ view: "profile", id: post.user.id })}
            className="shrink-0"
            aria-label={`پروفایل ${post.user.name}`}
          >
            <UserAvatar
              name={post.user.name}
              avatarUrl={post.user.avatarUrl}
              verified={post.user.isVerifiedBadge}
              size="md"
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => navigate({ view: "profile", id: post.user.id })}
                className="font-extrabold text-[14.5px] hover:text-primary transition-colors truncate"
              >
                {post.user.name}
              </button>
              {post.user.isVerifiedBadge && (
                <Icon name="badgeCheck" size={14} className="text-gold fill-gold/15 shrink-0" />
              )}
              <span className="text-xs text-muted-foreground">· {timeAgoFa(post.createdAt)}</span>
            </div>
            {(post.categoryName || post.skillName) && (
              <div className="flex items-center gap-1.5 mt-1">
                {post.categoryName && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    {post.categoryName}
                  </span>
                )}
                {post.skillName && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary/25 text-primary">
                    {post.skillName}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content — کلیک روی متن پست → صفحه کامل پست */}
        <button onClick={openDetail} className="block w-full text-start px-4 pb-2" aria-label="مشاهده پست">
          <p className="text-[14px] leading-[1.9] whitespace-pre-wrap break-words line-clamp-6">
            {post.content}
          </p>
        </button>

        {/* Media */}
        <MediaBlock media={post.media} />

        {/* Actions — قرصی با فنر */}
        <div className="flex gap-2 px-3 pb-3 pt-1.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            onClick={toggleLike}
            disabled={liking}
            className={cn(
              "flex-1 h-10 rounded-full flex items-center justify-center gap-2 text-[12.5px] font-extrabold border transition-colors",
              liked
                ? "text-white bg-rose border-rose shadow-[0_6px_18px_rgba(225,29,72,0.35)]"
                : "text-muted-foreground bg-card border-border hover:bg-muted/70 hover:text-rose"
            )}
            aria-label="پسندیدن"
          >
            <motion.span
              animate={likeBounce ? { scale: [1, 1.5, 0.85, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Icon
                name="heart"
                size={17}
                className={liked ? "fill-white text-white" : ""}
                strokeWidth={2}
              />
            </motion.span>
            <span className="tabular-nums">{formatCount(likeCount)}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            onClick={openDetail}
            className="flex-1 h-10 rounded-full flex items-center justify-center gap-2 text-[12.5px] font-extrabold text-muted-foreground bg-card border border-border hover:bg-muted/70 hover:text-primary transition-colors"
            aria-label="نظرات"
          >
            <Icon name="comment" size={17} strokeWidth={2} />
            <span>نظرات</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            onClick={sharePost}
            className="h-10 px-4 rounded-full flex items-center justify-center text-[12.5px] font-extrabold text-muted-foreground bg-card border border-border hover:bg-muted/70 hover:text-primary transition-colors"
            aria-label="اشتراک‌گذاری"
          >
            <Icon name="share" size={17} strokeWidth={2} />
          </motion.button>
        </div>

        {/* تاریخ */}
        <div className="px-4 pb-3 text-[11px] text-muted-foreground/70">
          {formatFaDate(post.createdAt)}
        </div>
      </article>
    </motion.div>
  );
}
