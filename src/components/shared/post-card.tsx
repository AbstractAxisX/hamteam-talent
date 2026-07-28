"use client";

import { motion } from "framer-motion";
import { apiPost } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import type { PostWithRelations } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "@/hooks/use-toast";
import { timeAgoFa, toFa, formatCount } from "@/lib/format";
import { Heart, Share2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function PostCard({ post, index = 0 }: { post: PostWithRelations; index?: number }) {
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
    } catch (e) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLiking(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="overflow-hidden border-border/60 shadow-card hover:shadow-lift transition-shadow duration-300">
        {/* Header */}
        <div className="p-4 flex items-start gap-3">
          <button onClick={() => navigate({ view: "profile", id: post.user.id })} className="shrink-0">
            <UserAvatar name={post.user.name} avatarUrl={post.user.avatarUrl} verified={post.user.isVerifiedBadge} size="md" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => navigate({ view: "profile", id: post.user.id })}
                className="font-bold text-[15px] hover:text-primary transition-colors truncate"
              >
                {post.user.name}
              </button>
              <span className="text-xs text-muted-foreground">· {timeAgoFa(post.createdAt)}</span>
            </div>
            {(post.categoryName || post.skillName) && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {post.categoryName && (
                  <Badge variant="secondary" className="text-[10px] py-0 h-5 rounded-md font-medium">{post.categoryName}</Badge>
                )}
                {post.skillName && (
                  <Badge variant="outline" className="text-[10px] py-0 h-5 rounded-md border-primary/25 text-primary font-medium">{post.skillName}</Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-[15px] leading-8 whitespace-pre-wrap break-words">{post.content}</p>
        </div>

        {/* Actions */}
        <div className="px-2 py-2 border-t border-border/50 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLike}
            disabled={liking}
            className={cn(
              "gap-1.5 h-9 rounded-lg font-medium",
              liked ? "text-rose hover:text-rose" : "text-muted-foreground hover:text-rose"
            )}
          >
            <motion.span whileTap={{ scale: 1.4 }} transition={{ type: "spring", stiffness: 600 }}>
              <Heart className={cn("w-[18px] h-[18px]", liked && "fill-current")} />
            </motion.span>
            <span className="text-xs nums-fa">{formatCount(likeCount)}</span>
          </Button>
          <Button variant="ghost" size="sm" disabled title="کامنت در فاز اول فعال نیست" className="gap-1.5 h-9 rounded-lg text-muted-foreground">
            <MessageSquare className="w-[18px] h-[18px]" />
          </Button>
          <Button variant="ghost" size="sm" disabled className="gap-1.5 h-9 rounded-lg text-muted-foreground mr-auto">
            <Share2 className="w-[18px] h-[18px]" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
