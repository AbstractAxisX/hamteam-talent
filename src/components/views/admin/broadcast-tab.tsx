"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import { Megaphone, Send, CheckCircle2, Users } from "lucide-react";

export function BroadcastTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  async function handleSend() {
    const t = title.trim();
    const b = body.trim();
    if (t.length < 3) {
      toast({ title: "خطا", description: "عنوان حداقل ۳ نویسه باشد", variant: "destructive" });
      return;
    }
    if (b.length < 1) {
      toast({ title: "خطا", description: "متن پیام خالی است", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost<{ ok: boolean; count: number }>("/api/admin/broadcast", {
        title: t,
        body: b,
      });
      setSentCount(res.count);
      toast({
        title: "اعلان ارسال شد",
        description: `به ${toFa(res.count)} کاربر ارسال شد`,
      });
      setTitle("");
      setBody("");
    } catch (e) {
      toast({ title: "خطا", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-warning/10 text-warning">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">اعلان سراسری</h2>
            <p className="text-xs text-muted-foreground">
              این پیام به عنوان اعلان به تمام کاربران فعال ارسال می‌شود
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-title">عنوان</Label>
            <Input
              id="broadcast-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: به‌روزرسانی مهم پلتفرم"
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground text-left">
              {toFa(title.length)} / {toFa(200)}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="broadcast-body">متن پیام</Label>
            <Textarea
              id="broadcast-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="متن اعلان را وارد کنید..."
              rows={5}
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground text-left">
              {toFa(body.length)} / {toFa(2000)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            ارسال به تمام کاربران فعال
          </div>
          <Button
            onClick={handleSend}
            disabled={submitting}
            className="gap-1.5"
          >
            {submitting ? (
              "در حال ارسال..."
            ) : (
              <>
                <Send className="w-4 h-4" />
                ارسال به همه کاربران
              </>
            )}
          </Button>
        </div>
      </Card>

      {sentCount !== null && (
        <Card className="p-4 bg-success/5 border-success/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <div className="text-sm">
              اعلان قبلی با موفقیت به{" "}
              <Badge variant="secondary" className="font-mono">
                {toFa(sentCount)}
              </Badge>{" "}
              کاربر ارسال شد.
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 bg-muted/30">
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">نکته:</strong> اعلان‌های سراسری در بخش «اعلان‌ها»
          هر کاربر نمایش داده می‌شوند. از این ابزار برای اطلاع‌رسانی رویدادها، به‌روزرسانی‌ها
          و تغییرات مهم پلتفرم استفاده کنید.
        </div>
      </Card>
    </div>
  );
}
