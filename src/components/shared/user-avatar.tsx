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
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClass = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-24 h-24 text-3xl",
  }[size];
  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClass, "border border-border", className)}>
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary font-bold">
          {name?.charAt(0) || "؟"}
        </AvatarFallback>
      </Avatar>
      {verified && (
        <BadgeCheck
          className="absolute -bottom-0.5 -left-0.5 w-4 h-4 text-warning fill-background rounded-full"
          aria-label="تایید شده"
        />
      )}
    </div>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("w-4 h-4 text-warning fill-warning/20", className)}
      aria-label="تایید شده"
    />
  );
}
