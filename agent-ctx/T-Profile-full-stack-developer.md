---
Task ID: T-Profile
Agent: full-stack-developer (Profile)
Task: Rebuild Profile, EditProfile, Connections views for talent platform

Work Log:
- Read worklog.md (prior tasks 0, 3-a..3-e, R-Profile, R2-UI), prisma/schema.prisma (User/Profile/Category/Skill/UserCategory/UserSkill/Resume/ResumeExperience/ResumeEducation/Post/Connection), globals.css (new lime+forest palette: --lime oklch(0.85 0.2 125), --forest oklch(0.32 0.05 165), --gold, --rose, cream bg, gradient utilities, animations), shared/{illustrations,empty-state,user-avatar,post-card}.tsx (LogoMark, EmptyIllustration kinds, CategoryIcon with emoji prop, EmptyState kind prop, UserAvatar sizes xs..2xl with verified gold BadgeCheck, PostCard {post, index}), lib/{nav,api-client,use-user,types,format,geo}.ts, app-shell.tsx (route→view switch).
- Read existing 3 view files to preserve data logic (profile fetch by id, edit 5 sections, connections PATCH /api/connections/[id], chat start POST, resume PDF download).
- **OVERWROTE profile-view.tsx** (~700 lines):
  * BANNER_GRADIENTS: 6 oklch variants (deep forest, forest→lime tint, green→lime, forest→success, forest→gold, green→rose). NO blue/indigo.
  * ProfileHeader: motion entrance; banner h-36 md:h-52 with gradient + radial highlight + dot pattern + 2 lime/20 blur orbs; banned badge top-left rose/90; verified badge top-right gold/95 with Award icon; **Card uses overflow-visible + rounded-2xl, banner div uses overflow-hidden + rounded-t-2xl → FIXES the avatar clip bug (avatar is now fully visible below the banner)**; UserAvatar size="2xl" ring-4 ring-card rounded-3xl; name + verified gold badge; bioShort line-clamp-2; meta row (MapPin/CalendarDays/Phone tinted text-forest, gated by phoneVisible); actions — self: outline border-forest "ویرایش پروفایل"; other: ConnectionButton (lime primary bg-lime text-forest for follow, gold outline for pending-sent, lime/40 disabled for accepted) + forest outline "چت" + ghost "رزومه" (opens /api/resume/USERID). Counts row text-forest bold clickable.
  * ConnectionButton: 4 states (UserPlus/Clock/UserCheck) + Loader2 spinner.
  * ProfileTabs: TabsList rounded-2xl bg-muted/60 p-1, TabsTriggers data-[state=active]:bg-lime data-[state=active]:text-forest.
  * AboutTab: motion cards (forest/10 FileSignature chip for bio, lime/20 Hash chip for cats). CategoryIcon with emoji prop + Separator + lime/15 skill badges.
  * ResumeTab: motion Experiences (forest/10 Briefcase chip, lime/40 timeline, forest dot) + Educations (gold/15 GraduationCap chip, gold/40 timeline, gold dot).
  * PostsTab: fetches /api/posts?userId=ID, PostCard with index. Empty state kind="posts" with lime CTA.
  * QuickStatsCard sidebar (lg): 2x2 tinted stat tiles (lime/forest/gold/rose).
  * ProfileSkeleton + NotFound EmptyState kind="people".
- **OVERWROTE edit-profile-view.tsx** (~920 lines):
  * Centered max-w-3xl. Header + section quick-nav chips (rounded-full hover:bg-lime/20 hover:text-forest). SectionWrapper motion staggered.
  * PhotosBioSection (ImageIcon): banner preview rounded-2xl + lime/20 blur orb; 7-option RadioGroup (6 gradients + custom) selected border-forest scale-105; UserAvatar size="xl" preview; bioShort/bioLong with toFa counters; lime "ذخیره".
  * LocationSection (MapPin): province/city chained Selects rounded-2xl; phone-visible Switch in bg-lime/10 border-lime/20 card with forest/10 Phone chip; lime "ذخیره".
  * CategoriesSection (Hash): per-cat Card with CategoryIcon emoji; skills as lime/15 badges with X hover:bg-rose/20 hover:text-rose; add-skill text-forest hover:bg-lime/15; remove-cat hover:bg-rose/10. Add-cat + add-skill dialogs hover:bg-lime/15.
  * ExperienceSection (Briefcase): list items with forest/10 chip, lime/15 skill badges, delete hover:bg-rose/10; add dialog all fields; lime "افزودن".
  * EducationSection (GraduationCap): list items with gold/15 chip; add dialog; lime "افزودن".
  * SectionTitle: forest/10 icon chip + bold title (consistent).
  * Login prompt if !user: forest/10 Lock + lime "ورود / ثبت‌نام".
  * EditSkeleton rounded-2xl.
- **OVERWROTE connections-view.tsx** (~470 lines):
  * Header: bg-forest text-lime Users icon chip rounded-2xl shadow-md.
  * 3 Tabs (rounded-2xl bg-muted/60 p-1 h-12): pending/accepted/sent with count badges (gold/forest/muted). Active: data-[state=active]:bg-lime data-[state=active]:text-forest.
  * PersonRow motion stagger min(index*0.05, 0.3), Card rounded-2xl shadow-card hover:shadow-lift, UserAvatar size="lg", clickable name hover:text-forest.
  * PendingCard: lime "پذیرش" (Check/Loader2) + outline rose "رد". Uses `api()` PATCH (preserved fix).
  * AcceptedCard: forest outline "چت" (MessageCircle/Loader2) → POST /api/chat/start.
  * SentCard: gold "در انتظار پاسخ" badge.
  * Empty states kind="connections" with forest outline "کشف استعدادها" CTA → discover (replaces obsolete "people").
  * Login prompt + ListSkeleton rounded-2xl.
- All 3 files: "use client", framer-motion staggered, lime+forest design, NO blue/indigo.
- Ran `bun run lint` → my 3 files have ZERO errors. (3 pre-existing errors in admin-view.tsx are out of scope.)
- Ran `bunx tsc --noEmit` → my 3 files have ZERO TS errors. (TS errors in admin/*, jobs-view, chat-view, notifications-view are out of scope.)
- dev.log shows Next.js 16.1.3 (Turbopack) compiled successfully.

Stage Summary:
- 3 view files rebuilt to match the new Lime + Forest talent discovery design system (vibrant lime for CTAs/active, deep forest for hero/dark sections, gold for verified, rose for danger).
- All functionality preserved: profile fetch by id (supports "me"), edit all 5 sections, connections accept/reject/chat, post fetch by userId, resume PDF download.
- **FIXED the avatar clip bug**: Card overflow-visible (avatar sticks out below banner), only banner div overflow-hidden (gradient/image clipped to rounded-t-2xl). Avatar fully visible at size 2xl with ring-4 ring-card rounded-3xl.
- Design compliance: Lime for primary CTAs/active tabs, Forest for dark sections/quick-actions, Gold for verified/pending-sent, Rose for danger/reject. NO blue/indigo. Cards rounded-2xl shadow-card hover:shadow-lift. Buttons rounded-2xl font-bold. EmptyState with `kind` prop. UserAvatar verified gold badge. CategoryIcon with emoji prop. framer-motion staggered entrances. Skeletons. Persian toFa(). Mobile-first responsive.
- Lint clean for my 3 files (0 errors). TypeScript clean for my 3 files (0 errors).
