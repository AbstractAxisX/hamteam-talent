"use client";

import { useEffect, useState, useCallback } from "react";
import { api, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import {
  LayoutGrid,
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type AdminCategory = {
  id: string;
  name: string;
  iconUrl: string | null;
  createdAt: string;
  skills: { id: string; name: string; categoryId: string }[];
  counts: { posts: number; jobPosts: number; users: number };
};

export function CategoriesTab() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Add category dialog state
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);

  // Edit category inline state
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");

  // Add skill state
  const [addSkillFor, setAddSkillFor] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [submittingSkill, setSubmittingSkill] = useState(false);

  // Edit skill state
  const [editSkillId, setEditSkillId] = useState<string | null>(null);
  const [editSkillName, setEditSkillName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ categories: AdminCategory[] }>("/api/admin/categories");
      setCategories(data.categories);
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateCategory() {
    const name = newCatName.trim();
    if (name.length < 1) {
      toast({ title: "خطا", description: "نام خالی است", variant: "destructive" });
      return;
    }
    setSubmittingCat(true);
    try {
      const res = await apiPost<{
        ok: boolean;
        category: AdminCategory;
      }>("/api/admin/categories", { name, iconUrl: newCatIcon.trim() || null });
      setCategories((prev) => [...prev, res.category].sort((a, b) => a.name.localeCompare(b.name)));
      setAddCatOpen(false);
      setNewCatName("");
      setNewCatIcon("");
      toast({ title: "دسته‌بندی ایجاد شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmittingCat(false);
    }
  }

  async function handleUpdateCategory(id: string) {
    const name = editCatName.trim();
    if (name.length < 1) {
      toast({ title: "خطا", description: "نام خالی است", variant: "destructive" });
      return;
    }
    try {
      const res = await apiPut<{ ok: boolean; category: { id: string; name: string; iconUrl: string | null } }>(
        `/api/admin/categories/${id}`,
        { name, iconUrl: editCatIcon.trim() || null }
      );
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, name: res.category.name, iconUrl: res.category.iconUrl } : c
        )
      );
      setEditCatId(null);
      toast({ title: "دسته‌بندی به‌روزرسانی شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await apiDelete(`/api/admin/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "دسته‌بندی حذف شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleCreateSkill(categoryId: string) {
    const name = newSkillName.trim();
    if (name.length < 1) {
      toast({ title: "خطا", description: "نام خالی است", variant: "destructive" });
      return;
    }
    setSubmittingSkill(true);
    try {
      const res = await apiPost<{ ok: boolean; skill: { id: string; name: string; categoryId: string } }>(
        "/api/admin/skills",
        { categoryId, name }
      );
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, skills: [...c.skills, res.skill].sort((a, b) => a.name.localeCompare(b.name)) }
            : c
        )
      );
      setNewSkillName("");
      toast({ title: "مهارت اضافه شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmittingSkill(false);
    }
  }

  async function handleUpdateSkill(skillId: string, categoryId: string) {
    const name = editSkillName.trim();
    if (name.length < 1) return;
    try {
      const res = await apiPut<{ ok: boolean; skill: { id: string; name: string; categoryId: string } }>(
        `/api/admin/skills/${skillId}`,
        { name }
      );
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                skills: c.skills
                  .map((s) => (s.id === skillId ? { ...s, name: res.skill.name } : s))
                  .sort((a, b) => a.name.localeCompare(b.name)),
              }
            : c
        )
      );
      setEditSkillId(null);
      toast({ title: "مهارت به‌روزرسانی شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  async function handleDeleteSkill(skillId: string, categoryId: string) {
    try {
      await apiDelete(`/api/admin/skills/${skillId}`);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, skills: c.skills.filter((s) => s.id !== skillId) }
            : c
        )
      );
      toast({ title: "مهارت حذف شد" });
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          مدیریت دسته‌بندی‌ها و مهارت‌ها ({toFa(categories.length)} دسته)
        </div>
        <Button onClick={() => setAddCatOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          دسته‌بندی جدید
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={LayoutGrid}
            title="دسته‌بندی‌ای موجود نیست"
            description="اولین دسته‌بندی را ایجاد کنید."
            action={
              <Button onClick={() => setAddCatOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                ایجاد دسته
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((c) => {
            const isEditing = editCatId === c.id;
            const isAddingSkill = addSkillFor === c.id;
            return (
              <Card key={c.id} className="p-4">
                {/* Category header */}
                <div className="flex items-start justify-between gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editCatIcon}
                        onChange={(e) => setEditCatIcon(e.target.value)}
                        placeholder="آیکن (اختیاری)"
                        className="w-16 text-center"
                        maxLength={4}
                      />
                      <Input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-success"
                        onClick={() => handleUpdateCategory(c.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditCatId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        {c.iconUrl && (
                          <span className="text-xl shrink-0">{c.iconUrl}</span>
                        )}
                        <h3 className="font-semibold truncate">{c.name}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditCatId(c.id);
                            setEditCatName(c.name);
                            setEditCatIcon(c.iconUrl ?? "");
                          }}
                          aria-label="ویرایش"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              aria-label="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف دسته‌بندی «{c.name}»؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                این عمل تمام مهارت‌های زیرمجموعه، پست‌ها و نیازمندی‌های مرتبط را تحت تاثیر قرار می‌دهد.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>انصراف</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(c.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>

                {/* Counts */}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span>{toFa(c.skills.length)} مهارت</span>
                  <span>·</span>
                  <span>{toFa(c.counts.posts)} پست</span>
                  <span>·</span>
                  <span>{toFa(c.counts.jobPosts)} نیازمندی</span>
                  <span>·</span>
                  <span>{toFa(c.counts.users)} کاربر</span>
                </div>

                <Separator className="my-3" />

                {/* Skills */}
                <Collapsible defaultOpen={false}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted-foreground">
                      مهارت‌ها
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setAddSkillFor(isAddingSkill ? null : c.id);
                          setNewSkillName("");
                        }}
                      >
                        <Plus className="w-3 h-3" />
                        افزودن مهارت
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronDown className="w-4 h-4 [[data-state=open]>&]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  {isAddingSkill && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="نام مهارت"
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateSkill(c.id);
                          if (e.key === "Escape") setAddSkillFor(null);
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-success"
                        disabled={submittingSkill}
                        onClick={() => handleCreateSkill(c.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setAddSkillFor(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <CollapsibleContent>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {c.skills.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          مهارتی ثبت نشده
                        </span>
                      ) : (
                        c.skills.map((s) => {
                          const isEditingSkill = editSkillId === s.id;
                          if (isEditingSkill) {
                            return (
                              <div key={s.id} className="flex items-center gap-1">
                                <Input
                                  value={editSkillName}
                                  onChange={(e) => setEditSkillName(e.target.value)}
                                  className="h-7 w-28 text-xs"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdateSkill(s.id, c.id);
                                    if (e.key === "Escape") setEditSkillId(null);
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-success"
                                  onClick={() => handleUpdateSkill(s.id, c.id)}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => setEditSkillId(null)}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            );
                          }
                          return (
                            <Badge
                              key={s.id}
                              variant="secondary"
                              className="gap-1 pr-1 group"
                            >
                              <span>{s.name}</span>
                              <button
                                onClick={() => {
                                  setEditSkillId(s.id);
                                  setEditSkillName(s.name);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity p-0.5"
                                aria-label="ویرایش مهارت"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSkill(s.id, c.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-0.5"
                                aria-label="حذف مهارت"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add category dialog */}
      <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>دسته‌بندی جدید</DialogTitle>
            <DialogDescription>
              یک دسته‌بندی جدید برای سازمان‌دهی پست‌ها و مهارت‌ها ایجاد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[64px_1fr] gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="cat-icon">آیکن</Label>
                <Input
                  id="cat-icon"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="🎵"
                  maxLength={4}
                  className="text-center text-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">نام دسته‌بندی</Label>
                <Input
                  id="cat-name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: موسیقی"
                  maxLength={60}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCatOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleCreateCategory} disabled={submittingCat} className="gap-1.5">
              {submittingCat ? "در حال ایجاد..." : (
                <>
                  <Plus className="w-4 h-4" />
                  ایجاد دسته
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// silence unused import
void Sparkles;
