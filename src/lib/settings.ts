"use client";

import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeColor = "petrol" | "emerald" | "rose" | "violet" | "amber" | "ocean";
export type FontFamily = "vazir" | "cairo" | "markazi" | "system";

interface SettingsState {
  mode: ThemeMode;
  color: ThemeColor;
  font: FontFamily;
  setMode: (m: ThemeMode) => void;
  setColor: (c: ThemeColor) => void;
  setFont: (f: FontFamily) => void;
  init: () => void;
}

const STORAGE_KEY = "hamteam-settings";

// Color palettes — each defines primary + gold overrides
const COLOR_PALETTES: Record<ThemeColor, { primary: string; secondary: string; accent: string }> = {
  petrol: { primary: "oklch(0.42 0.06 215)", secondary: "oklch(0.95 0.012 215)", accent: "oklch(0.42 0.06 215)" },
  emerald: { primary: "oklch(0.5 0.1 160)", secondary: "oklch(0.95 0.02 160)", accent: "oklch(0.5 0.1 160)" },
  rose: { primary: "oklch(0.55 0.18 15)", secondary: "oklch(0.95 0.02 15)", accent: "oklch(0.55 0.18 15)" },
  violet: { primary: "oklch(0.5 0.12 300)", secondary: "oklch(0.95 0.02 300)", accent: "oklch(0.5 0.12 300)" },
  amber: { primary: "oklch(0.62 0.16 70)", secondary: "oklch(0.95 0.03 70)", accent: "oklch(0.62 0.16 70)" },
  ocean: { primary: "oklch(0.5 0.1 230)", secondary: "oklch(0.95 0.02 230)", accent: "oklch(0.5 0.1 230)" },
};

export const THEME_COLORS: { id: ThemeColor; name: string; swatch: string }[] = [
  { id: "petrol", name: "پترول", swatch: "oklch(0.42 0.06 215)" },
  { id: "emerald", name: "زمردی", swatch: "oklch(0.5 0.1 160)" },
  { id: "ocean", name: "اقیانوس", swatch: "oklch(0.5 0.1 230)" },
  { id: "violet", name: "بنفش", swatch: "oklch(0.5 0.12 300)" },
  { id: "rose", name: "رز", swatch: "oklch(0.55 0.18 15)" },
  { id: "amber", name: "کهربایی", swatch: "oklch(0.62 0.16 70)" },
];

export const FONTS: { id: FontFamily; name: string; stack: string }[] = [
  { id: "vazir", name: "وزیر (پیش‌فرض)", stack: "var(--font-vazir), ui-sans-serif, system-ui, sans-serif" },
  { id: "cairo", name: "قاهره", stack: "var(--font-cairo), ui-sans-serif, system-ui, sans-serif" },
  { id: "markazi", name: "مرکزی", stack: "var(--font-markazi), ui-sans-serif, system-ui, sans-serif" },
  { id: "system", name: "سیستم", stack: "ui-sans-serif, system-ui, -apple-system, sans-serif" },
];

function applySettings(mode: ThemeMode, _color: ThemeColor, font: FontFamily) {
  const root = document.documentElement;
  // Theme mode
  const isDark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);

  // NOTE: Theme color picker has been disabled — the Modern Indigo palette
  // defined in globals.css is now the single source of truth for --primary,
  // --ring, --accent, etc. We no longer override those CSS variables here so
  // the locked palette is always used regardless of any persisted value.

  // Font
  const fontDef = FONTS.find((f) => f.id === font);
  if (fontDef) {
    root.style.setProperty("--font-sans", fontDef.stack);
    document.body.style.fontFamily = fontDef.stack;
  }
}

export const useSettings = create<SettingsState>((set, get) => ({
  mode: "light",
  color: "petrol",
  font: "vazir",
  setMode: (mode) => {
    set({ mode });
    const s = get();
    applySettings(mode, s.color, s.font);
    persist(s);
  },
  setColor: (color) => {
    set({ color });
    const s = get();
    applySettings(s.mode, color, s.font);
    persist(s);
  },
  setFont: (font) => {
    set({ font });
    const s = get();
    applySettings(s.mode, s.color, font);
    persist(s);
  },
  init: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const mode = saved.mode || "light";
        const color = saved.color || "petrol";
        const font = saved.font || "vazir";
        set({ mode, color, font });
        applySettings(mode, color, font);
      } else {
        applySettings("light", "petrol", "vazir");
      }
    } catch {
      applySettings("light", "petrol", "vazir");
    }
    // Listen for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (get().mode === "system") {
        applySettings("system", get().color, get().font);
      }
    };
    mq.addEventListener("change", handler);
  },
}));

function persist(s: SettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: s.mode, color: s.color, font: s.font }));
  } catch { /* ignore */ }
}
