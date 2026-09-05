"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  options: { value: string; label: string; group?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  allLabel?: string; // label for "all" option
  searchable?: boolean;
}

/* ═══════════════════════════════════════════════════════════
   SearchableSelect — دراپ‌داون جستجوپذیر
   · 🔧 منوی بازشونده با createPortal رندر می‌شود → دیگر هرگز
     زیر فوتر مودال/شیت گیر نمی‌افتد (مشکل گزارش‌شده در فیلتر کشف)
   · 🔧 آپشن‌ها بر اساس value یکتا می‌شوند → رفع خطای کلید تکراری
     (مثل «گرمی» در لیست شهرها)
   · موقعیت fixed با محاسبه فاصله از پایین ویوپورت + flip بالا
   ═══════════════════════════════════════════════════════════ */

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "انتخاب کنید",
  label,
  className,
  disabled = false,
  allLabel,
  searchable = true,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // کلیک بیرون دکمه و بیرون منوی پورتالی → بستن
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // موقعیت منوی پورتالی — دکمه را دنبال می‌کند؛ اگر جا نبود بالا flip می‌شود
  const updateMenuPos = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuH = Math.min(320, (options.length + 2) * 40 + 8);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < Math.min(menuH, 240) && r.top > spaceBelow;
    setMenuStyle({
      position: "fixed",
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
      left: r.left,
      width: r.width,
      zIndex: 9999,
    });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPos();
    // در اسکرول/ری‌سایز موقعیت تازه محاسبه شود (منوی fixed به دکمه بچسبد)
    window.addEventListener("scroll", updateMenuPos, true);
    window.addEventListener("resize", updateMenuPos);
    return () => {
      window.removeEventListener("scroll", updateMenuPos, true);
      window.removeEventListener("resize", updateMenuPos);
    };
  }, [open, updateMenuPos]);

  useEffect(() => {
    if (open && searchable && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, searchable]);

  const selected = options.find((o) => o.value === value);
  const isAll = value === "all" || value === "";

  // یکتاسازی آپشن‌ها بر اساس value (حفظ اولین مورد) — رفع کلید تکراری React
  const uniqueOptions = (() => {
    const seen = new Set<string>();
    const out: typeof options = [];
    for (const o of options) {
      if (!seen.has(o.value)) {
        seen.add(o.value);
        out.push(o);
      }
    }
    return out;
  })();

  // Build display options
  const displayOptions = allLabel
    ? [{ value: "all", label: allLabel }, ...uniqueOptions]
    : uniqueOptions;

  // Filter by search
  const filtered = query.trim()
    ? displayOptions.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.group || "").toLowerCase().includes(query.toLowerCase())
      )
    : displayOptions;

  // Group filtered options
  const groups = new Map<string, typeof filtered>();
  for (const opt of filtered) {
    const g = opt.group || "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(opt);
  }
  const groupKeys = Array.from(groups.keys());

  function select(val: string) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  function toggle() {
    if (disabled) return;
    setOpen((o) => !o);
    setQuery("");
  }

  const menu = open ? (
    <div
      ref={menuRef}
      style={menuStyle || { position: "fixed", top: 0, left: 0, zIndex: 9999, visibility: "hidden" }}
      className="rounded-xl border border-border bg-popover shadow-lg overflow-hidden animate-fade-in"
      dir="rtl"
      role="listbox"
    >
      {searchable && (
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو..."
              className="w-full h-9 pr-9 pl-3 rounded-lg bg-muted text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}
      <div className="max-h-60 overflow-y-auto slim-scroll p-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">موردی یافت نشد</p>
        ) : (
          groupKeys.map((g) => (
            <div key={g || "default"}>
              {g && (
                <p className="text-[10px] font-bold text-muted-foreground px-2.5 pt-2 pb-1">{g}</p>
              )}
              {groups.get(g)!.map((opt) => {
                const active = opt.value === value || (isAll && opt.value === "all");
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => select(opt.value)}
                    className={cn(
                      "w-full text-right px-2.5 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors",
                      active ? "bg-primary/8 text-primary font-bold" : "hover:bg-muted"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="block text-xs font-bold text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "w-full h-11 px-3.5 rounded-xl border border-border bg-card text-right flex items-center justify-between gap-2 transition-all",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-foreground/20",
          open && "ring-2 ring-ring border-transparent"
        )}
      >
        <span className={cn("flex-1 truncate text-sm", isAll && !selected && "text-muted-foreground")}>
          {isAll && allLabel ? allLabel : selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {menu && createPortal(menu, document.body)}
    </div>
  );
}
