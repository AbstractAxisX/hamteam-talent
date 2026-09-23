"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { navigate } from "@/lib/nav";
import { useUser } from "@/lib/use-user";
import type { PostWithRelations } from "@/lib/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/shared/icon";
import { MediaPlayer } from "@/components/shared/media-player";
import { RatingSummary, RatingModal } from "@/components/shared/rating-control";
import { FeatureButton } from "@/components/shared/feature-button";
import { ReportDialog } from "@/components/shared/report-dialog";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, formatCount, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   PostCard — کارت پست داخل پروفایل (نسخه بازطراحی‌شده)
   • رسانه (تصویر/ویدیو/صدا/سند) پشتیبانی می‌شود
   • امتیاز ۱..۱۰ ستاره + کامنت + اشتراک فعال‌اند → صفحه‌ی کامل پست باز می‌شود
   ════════════════════════════════════════════════════════════════════ */

function MediaBlock({ media }: { media: { id: string; url: string; type: string; fileName?: string | null; fileSize?: number }[] }) {
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
              alt={m.fileName || "رسانه پست"}
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
        <div
          key={m.id}
          className={cn(
            "rounded-2xl overflow-hidden border border-border/60 bg-muted/40",
            m.type === "video" ? "aspect-video max-h-[420px]" : m.type === "audio" ? "h-[76px]" : "h-[150px]"
          )}
        >
          <MediaPlayer file={{ url: m.url, type: m.type, fileName: m.fileName }} />
        </div>
      ))}
    </div>
  );
}

export function PostCard({ post, index = 0 }: { post: PostWithRelations; index?: number }) {
  const { user } = useUser();
  // امتیاز ستاره‌ای ۱..۱۰ — وضعیت محلی بعد از ثبت/ویرایش به‌روز می‌شود
  const [avg, setAvg] = useState(post.ratingAvg);
  const [ratingCount, setRatingCount] = useState(post.ratingCount);
  const [myScore, setMyScore] = useState<number | null>(post.myRating);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // رنگ فرد — دستهٔ اصلی کاربر (سقوط: رنگ دستهٔ پست)؛ رینگ و نوار بالا هم‌رنگ می‌شوند
  const userColor = post.user?.mainCategoryColor || post.categoryColor || null;

  function openDetail() {
    // مبدأ پروفایل — صفحه جزئیات پست، تعامل‌های کامل (امتیاز/کامنت) را دارد
    navigate({ view: "post", id: post.id, params: { from: "profile" } });
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
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2), ease: [0.16, 1, 0.3, 1] }}
    >
      <article className="relative bg-card rounded-[20px] overflow-hidden border border-border shadow-soft">
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
              gender={post.user.gender}
              size="md"
              frame={post.user.frame}
              ringColor={post.user.frame ? null : userColor || "var(--primary)"}
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

        {/* خلاصهٔ امتیاز — میانگین + تعداد رأی، زیر متن پست */}
        {ratingCount > 0 && (
          <div className="px-4 pb-1">
            <RatingSummary avg={avg} count={ratingCount} onClick={() => setRatingOpen(true)} />
          </div>
        )}

        {/* Media */}
        <MediaBlock media={post.media} />

        {/* Actions — امتیاز + کامنت + اشتراک + گزارش */}
        <div className="flex gap-2 px-3 pb-3 pt-1.5">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setRatingOpen(true)}
            className={cn(
              "flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-[12.5px] font-extrabold border transition-colors outline-none",
              myScore
                ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                : "text-muted-foreground bg-card border-border hover:bg-muted/70 hover:text-amber-700 dark:hover:text-amber-300"
            )}
            aria-label={myScore ? `ویرایش امتیاز ${toFa(myScore)} از ۱۰` : "ثبت امتیاز"}
          >
            <Icon name="star" size={16} strokeWidth={2} className={myScore ? "fill-amber-400 text-amber-500" : ""} />
            <span className="nums-fa">{myScore ? `${toFa(myScore)}/۱۰` : "امتیاز"}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={openDetail}
            className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-[12.5px] font-extrabold text-muted-foreground bg-card border border-border hover:bg-muted/70 hover:text-primary transition-colors outline-none"
            aria-label={`نظرات (${formatCount(post.commentCount)})`}
          >
            <Icon name="comment" size={16} strokeWidth={2} />
            <span className="tabular-nums">{formatCount(post.commentCount)}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={sharePost}
            className="h-11 px-4 rounded-full flex items-center justify-center text-[12.5px] font-extrabold text-muted-foreground bg-card border border-border hover:bg-muted/70 hover:text-primary transition-colors outline-none"
            aria-label="اشتراک‌گذاری"
          >
            <Icon name="share" size={16} strokeWidth={2} />
          </motion.button>

          {/* گزارش تخلف — مدیریت محتوا */}
          {user && user.id !== post.user.id && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setReportOpen(true)}
              className="h-11 w-11 shrink-0 rounded-full grid place-items-center text-muted-foreground bg-card border border-border hover:bg-rose/5 hover:text-rose hover:border-rose/30 transition-colors outline-none"
              aria-label="گزارش تخلف"
            >
              <Icon name="flag" size={15} strokeWidth={2} />
            </motion.button>
          )}
        </div>

        {/* ارسال به ویترین چهره برتر — فقط پست خودِ کاربرِ دارای قاب */}
        <FeatureButton
          postId={post.id}
          isFeatured={!!post.isFeatured}
          canFeature={!!post.canFeature}
          className="pt-0"
        />
      </article>

      {/* مودال امتیاز ۱ تا ۱۰ ستاره */}
      <RatingModal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        postId={post.id}
        initialScore={myScore}
        onSaved={({ avg: a, count: c, myScore: s }) => {
          setAvg(a);
          setRatingCount(c);
          setMyScore(s);
        }}
      />

      {/* دیالوگ گزارش تخلف */}
      <ReportDialog postId={post.id} open={reportOpen} onClose={() => setReportOpen(false)} />
    </motion.div>
  );
}
