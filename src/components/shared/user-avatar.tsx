"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Default avatar SVGs — male (teal) and female (coral), solid colors
function DefaultAvatarSVG({ gender }: { gender?: string | null; name: string }) {
  const isFemale = gender === "female";
  const bg = isFemale ? "oklch(0.6 0.12 25)" : "oklch(0.4 0.05 200)";
  return (
    <div
      className="w-full h-full rounded-full grid place-items-center"
      style={{ backgroundColor: bg }}
    >
      {/* Simple person silhouette — no letter */}
      <svg viewBox="0 0 40 40" className="w-3/5 h-3/5 opacity-25" fill="white">
        <circle cx="20" cy="14" r="7" />
        <path d="M6 38c0-7.7 6.3-14 14-14s14 6.3 14 14" />
      </svg>
    </div>
  );
}

export function UserAvatar({
  name,
  avatarUrl,
  verified,
  gender,
  size = "md",
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  gender?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const sizeClass = {
    xs: "w-7 h-7 text-[10px]",
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-2xl",
    "2xl": "w-28 h-28 text-3xl",
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
    <div className={cn("relative inline-block shrink-0", className)}>
      <div className={cn("relative rounded-full overflow-hidden ring-2 ring-background", sizeClass)}>
        {avatarUrl ? (
          <Avatar className="w-full h-full border-0">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>
              <DefaultAvatarSVG gender={gender} name={name} />
            </AvatarFallback>
          </Avatar>
        ) : (
          <DefaultAvatarSVG gender={gender} name={name} />
        )}
      </div>
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
