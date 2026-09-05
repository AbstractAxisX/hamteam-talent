"use client";

import { useUser } from "@/lib/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { LandingView } from "@/components/views/landing-view";
import { HomeView } from "@/components/views/home-view";

/* ═══ صفحهٔ اول ═══
   · مهمان → «عمومی» (لندینگ عمومی: هیرو، بنرها، دسته‌ها…)
   · کاربر لاگین‌شده → «خانه» (فید شخصی لینکدینی: کامپوزر، پست همتیمی‌ها، پیشنهادها) */
export function FeedView() {
  const { user, loading: userLoading } = useUser();

  if (!userLoading) {
    return user ? <HomeView /> : <LandingView />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
