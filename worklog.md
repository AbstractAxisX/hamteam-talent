# HamTeam Project Worklog

---
## Task ID: P2-AUDIT
**Date:** 2026-10-27 · **Agent:** Explore (read-only audit) · **Scope:** Full feature inventory + UI/UX audit of `/home/z/hamteam-talent` (user-facing views only; admin out of scope)

### What was done
Read 100% of: `app-shell.tsx`, `lib/nav.ts`, all 22 non-admin views in `src/components/views/`, all 6 shared components, `globals.css`, `settings.ts`, `use-user.ts`, `api-client.ts`, `layout.tsx`, `page.tsx`, `format.ts`, chat mini-service; skimmed `src/app/api/` folder names for capability mapping. No code was modified.

### Key numbers
- 25 hash routes (24 reachable + `feed` alias); 4 mobile bottom tabs + "بیشتر" sheet; 5 desktop nav links + more-menu; mobile chat FAB (bottom-left).
- View file sizes (lines): explore 2637, edit-profile 1706, chat 1283, profile 883, landing 852, connections 504, dashboard 464, discover 455, jobs 429 (DEAD), need-detail 412, needs 404, talents 367, create-need 361, notifications 349, tickets 339, ticket-detail 341, my-needs 339, auth 300, onboarding 260, category 216, settings 202, following 170, feed 21.
- Design: OKLCH tokens, dark-green primary `oklch(0.38 0.09 160)`, radius base 1.25rem, `.glass`/`.glass-strong`, 3 Persian Google fonts (Vazirmatn default, Cairo, Markazi Text), hugeicons via shared `<Icon>` + scattered lucide + inline SVGs (3 icon systems mixed).
- State: zustand stores (nav, user, settings), plain `fetch` via `api-client.ts` (no react-query despite being installed), optimistic likes/comments, socket.io chat via port-3003 mini-service + 5s read-status polling, 15s unread-badge polling.

### Critical bugs found (for redesign team to preserve/fix)
1. `onboarding-view.tsx:85` calls `apiPut` but only imports `{api, apiPost}` → runtime ReferenceError at main-category step.
2. `edit-profile-view.tsx:379,400` POST `/api/upload` — **route does not exist** → avatar/banner upload 404s.
3. `landing-view.tsx:623` POST `/api/top-talent/upload` — **route does not exist** → Top-Talent national-ID upload 404s.
4. No user-facing post-creation UI anywhere; `/api/posts/upload-media` is an orphan endpoint; profile posts empty-state CTA "ساخت پست" navigates to feed (landing) — dead-end.
5. `explore-view.tsx:2169-2175` PostDetailView fetches ALL explore posts then finds one client-side (perf smell).
6. `jobs-view.tsx` (430 lines) is dead code — imported nowhere, uses legacy lucide imports + `JobPostWithRelations`.
7. Dual theme controllers: `next-themes` ThemeProvider (layout) AND custom `useSettings` both toggle `.dark` class + separate localStorage keys → can desync.
8. Hard-coded indigo `#312e81` play icons + tailwind-100 doc colors in explore-view bypass the green token palette.
9. Icon name `"star"` (onboarding-view:204) not in icon map → silently falls back to Home icon.

### Deliverable
Full report (feature inventory per view, navigation map, design language, bug list w/ file:line, state patterns) delivered in agent final message to caller. Admin views (admin-view.tsx 4181 lines + 7 admin tabs) exist but were out of scope.

---
Task ID: PHASE-2
Agent: Z.ai Code (maintainer)
Task: Redesign Phase 2 — Design tokens migration to reference language (Glass Violet) + Atoms layer

Work Log:
- Read user's reference design upload (958-line HTML: composer, feed cards, carousel, audio player, doc viewer, lightbox, comment sheet) — adopted its language app-wide: indigo #4f46e5 / violet #8b5cf6 / pink #ec4899, grad 135deg, bg #eef1f5, card #fff, line #e7eaf0, shadow system, 480px mobile frame.
- Rewrote src/app/globals.css: new semantic tokens (light: bg #eef1f5/primary #4f46e5/rose #ec4899; dark: navy #0b1020 family) keeping ALL existing token names so every view reskins instantly with zero code changes. Fixed audit bugs: shadow-glow now defined (was dead in 12 views), nums-fa now defined, --color-warning self-reference fixed. Added: grad-brand/grad-text, glass-dark-chip, shadow-grad/glow-rose/glow-gold, shimmer util, cv-auto (content-visibility), hide-scrollbar alias, safe-b, keyframes (heart-pop, shimmer, eqz, burst, hint-float), prefers-reduced-motion guard, ::selection, overscroll-behavior-y:none.
- Added admin isolation: .admin-legacy wrapper in globals.css (full legacy green token set, light+dark) + 2-line wrap in app-shell.tsx renderView — admin panel keeps EXACT current look, zero admin code touched.
- Created src/components/ui/atoms.tsx (217 lines): SPRING constants (tap/pill/sheet/bounce), Spinner (single standard), Btn (6 variants × 3 sizes, loading, min-48 touch, whileTap spring), IconBtn (5 variants, 36-48px, aria-label required), Field (pill input per reference with icon+error), Chip (active gradient state), Badge (count/dot, fa-IR numerals), Sk/SkText (shimmer skeletons), Divider.
- Created src/components/ui/grad-avatar.tsx (148 lines): GradAvatar — deterministic 8-gradient letter avatars from reference palette, img with auto-fallback to letter, category ring, VerifiedMark (blue circle #3b82f6 per reference), CrownMark (gold top-talent), 6 sizes 24-72px. (Initially overwrote shadcn avatar.tsx by mistake — restored it and renamed to grad-avatar.tsx; user-avatar.tsx dependency intact.)
- Verification: bun run lint → 0 errors (1 pre-existing warning). tsc --noEmit → clean. Browser 412×915: body bg #eef1f5 ✓, bg-primary #4f46e5 ✓, grad-brand linear-gradient(135deg,#6366f1...) ✓, admin wrapper keeps green oklch(0.38 0.09 160) ✓, no horizontal overflow, zero console/page errors, dark mode renders with navy palette.

Stage Summary:
- App-wide visual identity switched to user's reference language via token layer (all 23 views reskinned instantly, zero view code changed).
- Atoms foundation ready for Phase 3 (post card rebuild): Btn/IconBtn/Field/Chip/Badge/Sk/GradAvatar + SPRING physics.
- Admin panel fully isolated on legacy green (hard constraint respected).
