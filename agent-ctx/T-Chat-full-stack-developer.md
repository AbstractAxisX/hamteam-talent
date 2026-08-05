---
Task ID: T-Chat
Agent: full-stack-developer (Chat)
Task: Rebuild Chat, Notifications, Tickets, TicketDetail views with lime+forest design

Work Log:
- Read worklog.md (prior tasks 0, 3-a..3-e, R-Profile, T-Profile) to understand context and design system established by previous agents.
- Read all design system files: globals.css (lime oklch(0.85 0.2 125), forest oklch(0.32 0.05 165), gold, rose, cream-gradient utility, slim-scroll, animations), shared/illustrations.tsx (EmptyIllustration kinds incl. chat/notif/tickets), shared/empty-state.tsx (EmptyState with kind prop + framer-motion entrance), shared/user-avatar.tsx (sizes xs..2xl with gold BadgeCheck verified), feed-view.tsx (design example — forest icon chips, lime CTA buttons, motion stagger), app-shell.tsx (mobile-first nav with floating pills, bottom nav, FAB).
- Read all 4 existing view files (chat-view.tsx ~769 lines, notifications-view.tsx ~371 lines, tickets-view.tsx ~337 lines, ticket-detail-view.tsx ~676 lines) to extract and preserve ALL functionality: socket.io real-time chat with join/message/typing events, conversation list+messages, optimistic send, mark-read/mark-all-read, ticket list/create/reply/close, admin verify/ban actions.
- Read lib/{nav,api-client,use-user,format}.ts — confirmed valid Route union (no people/explore/jobs/job), api/apiPost helpers, useUser zustand store, toFa/timeAgoFa/formatFaDateTime helpers.
- Identified pre-existing TS errors in chat-view.tsx and notifications-view.tsx (used obsolete `view: "people"`, `view: "explore"`, `view: "jobs"`, `view: "job"` routes that don't exist in nav.ts). Fixed by mapping: people→talents, explore→discover, jobs/job→feed (with comment explaining mapping in handleLink).

- **OVERWROTE chat-view.tsx** (~787 lines):
  * PageHeader: forest icon chip with lime MessageCircle (was bg-brand-gradient white text — replaced with bg-forest text-lime shadow-md).
  * Desktop: two-pane grid `lg:grid-cols-[1fr_320px]` — chat on LEFT, conversation list on RIGHT (RTL start side, w-80 = 320px). Card rounded-2xl shadow-sm.
  * Mobile: if no conversationId → list only. If conversationId → ChatThread with onBack → navigate({view:"chat"}).
  * ChatList: Card h-[72vh] with header (lime/20 MessageCircle chip + count), search input with lime focus ring, scrollable slim-scroll list. Each item: motion stagger, UserAvatar size="md", active state `bg-lime/15` + text-forest, lime accent pill on right edge (layoutId="chat-active-pill").
  * ChatThread: Card h-[72vh], **header bg-forest text-white** (was bg-card) — Back button ghost white, clickable avatar→profile, name hover:text-lime, typing indicator with 3 lime bouncing dots + "در حال تایپ..." text. ChevronLeft white/40 indicator.
  * Messages container: `bg-cream-gradient` (was bg-muted/30). Spec compliance: **own message = bg-forest text-white rounded-2xl rounded-tl-md on LEFT visually (items-end in RTL flex-col)**, other's = bg-card border rounded-2xl rounded-tr-md on RIGHT visually (items-start in RTL flex-col). Added clarifying comments. Skeleton loaders match the layout (mine on left with rounded-tl-md, theirs on right with rounded-tr-md).
  * Input area: Textarea rounded-2xl with lime focus ring + **lime circle send button** (motion.button whileTap scale 0.9, whileHover scale 1.05, bg-lime text-forest shadow-md, Send icon with -scale-x-100 for RTL mirror).
  * Helper text: Sparkles gold + "Enter برای ارسال · Shift+Enter برای خط جدید".
  * Socket.io: **`io("/", { path: "/", query: { XTransformPort: "3003" }, auth: { userId: user.id }, transports: ["websocket","polling"], reconnection: true })`** — preserved exactly. Listens to "message" (updates activeConv + reloads list), "typing" (4s timeout), emits "join"/"message"/"typing". Disconnects on unmount. activeConvRef avoids stale closures.
  * Empty states: kind="chat" with lime/forest CTA buttons.
  * Login prompt: forest Lock + lime "ورود / ثبت‌نام" button.

- **OVERWROTE notifications-view.tsx** (~298 lines):
  * PageHeader: forest icon chip with lime Bell (was bg-brand-gradient white). Subtitle shows unread count with pulsing lime dot, or "همه اعلان‌ها خوانده شده‌اند" with gold Sparkles.
  * "همه خوانده شد" button: outline border-forest/30 text-forest hover:bg-forest/5 (was generic outline).
  * Notification cards: motion stagger, hover:shadow-md hover:border-forest/20. Icon circles 11x11 rounded-2xl colored by type per spec: **connection=forest (bg-forest/12 text-forest), broadcast=lime (bg-lime/25 text-forest), chat=forest, job_match=gold (bg-gold/15 text-gold)**. Was: gold for connection, rose for broadcast — fixed to match spec.
  * Unread highlight: `bg-lime/5 border-lime/30` (was bg-primary/5 border-primary/25). Unread dot: spring-animated bg-lime with ring-4 ring-lime/20 (was bg-primary ring-primary/15).
  * Fixed `handleLink()`: replaced invalid routes (people→talents, explore→discover, jobs/job→feed) with valid ones using `Route` type. Added comment explaining mapping.
  * Empty state: kind="notif" with forest outline "کاوش کردن" CTA → discover.
  * Login prompt + ListSkeleton rounded-2xl.

- **OVERWROTE tickets-view.tsx** (~316 lines):
  * PageHeader: forest icon chip with lime TicketIcon (was bg-brand-gradient white). Subtitle shows open count + total with lime dot.
  * "تیکت جدید" button: **bg-lime text-forest font-bold hover:bg-lime/90 shadow-md** (was generic primary). Plus lime/20 chip in dialog header.
  * Refresh button: rounded-2xl ghost.
  * Ticket cards: motion stagger, hover:shadow-md hover:border-forest/20. Icon circle 11x11: **bg-lime/20 text-forest for open, bg-muted for closed** (was bg-success/12 text-success). Subject hover:text-forest.
  * StatusBadge: open = **bg-lime/20 text-forest border-lime/40** with CheckCircle2 (was bg-success/12). Closed = bg-muted text-muted-foreground with Lock icon (was just "بسته‌شده" text).
  * Create Dialog: rounded-2xl. Fields with lime focus. Submit button bg-lime text-forest font-bold hover:bg-lime/90 (was generic primary).
  * Empty state: kind="tickets" with lime "ایجاد اولین تیکت" CTA.

- **OVERWROTE ticket-detail-view.tsx** (~525 lines):
  * BackButton: ghost hover:bg-forest/5 hover:text-forest rounded-2xl.
  * Ticket header card: rounded-2xl shadow-sm. Icon circle: bg-lime/20 text-forest for open, bg-muted for closed (was bg-success/12). Separator + body text.
  * Replies thread: Card with **header bg-forest text-lime** (was bg-muted/30) showing count with white/10 chip. Messages container `bg-cream-gradient` (was bg-muted/20).
  * Thread bubbles per spec: **creator → RIGHT (forest bg-forest text-white rounded-tl-md), admin → LEFT (lime accent bg-lime/15 border-lime/40 rounded-tr-md)**. Admin badge: bg-forest text-lime (was bg-gold/15 text-gold). Non-creator non-admin: bg-card border rounded-tr-md on left.
  * Position logic: `onRight = isCreator && !replyIsAdmin` → `flex-row-reverse` puts bubble on RIGHT in RTL. Items-end on creator side, items-start on admin side.
  * Reply box: Textarea with lime focus ring. Close button: outline border-rose/40 text-rose hover:bg-rose/5 (was border-destructive). AlertDialog for close confirmation: bg-rose hover:bg-rose/90 (was bg-destructive). Send button: bg-lime text-forest font-bold hover:bg-lime/90 shadow-md.
  * Closed state: Lock icon + message in muted card.
  * Admin sidebar (preserved): forest/10 Shield chip, UserAvatar size="lg" with verified gold, role badges, InfoRow with Phone/IdCard/CalendarDays/MapPin. Buttons: forest outline "مشاهده پروفایل", gold outline verify, rose outline ban, success outline unban. AlertDialog for ban with bg-rose.
  * Not found state: kind="tickets" with forest outline "بازگشت به تیکت‌ها" CTA.

- All 4 files: "use client", framer-motion staggered entrances, lime+forest design system, NO blue/indigo, mobile-first responsive, rounded-2xl cards with shadow-sm hover:shadow-md, Persian toFa() numbers, .slim-scroll on scrollable areas.
- Ran `bun run lint` → **my 4 files have ZERO lint errors**. (3 pre-existing errors in admin-view.tsx are out of scope.)
- Ran `bunx tsc --noEmit` → **my 4 files have ZERO TS errors**. (Pre-existing TS errors in admin/*, profile/[id] route, websocket server, skills/* are out of scope. Note: I also FIXED the pre-existing TS errors in chat-view.tsx and notifications-view.tsx by replacing invalid `view: "people"`/`"explore"`/`"jobs"`/`"job"` routes with valid `view: "talents"`/`"discover"`/`"feed"`.)
- dev.log shows Next.js 16.1.3 (Turbopack) compiled successfully at session start.

Stage Summary:
- 4 view files rebuilt to match the new Lime + Forest talent discovery design system: vibrant lime (oklch 0.85 0.2 125) for CTAs/active/unread, deep forest (oklch 0.32 0.05 165) for dark headers/own-message-bubbles/creator-bubbles, gold for verified/job_match, rose for danger/close/ban.
- All functionality preserved:
  * Chat: socket.io real-time (join/message/typing events, optimistic send, auto-scroll, typing indicator with 4s timeout), conversation list with search, two-pane desktop / single mobile, back navigation, profile link from header.
  * Notifications: list with mark-read (optimistic) + mark-all-read, click-to-navigate via handleLink, unread highlight + count.
  * Tickets: list with status badges, create dialog (subject+body validation), navigate to detail.
  * TicketDetail: thread with creator-right/admin-left positioning, reply with optimistic append + auto-scroll, close with AlertDialog confirmation, admin sidebar with verify/ban actions preserved.
- Socket.io connection: `io("/", { path: "/", query: { XTransformPort: "3003" }, auth: { userId } })` — preserved EXACTLY per spec. No direct localhost:3003 URL.
- Design compliance verified: Lime for primary CTAs/active states/unread badges, Forest for dark headers (chat thread header, ticket thread header)/own message bubbles/creator bubbles, Gold for verified/job_match notifications, Rose for close/ban actions. NO blue/indigo. Cards rounded-2xl shadow-sm hover:shadow-md. Buttons rounded-2xl font-bold. EmptyState with `kind` prop (chat/notif/tickets). UserAvatar verified gold badge. framer-motion staggered entrances. Skeletons. Persian toFa(). Mobile-first responsive (lg: breakpoint for two-pane desktop).
- Bonus: Fixed pre-existing TS errors in chat-view.tsx and notifications-view.tsx (invalid Route views replaced with valid ones via handleLink mapping function).
- Lint clean for my 4 files (0 errors). TypeScript clean for my 4 files (0 errors).
