# Worklog — شبکه اجتماعی تخصصی مشاغل و تیم‌سازی

This file tracks all agent work for this project. Each agent appends a new section after `---`.

---
Task ID: 0
Agent: main
Task: Project initialization and planning

Work Log:
- Explored existing Next.js 16 project scaffold (shadcn/ui, Prisma, Tailwind 4)
- Analyzed full requirement document (Persian professional social network — LinkedIn + Divar hybrid)
- Created todo list with 15 tasks covering foundation through self-verification

Stage Summary:
- Project is a full-stack professional social network in Persian (RTL)
- Key features: auth (demo OTP + national ID validation), profiles, posts+likes, jobs, explore, connections, chat (socket.io), notifications, admin panel, tickets
- Design: minimal/cheerful/modern with custom emerald+amber palette, mobile bottom nav

---
Task ID: 3-c
Agent: full-stack-developer (Explore + People)
Task: Build ExploreView, PeopleView, and their API routes

Work Log:
- Read worklog.md, prisma/schema.prisma, src/lib/types.ts, src/lib/nav.ts, src/lib/api-client.ts, src/lib/use-user.ts, src/lib/auth.ts, src/lib/format.ts, src/lib/geo.ts, src/components/views/feed-view.tsx, src/components/shared/{user-avatar,empty-state}.tsx, src/app/api/posts/route.ts, src/app/api/categories/route.ts, src/app/api/me/skills/route.ts, src/app/api/seed/route.ts.
- Created `src/app/api/explore/route.ts` — GET posts with chained filters (categoryId, skillId, province, city, sort). Province/city filter via post.user.profile. Reuses PostWithRelations shape with like count + likedByMe + media. Take 60. Sort: recent (createdAt desc) | popular (like count desc). Prisma `where` typed via inline object type.
- Created `src/app/api/people/route.ts` — GET users with filters (categoryId, skillId, province, city, q text search on name/bio, sort). Excludes banned users and current user. Returns PeopleListItem[] (id, name, isVerifiedBadge, bioShort, avatarUrl, province, city, categories[], followersCount). Followers computed from accepted connections where user is receiver. For sort=followers, takes 200 then sorts/slices in JS (Prisma/SQLite limitation). Uses Prisma.UserWhereInput for type-safe where.
- Overwrote `src/components/views/explore-view.tsx` — `ExploreView()` with: header (Compass icon, "اکسپلور" + subtitle), sort toggle (newest/popular), collapsible filter card on mobile, cascading selects (category→skill, province→city), clear-all button, active filter chips (removable), responsive grid (1 col mobile, 2 col lg) of PostCard reused from feed-view, loading skeletons, EmptyState with clear-filters action, results count in fa digits. Debounced fetch (180ms) on filter/sort change. Skill select shows grouped skills (SelectGroup) when no category selected, only the selected category's skills otherwise. City select disabled until province chosen.
- Overwrote `src/components/views/people-view.tsx` — `PeopleView()` with: header (Users icon, "افراد" + subtitle), text search input (debounced 320ms), filter button with active count badge, sort toggle (newest/most-followers), cascading filter card, active chips, responsive grid (1/2/3 cols), PeopleCard component (UserAvatar lg + verified, name, location with MapPinned icon, bioShort line-clamp-2, up to 3 category badges + overflow count, followers count with formatCount, click navigates to profile, keyboard accessible). Loading skeletons, EmptyState, results count.
- Ran `bun run lint` — clean (0 errors, 0 warnings) after fixing unused eslint-disable directives and unused imports.
- Verified both API routes return correct data via curl with various filter combinations (single filter, chained filters, mismatched category+skill returns empty, sort=followers orders by follower count).
- Dev server log shows all routes returning 200 OK with no compile errors.

Stage Summary:
- 4 files delivered: 2 API routes (explore, people) + 2 view components (ExploreView, PeopleView).
- Cascading filter UX: category→skill, province→city with auto-reset of dependent fields.
- Reuses existing infrastructure: PostCard from feed-view, UserAvatar, EmptyState, PROVINCES/geo, format helpers, api-client, nav.
- Production-quality RTL Persian UI with emerald primary, amber accent (no blue/indigo).
- Mobile-first responsive: filter card collapses on mobile, grids adapt to 1/2/3 columns.
- Loading skeletons, EmptyState with action, toast on errors, debounced fetches, accessible cards (role=button, keyboard nav).
- All filters, sorts, and chained dependencies verified working end-to-end against seed data.

---
Task ID: 3-b
Agent: full-stack-developer (Jobs)
Task: Build Jobs views and API routes

Work Log:
- Read worklog.md, prisma/schema.prisma (JobPost, JobPostSkill, JobApplication, Notification, Conversation models), src/lib/types.ts (JobPostWithRelations), and shared infra (nav, api-client, use-user, auth, format, geo, shared components)
- Inspected existing API patterns in src/app/api/posts/route.ts and src/app/api/categories/route.ts for consistency
- Created src/app/api/jobs/route.ts — GET (list with categoryId/skillId/province/city/sort filters, status=open only, take 50, includes user info + category + skills + applicationCount + appliedByMe) and POST (auth required, validates title/description/categoryId/skills, validates skills belong to category, creates JobPost + JobPostSkill records, sends job_match notifications to all users with matching UserSkills excluding creator)
- Created src/app/api/jobs/[id]/route.ts — GET (full detail, owner sees applications list with applicant info), PUT (owner only, update status open/closed or fields), DELETE (owner or admin)
- Created src/app/api/jobs/[id]/apply/route.ts — POST (auth, prevents duplicates, prevents applying to own/closed posts, creates JobApplication, notifies owner, upserts Conversation between applicant & owner for follow-up chat)
- Created src/app/api/jobs/my-jobs/route.ts — GET (posted list with applications + applied list with job+owner info)
- Overwrote src/components/views/jobs-view.tsx — JobsView() with header + sort toggle (recent/popular) + collapsible filter card (category→skill chained, province→city chained, clear filters), responsive 1/2 col grid of JobCard components showing title, 2-line description, category+skill badges, location, application count, owner avatar+name (clickable), time ago
- Overwrote src/components/views/job-detail-view.tsx — JobDetailView({id}) with full info, status badge, category+skill badges, description, owner card (clickable), AlertDialog-confirmed close/reopen button for owner, applications section (max-h-96 scrollable) for owner, ApplySection with textarea for non-owner logged-in users (shows "already applied" success state), login prompt for guests
- Overwrote src/components/views/create-job-view.tsx — CreateJobView() with info banner (any category allowed, unlike posts), form (title with counter, description with counter, category select, skills as toggleable badge chips max 10, province/city chained selects), validation with toast errors, success → navigate to job detail
- Overwrote src/components/views/my-jobs-view.tsx — MyJobsView() with two Tabs (posted/applied), PostedJobCard with status badge + recent applicants preview (last 3 + "view more" button), AppliedJobCard with owner info + message preview, login prompt for guests, empty states for each tab
- Verified all shadcn imports resolve (Card, Button, Badge, Skeleton, Tabs, Select, Textarea, Input, Label, AlertDialog)
- Ran `bun run lint` — 0 errors (1 pre-existing warning in profile-view.tsx unrelated to this task)
- Verified endpoints via curl: GET /api/jobs (200), GET /api/jobs/{id} (200), GET /api/jobs/nonexistent (404), GET /api/jobs/my-jobs without auth (401), POST /api/jobs/{id}/apply without auth (401), all filter combinations (200)
- Checked dev.log — all routes compile and respond correctly

Stage Summary:
- Jobs (نیازمندی‌ها) feature complete: list view with filters/sort, detail view with apply flow and owner management, create form with category/skill/province/city selection, my-jobs dashboard with posted/applied tabs
- API supports full CRUD + apply + my-jobs aggregation; create flow auto-notifies users with matching skills via UserSkill join (job_match notification type, link #/job/{id})
- Apply flow also upserts a Conversation so applicant and owner can chat immediately
- All views use emerald primary + amber/success accents (no blue/indigo), mobile-first responsive grids (1 col mobile → 2 col desktop), skeletons during loading, EmptyState when empty, toast feedback for all actions
- Persian text + toFa() numerals throughout, Vazirmatn font, RTL-friendly layouts
- Static route /api/jobs/my-jobs correctly resolves before dynamic /api/jobs/[id] (Next.js gives priority to static segments)

---
Task ID: 3-a
Agent: full-stack-developer (Profile)
Task: Build ProfileView, EditProfileView, and Profile API routes

Work Log:
- Read worklog + explored shared infra: prisma schema, types.ts, auth.ts, api-client.ts, nav.ts, use-user.ts, format.ts, geo.ts, user-avatar.tsx, feed-view PostCard, existing API routes (categories, me/skills, posts, jobs).
- Created API routes under /api/profile/:
  * [id]/route.ts — GET public profile detail (returns ProfileDetail; supports id="me"; resolves connection status, followers/following counts, post count, categories+skills, experiences with manual cat/skill name lookup since Prisma schema has no relation, educations, phone visibility logic).
  * me/route.ts — GET (full profile for editing) + PUT (update bioShort, bioLong, avatarUrl, bannerUrl, province, city, phoneVisible). Province validated against PROVINCES.
  * me/categories/route.ts — POST add category (validates category exists, idempotent, auto-creates Profile + Resume if missing).
  * me/categories/[id]/route.ts — DELETE (treats [id] as categoryId, looks up UserCategory by (userId, categoryId), also removes UserSkills under skills of that category).
  * me/skills/route.ts — POST add skill (validates skill exists, parent category must already be in user's categories, idempotent).
  * me/skills/[id]/route.ts — DELETE (treats [id] as skillId).
  * me/experience/route.ts — POST create experience (jobTitle, organization, startDate?, endDate?, description, categoryId?, skillId? — ensures resume exists).
  * me/experience/[id]/route.ts — DELETE (scoped to current user via resume.profile.userId).
  * me/education/route.ts — POST create education (degree, institution, year?, description?).
  * me/education/[id]/route.ts — DELETE.
- Created /api/connections/route.ts — POST request connection. Smart logic: if there's a pending-received request from receiverId, accept it (and notify); if there's an existing outgoing request, return its status; otherwise create new pending request + notify receiver.
- Modified /api/posts/route.ts — added ?userId=xxx query param filter (used by profile posts tab).
- Refactored all auth-protected routes to use getCurrentUser() + manual 401 check (matching existing pattern) instead of requireUser() which threw unhandled 500s on unauth.
- Built ProfileView component (src/components/views/profile-view.tsx):
  * LinkedIn-style header card with banner (6 gradient presets when bannerUrl is null/default, picked by hashing userId — no blue/indigo), avatar overlapping banner with verified badge, name + admin badge, bio short, province/city, member-since date, phone (if visible), action buttons.
  * Self vs other actions: "ویرایش پروفایل" (Edit) button for self; for others: ConnectionButton (دنبال کردن / در انتظار پاسخ / پذیرش درخواست / متصل), "شروع گفتگو" (Start chat), "دانلود رزومه PDF" (toast: به‌زودی).
  * Follower/following/post counts row (clickable to connections view).
  * Tabs: درباره | رزومه | پست‌ها.
  * About tab: bioLong + categories & skills (grouped, with skill badges).
  * Resume tab: experiences timeline (vertical line w/ dots, dates LTR, category+skill badges) + educations list.
  * Posts tab: fetches /api/posts?userId=ID, reuses PostCard from feed-view.
  * Desktop sidebar (lg:block, lg:sticky lg:top-20): QuickStatsCard (4 stat tiles), categories/skills summary, quick actions.
  * Loading state: full skeleton. Not-found state: EmptyState with back-to-home button.
- Built EditProfileView component (src/components/views/edit-profile-view.tsx):
  * 5 card sections with consistent SectionTitle pattern.
  * Photos & Bio: 6-gradient radio picker + custom URL, avatar preview (using Avatar directly with custom rounded-2xl size), avatar URL input, bioShort (200 chars) + bioLong (4000 chars) with Persian digit character counters, explicit Save button.
  * Location & Contact: province Select (chained from PROVINCES), city Select (chained from province.cities), phoneVisible Switch with descriptive text, Save button.
  * Categories & Skills: list of category cards each with its skills as removable X-badges, "افزودن دسته‌بندی" dialog (lists all categories not yet selected), per-category "افزودن مهارت" dialog (lists skills not yet selected). All mutations immediate via API + refetch.
  * Experience: list with delete buttons, "افزودن" dialog form (jobTitle, organization, startDate, endDate, description, category Select, skill Select filtered by selected category).
  * Education: list with delete buttons, "افزودن" dialog form (degree, institution, year, description).
  * Auto-redirect to auth view if not logged in. Loading skeleton. All toasts in Persian.
- Modified src/app/page.tsx to return null (was returning Z.ai placeholder logo which broke the AppShell children-vs-renderView fallback). Cleared src/components/app-shell.tsx main content to use {renderView(route)} directly (children check was redundant and broke when page.tsx returned null).
- Verified end-to-end with agent-browser: navigated to /#/profile/{demoUserId} — banner gradient, avatar, verified badge, name, bio, location, counts, all 3 tabs (About with bio+categories+skills, Resume with experiences+educations, Posts with PostCard), sidebar all rendered correctly. Logged in as admin via cookie injection and verified EditProfileView rendered with all 5 sections, banner gradient picker, avatar preview, populated bio fields, province/city selects, phone toggle, empty states for categories/experience/education. Tested add-category flow (opened dialog, clicked برنامه‌نویسی, verified card appeared with empty skills message) and add-skill flow (opened dialog, clicked فرانت‌اند, verified skill badge appeared with remove button).
- Verified API endpoints with curl: GET /api/profile/[id] returns full ProfileDetail with correct connectionStatus; PUT /api/profile/me updates fields; POST categories/skills/experience/education all create records; DELETE endpoints properly remove records (after fixing [id] param semantics — categoryId/skillId vs UserCategory/UserSkill id); POST /api/connections handles all states correctly.

Stage Summary:
- 11 new API route files + 1 modified (posts) + 2 view files (ProfileView, EditProfileView) + 1 small fix (app-shell.tsx renderView) + 1 cleanup (page.tsx → null).
- Profile feature is fully functional end-to-end: public profile viewing with full LinkedIn-style layout, connection request flow, and complete profile editing with categories/skills/experience/education CRUD.
- All lint passes clean (0 errors, 0 warnings). No compile errors in dev.log.
- Design adheres to spec: emerald primary, amber for verified badges, RTL Persian throughout, mobile-first responsive (grid-cols-1 lg:grid-cols-[1fr_300px] for profile, single-column for edit), p-4/p-6 card padding, gap-4/gap-6 spacing, skeletons during loading, EmptyState when empty, toasts for feedback, Persian digit conversion via toFa().
- The Prisma schema's ResumeExperience model is missing `category Category?` and `skill Skill?` relation declarations (only has raw categoryId/skillId strings). Worked around by manually fetching category/skill names via separate findMany queries and building Maps. A future schema migration could add these relations for cleaner Prisma include syntax.

---
Task ID: 3-d
Agent: full-stack-developer (Connections + Notifications + Chat)
Task: Build ConnectionsView, NotificationsView, ChatView, socket.io mini-service, and API routes

Work Log:
- Read worklog.md, prisma/schema.prisma (Connection, Conversation, Message, Notification models), src/lib/types.ts, examples/websocket/server.ts (socket.io reference), and shared infra (nav, api-client, use-user, auth, format, user-avatar, empty-state, app-shell).
- Inspected existing patterns in /api/jobs/route.ts, /api/jobs/[id]/apply/route.ts, /api/profile/[id]/route.ts, and the existing POST /api/connections/route.ts (which was created by the Profile agent — I extended it with GET and kept POST intact).
- Installed socket.io-client@4.8.3 in the main project (`bun add socket.io-client`) and socket.io@4.8.3 in the new mini-service.
- Created /home/z/my-project/mini-services/chat-service/{package.json,index.ts} — a socket.io server on port 3003 (path "/"), with: auth handshake (`auth: { userId }`), `join` (joins room `conv:${id}` after isParticipant check), `message` (persists via Prisma then broadcasts to room — rejects spoofed senderId and non-participants), `typing` (broadcast only, no persistence). PrismaClient is created with absolute `DATABASE_URL=file:/home/z/my-project/db/custom.db` so the independent bun project resolves the parent's @prisma/client. Graceful SIGTERM/SIGINT shutdown. Started via `nohup bun run dev > /tmp/chat-service.log 2>&1 &`.
- Extended /api/connections/route.ts with GET — fetches pending (received) + sent + accepted (both directions) in parallel via Prisma `Promise.all`, returns shape `{ pending, sent, accepted, counts }` with each item `{ id, otherUser: { id, name, isVerifiedBadge, avatarUrl, bioShort }, status, createdAt }`. Kept the existing POST handler (auto-accept reverse pending, reset rejected → pending, create new + notify).
- Created /api/connections/[id]/route.ts — PATCH `{ action: "accept" | "reject" }`. Receiver-only check (403 otherwise). Accept: update status to accepted, notify requester (type "connection_accepted"), upsert a Conversation so they can chat immediately. Reject: delete the connection so a fresh request can be made later.
- Created /api/notifications/route.ts — GET (newest-first, take 50, include unreadCount) + POST (`{ action: "markAllRead" }` or `{ id, action: "markRead" }`). Returns `{ notifications, unreadCount }`.
- Created /api/chat/conversations/route.ts — GET current user's conversations (where userA or userB), each with `{ id, otherUser, lastMessage }`. Sorted by last message time desc.
- Created /api/chat/conversations/[id]/messages/route.ts — GET messages (oldest-first, take 100), validates current user is participant (403 otherwise), also returns the "other user" info for the chat header.
- Created /api/chat/start/route.ts — POST `{ userId }` find-or-create Conversation using `userAId < userBId` lexicographic ordering for unique pairs. Returns `{ conversationId }`.
- Overwrote src/components/views/connections-view.tsx — `ConnectionsView()` with three Tabs (دریافتی / ارتباطات / ارسالی) with badge counts. PersonRow card component (avatar, name, bioShort, time-ago) reused for all three tabs with different action slots: PendingCard has "پذیرش" (emerald) + "رد" (destructive outline) buttons; AcceptedCard has "پیام" button that POSTs /api/chat/start and navigates to chat; SentCard shows "در انتظار پاسخ" amber badge. Empty states per tab with action to navigate to people. Login prompt for guests. Loading skeletons.
- Overwrote src/components/views/notifications-view.tsx — `NotificationsView()` with header (icon, title, unread count subtitle, "خواندن همه" button when unread > 0). Notification card list with type-based icon (Briefcase/UserPlus/UserCheck/Megaphone/MessageCircle/Bell) and color (warning/primary/success/accent/muted). Unread items get primary tint background + border + unread dot. Click → markRead optimistically + parse `#/...` link and navigate. Keyboard accessible (Enter/Space). Empty state + login prompt + loading skeletons.
- Overwrote src/components/views/chat-view.tsx — `ChatView({ conversationId })` with:
  * Desktop (lg+): two-pane `lg:grid-cols-[320px_1fr]` — conversation list on the right (RTL start), active chat thread on the left.
  * Mobile: conversation list when no conversationId selected; chat thread + back button when one is selected.
  * ChatList: search input (filter by name), each item shows other user's avatar, name, last message preview, time-ago. Active item highlighted with primary tint. "همکاران" button → people page.
  * ChatThread: header with back button (mobile), avatar (clickable → profile), name + typing indicator (animated dots) or bioShort. Scrollable messages container with slim-scroll. Own messages aligned right (RTL start) with primary bg + primary-foreground; other's messages aligned left with card bg + border. Show sender name above first message in a run. Time-ago per bubble. Textarea input with Send button; Enter to send, Shift+Enter for newline. Hint text below input.
  * Socket.io integration: `io("/", { path: "/", query: { XTransformPort: "3003" }, auth: { userId } })` per gateway constraints. Emits `join` on conversation change, `message` on send (optimistic render + dedup), `typing` (with 1.5s debounce) on draft change. Listens for incoming `message` (appends if matches active conv, dedup by id) and `typing` (shows indicator with 4s auto-clear). Refs used for socket + activeConv to avoid stale closures. Proper cleanup on unmount.
  * Empty states: no conversations (login prompt), no messages (start chat prompt), no active conversation on desktop (select prompt).
  * Loading skeletons for both list and thread.
- Fixed two pre-existing ESLint errors (react-hooks/set-state-in-effect rule) in admin/users-tab.tsx and admin/chats-tab.tsx — wrapped synchronous setState calls in `queueMicrotask` and added a `cancelled` flag pattern so async state updates don't write after unmount. Behavior unchanged.
- Ran `bun run lint` — 0 errors, 0 warnings after fixes.
- Verified end-to-end via curl + socket.io client test:
  * Login as admin → GET /api/connections returns 3 lists with counts (1 pending, 2 accepted from seed data).
  * PATCH /api/connections/{id} accept → returns "accepted", requester gets connection_accepted notification.
  * PATCH /api/connections/{id} reject → returns "rejected", connection deleted, can re-request.
  * POST /api/connections → creates pending request, receiver gets connection_request notification.
  * GET /api/notifications → returns list + unreadCount.
  * POST /api/notifications markAllRead + markRead → both update DB and return new unreadCount.
  * POST /api/chat/start → creates conversation, returns conversationId.
  * GET /api/chat/conversations/{id}/messages → returns messages + otherUser info.
  * Socket.io client test: connected to chat-service on :3003 with auth.userId, emitted join + message, received the persisted message back via broadcast. Confirmed message was persisted in DB (verified via subsequent GET /messages).

Stage Summary:
- 10 files delivered: 1 mini-service (chat-service with package.json + index.ts on port 3003) + 6 API routes (connections GET + [id] PATCH, notifications GET+POST, chat conversations/messages/start) + 3 view components (ConnectionsView, NotificationsView, ChatView). Plus 2 minor lint fixes in admin views (users-tab.tsx, chats-tab.tsx).
- Real-time chat fully functional: socket.io mini-service persists messages via Prisma and broadcasts to conversation rooms; frontend uses XTransformPort=3003 query param (path "/") per gateway constraints — never hardcodes localhost:3003.
- Connections feature complete: 3-tab view (received/accepted/sent) with badge counts, accept/reject actions, "send message" shortcut for accepted connections, conversation auto-created on accept.
- Notifications feature complete: type-based icons and colors, unread highlighting, optimistic mark-read, mark-all-read, deep linking via `#/...` hash to feed/jobs/profile/chat/connections/etc.
- All API routes validated end-to-end with curl + socket.io client test against real DB. All return correct status codes (200/401/403/404) and data shapes.
- Design: emerald primary + amber/success accents (no blue/indigo), Persian throughout with toFa() numerals, mobile-first responsive (single-pane mobile chat with back button, two-pane desktop), p-4 card padding, slim-scroll on chat lists, loading skeletons, EmptyState, toast feedback.
- Lint clean: 0 errors, 0 warnings.

---
Task ID: 3-e
Agent: full-stack-developer (Tickets + Admin)
Task: Build TicketsView, TicketDetailView, AdminView, and API routes

Work Log:
- Read worklog.md (previous tasks 0, 3-a, 3-b, 3-c), prisma/schema.prisma (Ticket, TicketReply, User, Profile, Category, Skill, Post, JobPost, JobApplication, Connection, Conversation, Message, Notification), src/lib/types.ts, src/lib/{nav,api-client,use-user,auth,format,geo,db}.ts, src/components/shared/{user-avatar,empty-state}.tsx, src/components/ui/{table,tabs,badge,dialog,alert-dialog,dropdown-menu,select,button,collapsible,chart,skeleton,textarea}.tsx, existing API routes (posts, jobs, categories, people, chat/conversations/[id]/messages), src/components/app-shell.tsx (route → view switch, admin nav visibility).
- Created ticket API routes:
  * /api/tickets/route.ts — GET (current user's tickets with reply counts) + POST (create { subject, body } with 3-char/5-char/200/5000 length validation).
  * /api/tickets/[id]/route.ts — GET (ticket detail with replies + creator info; admin can view ANY ticket, owner can view own) + POST (add reply { content }; admin or owner; blocked when ticket is closed).
  * /api/tickets/[id]/close/route.ts — POST (admin or owner closes ticket; idempotent).
- Created 14 admin API routes (all check `getCurrentUser()` then `role === "admin"` → 403 if not admin):
  * /api/admin/stats/route.ts — counts (users, posts, openJobs, messages, connections, tickets, categories, skills) + growthData (14-day bucket of user registrations).
  * /api/admin/users/route.ts — GET with filters (q name/phone/nationalId, city, categoryId, banned, verified) + pagination.
  * /api/admin/users/[id]/route.ts — GET (full user detail with counts: posts, jobPosts, applications, connections, conversations, tickets, followers, following + categories + skills + experiences + educations) + PATCH ({ action: ban|unban|verify|unverify }; blocks self-ban/self-unverify).
  * /api/admin/users/[id]/posts/route.ts — GET user's posts for admin oversight.
  * /api/admin/posts/route.ts — GET all posts paginated (with author + like + media counts).
  * /api/admin/posts/[id]/route.ts — DELETE any post.
  * /api/admin/categories/route.ts — GET (with skills + counts) + POST (create { name, iconUrl? }).
  * /api/admin/categories/[id]/route.ts — PUT (update name/iconUrl) + DELETE (cascades to skills via Prisma).
  * /api/admin/skills/route.ts — POST (create { categoryId, name }; validates uniqueness).
  * /api/admin/skills/[id]/route.ts — PUT (update name) + DELETE.
  * /api/admin/jobs/route.ts — GET all job posts (including closed) with owner info + app counts.
  * /api/admin/jobs/[id]/route.ts — PATCH ({ status: open|closed }) + DELETE.
  * /api/admin/broadcast/route.ts — POST { title, body } → creates Notification(type: broadcast) for ALL non-banned users; returns count.
  * /api/admin/tickets/route.ts — GET all tickets with user info + reply counts.
  * /api/admin/conversations/route.ts — GET all conversations (user A, user B, msg count, last message) paginated.
  * /api/admin/conversations/[id]/messages/route.ts — GET (admin-only, read-only message list for any conversation).
- Built TicketsView (src/components/views/tickets-view.tsx):
  * Header "تیکت‌های پشتیبانی" + refresh button + "تیکت جدید" button.
  * Auth-gated: redirects to /auth if not logged in.
  * List of user's tickets as Cards: ticket icon (emerald for open, muted for closed), subject, status badge (open=default emerald, closed=secondary), reply count + last updated time. Click → ticket detail.
  * Empty state with "ایجاد اولین تیکت" CTA.
  * Loading skeletons.
  * "تیکت جدید" Dialog: subject input (with counter), body textarea (with counter), validation, navigate to ticket on success.
- Built TicketDetailView (src/components/views/ticket-detail-view.tsx):
  * Back button + ticket header card (icon, subject, creation datetime, creator name, status badge).
  * Body text in separator-divided card.
  * Replies thread (max-h-[460px] scrollable, slim scrollbar): each reply shows avatar, name + admin badge if admin, content bubble (admin replies highlighted amber, my replies aligned right with primary tint), time.
  * Reply box (textarea + send button + character counter). Disabled when ticket closed.
  * "بستن تیکت" button with AlertDialog confirmation (owner or admin only, only when open).
  * Admin sidebar (lg:grid-cols-[1fr_300px]): creator info card with avatar (verified badge), name (clickable → profile), role/verified/banned badges, contact details (phone, nationalId, member since, location), "مشاهده پروفایل" button, and quick action buttons: "اعطای تیک آبی"/"لغو تیک آبی", "مسدود کردن کاربر"/"رفع مسدودیت" (with AlertDialog for ban; calls /api/admin/users/[id] PATCH).
  * Loading skeletons, not-found EmptyState.
- Built AdminView (src/components/views/admin-view.tsx) with 7-tab layout:
  * Access control: if not admin, shows "دسترسی غیرمجاز" EmptyState.
  * Header with warning-tinted Shield icon + "پنل مدیریت" title.
  * Tabs (scrollable on mobile): Dashboard | کاربران | دسته‌بندی‌ها | محتوا | چت‌ها | تیکت‌ها | نوتیف سراسری.
  * Dashboard tab: 6 stat cards (emerald/amber icons) + 2 secondary stat cards (categories, skills) + 14-day growth AreaChart (recharts, emerald gradient fill).
  * Users tab: debounced search input + collapsible filter card (province/city/category/banned/verified) + active filter chips + shadcn Table (avatar+name, phone, role badge, location, joined date, status badges, actions dropdown with verify/ban actions) + row click opens UserDetailDialog (full profile with count tiles, categories+skills, action buttons) + pagination.
  * Categories tab: grid of category cards with icon, name, counts (skills/posts/jobs/users), inline edit (icon+name), delete (with AlertDialog), collapsible skills list with inline edit + delete badges, add skill input, "دسته‌بندی جدید" dialog (icon + name).
  * Content tab: sub-tabs Posts/Jobs. Posts table (content preview, author with avatar, category, like count, date, delete button). Jobs table (title, owner, category, status badge, app count, date, toggle status + delete buttons).
  * Chats tab: read-only conversations table (user A, user B with avatars, msg count, last message preview + time, view button) + conversation detail dialog with scrollable messages + profile links.
  * Tickets tab: all tickets table (subject, creator with avatar, status badge, reply count, last updated, view button → navigates to ticket detail with admin sidebar).
  * Broadcast tab: form (title input + body textarea with counters) + "ارسال به همه کاربران" button + success card showing recipient count.
- Fixed bug: missing `MessageCircle` icon import in users-tab.tsx (caught via agent-browser runtime test — Next.js error overlay showed "Runtime ReferenceError" pointing at UserDetailDialog line 695). Added the missing import; verified dialog now opens correctly.
- Ran `bun run lint` — 0 errors, 0 warnings.
- Verified all admin endpoints with curl (as admin and as regular user): stats (200/403), users (200/403 + filters q/verified/banned/category), users/[id] (200/404/403 + counts), users/[id] PATCH (verify/unverify/ban/unban + self-ban blocked), categories CRUD, skills CRUD, jobs PATCH (open/closed) + DELETE, broadcast (sent to 11 users), tickets (create/reply/close), conversations + messages, posts DELETE (404 for nonexistent). All return correct status codes (200/400/403/404).
- Verified access control: regular user gets 403 on all /api/admin/* endpoints; user can only access own tickets (403 when trying to access another user's ticket); admin can access any ticket.
- Verified UI with agent-browser: logged in as admin (09120000000 / 1111111111 / OTP 1234), navigated through all 7 admin tabs — Dashboard (stat cards + growth chart), Users (table + filters + dropdown actions + detail dialog with count tiles + verify action verified working), Categories (8 cards with skills + collapsible), Content (Posts sub-tab with 10 posts + Jobs sub-tab with 6 jobs), Chats (2 conversations), Tickets (1 ticket), Broadcast form. Tested ticket workflow: created ticket as user, replied as admin, closed ticket, verified status update. Tested ticket detail admin sidebar with creator info + action buttons.

Stage Summary:
- 18 new API route files + 3 view files (TicketsView, TicketDetailView, AdminView) + 7 admin sub-component files (dashboard/users/categories/content/chats/tickets/broadcast tabs).
- Tickets feature: users can create/view/reply/close their own tickets; admins can view any ticket, reply, and close; admin sidebar in TicketDetailView shows full creator context with quick action buttons (verify/ban) wired to /api/admin/users PATCH.
- Admin Panel: comprehensive 7-tab dashboard with stats + growth chart (recharts AreaChart with emerald gradient), user management (search/filter/paginate/table/detail-dialog/verify-ban actions), category & skill CRUD (inline editing), content moderation (posts + jobs tables with delete/toggle), read-only chat oversight (conversations + message viewer), ticket oversight (table → ticket detail), broadcast notifications to all users.
- Design: emerald primary + amber warning accents (NO blue/indigo), RTL Persian throughout, Vazirmatn font, mobile-first responsive (scrollable tabs, horizontally-scrollable tables, sidebar collapses to top on mobile), p-4/p-6 card padding, gap-3/gap-4 spacing, skeletons during loading, EmptyState when empty, toast feedback for all actions, AlertDialog confirmations for destructive ops, Persian digit conversion via toFa() everywhere.
- All access control enforced server-side: getCurrentUser() check + role === "admin" check on every /api/admin/* route; ticket endpoints check ownership OR admin role.
- Lint clean (0 errors, 0 warnings). Dev server log shows no compile errors. All endpoints verified working via curl + UI testing via agent-browser.

---
Task ID: R-Jobs
Agent: full-stack-developer (Jobs Redesign)
Task: Redesign Jobs views to new premium design system (Petrol + Saffron)

Work Log:
- Read worklog.md, globals.css (design tokens: petrol primary, gold/saffron accent, rose, shadow-card/lift/float, animate-float/slide-up/fade-in), illustrations.tsx (LogoMark, EmptyIllustration with kind prop, CategoryIcon), empty-state.tsx (EmptyState with kind prop + framer-motion), user-avatar.tsx (UserAvatar sizes + verified gold badge), post-card.tsx (card pattern reference), feed-view.tsx (SortButton + CreatePostBox pattern), app-shell.tsx (navigation context).
- Read existing 4 jobs views + lib/types.ts, lib/format.ts, lib/nav.ts, lib/api-client.ts, lib/geo.ts to preserve all functionality.
- Read explore-view.tsx as additional reference for filter/chip pattern.
- Rewrote `src/components/views/jobs-view.tsx`:
  • Page header: large 2xl font-extrabold title "نیازمندی‌ها" + subtitle + petrol primary "ثبت آگهی" button (h-10, rounded-xl, shadow-card) with brand-gradient icon tile.
  • Sort toggle (recent/popular) as rounded-xl outline/default buttons matching feed-view SortButton pattern.
  • Collapsible filters card with framer-motion AnimatePresence (height animation), rounded-xl Selects, chained category→skill and province→city.
  • Filter count badge + "پاک کردن" ghost button.
  • Responsive grid: 1 col mobile, 2 col lg. JobCard: rounded-2xl, p-5, shadow-card hover:shadow-lift, border-border/60, framer-motion stagger (delay index*0.05). Title font-bold text-[15px] line-clamp-2 group-hover:text-primary, 2-line description, category + skill badges (rounded-md), location with MapPin, application count + time ago + chevron in footer, owner avatar+name clickable.
  • Loading: 6 skeleton cards (rounded-2xl). Empty: EmptyState kind="jobs" with contextual title/description + conditional action (clear filters OR create job).
  • Results count footer.
- Rewrote `src/components/views/job-detail-view.tsx`:
  • Back button (ghost, rounded-xl). Max-w-3xl container.
  • Hero card (rounded-2xl, shadow-card, p-6, framer-motion): title 2xl font-extrabold, status badge (open=success green / closed=secondary), quick meta (date + location + applicant count with icons), category + skill badges.
  • Description card with Briefcase icon header + leading-8 typography.
  • Owner card with UserAvatar (verified gold badge via component) + clickable profile navigation.
  • Owner actions card: AlertDialog for close confirmation (rounded-2xl content), reopen button with success styling.
  • ApplicationsSection: header with count badge, scrollable list (max-h-96 slim-scroll) of applicant cards with motion stagger, avatar, name, message in muted bg, view-profile button. Empty state uses EmptyState kind="people".
  • ApplySection: three states — closed (muted card with XCircle), already-applied (success card with CheckCircle2), form (Send icon header, Textarea rounded-xl, char counter, h-10 submit button with Loader2 spinner).
  • Guest: brand-gradient-soft card with Lock icon + login CTA.
  • Loading: skeleton hero + description card. Not-found: EmptyState kind="jobs".
  • All sections wrapped in motion.div with staggered delays (0, 0.05, 0.1, 0.15, 0.2).
- Rewrote `src/components/views/create-job-view.tsx`:
  • Max-w-2xl centered. Back button + brand-gradient header tile + 2xl title.
  • Info banner card (bg-primary/5, border-primary/20, rounded-2xl): "هر کاربری می‌تواند آگهی ثبت کند" with Info icon tile.
  • Form card (rounded-2xl, shadow-card, p-6, space-y-6): each field has icon label (Type/FileText/Tag/MapPin), Input/Textarea rounded-xl h-11, char counters.
  • Skills as toggleable chips: selected = bg-primary text-primary-foreground shadow-card, unselected = outline border hover:border-primary/40. Counter shows toFa(selected)/toFa(MAX_SKILLS).
  • Province/city chained selects (rounded-xl h-11).
  • Full-width h-12 submit button (petrol primary, rounded-xl, shadow-card, font-semibold) with Loader2 spinner + Send icon. Ghost cancel button below.
  • Selected skills summary card at bottom.
  • All validation toasts preserved. Motion stagger on header/banner/form/summary.
- Rewrote `src/components/views/my-jobs-view.tsx`:
  • Max-w-3xl. Brand-gradient header tile + 2xl title + outline "ثبت نیازمندی" button.
  • shadcn Tabs with rounded-xl TabsList (h-11, bg-muted, p-1), tab triggers with rounded-lg + shadow-card when active, count badges (bg-primary/15 text-primary).
  • PostedJobCard (rounded-2xl, p-5, shadow-card hover:shadow-lift, motion stagger): title + status badge (open=success outline / closed=secondary), meta row (category badge, location, time, applicant count), recent applicants preview (avatar + name + message truncate + time), "مشاهده N درخواست دیگر" ghost button, "مشاهده جزئیات" outline button.
  • AppliedJobCard: job title, owner avatar+name (clickable, stopPropagation), status badge, meta row, "پیام شما" preview in muted bg, "مشاهده نیازمندی" button.
  • Empty states: posted → EmptyState kind="jobs" with create-job CTA; applied → EmptyState kind="search" with view-jobs CTA.
  • PostedSkeleton / AppliedSkeleton with rounded-2xl cards.
  • Not-logged-in state: Lock icon card with auth CTA.
- Ran `bun run lint` — 0 errors, 0 warnings in my 4 files (only 1 pre-existing warning in chat-view.tsx, out of scope).
- Verified dev.log: `✓ Compiled`, `GET / 200`, all APIs 200. No errors related to jobs files.

Stage Summary:
- All 4 Jobs views fully redesigned to new Petrol + Saffron premium design system.
- Design tokens applied: shadow-card (default) / shadow-lift (hover), rounded-2xl cards, rounded-xl buttons/selects/inputs, border-border/60, font-extrabold headings, text-muted-foreground secondary, text-[15px] body, leading-7/8.
- framer-motion throughout: staggered card entrances (delay index*0.05), AnimatePresence for collapsible filters, motion.div sections in detail view.
- EmptyState component used with kind prop ("jobs", "people", "search") — no more legacy icon prop.
- UserAvatar with verified gold badge used consistently.
- Persian numbers via toFa(), formatCount(), timeAgoFa(), formatFaDate() preserved.
- ALL existing functionality preserved: list+filters (category/skill/province/city chained) + sort (recent/popular), detail (owner sees applicants, non-owner applies with message, close/reopen with AlertDialog), create (title/desc/category/skills-max10/province/city + validation), my-jobs (posted/applied tabs).
- No API routes modified. No other files touched. "use client" at top of each file.
- Lint clean. Dev server compiles successfully and serves HTTP 200.

---
Task ID: R-Explore
Agent: full-stack-developer (Explore Redesign)
Task: Redesign Explore and People views

Work Log:
- Read worklog.md and design system files: globals.css (Petrol+Saffron tokens — primary oklch(0.42 0.06 215), gold oklch(0.72 0.16 75), rose, success; shadow-card/lift/float; animate-shimmer/fade-in/slide-up), illustrations.tsx (EmptyIllustration kinds: posts/jobs/people/chat/notif/connections/tickets/search/generic + CategoryIcon), empty-state.tsx (EmptyState with `kind` prop, motion fade-in-up, optional action), user-avatar.tsx (sizes xs→2xl, gold verified BadgeCheck badge), post-card.tsx (shared PostCard with `post` + `index` props, shadow-card hover:shadow-lift, motion stagger delay index*0.05 capped at 0.3s), feed-view.tsx (SortButton pattern with rounded-xl font-semibold h-9).
- Read existing explore-view.tsx + people-view.tsx (old emerald design with `PostCard from "@/components/views/feed-view"` import that no longer exists; old EmptyState with `icon` prop that no longer exists in new design).
- Read api/explore/route.ts and api/people/route.ts to confirm response shapes (`{ posts: PostWithRelations[] }` and `{ users: PeopleListItem[] }`) — no API changes needed.
- Read lib/{format,geo,nav,api-client,types}.ts for infrastructure signatures.
- OVERWROTE src/components/views/explore-view.tsx — new Petrol+Saffron design:
  * Header: motion fade-in-up, petrol-tinted rounded-2xl icon tile (Compass) with shadow-soft, title "کشف پست‌ها" + subtitle.
  * Sort toggle (SortButton pattern from feed-view): recent/popular, rounded-xl font-semibold h-9.
  * Mobile-only "فیلترها" button (lg:hidden) with active count badge.
  * Filter card: rounded-2xl p-4 sm:p-5 border-border/60 shadow-card, 2-col grid of Selects (all `rounded-xl h-10`): category, skill (chained — auto-resets when category changes; groups skills by SelectGroup when no category selected), province, city (chained — disabled until province chosen). Clear-all button (lg+ in header, mobile in card footer).
  * Active filter chips: motion fade-in-up, removable, primary tint.
  * Results count with gold Sparkles icon.
  * Loading skeletons: 2-col grid of post-card-shaped skeletons (avatar + 2 lines + content + action row).
  * EmptyState with kind="posts" (no filters) or kind="search" (with filters), with clear-filters action button.
  * Post grid: 1 col mobile, 2 col lg. Reuses shared PostCard from `@/components/shared/post-card` with `index={i}` for stagger animation.
  * Debounced fetch (180ms) on filter/sort change.
  * Container max-w-5xl mx-auto for breathing room.
- OVERWROTE src/components/views/people-view.tsx — new Petrol+Saffron design:
  * Header: motion fade-in-up, petrol-tinted rounded-2xl icon tile (Users), title "کشف افراد" + subtitle.
  * Search input: large (h-11) rounded-xl with right-aligned search icon (RTL), clear button, shadow-soft. Mobile-only filter toggle button next to search.
  * Sort toggle: recent/followers, rounded-xl font-semibold h-9.
  * Filter card: same pattern as explore — rounded-2xl p-4 sm:p-5, 2-col grid of chained selects, clear-all.
  * Active filter chips (includes debouncedQ as `«query»` chip).
  * Results count with gold Sparkles icon.
  * Loading skeletons: 3-col grid of centered people-card-shaped skeletons (avatar circle + name + location + bio + 2 badge pills).
  * EmptyState with kind="people" (no filters) or kind="search" (with filters), with clear-filters action button.
  * People grid: 1 col mobile, 2 col sm, 3 col lg.
  * PeopleCard component: motion.div fade-in-up with stagger delay index*0.05 capped at 0.3s; Card with `shadow-card hover:shadow-lift rounded-2xl p-5 border-border/60 hover:border-primary/30 text-center cursor-pointer group transition-all duration-300`. Centered UserAvatar size lg (with verified gold badge) that scales 1.05 on hover. Name (font-bold text-[15px] group-hover:text-primary). Location with MapPinned icon (primary tint). Bio 2-line clamp min-h-3rem. Category badges (first 3, secondary/outline variant, text-[10px] h-5 rounded-md) with overflow +N count. Footer border-t with UserCheck icon + formatCount(followersCount) + "دنبال‌کننده". Whole card clickable (role=button, tabIndex=0, Enter/Space keyboard handler) → navigate to profile.
  * Debounced fetch: 320ms on text search, 180ms on filter/sort change.
  * Container max-w-5xl mx-auto.
- CRITICAL FIX: discovered pre-existing broken import in src/components/views/profile-view.tsx line 17 (`import { PostCard } from "@/components/views/feed-view"` — the redesigned feed-view no longer exports PostCard; it now lives in `@/components/shared/post-card`). This broken import was causing the entire client bundle to fail compilation, which made ALL routes (including /api/explore and /api/people) return 500 in dev mode. Applied minimal targeted fix: (1) changed import source to `@/components/shared/post-card`; (2) updated usage `<PostCard key={p.id} post={p} onLike={load} />` → `<PostCard key={p.id} post={p} index={i} />` (new PostCard API uses `index` prop for stagger, doesn't accept `onLike`). The `load` callback is still used by `useEffect` so no unused-var issue. This was a one-line bug fix needed to unblock verification — not a redesign of profile-view.
- Ran `bun run lint` — 0 errors, 0 warnings (the only pre-existing warning in chat-view.tsx also resolved on this run).
- Verified all API endpoints with curl after the profile-view fix:
  * GET /api/explore?sort=recent → 200 (returns { posts: [...] })
  * GET /api/explore?sort=popular → 200
  * GET /api/explore?province=tehran&city=تهران → 200 (URL-encoded city filter works)
  * GET /api/people?sort=recent → 200 (returns { users: [...] })
  * GET /api/people?q=test → 200 (text search works)
  * GET /api/people?sort=followers → 200
- Checked dev.log — no errors, no ⨯ markers, all routes 200, clean compiles.

Stage Summary:
- 2 view files redesigned (explore-view.tsx, people-view.tsx) following the new Petrol+Saffron design system + 1 critical one-line import fix in profile-view.tsx (needed because previous redesign agent removed PostCard export from feed-view but didn't update its dependents — this was breaking the entire app's compilation including API routes).
- Design system adherence: petrol primary (oklch 0.42 0.06 215), gold accents (Sparkles icon, verified badges), rose for likes (inherited from PostCard), shadow-card → hover:shadow-lift transition, rounded-2xl cards with border-border/60, rounded-xl h-10 selects, rounded-xl font-semibold h-9 sort buttons, motion stagger with delay = index * 0.05 (capped 0.3s), EmptyState with kind-based illustrations, framer-motion fade-in-up entrance animations on header/chips/cards.
- UX preserved: chained filters (category→skill, province→city with auto-reset), debounced fetch (180ms explore / 320ms text search + 180ms filters people), sort toggles (recent/popular for explore, recent/followers for people), active filter chips (removable, including query chip for people), loading skeletons, empty states with clear-filters action, results count in Persian digits, mobile-collapsible filter card with lg:!block desktop visibility, mobile filter toggle button with count badge.
- Both views are mobile-first responsive (explore: 1 col → 2 col lg; people: 1 col → 2 col sm → 3 col lg) and accessible (people cards are keyboard-navigable with role=button + Enter/Space handlers).
- Lint clean: 0 errors, 0 warnings. Dev server compiles cleanly. All API endpoints verified returning 200 with valid JSON.

---
Task ID: R-Chat
Agent: full-stack-developer (Chat Redesign)
Task: Redesign Chat, Notifications, Tickets views

Work Log:
- Read /home/z/my-project/worklog.md (prior agents' tasks 0, 3-a..3-e), prisma/chat-service reference, and the NEW design-system files: globals.css (Petrol + Saffron oklch palette, shadow-card/shadow-lift/rounded-2xl/slim-scroll), shared/illustrations.tsx (EmptyIllustration kinds: posts/jobs/people/chat/notif/connections/tickets/search/generic), shared/empty-state.tsx (EmptyState props: kind/title/description/action/className — NO icon prop), shared/user-avatar.tsx (UserAvatar xs..2xl + verified gold badge), shared/feed-view.tsx (design example), app-shell.tsx (route→view switch + navigation patterns).
- Inspected the 4 view files to be overwritten (chat-view, notifications-view, tickets-view, ticket-detail-view) and confirmed they relied on the old emerald palette + used `icon={...}` prop on EmptyState (which no longer exists in the new EmptyState API).
- Overwrote src/components/views/chat-view.tsx — `ChatView({ conversationId })`:
  * PageHeader: 11x11 brand-gradient rounded-2xl icon tile, bold title, muted subtitle.
  * Desktop (lg+): `lg:grid-cols-[320px_1fr]` two-pane — ChatList right (RTL start), ChatThread left.
  * Mobile: list when no conversationId, thread + back button when one is selected.
  * ChatList: rounded-2xl border-border/60 shadow-card; header has "گفتگوها" title + "همکاران" link; rounded-xl search input with leading Search icon; conversation items use motion.div with staggered fade-up (delay min(i*0.03, 0.25)); each row: UserAvatar (md), name (bold+primary when active), last-message preview (line-clamp-1), time-ago; active row has bg-primary/8.
  * ChatThread: rounded-2xl border-border/60 shadow-card; header with optional back button (rounded-xl), clickable avatar → profile, name (hover→primary), typing indicator (3 bouncing petrol dots, 4s auto-clear), bio subtitle.
  * Messages: bg-muted/30 background, slim-scroll. Own messages: items-start, bg-primary text-primary-foreground rounded-2xl rounded-tl-md, shadow-soft. Other's: items-end, bg-card border-border/60 rounded-2xl rounded-tr-md. Time-ago per bubble. AnimatePresence + motion.div with layout="position" + initial opacity/y/scale.
  * Input: rounded-2xl Textarea + circular petrol send button (rounded-full w-11 h-11 shadow-card hover:shadow-lift). Enter to send, Shift+Enter newline. Hint row with Sparkles (gold) icon.
  * EmptyState kind="chat" for: not-logged-in, no conversations, no messages, no active conversation on desktop.
  * Socket.io: `io("/", { path: "/", query: { XTransformPort: "3003" }, auth: { userId }, transports: ["websocket","polling"], reconnection: true })` — gateway-safe, never hardcodes localhost:3003. Emits join/message/typing, listens for message/typing. activeConvRef used to avoid stale closures in socket handlers. Optimistic message render + dedup by id. Proper cleanup on unmount (socket.disconnect, clear timers).
  * Loading skeletons match new rounded-2xl language for both list and thread.
- Overwrote src/components/views/notifications-view.tsx — `NotificationsView()`:
  * PageHeader: brand-gradient Bell tile, title "اعلان‌ها", subtitle "{n} اعلان خوانده‌نشده" / "همه اعلان‌ها خوانده شده‌اند", "همه خوانده شد" outline button (sm:hidden shows "خواندن").
  * Notification cards: rounded-2xl border-border/60 shadow-card hover:shadow-lift hover:border-primary/30. Icon circle (11x11 rounded-2xl) colored per spec: job_match=bg-primary/12 text-primary, connection_request/accepted=bg-gold/15 text-gold, broadcast=bg-rose/12 text-rose, chat=bg-primary/12 text-primary, default=muted.
  * Unread cards: bg-primary/[0.05] border-primary/25 highlight. Unread dot: w-2.5 h-2.5 bg-primary rounded-full with ring-4 ring-primary/15.
  * Title (font-bold), body (line-clamp-2 muted), time-ago with leading bullet dot.
  * Click/Enter/Space → optimistic markRead + handleLink (parses #/... to navigate). EmptyState kind="notif" for not-logged-in and empty.
  * Motion stagger: motion.div per item with delay min(i*0.04, 0.4).
  * ListSkeleton uses same rounded-2xl cards.
- Overwrote src/components/views/tickets-view.tsx — `TicketsView()`:
  * PageHeader: brand-gradient Ticket tile, title "تیکت‌های پشتیبانی". Action group: ghost refresh icon (rounded-xl) + "تیکت جدید" petrol button (rounded-xl shadow-card hover:shadow-lift).
  * Ticket cards: rounded-2xl border-border/60 shadow-card hover:shadow-lift hover:border-primary/30. Status icon (11x11 rounded-2xl): open=bg-success/12 text-success, closed=bg-muted text-muted-foreground.
  * Subject (font-bold, hover→primary), StatusBadge component (open = success with CheckCircle2, closed = muted secondary), reply count + last-updated time-ago with bullet separator.
  * ChevronLeft with group-hover translate-x.
  * EmptyState kind="tickets" with "ایجاد اولین تیکت" CTA inside rounded-2xl card.
  * Create Dialog (rounded-2xl): subject Input + body Textarea with counters, rounded-xl fields, Send icon button with Loader2 spinner during submit.
  * Motion stagger on ticket cards.
- Overwrote src/components/views/ticket-detail-view.tsx — `TicketDetailView({ id })`:
  * BackButton component (ghost rounded-xl, ArrowRight + "تیکت‌ها").
  * Layout: lg:grid-cols-[1fr_300px] — main thread + admin sidebar (admin only).
  * Ticket header card: rounded-2xl shadow-card, status icon (success/muted), subject (font-extrabold tracking-tight), creation date + creator name with bullet separators, StatusBadge. Body text below Separator.
  * Replies thread: rounded-2xl shadow-card, header "گفتگو ({n} پاسخ)" on bg-muted/30, scrollable max-h-[460px] slim-scroll on bg-muted/20.
    Per spec: creator messages aligned RIGHT (RTL start, flex-row-reverse) with bg-primary text-primary-foreground rounded-2xl rounded-tl-md; admin messages aligned LEFT with gold-accent bg-gold/10 border-gold/40 rounded-2xl rounded-tr-md + gold "مدیر" badge (Shield icon); other non-creator/non-admin messages aligned LEFT with bg-card border.
    AnimatePresence + motion.div layout="position" with initial fade-up-scale.
  * Reply box: rounded-2xl shadow-card, rounded-xl Textarea + counter + "بستن تیکت" outline (Lock icon, AlertDialog confirmation, destructive action button) + "ارسال پاسخ" petrol button with Send/Loader2.
  * Closed state: muted card with Lock icon and instruction.
  * Admin sidebar (isAdmin): rounded-2xl shadow-card. Header: gold Shield tile + "اطلاعات کاربر". UserAvatar (lg, verified if applicable) + clickable name. Role/verified/banned badges. InfoRow component with Phone/IdCard/CalendarDays/MapPin icons. "مشاهده پروفایل" outline button. "اقدامات سریع" section: verify/unverify (gold-tinted), ban (AlertDialog confirmation, destructive) / unban (success-tinted). Self-ban/self-unverify disabled.
  * EmptyState kind="tickets" for not-found.
  * Loading skeletons match new rounded-2xl language.
- Ran `bun run lint` — 0 errors, 0 warnings. Initial run flagged an unused eslint-disable for react-hooks/exhaustive-deps on the chat socket effect; replaced it with the proper dependency array [user, loadConversations, scrollToBottom] (these are stable useCallback refs).
- Ran `bunx tsc --noEmit -p tsconfig.json` — 0 errors in any of the 4 rewritten view files. (Pre-existing TS errors remain in OTHER files I was instructed not to modify: admin/tickets-tab, admin/users-tab, connections-view, edit-profile-view, lib/auth — all because the old code still passes `icon={...}` to the redesigned EmptyState which only accepts `kind`. These are out of scope for Task R-Chat.)
- Verified dev server log — no compile errors after edits. Hit `/` and `/#/chat` to trigger Next.js compilation: HTTP 200, "GET / 200 in 924ms (compile: 204ms, render: 720ms)". All routes still serve correctly.

Stage Summary:
- 4 view files redesigned with the new Petrol + Saffron premium design system: chat-view, notifications-view, tickets-view, ticket-detail-view.
- All functionality preserved: socket.io real-time chat (with `io("/", { path: "/", query: { XTransformPort: "3003" }, auth: { userId } })` gateway-safe connection, optimistic renders, typing indicators, dedup, auto-scroll, proper cleanup), notification mark-read/mark-all-read with deep linking, ticket create/reply/close flow with confirmation dialogs, admin sidebar with verify/ban quick actions.
- Design language consistently applied across all 4 views: rounded-2xl cards, border-border/60, shadow-card → hover:shadow-lift, brand-gradient petrol headers, gold for verified/admin/premium, rose for broadcast/danger, success for open tickets, NO blue/indigo anywhere.
- EmptyState used with `kind` prop (chat/notif/tickets) — no more invalid `icon` prop in the rewritten files. UserAvatar reused throughout. Persian numerals via toFa(). Persian date/time via formatFaDateTime + timeAgoFa.
- Motion: framer-motion AnimatePresence + layout="position" on chat & ticket message bubbles; staggered fade-up on list items (conversations, notifications, tickets).
- Responsive: mobile-first single-pane (chat list → thread with back button); lg+ two-pane (chat list right + thread left; ticket thread + admin sidebar).
- Slim scrollbars (.slim-scroll) on chat message container, chat list, ticket replies.
- Lint clean (0 errors, 0 warnings). TypeScript clean for all 4 modified files. Dev server compiles without errors.

---
Task ID: R-Profile
Agent: full-stack-developer (Profile Redesign)
Task: Redesign Profile, EditProfile, Connections views

Work Log:
- Read worklog.md (prior tasks 0, 3-a..3-e), globals.css (Petrol + Saffron tokens, shadow-card/lift/float, bg-brand-gradient utilities), shared/illustrations.tsx (LogoMark, EmptyIllustration kinds, CategoryIcon), shared/empty-state.tsx (EmptyState with `kind` prop, motion-wrapped), shared/user-avatar.tsx (UserAvatar sizes xs..2xl, verified → gold BadgeCheck), shared/post-card.tsx (PostCard signature: { post, index }), feed-view.tsx (SortButton, CreatePostBox patterns), app-shell.tsx (route→view switch), nav.ts, use-user.ts, api-client.ts, format.ts, geo.ts, types.ts (ProfileDetail, PostWithRelations, CategoryWithSkills).
- Read existing 3 target files. Found 2 pre-existing bugs: profile-view.tsx imported `PostCard from "@/components/views/feed-view"` but feed-view no longer exports PostCard (caused runtime 500 errors); connections-view.tsx used `apiPost` (POST) to call /api/connections/[id] but the route only accepts PATCH (would return 405).
- Verified /api/connections/[id]/route.ts exports only PATCH; /api/profile/me/route.ts GET/PUT shape; api-client.ts provides api/apiPost/apiPut/apiDelete helpers.
- **OVERWROTE profile-view.tsx**: New BANNER_GRADIENTS (6 oklch petrol+saffron+rose linear-gradients, NO blue/indigo). ProfileHeader with motion entrance, banner h-36 md:h-52 with gradient + radial highlight + dot pattern, banned badge (rose/90), UserAvatar size="2xl" with `ring-4 ring-card rounded-3xl` (square LinkedIn-style) overlapping banner via -mt-14 md:-mt-16, name + admin badge (bg-gold/15 text-gold border-gold/30 + Sparkles), bioShort line-clamp-2, meta row (MapPin/CalendarDays/Phone gated by phoneVisible), action buttons (rounded-xl font-semibold — self: outline "ویرایش پروفایل"; other: ConnectionButton + "چت" + "رزومه"). Counts row (clickable followers/following → connections view). ConnectionButton 4-state (none/pending-sent/pending-received/accepted) with UserPlus/Clock/UserCheck icons + Loader2 spinner. ProfileTabs (3-col grid rounded-xl). AboutTab: motion cards, bioLong card (FileSignature), categories card (Hash + CategoryIcon per group + Separator + skill badges, stagger i*0.05). ResumeTab: motion Experiences timeline (Briefcase header, primary dot ring-4 ring-card) + Educations timeline (GraduationCap header, gold dot). PostsTab: fetches /api/posts?userId=ID, renders PostCard from "@/components/shared/post-card" with index. Sidebar (lg only): QuickStatsCard (2x2 grid), categories card, quick-actions card. ProfileSkeleton + not-found EmptyState kind="people".
- **OVERWROTE edit-profile-view.tsx**: Centered max-w-3xl. Header with title + "مشاهده پروفایل" ghost button. Section quick-nav chips (rounded-full) that scrollIntoView (preventDefault to avoid disturbing hash router). SectionWrapper motion.div with staggered delays. 5 sections: PhotosBioSection (ImageIcon — banner picker 6 gradients + custom URL, UserAvatar size="xl" preview, bioShort/bioLong with toFa counters); LocationSection (MapPin — chained province/city Selects, phone-visible Switch in rounded-2xl card); CategoriesSection (Hash — per-category Card with CategoryIcon, removable skill badges with X hover:rose, add-category + add-skill dialogs); ExperienceSection (Briefcase — list items with brand-gradient-soft chip icon, delete hover:rose, add dialog with all fields); EducationSection (GraduationCap — list items with gold/15 chip icon, delete + add dialog). SectionTitle helper (icon chip + title, consistent). EditSkeleton. Login prompt if !user.
- **OVERWROTE connections-view.tsx**: Centered max-w-2xl. Header (Users icon in bg-brand-gradient rounded-2xl chip). 3 tabs (rounded-xl h-11): pending/accepted/sent with count badges (pending=gold/15 text-gold, accepted=primary/10 text-primary, sent=muted). PersonRow motion.div with stagger delay min(index*0.05, 0.3), Card with shadow-card hover:shadow-lift, UserAvatar size="lg" with verified gold badge, clickable name → profile, timeAgoFa. PendingCard: "پذیرش" primary (Check/Loader2) + "رد" outline text-rose — uses `api()` with method:"PATCH" (fixed bug). AcceptedCard: "چت" outline (MessageCircle/Loader2) → /api/chat/start → navigate to chat. SentCard: "در انتظار پاسخ" gold badge. Empty states kind="connections" for all 3 tabs with "پیدا کردن همکار" CTA → people. Login prompt if !user. ListSkeleton.
- Removed unused `cn` import from profile-view.tsx and connections-view.tsx (twMerge not needed there).
- Ran `bun run lint` — 0 errors, 0 warnings.
- Dev log shows clean compile after fix (the previous "Fast Refresh had to perform a full reload" was caused by the pre-existing broken PostCard import that's now fixed).
- Verified home page returns 200 and view bundles (profile-view, edit-profile-view) are emitted in the SSR HTML.

Stage Summary:
- 3 view files redesigned to match the new Petrol + Saffron design system.
- All functionality preserved: profile fetch by id, edit all 5 sections, connections accept/reject/chat, post fetch by userId.
- Fixed 2 pre-existing bugs: (1) profile-view imported PostCard from feed-view (which no longer exports it) → now imports from shared/post-card; (2) connections-view called apiPost (POST) on a PATCH-only endpoint → now uses api() with method:"PATCH".
- Design system compliance: Petrol primary, Saffron gold for verified/admin/premium, rose for danger. NO blue/indigo. Cards: shadow-card hover:shadow-lift rounded-2xl border-border/60. Buttons: rounded-xl font-semibold. EmptyState with `kind` prop. UserAvatar with verified gold badge. CategoryIcon for category chips. framer-motion staggered entrances (delay: i*0.05). Skeletons for loading. Persian numerals via toFa(). Mobile-first responsive (lg sidebar, sm breakpoint adjustments).
- LinkedIn-style profile header with overlapping square avatar, gradient banner (6 petrol/saffron variants hashed by userId), admin gold badge, action buttons row, clickable follower/following counts.
- Edit profile: 5 motion-staggered section cards with consistent SectionTitle pattern (icon chip + title), bio counters, province/city chained selects, phone-visible switch, category cards with removable skill badges, experience/education list items with delete + add-in-dialog flows.
- Connections: 3 clean tabs with count badges, motion-staggered person cards, accept/reject with PATCH, chat start with POST, "در انتظار پاسخ" gold badge for sent.
- Lint clean (0 errors, 0 warnings). Dev server compiles successfully.

---
Task ID: R2-UI
Agent: main
Task: UI redesign v2 — landing page, floating pills, settings, PDF resume, profile fix, auth two-mode

Work Log:
- Created settings store (theme mode light/dark/system, 6 color palettes, 4 Persian fonts) with localStorage persistence
- Added SettingsBootstrap component to apply settings on app load
- Updated layout.tsx with Vazirmatn + Cairo + Markazi Text Persian fonts
- Rewrote AppShell: removed mobile header, added floating pills (back=right, profile/notifications=left), floating chat FAB with pulse animation, removed footer entirely
- Added settings route to nav store + SettingsView with theme/color/font controls
- Created LandingView for guests (hero, features grid, how-it-works, CTA, "توسعه ادامه دارد" notice)
- Updated FeedView to show LandingView for non-logged-in users
- Rewrote AuthView with two-mode toggle (login=phone only / register=name+phone+nid), both desktop+mobile beautiful
- Fixed profile avatar overlap bug (changed card overflow-hidden → overflow-visible, banner rounded-t-2xl overflow-hidden)
- Implemented PDF resume: /api/resume/[userId] returns print-friendly HTML that auto-triggers window.print()
- Wired both PDF download buttons in profile-view to open resume URL in new tab

Stage Summary:
- All requested UI changes complete: landing page, floating pills, no mobile header, no footer, two-mode auth, settings page, PDF resume, profile avatar fix, chat FAB, removed build date
- Lint clean, no compile errors
- VLM: mobile landing 8/10, settings 8.5/10, profile avatar fixed
- Both servers (dev:3000, chat:3003) running

---
Task ID: T-Core
Agent: full-stack-developer (Core Views)
Task: Build Feed, Landing, Discover, Talents, Category views for talent platform

Work Log:
- Read worklog.md, globals.css (lime+forest palette, gradient utilities, animations), shared components (illustrations, empty-state, user-avatar, post-card), app-shell.tsx, lib/{nav,api-client,use-user,format,types,geo}.ts, prisma schema, and existing API routes (/api/posts, /api/categories, /api/talents). Confirmed data shapes (PostWithRelations, TalentListItem, CategoryWithSkills).
- Identified that previously-referenced classes (`bg-brand-gradient`, `bg-brand-gradient-soft`, `shadow-soft/card/lift/float`, `nums-fa`, `text-brand-gradient`) are NOT defined in globals.css — switched all new code to use the explicitly-defined lime/forest utilities (`bg-lime`, `bg-forest`, `bg-forest-gradient`, `bg-lime-gradient`, `bg-cream-gradient`, `text-lime`, `text-forest`, `text-gold`, `text-rose`, `bg-lime/15`, `bg-forest/10`, `shadow-sm/md/lg/xl`).
- WROTE landing-view.tsx: forest-gradient hero with floating lime/gold shapes + dotted overlay + "استعدادت رو کشف کن و نشون بده" headline (lime accent words), quick-access category grid (3-col mobile / 4-col sm) fetched from /api/categories with emoji circle cards, "چرا همتیم؟" feature grid (4 cards with colored icon badges), "چطور کار می‌کند؟" 4-step section on cream-gradient, lime-gradient CTA section with AuthIllustration + forest button + trust badges, dev notice pill.
- WROTE feed-view.tsx: if guest → <LandingView/>; if loading → skeleton; else feed with header (🌿 emoji accent), collapsible CreatePostBox (collapsed = "چه چیزی می‌خواهی به اشتراک بگذاری؟" + forest/lime sparkle button; expanded = textarea + chained category/skill Selects + lime "انتشار پست" button), empty-state if user has no skills → forest button "تکمیل پروفایل", sort toggle (جدیدترین/محبوب‌ترین as lime pill when active), PostCard list with stagger animation, skeleton loading, empty-state kind="posts".
- WROTE discover-view.tsx: header "کشف استعدادها ✨" + search input (lime focus ring), horizontal-scroll category chips (navigate to #/category/ID), sort toggle (recent/popular for posts), Promise.all fetch of /api/talents?sort=followers&q= and /api/posts?sort=, "استعدادهای برتر" section (mini talent cards in 2/3-col grid with avatar+name+bio+followers count, lime accent), "پست‌های جدید" section (PostCard list, max 10). 300ms debounce on search.
- WROTE talents-view.tsx: header with active count, filters card (search input + 2-col category/skill chained Selects + sort pills محبوب‌ترین/جدیدترین + clear button when filters active), responsive grid 1/2/3 cols, TalentCardLarge component (exported for reuse) with avatar+name+bio+location+category badges+followers count, framer-motion stagger, skeleton loaders, empty-state kind="people" with "پاک کردن فیلترها" action.
- WROTE category-view.tsx: forest-gradient hero header (emoji in lime rounded square, name, skill/talent counts with lime accents, floating shapes), skill filter pills row (horizontal scroll, "همه" + each skill, lime when active), TalentCardLarge grid (imported from talents-view to avoid duplication), skeleton + empty-state with conditional "نمایش همه" action when skill filter is active.
- Ran `bun run lint`: 0 errors in any of my 5 files (the only 3 lint errors are pre-existing in admin-view.tsx which I was instructed NOT to modify). dev.log clean — no compile errors.

Stage Summary:
- 5 core views rewritten with vibrant lime+forest design system, fully mobile-first.
- LandingView: beautiful hero with floating shapes, category quick-access, features, how-it-works, CTA.
- FeedView: guests see LandingView, logged-in users see CreatePostBox + sort + PostCard feed.
- DiscoverView: search + category chips + sort + "top talents" + "recent posts" mixed layout.
- TalentsView: full filter UI (search/category/skill/sort) + responsive talent card grid.
- CategoryView: forest-gradient hero + skill pills + talent grid (reuses TalentCardLarge).
- TalentCardLarge component exported from talents-view and imported by category-view (no duplication).
- All Persian text, toFa() for numbers, framer-motion stagger animations, lime CTAs, forest dark sections, cream background.
- No API routes / app-shell.tsx / page.tsx / layout.tsx / admin modified.

---
Task ID: T-Profile
Agent: full-stack-developer (Profile)
Task: Rebuild Profile, EditProfile, Connections views for talent platform

Work Log:
- Read worklog.md (prior tasks 0, 3-a..3-e, R-Profile, R2-UI) to understand the new Lime + Forest design system rewrite from jobs platform → talent discovery platform.
- Read prisma/schema.prisma (User, Profile, Category, Skill, UserCategory, UserSkill, Resume, ResumeExperience, ResumeEducation, Post, Connection models).
- Read src/app/globals.css — confirmed new design tokens: --lime (oklch(0.85 0.2 125)), --forest (oklch(0.32 0.05 165)), --gold (oklch(0.72 0.16 75)), --rose (oklch(0.62 0.2 15)), cream background, .bg-forest-gradient, .bg-lime-gradient, .bg-forest-lime-gradient, .bg-cream-gradient, .text-lime-gradient, .glass, .slim-scroll, .animate-float/.animate-pop/.animate-pulse-lime/.pb-safe.
- Read shared/{illustrations,empty-state,user-avatar,post-card}.tsx and lib/{nav,api-client,use-user,types,format,geo}.ts for the existing shared infrastructure (ProfileDetail, PostWithRelations, CategoryWithSkills types; toFa/formatCount/formatFaDate/timeAgoFa; PROVINCES/getProvinceName).
- Read existing 3 view files to preserve all data logic (profile fetch by id, edit 5 sections, connections PATCH /api/connections/[id], chat start POST, resume PDF download).
- **OVERWROTE profile-view.tsx** (~700 lines) with new Lime + Forest design:
  * New BANNER_GRADIENTS array (6 oklch variants — deep forest, forest→lime tint, green→lime, forest→success, forest→gold, green→rose). NO blue/indigo. Inline style for fine-grained control.
  * ProfileHeader: motion.div entrance; banner h-36 md:h-52 with gradient + radial highlight + dot pattern + 2 lime/20 blur orbs (decorative); banned badge top-left rose/90; verified badge top-right gold/95 with Award icon + shadow; Card uses overflow-visible + rounded-2xl, banner div uses overflow-hidden + rounded-t-2xl — this FIXES the avatar clip bug (avatar is now fully visible, sticking out below the banner); UserAvatar size="2xl" with ring-4 ring-card rounded-3xl; name + verified gold badge (bg-gold/15 text-gold border-gold/30 with Sparkles icon); bioShort line-clamp-2; meta row with MapPin/CalendarDays/Phone (all tinted text-forest, gated by phoneVisible); action buttons — self: outline border-forest text-forest hover:bg-forest/5 "ویرایش پروفایل"; other: ConnectionButton (lime primary bg-lime text-forest for follow/pending-received, gold outline for pending-sent, lime/40 disabled for accepted) + outline forest "چت" + ghost "رزومه" (opens /api/resume/USERID in new tab). Counts row with text-forest bold clickable followers/following + post count.
  * ConnectionButton: 4 states with UserPlus/Clock/UserCheck icons + Loader2 spinner when busy. Lime primary CTAs.
  * ProfileTabs: shadcn Tabs, 3-col grid TabsList rounded-2xl bg-muted/60 p-1 h-11, TabsTriggers with data-[state=active]:bg-lime data-[state=active]:text-forest for vibrant lime active state.
  * AboutTab: motion-wrapped cards. BioLong card with forest/10 icon chip (FileSignature). Categories card with lime/20 icon chip (Hash). Each category uses CategoryIcon (with emoji prop from c.iconUrl) + Separator + lime/15 skill badges (bg-lime/15 text-forest border-lime/30). Stagger delay i*0.05.
  * ResumeTab: motion Experiences card (forest/10 Briefcase icon chip) with vertical timeline (border-r-2 border-lime/40 in RTL, forest dot with ring-4 ring-card). Educations card (gold/15 GraduationCap icon chip) with gold/40 timeline + gold dot. Skill badges use lime/15.
  * PostsTab: fetches /api/posts?userId=ID, renders PostCard from "@/components/shared/post-card" with index. Empty state kind="posts" with lime "رفتن به فید" CTA for self. Loading skeleton.
  * QuickStatsCard sidebar (lg only): 2x2 grid of stat tiles with tinted icon chips (lime/forest/gold/rose per stat). Plus categories sidebar card (forest Hash icon, CategoryIcon per cat) and quick-actions card (forest bg-forest text-lime "ویرایش پروفایل" for self; forest outline "شروع گفتگو" + ghost "دانلود رزومه PDF" for others).
  * ProfileSkeleton: banner + avatar + name + counts + tabs skeleton with rounded-2xl.
  * NotFound: EmptyState kind="people" with lime "بازگشت به خانه" action.
- **OVERWROTE edit-profile-view.tsx** (~920 lines) with new Lime + Forest design:
  * Same BANNER_GRADIENTS as profile-view (forest/lime/gold/rose palette).
  * Centered max-w-3xl mx-auto. Header with title + subtitle + ghost "مشاهده پروفایل" button.
  * Section quick-nav chips (rounded-full bg-muted hover:bg-lime/20 hover:text-forest) — click scrolls into view via scrollIntoView (preventDefault so hash routing isn't disturbed).
  * SectionWrapper motion.div with staggered delays (0.05..0.25).
  * PhotosBioSection (ImageIcon): banner preview rounded-2xl with lime/20 blur orb; 7-option RadioGroup (6 gradients + custom URL) with selected border-forest shadow-md scale-105; UserAvatar size="xl" preview + URL Input; bioShort Input with toFa counter (200); bioLong Textarea with counter (4000); lime "ذخیره" button.
  * LocationSection (MapPin): province/city chained Selects rounded-2xl; phone-visible Switch in rounded-2xl bg-lime/10 border-lime/20 card with forest/10 Phone icon chip; lime "ذخیره".
  * CategoriesSection (Hash): per-category Card with CategoryIcon (emoji prop) header; skills as lime/15 badges with X close (hover:bg-rose/20 hover:text-rose); add-skill ghost button text-forest hover:bg-lime/15; remove-category ghost button hover:bg-rose/10. Add-category dialog lists available cats with CategoryIcon + Plus (hover:bg-lime/15). Add-skill dialog similar.
  * ExperienceSection (Briefcase): list items with forest/10 Briefcase icon chip, lime/15 skill badges, delete hover:bg-rose/10; add dialog with all fields (job title, organization, dates, description, category+skill selects). Lime "افزودن" button.
  * EducationSection (GraduationCap): list items with gold/15 GraduationCap icon chip; add dialog with degree/institution/year/description. Lime "افزودن".
  * SectionTitle helper: forest/10 icon chip + bold title (consistent across sections).
  * Login prompt if !user: forest/10 Lock icon, lime "ورود / ثبت‌نام" button.
  * EditSkeleton with rounded-2xl shapes.
- **OVERWROTE connections-view.tsx** (~470 lines) with new Lime + Forest design:
  * Header with bg-forest text-lime Users icon chip in rounded-2xl shadow-md.
  * 3 Tabs (rounded-2xl bg-muted/60 p-1 h-12): pending (UserPlus)/accepted (UserCheck)/sent (Inbox) with count badges. Active tab uses data-[state=active]:bg-lime data-[state=active]:text-forest. Count badges: pending=gold/15 text-gold border-gold/30, accepted=forest/10 text-forest border-forest/20, sent=secondary muted.
  * PersonRow motion.div with stagger delay min(index*0.05, 0.3), Card rounded-2xl shadow-card hover:shadow-lift, UserAvatar size="lg" with verified gold badge, clickable name (hover:text-forest) → profile, timeAgoFa.
  * PendingCard: "پذیرش" lime primary (Check/Loader2) + "رد" outline text-rose border-rose/30 hover:bg-rose/5 — uses `api()` with method:"PATCH" (preserved from prior fix).
  * AcceptedCard: "چت" forest outline (MessageCircle/Loader2) → POST /api/chat/start → navigate to chat.
  * SentCard: "در انتظار پاسخ" gold badge (bg-gold/15 text-gold border-gold/30).
  * Empty states kind="connections" for all 3 tabs with forest outline "کشف استعدادها" CTA → discover view (replaces obsolete "people" view).
  * Login prompt if !user: forest/10 Lock icon, lime "ورود / ثبت‌نام" button.
  * ListSkeleton with rounded-2xl shapes.
- All 3 files use `"use client"`, framer-motion staggered entrances, lime+forest design system, NO blue/indigo.
- Ran `bun run lint` — my 3 files have ZERO errors. (3 remaining errors are pre-existing in admin-view.tsx which I'm not allowed to modify per task constraints.)
- Ran `bunx tsc --noEmit` — my 3 files have ZERO TypeScript errors. (All TS errors are in admin/*, jobs-view, chat-view, notifications-view which I'm not allowed to modify.)
- Read dev.log — Next.js 16.1.3 (Turbopack) compiled successfully; the dev server is managed by the system per instructions ("bun run dev will be run automatically by the system. Do NOT run it.").

Stage Summary:
- 3 view files rebuilt to match the new Lime + Forest talent discovery design system (vibrant lime for CTAs/active, deep forest for hero/dark sections, gold for verified, rose for danger).
- All functionality preserved: profile fetch by id (supports id="me"), edit all 5 sections (photos/bio, location, categories/skills, experiences, educations), connections accept/reject/chat (PATCH for accept/reject, POST /api/chat/start for chat), post fetch by userId with PostCard, resume PDF download via /api/resume/[userId].
- **FIXED the avatar clip bug**: Card uses `overflow-visible` (so the avatar sticks out below the banner), and only the banner div uses `overflow-hidden` (so the gradient/image is clipped to rounded-t-2xl). Avatar is now fully visible at size 2xl with ring-4 ring-card rounded-3xl.
- Design system compliance: Lime (bg-lime text-forest) for primary CTAs/active tabs, Forest (bg-forest text-lime) for dark sections/quick-actions, Gold for verified/premium/pending-sent, Rose for danger/reject. NO blue/indigo. Cards: rounded-2xl shadow-card hover:shadow-lift border-border/60. Buttons: rounded-2xl font-bold. EmptyState with `kind` prop (people/connections/posts/generic). UserAvatar with verified gold BadgeCheck. CategoryIcon with emoji prop (iconUrl from category). framer-motion staggered entrances (delay: i*0.05). Skeletons for loading. Persian numerals via toFa(). Mobile-first responsive (lg sidebar, sm breakpoint adjustments).
- iOS-quality talent portfolio profile header: forest gradient banner with decorative lime blur orbs, overlapping square avatar, gold verified badge corner banner, action buttons row, clickable follower/following counts (text-forest bold).
- Edit profile: 5 motion-staggered section cards with consistent SectionTitle pattern (forest/10 icon chip + bold title), lime/20 hover chips for section quick-nav, lime "ذخیره"/"افزودن" primary buttons, lime/15 skill badges with rose hover-delete, lime-tinted phone-visible switch card.
- Connections: 3 clean tabs with lime active state + colored count badges (gold/forest/muted), motion-staggered person cards, lime "پذیرش" + rose "رد" buttons, forest outline "چت", gold "در انتظار پاسخ" badge. Empty states kind="connections" with forest outline "کشف استعدادها" CTA.
- Lint clean for my 3 files (0 errors). TypeScript clean for my 3 files (0 errors). Pre-existing errors in admin-view.tsx, jobs-view.tsx, chat-view.tsx, notifications-view.tsx are out of scope per task instructions ("Do NOT modify ... admin panel" + "Only overwrite the 3 view files").

---
Task ID: T-Chat
Agent: full-stack-developer (Chat)
Task: Rebuild Chat, Notifications, Tickets, TicketDetail views with lime+forest design

Work Log:
- Read worklog.md (prior tasks 0, 3-a..3-e, R-Profile, T-Profile) + all design system files (globals.css, illustrations, empty-state, user-avatar, feed-view, app-shell) + 4 existing view files to preserve functionality.
- **OVERWROTE chat-view.tsx** (~787 lines): forest icon chip + lime accents; desktop two-pane `lg:grid-cols-[1fr_320px]` (chat left, list right RTL); mobile list/chat toggle with back; ChatList with search + lime active pill; ChatThread header bg-forest text-white with lime typing dots; messages per spec (own=bg-forest text-white rounded-tl-md on LEFT/items-end, other=bg-card border rounded-tr-md on RIGHT/items-start) on bg-cream-gradient; lime circle send button (motion whileTap/whileHover, Send -scale-x-100 for RTL); socket.io preserved EXACTLY `io("/", { path:"/", query:{ XTransformPort:"3003" }, auth:{ userId } })` with join/message/typing events, optimistic send, auto-scroll; empty states kind="chat".
- **OVERWROTE notifications-view.tsx** (~298 lines): forest Bell chip + lime pulse for unread; "همه خوانده شد" outline border-forest; cards with icon circles per spec (connection=forest, broadcast=lime, chat=forest, job_match=gold); unread=bg-lime/5 border-lime/30 with spring-animated lime dot; FIXED pre-existing TS errors (invalid routes people→talents, explore→discover, jobs/job→feed via handleLink+Route type); empty kind="notif".
- **OVERWROTE tickets-view.tsx** (~316 lines): forest TicketIcon chip + lime "تیکت جدید" CTA; cards with lime/20 open icon + forest hover; StatusBadge open=bg-lime/20 text-forest border-lime/40, closed=bg-muted+Lock; create dialog with lime submit; empty kind="tickets".
- **OVERWROTE ticket-detail-view.tsx** (~525 lines): header card with lime/forest status icons; thread header bg-forest text-lime; bubbles per spec (creator=RIGHT bg-forest text-white rounded-tl-md, admin=LEFT bg-lime/15 border-lime/40 rounded-tr-md) on bg-cream-gradient; reply box with lime send + rose close (AlertDialog confirm); admin sidebar preserved (verify/ban with gold/rose AlertDialogs); empty kind="tickets".
- All 4: "use client", framer-motion staggered, lime+forest palette, NO blue/indigo, mobile-first, rounded-2xl shadow-sm, Persian toFa(), .slim-scroll.

Stage Summary:
- 4 view files rebuilt to lime+forest design system. All functionality preserved (socket.io real-time chat, mark-read/mark-all-read, ticket CRUD, admin actions).
- Socket.io uses XTransformPort=3003 query, path "/" — no direct localhost URL.
- Spec compliance verified: Lime CTAs/active/unread, Forest dark headers/own+creator bubbles, Gold verified/job_match, Rose close/ban. NO blue/indigo.
- Lint clean for my 4 files (0 errors; 3 pre-existing in admin-view.tsx out of scope). TypeScript clean for my 4 files (0 errors; also FIXED pre-existing TS errors in chat-view.tsx and notifications-view.tsx by replacing invalid Route views).
- See /agent-ctx/T-Chat-full-stack-developer.md for full details.

---
Task ID: T-Final
Agent: main
Task: Complete rewrite to talent discovery platform — verification

Work Log:
- Rewrote Prisma schema: removed JobPost/JobApplication, added AdminUser (username+password), added Category.order field
- Rewrote auth: user=phone+OTP (no nationalId), admin=separate username+password with own cookie/session
- Created 20 talent categories with emoji icons (music, cooking, sports, design, etc.) + 120+ skills
- New design system: lime+forest green palette, cream background, vibrant not minimal
- New AppShell: mobile-first, floating pills (back+profile), bottom nav (Home/Discover/Talents/More), floating chat FAB
- New AuthView: talent-focused, name+phone+OTP, beautiful mobile+desktop
- Admin panel: simple, separate login (admin/admin123), tabs (overview/users/categories/posts/broadcast)
- Delegated core views (feed/landing/discover/talents/category), profile+connections, chat+notifications+tickets to 3 subagents
- All views rebuilt with lime+forest design

Stage Summary:
- Complete project rewrite from jobs platform to talent discovery platform
- Admin auth fully separate (username+password, no OTP/nationalId)
- 20 talent categories, mobile-first UI, lime+forest palette
- Lint: 0 errors. VLM: landing 8/10, mobile 7.5/10, profile 8/10 (avatar fixed)
- Both servers running (dev:3000, chat:3003)
- Admin login: admin / admin123 (at #/admin)
- User demo: any phone + OTP 1234

---
Task ID: V3-Core
Agent: full-stack-developer (Core Views v3)
Task: Rebuild Feed (3 sections), Following, Discover (2 sections + strong filters), Talents (full-width filters), Category views

Work Log:
- Read worklog.md, globals.css (calm petrol-teal palette), illustrations.tsx, empty-state.tsx, user-avatar.tsx (gender prop), post-card.tsx, app-shell.tsx (swipe-up dock + floating pills), existing feed/discover/talents/category/landing view stubs, nav.ts, types.ts, format.ts, geo.ts, api-client.ts, use-user.ts, /api/feed/home, /api/feed/following, /api/posts, /api/talents, /api/connections.
- Rebuilt **landing-view.tsx** — Solid `bg-primary text-primary-foreground` hero (NO gradients, NO lime/forest), warm `bg-accent` CTA section, category quick-access grid with emoji circle cards, FEATURES grid, "چطور کار می‌کند؟" steps, bottom CTA + dev notice "توسعه‌ی این صفحه ادامه دارد".
- Rebuilt **feed-view.tsx** — Fetches `/api/feed/home`. 3 staggered sections: (1) پست‌های دنبال‌شوندگان (vertical PostCard list, with empty prompt for new users linking to discover); (2) استعدادهای مرتبط (horizontal scroll of TalentMiniCard with avatar + name + bio + follow button → POST /api/connections); (3) افراد هم‌مهارت (2-col grid of TalentSquareCard with avatar + follow button). Collapsible CreatePostBox at top. SectionHeader with count badge + "همه" link. Uses UserAvatar with `gender` prop. Loading skeleton. Reload-on-create via reloadKey.
- Rebuilt **following-view.tsx** — Dedicated page for posts from followed users only. Title "دنبال‌شده‌ها" with subtitle. Sort toggle (recent/popular). Fetches `/api/feed/following?sort=`. EmptyState kind="posts" with CTA to discover when no posts. Stagger animations on PostCard list.
- Rebuilt **discover-view.tsx** — Strong filters: text search + collapsible "فیلترهای دقیق" panel with Category select (chained), Skill select (chained), Province select (chained), City select (chained), sort toggle (recent/popular for posts, recent/followers for users). Category quick-chips row (horizontal scroll). Active filter chips (removable) below search. Tab switcher: پست‌ها | کاربران. Posts tab fetches `/api/posts?sort=` then filters client-side by categoryId/skillId/q. Users tab fetches `/api/talents?...` with all filters server-side. EmptyState kind="posts" or "people" with CTA. Loading skeletons.
- Rebuilt **talents-view.tsx** — Full-width stacked filters (Row 1: Category full-width, Row 2: Skill full-width chained, Row 3: text search full-width, Row 4: Province + City side-by-side, Row 5: Sort toggle + Clear). Grid of TalentCardLarge (1 col mobile, 2 col sm, 3 col lg). Each card: UserAvatar (lg, with gender), name + verified badge, bio, city, category badges, follower count. Exports `TalentCardLarge` for reuse by CategoryView.
- Rebuilt **category-view.tsx** — Solid petrol-teal hero header with category emoji, name, counts (skills + talents). Skill filter pills (horizontal scroll, "همه" + skills). Back-to-discover button + result count. Talent grid using shared `TalentCardLarge` from talents-view. Fetches `/api/talents?categoryId=ID&skillId=...&sort=followers`.
- All views use `"use client"`, framer-motion `initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}`, `toFa()` for Persian numbers, calm palette (NO gradients, NO neon, NO indigo/blue, NO lime/forest/cream), mobile-first single-column layouts with `rounded-2xl` cards and `border border-border` shadows.
- Verified: `bun run lint` passes with no errors. dev.log shows clean compile. Browser-tested all 6 views with iPhone 14 viewport: landing renders hero+categories+features+CTA+dev-notice; discover shows category chips, tab switcher (پست‌ها ۱۲ | کاربران ۰), filter panel expands correctly with 4 chained selects; talents shows 14 talent cards with full-width stacked filters; following shows empty-state with CTA; category view (id=cmsg6dt52001bof3el9np4uso) shows hero "آشپزی و شیرینی‌پزی", 9 skill pills, 1 talent result; feed shows landing for guests.

Stage Summary:
- 6 core views rebuilt with V3 calm petrol-teal design system, mobile-first iOS-quality
- NO gradients, NO neon, NO blue/indigo/lime/forest/cream — solid colors only via `bg-primary`, `bg-card`, `bg-accent`, `bg-secondary`, `bg-muted`
- All animations use framer-motion with subtle y/scale transitions (`[0.16, 1, 0.3, 1]` easing, 0.35s duration)
- All Persian text, `toFa()` for numbers, `formatCount` for follower counts
- UserAvatar uses new `gender` prop on every avatar render
- TalentCardLarge exported from talents-view and imported by category-view (no duplication)
- Follow button on feed's TalentMiniCard/TalentSquareCard triggers POST /api/connections (auto-accepts pending-received, otherwise sends request)
- Lint passes, dev compiles cleanly, all routes render correctly in browser test

---
Task ID: V3-Profile-Chat
Agent: full-stack-developer (Profile + Chat v3)
Task: Rebuild Profile (circular avatar, gender, upload), EditProfile (upload + gender), Chat (message requests, status header, requests section)

Work Log:
- Read worklog.md, prisma/schema.prisma (Profile.gender, Conversation.status + initiatorId), globals.css (NEW calm petrol-teal palette: --primary oklch(0.4 0.05 200), warm off-white bg, --gold/--rose/--success/--warning/--teal tokens, NO gradients/neon utilities, .glass/.glass-strong/.slim-scroll/.animate-*).
- Read shared infrastructure: user-avatar.tsx (UserAvatar accepts gender prop; sizes xs→2xl where 2xl = w-28 h-28; rounded-full + ring-2 ring-background; renders male=teal or female=coral default avatar), illustrations.tsx (CategoryIcon with emoji prop, EmptyIllustration kinds), empty-state.tsx (EmptyState with kind prop, motion fade-in-up), post-card.tsx, app-shell.tsx (floating pills + bottom dock + chat FAB; passes gender={user.profile?.gender} to UserAvatar).
- Read API routes to confirm shapes: /api/profile/[id] (ProfileDetail now includes gender), /api/profile/me (PUT accepts gender: "male"|"female"|null), /api/upload (multipart file + type "avatar"|"banner", returns {ok,url}, updates profile), /api/chat/conversations (returns {conversations:[active+my own pending as myRequestPending], requests:[their pending_request for me], unreadCount}), /api/chat/start ({userId,initialMessage?} → {conversationId, status:"active"|"pending_request"}), /api/chat/conversations/[id]/respond ({action:"accept"|"reject"}), /api/chat/conversations/[id]/messages (returns {conversation:{otherUser}, messages}), /api/chat/conversations/[id]/read (POST marks as read).
- Read existing profile-view.tsx + edit-profile-view.tsx + chat-view.tsx — confirmed they used OLD lime/forest palette + bg-cream-gradient (no longer defined in globals.css). Rewrote all 3 to use ONLY bg-primary/text-primary-foreground/bg-card/bg-muted/border-border tokens from the new calm palette.
- **OVERWROTE profile-view.tsx**: Card overflow-visible (FIXES avatar clip bug), banner div h-40 md:h-44 overflow-hidden rounded-t-2xl bg-primary solid petrol-teal (NO gradient) with subtle radial highlight + dotted pattern when no bannerUrl uploaded. UserAvatar size="2xl" (w-28 h-28) with gender prop, ring-4 ring-card — NO rounded-3xl override (keeps UserAvatar's natural rounded-full = perfect circle). Header shows name + gold verified badge + gender badge (مرد/زن) + bio + city + join date + phone (if visible). Action buttons: self → outline "ویرایش پروفایل"; other → ConnectionButton (دنبال کردن/در انتظار gold/متصل disabled/پذیرش درخواست) + outline "پیام" (POST /api/chat/start → if status="active" navigate chat with convId, else toast "درخواست پیام ارسال شد") + ghost "رزومه" (window.open resume URL). Clickable followers/following + post counts in text-primary. Tabs 3-col rounded-2xl bg-muted/60 with data-[state=active]:bg-primary text-primary-foreground. About tab: bioLong card + اطلاعات کلی card (gender/موقعیت/عضو از) + categories with CategoryIcon + Separator + skill badges. Resume tab: timeline border-r-2 border-primary/30 with primary dots, education timeline border-gold/40 with gold dots. Posts tab: PostCard list. Sidebar: QuickStatsCard 2x2 grid + categories card + quick-actions card. ProfileSkeleton with rounded-2xl + rounded-t-2xl banner. NotFound EmptyState kind="people" with primary CTA.
- **OVERWROTE edit-profile-view.tsx**: 6 sections in order: PhotosBio (upload), Gender (NEW), Location, Categories/Skills, Experience, Education. NEW PhotosBioSection: avatar upload via POST /api/upload multipart with type="avatar" (hidden file input + "آپلود عکس" button with Loader2 spinner) + banner upload via POST /api/upload type="banner" + URL inputs as fallback + bioShort/bioLong with toFa() counters. NEW GenderSection: RadioGroup with 3 cards مرد/زن/نامشخص, each card has icon + label, active = border-primary bg-primary/5 shadow-sm + primary icon circle. Saves via PUT /api/profile/me with gender: "male"|"female"|null. Location: province/city chained Selects + phone-visible Switch in primary/8 card. Categories/Skills: per-category Card with CategoryIcon + lime→primary/10 tinted skill badges + X hover-rose delete + add-skill/add-category dialogs. Experience + Education: list items + add dialogs with primary submit buttons. SectionTitle helper: primary/10 icon chip + bold title. Section quick-nav chips: rounded-full bg-muted hover:bg-primary/15 hover:text-primary. Login prompt if !user with primary CTA.
- **OVERWROTE chat-view.tsx**: This is the BIG rewrite with NEW message requests system. PageHeader: primary icon chip + "پیام‌ها جدید"/"درخواست" badges + outline "همکاران" button. ChatListPanel (right pane in RTL desktop, full-width on mobile): tabs "پیام‌ها" | "درخواست‌ها" with count badges (active=primary bg, requests=warning bg), search input, scrollable list. ConversationRow: UserAvatar with gender + unread count badge (primary bg) + name + last message preview + time; requests show inline "تأیید" (primary) + "رد" (outline rose) buttons. ChatThread: header bg-primary text-primary-foreground with ArrowRight back button (mobile) + UserAvatar (clickable to profile) + name + status badge BELOW name (active=✓ "دنبال‌شده"; pending+I'm initiator=Clock "در انتظار تأیید درخواست"; pending+I'm receiver=Bell "درخواست پیام جدید"). Messages area bg-background with own msgs=bg-primary text-primary-foreground rounded-tl-md (RIGHT), other msgs=bg-card border rounded-tr-md (LEFT). Auto-scroll, motion slide-in. Input area varies by status: active=Textarea + primary round send button (motion whileTap/whileHover, Send -scale-x-100); pending+my request=warning/10 card "در انتظار تأیید درخواست" no input; pending+their request="تأیید"/"رد" buttons. Accept → re-fetch messages + list. Reject → navigate back to chat. Socket.io PRESERVED EXACTLY: io("/", { path:"/", query:{ XTransformPort:"3003" }, auth:{ userId } }) with join/message/typing events, optimistic send, mark-read on view (POST /api/chat/conversations/[id]/read). On incoming message → if active conv → append + mark read; always refresh conversations list. Empty states kind="chat" with appropriate per-status title/description.
- FIX: chat "no collaboration" bug — chat now works between accepted connections (status="active" → full chat with input) AND for non-connections (status="pending_request" → message request flow with accept/reject, no input until accepted). Socket.io uses XTransformPort=3003 query, path "/".
- Ran `bun run lint` — 0 errors in any file (lint clean across entire project).
- Ran `bunx tsc --noEmit` — 0 errors in my 3 files. (Pre-existing TS errors in api/admin, api/profile, api/tickets routes are out of scope per task constraints "Do NOT modify API routes".)
- Checked dev.log — multiple "✓ Compiled in Xms" entries, NO errors, NO warnings, NO module-not-found. All API routes returning 200.

Stage Summary:
- 3 view files rebuilt to NEW calm petrol-teal palette (bg-primary/text-primary-foreground, gold for verified, rose for danger, warning for pending). NO gradients, NO neon, NO lime/forest (those classes no longer exist in globals.css).
- profile-view: circular BIGGER avatar (size 2xl = w-28 h-28, perfect rounded-full), solid petrol-teal banner (h-40), banner-only overflow-hidden (FIXES avatar clip bug), gender badge, gender in About tab, clickable counts, primary CTAs, motion animations.
- edit-profile: avatar upload (POST /api/upload type=avatar) + banner upload (POST /api/upload type=banner) with file inputs + Loader2 spinners + URL fallback inputs, NEW GenderSection (RadioGroup مرد/زن/نامشخص saved via PUT /api/profile/me gender), all 5 existing sections preserved with primary palette.
- chat-view: TWO tabs (پیام‌ها + درخواست‌ها), requests section with تأیید/رد buttons, status header badge (active=دنبال‌شده green-implicit; my-pending=amber "در انتظار تأیید"; their-pending=amber "درخواست پیام جدید"), input area varies by conversation status (active=normal input; my-pending=message only; their-pending=accept/reject buttons), socket.io preserved with XTransformPort=3003 + path "/", mark-read on view, real-time message receive + auto-scroll.
- All files use "use client" at top, framer-motion staggered entrances, mobile-first responsive (lg:grid-cols-[1fr_320px] for desktop, full-width stack on mobile with back button), toFa() Persian numerals, .slim-scroll for long lists, EmptyState kind="chat"/"people"/"posts" with appropriate actions.
- No API routes modified, no app-shell/page.tsx/layout.tsx/admin files modified.

---
Task ID: V3-Final
Agent: main
Task: Major redesign — calm palette, iOS mobile UX, chat message requests, gender avatars, scroll-to-top, swipe dock

Work Log:
- New calm palette: deep petrol-teal primary, warm off-white bg. NO gradients, NO neon. Solid colors only.
- Removed theme color picker from settings (now just light/dark/system mode + font)
- Schema: added gender field to Profile, status/initiatorId to Conversation for message requests
- Created /api/upload for avatar/banner photo upload (saves to /public/uploads)
- Created /api/feed/home (3 sections: followed posts, relevant talents, same-skill people)
- Created /api/feed/following (posts from followed users only)
- Rewrote /api/chat/start: if connected → active conversation; if not → pending_request + message + notification
- Created /api/chat/conversations/[id]/respond (accept/reject message requests)
- Created /api/chat/conversations/[id]/read (mark messages read)
- Updated /api/chat/conversations to return { conversations, requests, unreadCount }
- New UserAvatar with gender prop: renders male (teal) or female (coral) default avatar
- New AppShell: back button (top-right with margin, small), liquid-glass floating dock with blur, swipe-up dock (drag to reveal more items), scroll-to-top on navigation, iOS page animations, chat FAB with unread count badge
- Added "following" route to nav + FollowingView
- Delegated 6 core views (feed/landing/following/discover/talents/category) + 3 profile/chat views to 2 subagents

Stage Summary:
- All requested changes implemented
- Calm professional palette (no neon, no gradients) — VLM: landing 8/10, profile 9/10, dock 8/10
- Mobile-first iOS-quality: liquid glass dock, swipe-up, back button, scroll-to-top, page animations
- Chat system fixed: message requests for non-connections, requests section, status header
- Gender field + default male/female avatars + photo upload for avatar/banner
- Home page has 3 sections (followed posts, relevant talents, same-skill people)
- Following page with bottom nav button
- Discover with strong filters + 2 sections (posts/users)
- Talents with full-width stacked filters
- Lint: 0 errors. Both servers running.
