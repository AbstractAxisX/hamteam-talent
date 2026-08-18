"use client";

import { useUser } from "@/lib/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { LandingView } from "@/components/views/landing-view";
import { DashboardView } from "@/components/views/dashboard-view";

export function FeedView() {
  const { user, loading: userLoading } = useUser();

  // Home page = LandingView for EVERYONE (guests + logged-in)
  // Dashboard is a SEPARATE route accessible from the dock/more menu
  if (!userLoading) return <LandingView />;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
