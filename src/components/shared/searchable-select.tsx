"use client";

import { useState, useRef, useEffect } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && searchable && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, searchable]);

  const selected = options.find((o) => o.value === value);
  const isAll = value === "all" || value === "";

  // Build display options
  const displayOptions = allLabel
    ? [{ value: "all", label: allLabel }, ...options]
    : options;

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

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="block text-xs font-bold text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
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

      {open && (
        <div className="absolute z-50 top-full mt-1.5 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden animate-fade-in">
          {searchable && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                <div key={g}>
                  {g && (
                    <p className="text-[10px] font-bold text-muted-foreground px-2.5 pt-2 pb-1">{g}</p>
                  )}
                  {groups.get(g)!.map((opt) => {
                    const active = opt.value === value || (isAll && opt.value === "all");
                    return (
                      <button
                        key={opt.value}
                        type="button"
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
      )}
    </div>
  );
}
