"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TalentCardLarge } from "@/components/views/talents-view";
import type { CategoryWithSkills, TalentListItem } from "@/lib/types";
import { Sparkles, Users, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";

export function CategoryView({ id }: { id: string }) {
  const [cat, setCat] = useState<CategoryWithSkills | null>(null);
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(true);
  const [skillId, setSkillId] = useState("");

  useEffect(() => {
    setCatLoading(true);
    api<{ categories: CategoryWithSkills[] }>("/api/categories")
      .then((d) => {
        const found = d.categories.find((c) => c.id === id);
        setCat(found || null);
      })
      .catch(() => setCat(null))
      .finally(() => setCatLoading(false));
  }, [id]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ categoryId: id, sort: "followers" });
      if (skillId) params.set("skillId", skillId);
      const data = await api<{ talents: TalentListItem[] }>(
        `/api/talents?${params.toString()}`
      );
      setTalents(data.talents);
    } catch {
      setTalents([]);
    } finally {
      setLoading(false);
    }
  }, [id, skillId]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  if (catLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="flex gap-2 overflow-hidden">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!cat) {
    return (
      <EmptyState
        kind="generic"
        title="دسته‌بندی پیدا نشد"
        description="ممکن است حذف شده باشد یا آدرس اشتباه باشد."
        action={
          <Button
            onClick={() => navigate({ view: "discover" })}
            className="rounded-2xl font-bold"
          >
            بازگشت به کشف
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* ══════ Hero header — solid petrol-teal ══════ */}
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-6 sm:p-8 shadow-sm"
      >
        {/* Soft solid circles — NO gradients */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-primary-foreground/10 animate-float" />
        <div
          className="absolute -bottom-12 -right-8 w-32 h-32 rounded-full bg-accent/20 animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div className="relative flex items-center gap-4">
          <span className="grid place-items-center w-20 h-20 rounded-3xl bg-primary-foreground/15 text-5xl shrink-0">
            {cat.iconUrl || "✨"}
          </span>
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold truncate">
              {cat.name}
            </h1>
            <p className="text-sm text-primary-foreground/80 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-gold" />
                {toFa(cat.skills.length)} مهارت
              </span>
              <span className="text-primary-foreground/40">·</span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-4 h-4 text-gold" />
                {toFa(talents.length)} استعداد
              </span>
            </p>
          </div>
        </div>
      </motion.section>

      {/* ══════ Skill filter pills ══════ */}
      {cat.skills.length > 0 && (
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setSkillId("")}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold transition-all active:scale-95 shrink-0",
                !skillId
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              )}
            >
              همه
            </button>
            {cat.skills.map((s) => (
              <button
                key={s.id}
                onClick={() => setSkillId(s.id === skillId ? "" : s.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold transition-all active:scale-95 shrink-0",
                  skillId === s.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════ Back to discover ══════ */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ view: "discover" })}
          className="text-primary font-bold h-9"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          بازگشت به کشف
        </Button>
        {!loading && talents.length > 0 && (
          <span className="text-xs text-muted-foreground font-medium">
            {toFa(talents.length)} نتیجه
          </span>
        )}
      </div>

      {/* ══════ Results ══════ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : talents.length === 0 ? (
        <EmptyState
          kind="people"
          title="استعدادی در این دسته نیست"
          description={
            skillId
              ? "مهارت دیگه‌ای رو انتخاب کن یا بعداً سر بزن."
              : "بعداً سر بزن یا دسته‌ی دیگه‌ای رو امتحان کن."
          }
          action={
            skillId ? (
              <Button
                onClick={() => setSkillId("")}
                className="rounded-2xl font-bold"
              >
                نمایش همه
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {talents.map((t, i) => (
            <TalentCardLarge key={t.id} talent={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
