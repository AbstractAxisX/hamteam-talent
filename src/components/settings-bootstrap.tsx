"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings";

// Applies saved user settings (theme mode, color, font) on app load.
export function SettingsBootstrap() {
  const init = useSettings((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return null;
}
