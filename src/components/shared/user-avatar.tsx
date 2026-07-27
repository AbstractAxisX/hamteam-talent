"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  avatarUrl,
  verified,
  size = "md",
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const sizeClass = {
    xs: "w-7 h-7 text-[10px]",
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-2xl",
    "2xl": "w-28 h-28 text-4xl",
  }[size];
  const badgeSize = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
    "2xl": "w-7 h-7",
  }[size];
  return (
    <div className="relative inline-block shrink-0">
      <Avatar className={cn(sizeClass, "ring-2 ring-background shadow-soft", className)}>
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="bg-brand-gradient-soft font-bold text-primary">
          {name?.charAt(0) || "؟"}
        </AvatarFallback>
      </Avatar>
      {verified && (
        <span className="absolute -bottom-0.5 -left-0.5 grid place-items-center rounded-full bg-background p-0.5">
          <BadgeCheck className={cn(badgeSize, "text-gold fill-gold/15")} />
        </span>
      )}
    </div>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return <BadgeCheck className={cn("w-4 h-4 text-gold fill-gold/15", className)} aria-label="تایید شده" />;
}
