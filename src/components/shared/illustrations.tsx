"use client";

import { cn } from "@/lib/utils";

/* ── Brand Logo Mark ── */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.5 0.09 200)" />
          <stop offset="100%" stopColor="oklch(0.35 0.07 230)" />
        </linearGradient>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.8 0.16 80)" />
          <stop offset="100%" stopColor="oklch(0.65 0.17 55)" />
        </linearGradient>
      </defs>
      {/* Shield base */}
      <path d="M24 3L6 11v14c0 11 7.5 18.5 18 21 10.5-2.5 18-10 18-21V11L24 3z" fill="url(#logo-grad)" />
      {/* Inner highlight */}
      <path d="M24 3L6 11v14c0 11 7.5 18.5 18 21 10.5-2.5 18-10 18-21V11L24 3z" fill="white" fillOpacity="0.06" />
      {/* Two connected nodes = team/connection */}
      <circle cx="17" cy="20" r="5" fill="white" fillOpacity="0.95" />
      <circle cx="31" cy="28" r="5" fill="url(#logo-gold)" />
      <path d="M20.5 23.5L27.5 26.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7" />
    </svg>
  );
}

/* ── Auth / Onboarding Illustration (3D-style) ── */
export function AuthIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 500" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="auth-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.45 0.08 210)" />
          <stop offset="100%" stopColor="oklch(0.3 0.06 240)" />
        </linearGradient>
        <linearGradient id="auth-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.16 80)" />
          <stop offset="100%" stopColor="oklch(0.68 0.17 55)" />
        </linearGradient>
        <linearGradient id="auth-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0.05" />
        </linearGradient>
        <filter id="auth-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Floating background blobs */}
      <circle cx="80" cy="100" r="60" fill="white" fillOpacity="0.04" className="animate-float" />
      <circle cx="340" cy="400" r="80" fill="oklch(0.72 0.16 75)" fillOpacity="0.12" />

      {/* Main profile card (3D) */}
      <g filter="url(#auth-shadow)" transform="translate(70, 120)">
        <rect x="0" y="0" width="260" height="280" rx="24" fill="url(#auth-card)" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
        {/* Cover banner */}
        <rect x="0" y="0" width="260" height="80" rx="24" fill="url(#auth-gold)" fillOpacity="0.8" />
        <path d="M0 56 Q130 40 260 56 L260 80 L0 80 Z" fill="url(#auth-gold)" fillOpacity="0.5" />

        {/* Avatar */}
        <circle cx="130" cy="80" r="34" fill="white" />
        <circle cx="130" cy="80" r="30" fill="url(#auth-bg)" />
        <text x="130" y="90" textAnchor="middle" fill="white" fontSize="24" fontWeight="700" fontFamily="sans-serif">ه</text>

        {/* Verified badge */}
        <circle cx="156" cy="104" r="9" fill="url(#auth-gold)" />
        <path d="M152 104l3 3 6-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Name + bio lines */}
        <rect x="80" y="128" width="100" height="8" rx="4" fill="white" fillOpacity="0.7" />
        <rect x="95" y="144" width="70" height="5" rx="2.5" fill="white" fillOpacity="0.35" />

        {/* Skill badges */}
        <rect x="40" y="170" width="60" height="20" rx="10" fill="white" fillOpacity="0.12" />
        <rect x="108" y="170" width="70" height="20" rx="10" fill="white" fillOpacity="0.12" />
        <rect x="186" y="170" width="40" height="20" rx="10" fill="white" fillOpacity="0.12" />

        {/* Stats row */}
        <line x1="20" y1="210" x2="240" y2="210" stroke="white" strokeOpacity="0.1" />
        <rect x="40" y="228" width="50" height="6" rx="3" fill="white" fillOpacity="0.3" />
        <rect x="40" y="242" width="30" height="10" rx="5" fill="white" fillOpacity="0.7" />
        <rect x="120" y="228" width="50" height="6" rx="3" fill="white" fillOpacity="0.3" />
        <rect x="120" y="242" width="36" height="10" rx="5" fill="white" fillOpacity="0.7" />
        <rect x="200" y="228" width="50" height="6" rx="3" fill="white" fillOpacity="0.3" />
        <rect x="200" y="242" width="24" height="10" rx="5" fill="white" fillOpacity="0.7" />
      </g>

      {/* Floating connection nodes */}
      <g className="animate-float" style={{ animationDelay: "1s" }}>
        <circle cx="50" cy="300" r="16" fill="url(#auth-gold)" fillOpacity="0.9" />
        <path d="M50 292l4 4 8-8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <g className="animate-float" style={{ animationDelay: "2s" }}>
        <circle cx="350" cy="180" r="14" fill="white" fillOpacity="0.9" />
        <path d="M344 180h12M350 174v12" stroke="url(#auth-bg)" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g className="animate-float" style={{ animationDelay: "0.5s" }}>
        <circle cx="330" cy="340" r="12" fill="url(#auth-bg)" />
      </g>
    </svg>
  );
}

/* ── Empty State Illustrations ── */
export type EmptyKind = "posts" | "jobs" | "people" | "chat" | "notif" | "connections" | "tickets" | "search" | "generic";

export function EmptyIllustration({ kind, className }: { kind: EmptyKind; className?: string }) {
  const gradients: Record<EmptyKind, [string, string]> = {
    posts: ["oklch(0.6 0.09 200)", "oklch(0.5 0.08 220)"],
    jobs: ["oklch(0.72 0.16 75)", "oklch(0.62 0.17 55)"],
    people: ["oklch(0.6 0.13 158)", "oklch(0.5 0.12 175)"],
    chat: ["oklch(0.55 0.1 280)", "oklch(0.45 0.1 300)"],
    notif: ["oklch(0.62 0.2 15)", "oklch(0.52 0.2 30)"],
    connections: ["oklch(0.55 0.1 210)", "oklch(0.45 0.08 230)"],
    tickets: ["oklch(0.65 0.12 200)", "oklch(0.55 0.1 220)"],
    search: ["oklch(0.55 0.08 215)", "oklch(0.45 0.07 235)"],
    generic: ["oklch(0.6 0.08 200)", "oklch(0.5 0.07 220)"],
  };
  const [c1, c2] = gradients[kind];
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`emp-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      {/* soft shadow blob */}
      <ellipse cx="80" cy="130" rx="50" ry="8" fill="oklch(0.5 0.05 220)" fillOpacity="0.1" />
      {/* main 3D sphere */}
      <circle cx="80" cy="70" r="40" fill={`url(#emp-${kind})`} />
      <ellipse cx="68" cy="56" rx="16" ry="10" fill="white" fillOpacity="0.25" />
      {/* icon by kind */}
      {kind === "posts" && (
        <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="62" y="55" width="36" height="30" rx="4" />
          <line x1="70" y1="66" x2="90" y2="66" />
          <line x1="70" y1="73" x2="84" y2="73" />
        </g>
      )}
      {kind === "jobs" && (
        <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="62" y="56" width="36" height="28" rx="4" />
          <path d="M70 56v-4h20v4" />
          <line x1="68" y1="68" x2="92" y2="68" />
          <line x1="68" y1="74" x2="86" y2="74" />
        </g>
      )}
      {kind === "people" && (
        <g fill="white">
          <circle cx="80" cy="62" r="7" />
          <path d="M68 82c0-7 5-12 12-12s12 5 12 12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      {kind === "chat" && (
        <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M64 58h32a4 4 0 014 4v16a4 4 0 01-4 4H74l-8 6v-6h-2a4 4 0 01-4-4V62a4 4 0 014-4z" />
        </g>
      )}
      {kind === "notif" && (
        <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M70 82a10 10 0 0020 0" />
          <path d="M68 70v-4a12 12 0 0124 0v4l3 8H65l3-8z" />
        </g>
      )}
      {kind === "connections" && (
        <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round">
          <circle cx="72" cy="64" r="5" fill="white" />
          <circle cx="90" cy="78" r="5" fill="white" />
          <line x1="76" y1="67" x2="86" y2="75" />
        </g>
      )}
      {kind === "tickets" && (
        <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="62" y="58" width="36" height="24" rx="4" />
          <line x1="78" y1="58" x2="78" y2="82" strokeDasharray="2 3" />
        </g>
      )}
      {kind === "search" && (
        <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round">
          <circle cx="76" cy="66" r="8" />
          <line x1="82" y1="72" x2="90" y2="80" />
        </g>
      )}
      {kind === "generic" && (
        <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round">
          <circle cx="80" cy="70" r="8" />
          <line x1="80" y1="58" x2="80" y2="62" />
          <line x1="80" y1="78" x2="80" y2="82" />
          <line x1="62" y1="70" x2="66" y2="70" />
          <line x1="94" y1="70" x2="98" y2="70" />
        </g>
      )}
      {/* small floating dot */}
      <circle cx="120" cy="50" r="6" fill={c2} fillOpacity="0.5" className="animate-float" />
      <circle cx="40" cy="95" r="4" fill={c1} fillOpacity="0.4" className="animate-float" style={{ animationDelay: "1.5s" }} />
    </svg>
  );
}

/* ── Category Icon (3D-style chip) ── */
export function CategoryIcon({ emoji, className }: { emoji?: string | null; className?: string }) {
  return (
    <span className={cn("inline-grid place-items-center rounded-xl bg-brand-gradient-soft text-lg", className)}>
      {emoji || "✨"}
    </span>
  );
}
