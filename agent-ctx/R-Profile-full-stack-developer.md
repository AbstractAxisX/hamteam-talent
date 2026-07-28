---
Task ID: R-Profile
Agent: full-stack-developer (Profile Redesign)
Task: Redesign Profile, EditProfile, Connections views

Work Log:
- Read worklog.md (prior tasks 0, 3-a..3-e), globals.css (Petrol + Saffron tokens: --primary deep petrol, --gold saffron, --rose, --success, shadow-card/lift/float, bg-brand-gradient utilities), shared/illustrations.tsx (LogoMark, EmptyIllustration kinds, CategoryIcon), shared/empty-state.tsx (EmptyState with `kind` prop, motion-wrapped), shared/user-avatar.tsx (UserAvatar sizes xs..2xl, verified → gold BadgeCheck, VerifiedBadge), shared/post-card.tsx (PostCard signature: { post, index }), feed-view.tsx (SortButton, CreatePostBox patterns), app-shell.tsx (route→view switch, mobile bottom nav, desktop top nav), nav.ts, use-user.ts, api-client.ts, format.ts (toFa, formatCount, formatFaDate, timeAgoFa), geo.ts (PROVINCES, getProvinceName), types.ts (ProfileDetail, PostWithRelations, CategoryWithSkills).
- Read existing 3 target files: profile-view.tsx (713 lines, had a broken import `PostCard from "@/components/views/feed-view"` since feed-view no longer exports PostCard — this was the cause of runtime 500 errors), edit-profile-view.tsx (1082 lines, emerald gradient banners), connections-view.tsx (439 lines, used `apiPost` (POST) to call /api/connections/[id] but API only accepts PATCH → bug).
- Verified /api/connections/[id]/route.ts exports only PATCH (the existing apiPost call would have returned 405).
- Verified /api/profile/me/route.ts GET returns full ProfileDetail; PUT accepts avatarUrl/bannerUrl/bioShort/bioLong/province/city/phoneVisible.
- **OVERWROTE profile-view.tsx** (≈660 lines):
  * New BANNER_GRADIENTS array uses 6 oklch petrol+saffron+rose linear-gradients (NO blue/indigo, NO Tailwind from-/via-/to- color classes that mapped to emerald/teal). Inline `style={{ background }}` for fine-grained control.
  * ProfileHeader: motion.div entrance; banner h-36 md:h-52 with gradient + radial highlight + dot pattern overlay; banned badge top-left with rose/90; UserAvatar size="2xl" with `ring-4 ring-card rounded-3xl` (square LinkedIn-style avatar) overlapping banner via -mt-14 md:-mt-16; name + admin badge in gold (bg-gold/15 text-gold border-gold/30) + Sparkles icon; bioShort line-clamp-2; meta row with MapPin/CalendarDays/Phone (phone only if phoneVisible); action buttons row with rounded-xl font-semibold — self → "ویرایش پروفایل" (outline); other → ConnectionButton + "چت" (outline) + "رزومه" (ghost). Counts row with pt-4 border-t: following/followers clickable (navigate to connections), post count non-clickable.
  * ConnectionButton: 4 states (none/pending-sent/pending-received/accepted) with appropriate icons (UserPlus/Clock/UserCheck) and Loader2 spinner when busy.
  * ProfileTabs: shadcn Tabs, 3-col grid TabsList rounded-xl, TabsTriggers rounded-lg font-semibold.
  * AboutTab: motion-wrapped cards (bioLong card with FileSignature header, categories card with Hash header). Each category uses CategoryIcon (3D chip from illustrations.tsx) + Separator + skill badges (outline border-primary/30 text-primary). Stagger delay i*0.05.
  * ResumeTab: motion-wrapped Experiences card (Briefcase header) with vertical timeline (border-r-2 in RTL, primary dot with ring-4 ring-card). Educations card (GraduationCap header) with gold dot for variety. Stagger.
  * PostsTab: fetches /api/posts?userId=ID, renders PostCard from "@/components/shared/post-card" with index for stagger. Loading skeleton with avatar + 2 text lines. Empty state kind="posts" with optional "رفتن به فید" CTA for self.
  * QuickStatsCard sidebar (lg only): 2x2 grid of stat tiles with bg-muted/50 hover:bg-muted, icons in primary. Plus categories sidebar card (Hash header, secondary badges) and quick-actions card (MessageCircle chat / Download PDF / Pencil edit-profile depending on isSelf).
  * ProfileSkeleton: banner + avatar + name skeleton + counts row + tabs skeleton.
  * NotFound: EmptyState kind="people" with "بازگشت به خانه" action.
- **OVERWROTE edit-profile-view.tsx** (≈920 lines):
  * Same BANNER_GRADIENTS petrol+saffron palette.
  * Centered max-w-3xl mx-auto.
  * Header with title + subtitle + "مشاهده پروفایل" ghost button (with ChevronLeft).
  * Section quick-nav chips (rounded-full bg-muted hover:bg-primary/10) for the 5 sections — click scrolls into view via scrollIntoView (preventDefault so hash routing isn't disturbed).
  * SectionWrapper motion.div with staggered delays (0.05..0.25).
  * PhotosBioSection (ImageIcon): banner preview (rounded-2xl), 7-option RadioGroup (6 gradients + custom URL) with selected border-foreground, avatar UserAvatar size="xl" preview + URL Input, bioShort Input with counter (200 chars), bioLong Textarea with counter (4000 chars), Save button.
  * LocationSection (MapPin): province/city Selects (chained, city disabled until province chosen), phone-visible Switch in rounded-2xl bg-muted/40 card with Phone icon in primary/10 chip.
  * CategoriesSection (Hash): per-category Card with CategoryIcon header, skills as outline badges with X close button (hover:rose), add-skill and remove-category ghost buttons. Add-category dialog lists available cats with CategoryIcon + Plus. Add-skill dialog lists available skills.
  * ExperienceSection (Briefcase): list items with Briefcase icon in brand-gradient-soft chip, jobTitle @ organization, dates (ltr), description (line-clamp-2), category+skill badges. Delete button (hover:rose). Add dialog with jobTitle/organization/startDate/endDate/description/categoryId/skillId fields.
  * EducationSection (GraduationCap): list items with GraduationCap icon in gold/15 chip, degree, institution, year, description. Delete + add dialog.
  * SectionTitle helper: icon in primary/10 chip + title (consistent across sections).
  * EditSkeleton: header + 2 cards with skeletons.
  * Login prompt if !user: Lock icon in primary/10, "ورود / ثبت‌نام" button.
- **OVERWROTE connections-view.tsx** (≈478 lines):
  * Centered max-w-2xl mx-auto.
  * Header: Users icon in bg-brand-gradient (petrol) rounded-2xl shadow-soft chip + title + subtitle.
  * Tabs (rounded-xl, h-11): pending/accepted/sent with count badges — pending uses gold/15 text-gold, accepted uses primary/10 text-primary, sent uses muted. TabsTrigger rounded-lg font-semibold, responsive text-xs sm:text-sm.
  * PersonRow: motion.div with stagger delay = min(index*0.05, 0.3). Card with border-border/60 shadow-card hover:shadow-lift. UserAvatar size="lg" with verified prop (gold badge auto-rendered). Name (clickable → profile), bioShort (line-clamp-1), timeAgoFa. Actions column on the side.
  * PendingCard: "پذیرش" (primary, Check icon, Loader2 when acting) + "رد" (outline text-rose border-rose/30, X icon). Uses `api()` with method:"PATCH" and JSON.stringify body to call /api/connections/[id] correctly (was a bug before — used POST which returned 405).
  * AcceptedCard: "چت" (outline, MessageCircle icon, Loader2 when starting). Calls /api/chat/start POST → navigates to chat with conversationId.
  * SentCard: "در انتظار پاسخ" badge with gold border + Clock icon.
  * Empty states: kind="connections" for all 3 tabs, with "پیدا کردن همکار" CTA → people view.
  * Login prompt if !user: Lock icon, "ورود / ثبت‌نام" button.
  * ListSkeleton: 4 cards with avatar circle + 3 text lines + 2 action button skeletons.
- Lint: ran `bun run lint` — 0 errors, 0 warnings.
- Dev log: confirmed no compile errors after the fix; the previous "Fast Refresh had to perform a full reload" was from the pre-existing broken PostCard import in the old profile-view, which is now fixed by importing from "@/components/shared/post-card".

Stage Summary:
- 3 view files redesigned (profile-view.tsx, edit-profile-view.tsx, connections-view.tsx) to match the new Petrol + Saffron design system.
- All functionality preserved: profile fetch by id, edit all 5 sections, connections accept/reject/chat, post fetch by userId.
- Fixed 2 pre-existing bugs along the way: (1) profile-view imported PostCard from feed-view (which no longer exports it) — now imports from shared/post-card; (2) connections-view called apiPost (POST) on a PATCH-only endpoint — now uses api() with method:"PATCH".
- Design system compliance: Petrol primary, Saffron gold for verified/admin/premium, rose for danger. NO blue/indigo. Cards use shadow-card hover:shadow-lift rounded-2xl border-border/60. Buttons use rounded-xl font-semibold. EmptyState with kind prop. UserAvatar with verified gold badge. CategoryIcon for category chips. framer-motion staggered entrances (delay: i*0.05). Skeletons for loading. Persian numerals via toFa(). Mobile-first responsive (lg sidebar, sm breakpoint adjustments).
- LinkedIn-style profile header with overlapping square avatar, gradient banner (6 petrol/saffron variants hashed by userId), admin gold badge, action buttons row, clickable follower/following counts.
- Edit profile: 5 motion-staggered section cards with consistent SectionTitle pattern (icon chip + title), bio counters, province/city chained selects, phone-visible switch, category cards with removable skill badges, experience/education list items with delete + add-in-dialog flows.
- Connections: 3 clean tabs with count badges, motion-staggered person cards, accept/reject with PATCH, chat start with POST, "در انتظار پاسخ" gold badge for sent.
- Lint clean (0 errors, 0 warnings). Dev server compiles successfully.
