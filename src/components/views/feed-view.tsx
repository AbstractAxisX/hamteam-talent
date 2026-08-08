"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiPost } from "@/lib/api-client";
import { useUser } from "@/lib/use-user";
import { navigate } from "@/lib/nav";
import type { PostWithRelations, TalentListItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/shared/post-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LandingView } from "@/components/views/landing-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { toast } from "@/hooks/use-toast";
import { toFa, formatCount } from "@/lib/format";
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  X,
  UserPlus,
  ArrowLeft,
  Users,
  Compass,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MyCategory = {
  id: string;
  name: string;
  skills: { id: string; name: string }[];
};

type HomeFeed = {
  followedPosts: PostWithRelations[];
  relevantTalents: TalentListItem[];
  sameSkillPeople: TalentListItem[];
  followingCount: number;
};

export function FeedView() {
  const { user, loading: userLoading } = useUser();

  // ── Guests see the landing page ──
  if (!user && !userLoading) return <LandingView />;

  // ── Logged-in users see the dashboard ──
  if (user) return <DashboardView />;

  // Loading state
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
