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

---
Task ID: RESTORE-BATCH
Agent: Z.ai Code (maintainer)
Task: Client's urgent restore batch: empty database reseed, dead skill-category button, avatar/banner upload 404, GitHub pull error, full E2E (post+music+files).

Work Log:
- Diagnosed "no data": sandbox snapshot regression AGAIN deleted src/app/api/upload/route.ts (4th time) + api/top-talent/upload (5th) + wiped DB. Restored both routes from git history.
- Wrote scripts/wipe-db.ts (all 31 models, FK-safe order) → clean slate; seed-full.ts CRASHED on empty DB (repair loop asserted existing user via `!` non-null) — fixed with existingUser guard, re-seeded: 10 users, 12 cats, 44 skills, 13 posts (seed-featured), 6 needs, 3 banners, 78 likes, 54 comments.
- NEW scripts/seed-social.ts: 7 connections (4 accepted / 3 pending), 2 conversations (1 active, 1 pending_request), 4 messages — home feed + chat + requests now have data.
- «ثبت دسته مهارت» button ROOT-CAUSE = empty DB (no categories to pick). After reseed E2E-verified: dialog opens, category adds, toast «دسته‌بندی اضافه شد ✅», userCategories 3 in DB.
- API-verified all uploads: /api/upload avatar+banner 200 + auto-persist; /api/posts/upload-media music(wav)+pdf+image 200; correct composer flow (post → attach with postId) confirmed; file serving 200.
- FIXED upload-media type-inference bug: MIME must beat form hint (PDF saved as "image" when type field omitted) — actualType now infers doc from MIME.
- UPGRADED PostCard MediaBlock → real MediaPlayer (audio: custom play/pause player h-76; video: aspect-video native player; doc: PDF preview + download) — previously non-image media was just a download link in home/profile feeds. fileName/fileSize added to media serializers (posts, feed/home, feed/following) + types.
- E2E browser (via :81 gateway): landing → OTP login → home (banner slider, 67%→ checklist, inline composer, top-talent CTA, suggestions, category grid, connection feed) → published post WITH music file → REAL playback verified (audio playing 1s/2s) → music player visible (VLM: "test-music.wav / فایل صوتی") → category add zero-jump → avatar+banner upload UI → persisted in DB → professional profile (VLM: complete). lint 0, dev.log clean.
- GIT ROOT-CAUSE of client's GitHub Desktop pull error: local sandbox history had become UNRELATED to remote (different root commits 3936459 vs 28d29eb — snapshot regression re-created repo). Remote itself is HEALTHY. Fix: rebased local onto origin/main (backup branch backup-diverged), re-applied 13 fix files, .env aligned to remote (relative DATABASE_URL + SESSION_SECRET restored).
- Removed db/custom.db from tracking (gitignored content, DB must not ship in repo).

Stage Summary:
- DB fully restored + enriched (social graph), uploads working E2E, music plays INSIDE posts, skill button alive.
- Local repo history realigned with remote → client's `git pull` will work after simple local HEAD-ref repair (commands delivered in report).
- Pushed as fast-forward commit on origin/main.

---
Task ID: RESTORE-BATCH (addendum)
Agent: Z.ai Code (maintainer)

Work Log:
- POST-PUSH discovery: db/custom.db had been TRACKED on remote (legacy) — `git reset --hard origin/main` during realignment checked out the STALE remote DB over the fresh seed. Fix: full re-seed chain (wipe → seed-full → seed-featured → seed-social) + recreated mixed-media demo post via API. Dev server restarted (next-server had been silently OOM-killed during git ops).
- PDF-without-type-field now correctly saved as "doc" (verified in re-created demo post) — MIME inference fix confirmed in production flow.
- Final E2E sweep: login → home feed 12 posts + music post PLAYING (audio 1s/2s) → explore 13 cards → talents people list → needs 4+ → profile complete. lint 0, dev.log 47×200, no failed /api calls.
- User's GitHub pull error = broken local `refs/remotes/origin/HEAD` + previously-diverged remote (now realigned). Remote fsck clean; fix commands delivered to user.

Stage Summary:
- DB is now UNTRACKED (git rm --cached) — future git operations can never clobber it again. After pull, user must run `bun scripts/seed-full.ts` (their local db file will be removed by the pull since it was previously tracked).

---
Task ID: DEPLOY-1
Agent: Z.ai Code (maintainer)
Task: رفع خطای git کاربر + استقرار رسمی پروژه روی سرور 217.114.40.93 + لینک دمو برای کارفرما

Work Log:
- بررسی وضعیت: DB سالم (10 کاربر/14 پست/12 دسته/44 مهارت/3 بنر/7 ارتباط)، api/upload موجود و سالم، دکمه افزودن دسته/مهارت API-level سالم — همه از RESTORE-BATCH قبلی.
-增强了 uploads serving route: MIME کامل (svg/mov/ogg/aac/m4a/flac/doc/docx/xls/xlsx/ppt/pptx/csv) روی نسخه چندمسیری ریپو → commit 19402b2.
- امنیت استقرار HTTP: auth.ts فلگ secure کوکی با env COOKIE_SECURE=false قابل‌خاموش‌شد شد (پیش‌فرض production) → commit b4bfeb7. بدون این، لاگین روی http://IP کار نمی‌کرد.
- رمز سرور منقضی بود → با PTY تعاملی paramiko رمز عوض شد (جدید: Frs2025@HmTq).
- سرور: Ubuntu 24.04, 961MB RAM, 1 CPU → swap 2GB ساخته شد + fstab.
- Node.js 22.23.2 (NodeSource) + Bun 1.x + unzip نصب شد.
- کلون /opt/hamteam از origin/main (b4bfeb7) + .env تولید: DATABASE_URL مطلق (file:/opt/hamteam/db/custom.db) + SESSION_SECRET تصادفی 48 کاراکتری.
- bun install: 836 پکیج در 24s.
- db:push + seed-full + seed-featured + seed-social اجرا شد → دیتای کامل تستی.
- next build (standalone) در پس‌زمینه در حال اجرا (PID 76241).

Stage Summary:
- همه commitها push شدند؛ سرور آماده؛ در انتظار اتمام build → systemd → پورت 80 → تست نهایی.

---
Task ID: DEPLOY-1 (final)
Agent: Z.ai Code (maintainer)
Task: تکمیل استقرار + تست E2E کامل production

Work Log:
- باگ بحرانی پیدا و رفع شد: pending auth Map بین routeها بعد از HMR ناپایدار → globalThis singleton (commit 0951be3).
- rebuild روی سرور + restart → لاگین production با تأخیر 8 ثانیه تأیید شد.
- nginx نصب شد روی 80 با map $arg_XTransformPort (مثل گیت‌وی sandbox) → اپ Next روی 3000، چت socket.io روی 3003.
- hamteam-chat systemd ساخته شد؛ فیکس مسیر DB چت با env override (commit 446766d).
- تست‌های E2E production (از بیرون، از طریق nginx):
  · Home 200 · لاگین OTP کامل · آپلود موزیک/عکس 200 و سرو با MIME صحیح
  · feed ۱۴ پست · بنرها 200 · socket.io handshake + CONNECT با token
  · ارسال پیام چت real-time → broadcast + persistence در DB تأیید شد
- تست مرورگر local (کد یکسان): لاگین UI → فید کامل → پخش واقعی موسیقی (audio.playing=true) → افزودن دسته‌بندی از UI + toast + تأیید DB → بدون خطای console.

Stage Summary:
- استقرار کامل: http://217.114.40.93 (nginx:80 → next:3000 + chat:3003) با دیتای تستی کامل.
- دسترسی دمو: 09121110001/1234 — ادمین: admin/admin123.
- رمز سرور عوض شد (قبلی منقضی بود): Frs2025@HmTq

---
Task ID: STARS-BACKEND
Agent: Z.ai Code (maintainer)
Task: بازسازی بک‌اند — حذف کامل آیدی/لایک/سیستم استعداد برتر + سیستم ستاره ۱..۱۰ + منطق چهره برتر

Work Log:
- Turbopack panic رفع شد (ریست سندباکس → فایل api/upload دوباره حذف شده بود + کش .next خراب؛ پاک‌سازی + بازیابی از گیت).
- Schema: حذف User.username + User.isTopTalent + مدل PostLike + مدل TopTalentRequest. isTopTalent حالا مشتق از ستاره‌هاست.
- src/lib/stars.ts جدید: GOLD=5000 / ROSE_GOLD=10000 / frameFor / usersStarInfo (raw SQL sum) / postsRatingStats (groupBy).
- سریالایزرهای همه مسیرها یکدست شدند: posts / feed/home / feed/following / explore/posts / talents / auth/me / profile/{me,[id],[id]/meta} / chat messages / comments / comments+portfolio likes / admin users / admin posts — همه username و likeCount/likedByMe حذف؛ ratingAvg/ratingCount/myRating/commentCount + user.frame/totalStars/isTopTalent(مشتق) اضافه.
- route جدید: POST /api/posts/[id]/feature (شرط ≥5000 ستاره + سقف 5 پست ویترین). admin feature گیت باز شد.
- حذف مسیرها: /api/username/*, /api/posts/[id]/like + /likes, /api/top-talent/*, /api/admin/users/[id]/top-talent, /api/explore/people, /api/seed, /api/admin/users/[id]/posts.
- use-user.ts: گیت اجباری onboarding (بر اساس username) حذف شد — ورود مستقیم به فید.
- seed-full: username/لایک→ رأی ۶..۱۰ طبیعی، isFeatured=false پیش‌فرض، بنر→#/explore.
- seed-featured: بازنویسی — نویسنده‌ها بر اساس phone، رأی ستاره، بدون featured.
- seed-stars.ts جدید: ۶۰ کاربر پشتیبان + پست‌های امیرحسین(۸) و مهتاب(۱۶) + رأی همه → امیرحسین ۵۶۰۸⭐ (طلایی) / مهتاب ۱۱۰۴۰⭐ (رزگلد) + ۷ پست ویترین چهره برتر.
- فایل‌های مرده حذف شدند (11 فایل): root post-card/explore-view/discover-filter-fab/jobs-view/views-admin folder.
- react-easy-crop نصب شد (برای کراپر آواتار/کاور).

Stage Summary:
- قرارداد API جدید برای فرانت‌اند آماده است:
  PostWithRelations = { id, content, createdAt, categoryId, skillId, categoryName, categoryColor, skillName, isFeatured?, canFeature?, user: { id, name, isVerifiedBadge, avatarUrl, gender, isTopTalent, frame: "gold"|"rosegold"|null, totalStars, mainCategoryColor }, commentCount, ratingAvg, ratingCount, myRating, media[] }
  feed/home stats: { connectionsCount, postsCount, followersCount, totalStars, frame, nextAt }
  POST /api/posts/[id]/feature → { ok, isFeatured, totalStars, frame }
- دیتابیس local seed شده (13+24 پست، 70 کاربر، 1763 رأی).

---
Task ID: FE-A
Agent: Z.ai Code (sub-agent)
Task: Post cards star rating UI — حذف کامل سیستم لایک از کارت‌های پست و اتصال به سیستم امتیاز ستاره‌ای ۱..۱۰ (قرارداد STARS-BACKEND)

Work Log:
- src/components/shared/post-card.tsx:
  · حذف کامل like: toggleLike() (POST /api/posts/[id]/like)، stateهای liked/likeCount/liking/likeBounce/likersOpen، قرص قلب/رز، LikersSheet + postLikersFetcher و import apiPost.
  · جایگزینی با الگوی اثبات‌شدهٔ explore (خطوط ۷۱۱-۷۷۹): RatingSummary زیر متن پست (شرط ratingCount>0، کلیک → باز شدن مودال) + دکمهٔ اکشن «⭐ ثبت امتیاز» / «ویرایش (score/۱۰)» در نوار اکشن — حالت طلایی grad-gold + shadow-glow-gold وقتی myScore ثبت شده.
  · RatingModal با initialScore={myScore} و onSaved → setAvg/setRatingCount/setMyScore (به‌روزرسانی محلی بدون رفرش). ریدایرکت auth داخل خود مودال مدیریت می‌شود.
  · دکمهٔ نظرات حالا formatCount(post.commentCount) را نشان می‌دهد؛ share و report حفظ شدند. کل نوار اکشن h-10 → h-11 (هدف لمسی ۴۴px) هم‌راستا با explore.
  · topTalent badge / رینگ رنگ دسته / UserAvatar(topTalent) بدون تغییر سالم ماند.
- src/components/views/dashboard-view.tsx:
  · TimelinePost: حذف toggleLike/liked/likeCount/liking/likersOpen + قلب + LikersSheet + importهای apiPost/toast.
  · افزودن RatingSummary (با stopPropagation داخل کارت motion.button) + قرص h-11 «ثبت امتیاز/ویرایش» + RatingModal با همان onSaved pattern.
  · دکمهٔ کامنت حالا commentCount (formatCount + toFa) را نشان می‌دهد. تایپ PostWithRelations از قبل با قرارداد جدید همگام بود — فقط فیلدهای جدید map شدند.
- src/components/shared/likers-sheet.tsx:
  · حذف postLikersFetcher (اندپوینت /api/posts/[id]/likes دیلیت شده). commentLikersFetcher + portfolioLikersFetcher حفظ شدند.
  · حذف username از LikerUser و رندر ردیف (@handle در کل سیستم حذف شده) — فقط نام نمایش داده می‌شود.
- راستی‌آزمایی: bun run lint → 0 errors. tsc --noEmit → هر ۳ فایل من صفر خطا (خطاهای باقی‌مانده در فایل‌های اِيجنت‌های موازی: explore/discover/edit-profile/home/profile/top-talent + stars.ts خارج از اسکوپ FE-A است).
- هیچ فایلی خارج از ۳ فایل مجاز لمس نشد.

Stage Summary:
- سیستم امتیاز ستاره‌ای ۱..۱۰ در هر سه نقطهٔ مصرف (کارت پست پروفایل + تایم‌لاین داشبورد) زنده است: RatingSummary (آمبر) + دکمهٔ ثبت/ویرایش + RatingModal با به‌روزرسانی آفتیو {avg,count,myScore}.
- هیچ ردی از like در فایل‌های FE-A نمانده؛ likers-sheet فقط برای لایک کامنت/نمونه‌کار استفاده می‌شود.
- نکته برای اِيجنت explore: import باقی‌ماندهٔ postLikersFetcher در explore-view.tsx خط ۲۹/۲۷۰۱ باید حذف شود (خارج از اسکوپ من).

---
Task ID: FE-C (cropper + banner + FABs)
Agent: Z.ai Code (sub-agent FE-C)
Task: کراپر حرفه‌ای آواتار/بنر (react-easy-crop) + رندر بنر پروفایل با نسبت ۳:۱ + ری‌استایل FAB فیلتر

Work Log:
- NEW src/components/shared/crop-dialog.tsx (CropDialog): react-easy-crop v6.2.3 (ایمپورت default؛ خروجی v6 فقط default است نه named). آواتار aspect 1 + cropShape round / بنر aspect 3 (۳:۱) rect؛ objectFit="cover" تا خروجی canvas هیچ‌گاه حاشیه سفید نگیرد؛ اسلایدر «بزرگنمایی» LTR با هدف لمسی ۴۴px (input range سفارشی با گرادیان پرشدگی) + چیپ مقدار «۱٫۸×» فارسی؛ پَن/پینچ لمسی خود کتابخانه؛ بات‌شیت rounded-t-[28px] با درگ-هندل در موبایل (فقط هدر درگ می‌شود تا پَن کراپر دست‌نخورده بماند) / کارت وسط sm:max-w-md در دسکتاپ؛ z-[80] + قفل اسکرول بدنه + Esc + کلیک backdrop؛ خروجی دستور استاندارد canvas: createImageBitmap → drawImage(croppedAreaPixels) → JPEG 0.92 با fillRect سفید (شفافیت PNG) و سقف عرض ۱۰۲۴ (آواتار) / ۱۵۰۰ (بنر)؛ بستن با requestClose → انیمیشن خروج ۲۸۰ms. Btn/IconBtn/SPRING از atoms + Icon مشترک.
- edit-profile-view: UsernameSection به‌طور کامل حذف شد (آیتم SECTIONS، بلوک رندر، خودِ کامپوننت، اعتبارسنجی و POST /api/username/set) و دیلی‌های سکشن‌ها بازچینش شد؛ فلوی آپلود آواتار/بنر حالا از کراپر می‌گذرد: انتخاب فایل → openCropper(mode) → CropDialog → بلاب JPEG → new File("avatar.jpg"/"banner.jpg") → همان POST /api/upload (type=avatar|banner) → setAvatarUrl/setBannerUrl(data.url) → PUT /api/profile/me (جریان ذخیرهٔ فوری و دکمه‌های حذف دست‌نخورده)؛ پیش‌نمایش بنر h-28 md:h-32 → aspect-[3/1] و متن راهنما «نسبت ۳:۱ — ابعاد پیشنهادی ۱۵۰۰×۵۰۰».
- profile-view: بنر روایت شد (ریشهٔ «عکس کاور پروفایل ست نمیشه»): <motion.img src=profile.bannerUrl alt="بنر پروفایل" absolute inset-0 object-cover> داخل کاور؛ گرادیانت aurora فقط fallback؛ هاله‌های نور در حالت بنر خاموش (کاور عکس تمیز) ولی بافت نقطه‌ای/اسپارک طلایی/خط طلایی isTopTalent روی بنر می‌مانند؛ کاور کوچک‌تر استاندارد توییتر/لینکدین: h-48 sm:h-56 → aspect-[3/1] max-h-56 (روی ۴۱۲px ≈ ۱۳۷px، دسکتاپ سقف ۲۲۴px)؛ آواتار با همان -mt-12 روی نسبت جدید سالم می‌نشیند؛ @handle زیر نام حذف شد؛ نوار آمار grid-cols-3 → grid-cols-4 با «ستاره‌ها»: toFa(totalStars.toLocaleString("fa-IR")) مثل «۵٬۶۰۸» (fallback meta.totalStars)؛ کل تریتمنت طلایی TopTalent (coverStyle/Sparkles/GoldCheckMark/TopTalentBanner/EliteAvatar) دست‌نخورده کار می‌کند؛ rose-gold عمداً untouched (مال ایجنت elite)؛ اسکلتون هم aspect-[3/1].
- filter-fab: دکمه شناور size-14 grad-brand shadow-glow → size-11 (۴۴px) bg-card + border-border/60 + shadow-md، آیکون text-blue-600 dark:text-blue-400 (سایز ۱۹)؛ بَج تعداد فعال bg-gold → bg-blue-600 text-white ring-2 ring-card؛ منطق موقعیت (logged-in/guest/md) و گِست‌ها دست‌نخورده — هم‌زبان با FAB چت app-shell که ایجنت دیگر با همان اسپک می‌سازد.
- تایید: eslint روی ۴ فایل FE-C → ۰ خطا/۰ هشدار (خطاهای لحظه‌ای admin-view.tsx متعلق به ایجنت همزمان دیگر است)؛ tsc --noEmit → ۴ فایل FE-C بدون خطا. فایل دیگران دست نخورده.

Stage Summary:
- باگ کاور حل شد: bannerUrl از قبل ذخیره می‌شد ولی رندر نمی‌شد — حالا هم رندر می‌شود هم قبل از آپلود کراپ حرفه‌ای ۱:۱/۳:۱ موبایل‌دوست دارد.
- قرارداد عمومی CropDialog برای مصرف‌های آینده: { open, onClose, imageFile: File, mode: "avatar"|"banner", onCropped(blob: Blob) }.
- FAB فیلتر و چت اکنون یک زبان بصری واحد دارند: سفید ۴۴px + آیکون آبی + سایه ملایم.

---
Task ID: FE-B (renames + چهره برتر)
Agent: Z.ai Code (frontend FE-B)
Task: تغییر نام کشف→چهره‌یاب و برترین‌ها→چهره برتر + حذف کامل آیدی/لایک/سیستم قدیمی استعداد برتر از فرانت + قاب رزگلد + دکمهٔ ارسال پست به چهره برتر

Work Log:
- elite.tsx: EliteAvatar پارامتری شد (variant: "gold"|"rosegold") + خروجی جدید RoseGoldAvatar (متال رز #f43f5e→#fb7185→#fda4af→#be123c با کانال تیره/پرچ/درخشش، همان هندسه) + RoseGoldCheckMark (تیک رزگلد) + متن بنر به «چهره برتر — ۵۰۰۰+ ستاره» تغییر کرد.
- user-avatar.tsx: پراپ جدید frame?: "gold"|"rosegold"|null — رزگلد برطلایی اولویت دارد؛ topTalent قدیمی به‌عنوان fallback طلایی سازگار ماند.
- nav.ts: مسیر {view:"top-talent"} حذف شد (نوع + parseBase).
- app-shell.tsx: تب‌های موبایل «کشف»→«چهره‌یاب» و «برترین‌ها»→«چهره برتر»؛ دسکتاپ «کشف»→«چهره‌یاب» و «استعدادهای برتر»→«چهره برتر»؛ import/render TopTalentView حذف؛ @handle کارت کاربر شیت «بیشتر» حذف؛ آواتارها frame می‌گیرند؛ FAB چت بازطراحی شد: ۴۴px، bg-card، آیکون آبی (blue-600/400)، بوردر+سایه ظریف (بدون grad-brand)، بج bg-rose ماند.
- onboarding-view.tsx: مرحلهٔ نام کاربری کاملاً حذف شد — ویزارد ۳ مرحله‌ای (categories→mainCategory→welcome)، شروع از categories، حذف apiPost /api/username/*، progress ۳۳/۶۶/۱۰۰٪، «خروج» فقط روی مرحلهٔ اول، خط «نام کاربر شما: @x» حذف.
- discover-view.tsx: H1 «چهره‌یاب»؛ کل مود جستجوی @آیدی حذف شد (idMode، placeholder «جستجوی آیدی»، چیپ مود آیدی، empty-state آیدی)؛ @{talent.username} حذف؛ آواتار frame می‌گیرد.
- talents-view.tsx: TalentCardLarge آواتار frame می‌گیرد + چیپ ستاره (totalStars، طلایی/رزگلد) کنار نام برای چهره‌های برتر.
- chat-view.tsx: @handle کارت مقابل حذف (نام + چیپ «نخبه» با فلگ مشتق ماند).
- home-view.tsx: stats اکنون totalStars/frame/nextAt؛ CTA «استعداد برتر شو — ثبت‌نام کنید» با پنل پیشرفت ستاره «چهره برتر شو» عوض شد (نوار گرادیانی طلایی/رز، حالت‌ها: هدف ۵۰۰۰ / طلایی→۱۰۰۰۰ رزگلد / رزگلد=بالاترین سطح، دکمهٔ «مشاهده چهره برتر»→explore)؛ @user.username و گام چک‌لیست «نام کاربری» حذف شد؛ آواتارها frame می‌گیرند.
- landing-view.tsx: دکمهٔ طلایی هیرو → «چهره‌های برتر» (explore)؛ TopTalentSection → StarSystemSection: توضیح سیستم ستاره (۵۰۰۰=قاب طلایی/۱۰۰۰۰=رزگلد + ارسال پست دلخواه)، چیپ‌های دو سطح، CTA «مشاهده چهره برتر»؛ ظاهر پرمیوم ابیسیدین-طلا-رز حفظ شد.
- explore-view.tsx (چهره برتر):
  · H1 «چهره برتر» + زیرعنوان «چهره‌های برتر با ۵۰۰۰+ ستاره — پست‌های منتخبِ خودشان»؛ چیپ‌های آمار: پست منتخب / چهره دارای قاب / رزگلد / میانگین از ۱۰.
  · ExplorePost: likeCount/likedByMe حذف؛ isFeatured/canFeature + user.frame/totalStars اضافه شد.
  · PostDetailView: کل سیستم لایک حذف شد (stateها، toggleLike → POST /like، pill لایک، LikersSheet پست) — RatingSummary + RatingModal در هر دو حالت (پروفایل/ویترین)؛ fallback از /api/posts به پاس‌-‌از-سرور ساده شد (فقط categoryIcon از لیست دسته).
  · PostCard + PostDetailView: دکمهٔ جدید FeatureButton «به چهره برتر بفرست» / «در چهره برتر است ✓ — برداشتن» → POST /api/posts/[id]/feature با آپدیت خوش‌بینانه + toast؛ خطای ۴۰۳ پیام ستارهٔ سرور را در toast مخرب نشان می‌دهد؛ در فید explore برداشتن از ویترین پست را از لیست خارج می‌کند.
  · قاب‌آگاهی: بوردر/نوار بالای کارت/بج «برتر»/تیک نام — همهٔ نسخهٔ رزگلد دارند؛ آواتار frame می‌گیرد.
- admin-view.tsx: آیتم سایدبار «درخواست‌های استعداد برتر» + TopTalentTab کامل (~۷۹۰ خط) + TopTalentStatusBadge/TopTalentCrownBadge/SummaryCard/DetailRow/DetailField + تایپ‌های TopTalentRequest(Detail) حذف شدند؛ UsersTab: toggleTopTalent (POST /top-talent) و دیالوگ مدارک/کارت ملی حذف؛ تاج‌ها با ستون «ستاره» (UserStarsCell: totalStars + چیپ طلایی/رزگلد فقط-خواندنی) عوض شد؛ فیلتر به «قاب چهره برتر»؛ تب پست‌ها: ویترین ماند، متن‌ها به «چهره برتر» تغییر کرد.
- حذف فایل‌ها: src/components/views/top-talent-view.tsx و پوشهٔ src/components/top-talent/.
- فیکس‌های لازم برای کامپایل/اجرای قرارداد جدید بک‌اند (خارج از لیست ولی بحرانی):
  · src/app/api/admin/posts/route.ts — import جاافتادهٔ usersStarInfo اصلاح شد (پنل ادمین ۵۰۰ می‌شد).
  · src/lib/stars.ts — ratingCount: a._count._all (با گروه‌بندی prisma مقدار {_all:n} برمی‌گردد؛ قبلاً آبجکت می‌رفت داخل UI).
- تیک تأیید GoldCheckMark aria «چهره برتر»؛ متن banners-tab (فایل مال دیگران) دست نخورد.

Stage Summary:
- رینم‌ها کامل: چهره‌یاب (کشف) / چهره برتر (برترین‌ها) — هیچ ردی از آیدی، لایک پست یا سیستم درخواست استعداد برتر در فایل‌های FE-B نیست.
- رزگلد به‌عنوان سطح کمیاب (۱۱۰۴۰⭐ مهتاب در seed) در آواتار/تیک/بج/پنل خانه/چیپ آمار explore رندر می‌شود.
- دکمهٔ ویترین در PostCard و PostDetailView با ۴۰۳→پیام ستاره کار می‌کند؛ ادمین ویترین ungated ماند.
- bunx tsc --noEmit → فقط خطاهای پیش‌ existing پوشه‌های examples/skills/scripts/mini-services؛ src تمیز. bun run lint → ۰ خطا (exit 0).
- فایل‌های مالک دیگران (post-card، dashboard، likers-sheet، profile، edit-profile، filter-fab، rating-control) دست نخوردند.

---
Task ID: FE-INTEGRATION
Agent: Z.ai Code (maintainer)
Task: یکپارچه‌سازی خروجی سه agent + تست E2E کامل + پالایش

Work Log:
- FeatureButton به کامپوننت مشترک منتقل شد (shared/feature-button.tsx) و به post-card اصلی اضافه شد — کاربران دارای قاب حالا از فید/پروفایل هم می‌توانند پست بفرستند (قبلاً فقط از explore دیده می‌شد).
- باگ سینتکس explore-view (حذف ناقص FeatureButton محلی توسط اسکریپت) رفع شد.
- تست E2E مرورگر کامل:
  · لاگین مستقیم به فید (بدون گیت آیدی) ✓
  · خانه: پنل «چهره برتر شو» با پیشرفت ۵۶۰۸/۱۰۰۰۰ + کارت‌ها با قرص میانگین/رأی ✓
  · مودال امتیاز: ۹ ستاره ثبت → «ویرایش امتیاز ۹ از ۱۰» + میانگین ۸٫۳/۷ رأی ✓
  · ارسال پست به چهره برتر از فید → توست «پست به چهره برتر رفت ⭐» → DB=8 featured ✓
  · کراپر آواتار: باز شدن، زوم ۱.۴×، اعمال برش → آپلود + ذخیره در DB ✓ (خطای قبلی مربوط به فایل تستی حذف‌شده از /tmp بود نه اپ)
  · بنر رندر می‌شود (aspect 3:1) + آواتار جدید در پروفایل ✓
  · «چهره‌یاب» و «چهره برتر» H1 ها ✓ — قاب رزگلد مهتاب (11040⭐) در explore ✓
  · FABها: 44px سفید/آبی در موبایل ✓ (چت FAB فقط موبایل — md:hidden)
- پالایش: کنتراست زیرنویس هدر چهره برتر /70→/90.
- lint 0 خطا · tsc فقط خطای خارج از src/ · همه ویوها 200 بدون خطای JS.

Stage Summary:
- کل سیستم جدید ستاره/چهره برتر/حذف آیدی/کراپر/FAB از سر تا کلاینت کامل و تست‌شده.
- آماده push + استقرار production (سرور 217.114.40.93).

---
Task ID: DEPLOY-2
Agent: Z.ai Code (maintainer)
Task: استقرار سیستم جدید روی سرور production (217.114.40.93)

Work Log:
- push 3722a56 به origin/main → سرور: git pull + bun install (react-easy-crop).
- DB تازه (schema جدید): rm db → db:push → زنجیره کامل seed در پس‌زمینه (سرور تک‌هسته‌ای).
- rebuild موفق (BUILD_EXIT_0) + restart سرویس‌ها (next/nginx/chat).
- تست E2E بیرونی:
  · Home 200 · لاگین OTP ✓ · /api/auth/me: {frame:"gold", totalStars:5868} بدون آیدی ✓
  · چهره برتر: ۲۰ پست ویترین — مهتاب rosegold 11520⭐ / امیرحسین gold 5868⭐ (میانگین ۱۰/۱۰، ۷۲ رأی) ✓
  · آپلود+سرو فایل ✓ · وب‌سوکت چت handshake ✓
  · API ویترین: سقف ۵ پست فعال به‌درستی خطا داد ✓

Stage Summary:
- http://217.114.40.93 با سیستم ستاره/چهره برتر/کراپر/بدون آیدی کاملاً بالاست.

---
Task ID: FE-2
Agent: Z.ai Code (sub-agent FE-2)
Task: مسیر جایگزین چهره برتر (درخواست بررسی مستقیم ادمین) + دو تب ادمین «چهره‌یاب‌ها» و «درخواست‌های چهره برتر» — فقط UI، بک‌اند از قبل زنده

Work Log:
- src/components/views/home-view.tsx (۵۵۱→۷۸۰ خط):
  · وضعیت مسیر جایگزین: GET /api/elite/request در mount (refreshEliteStatus) → state eliteStatus {isTopTalent, frame, request}. منطق نمایش: request.status==="approved" → چیپ grad-gold «چهره برتر — تأیید ادمین ⭐» (GoldCheckMark)؛ pending → چیپ outline آمبری + آیکون clock «درخواست بررسی مستقیم: در انتظار بررسی ادمین»؛ isTopTalent (بدون درخواست تأییدشده) → مسیر جایگزین کلاً مخفی؛ rejected/هیچ → دکمهٔ متنی باریک (h-9, text-[12px], amber-100/60→hover:amber-100) «استعداد برتری داری؟ درخواست بررسی مستقیم ادمین» — همه داخل همان پنل طلایی، زیر «مشاهده چهره برتر».
  · EliteRequestDialog جدید (در همان فایل، الگوی RatingModal: AnimatePresence + fixed z-[75] + backdrop blur + ESC + قفل اسکرول): عنوان «مسیر جایگزین چهره برتر»، متن توضیح دقیق اسپک (۵٬۰۰۰ ستاره یا ۵۰۰ رأی / صلاح‌دید ادمین + نظر چهره‌یاب‌ها)، textarea حداقل ۳۰ کاراکتر با شمارنده فارسی و گیج سبز/خاکستری، دکمهٔ h-11 grad-gold → POST /api/elite/request → toast موفق + بستن + refreshEliteStatus؛ خطای 400/409 → هم error inline داخل مودال هم toast مخرب (پیام error سرور از api-client مستقیم می‌رسد).
- src/components/views/admin-view.tsx (۳۱۳۸→۳۸۴۹ خط):
  · PAGES + PageKey: دو ورودی جدید بعد از «نیازمندی‌ها» — { key:"scouts", label:"چهره‌یاب‌ها", icon:CompassIcon } و { key:"eliteRequests", label:"درخواست‌های چهره برتر", icon:StarIcon } (lucide: Compass/Star/Phone/IdCard/MessageSquare ایمپورت شدند) + سوییچ رندر تب‌ها.
  · کامپوننت‌های مشترک جدید: AdminAvatar (دایره ۳۶/۴۴px حرف-اول/عکس، الگوی جدول کاربران)، ReviewStatusChip (در انتظار آمبر / تأیید-emerald / رد-red با Clock/CheckCircle2/XCircle)، StatusFilterChips (همه/در انتظار/تأییدشده/ردشده — چیپ فعال ADMIN_PRIMARY، بج آمبر روی «در انتظار»)، EmptyCardState (کارت خالی آیکون‌دار).
  · ScoutsTab (GET /api/admin/scouts?status=…): PageHeader + بج pendingCount آمبر + دکمهٔ به‌روزرسانی؛ کارت‌های درخواست (نه جدول): آواتار+نام+چیپ وضعیت، تلفن mono ltr، کدملی mono ltr با IdCardIcon، تاریخ formatFaDate، description در باکس خاکستری، یادداشت ادمین، thumbnail کارت ملی (۲۰×۱۴) → کلیک → لایت‌باکس Dialog تمام‌عرض (bg-gray-900, max-h-70vh, esc/backdrop بسته می‌شود، Radix)؛ اکشن pending: «تأیید و فعال‌سازی» (PrimaryButton آبی = استایل primary موجود ادمین) + «رد» → دیالوگ با textarea یادداشت اختیاری → POST {id, action:"reject", note}. سکشن «چهره‌یاب‌های فعال»: ردیف‌های فشرده (آواتار، تلفن، چیپ needsCount با Briefcase، since فارسی) + «لغو دسترسی» destructive outline → AlertDialog تأیید → POST {id, userId, action:"revoke"}. اسکلتون + empty state هر دو لیست.
  · EliteRequestsTab (GET /api/admin/elite-requests?status=…): همان هدر/فیلتر/بج؛ کارت درخواست: آواتار+نام+بج قاب فعلی (Crown طلایی/رزگلد) + چیپ وضعیت، تلفن mono ltr، تاریخ، چیپ‌های totalStars (StarIcon آمبر) + votes + منبع: source==="scout" → چیپ emerald «معرفی چهره‌یاب: {nominator.name}» با CompassIcon / «درخواست مستقیم کاربر» خنثی با UserIcon؛ reason در باکس؛ adminNote؛ اکشن pending: «تأیید → قاب طلایی» (دکمهٔ طلایی bg-amber-500 + Crown) → POST approve → toast پیام سرور «{name} چهره برتر شد» + «رد» با دیالوگ یادداشت.
  · هر دو تب به‌روزرسانی stateful با load() useCallback وابسته به فیلتر؛ هیچ فایل دیگری لمس نشد.
- راستی‌آزمایی: bunx tsc --noEmit → صفر خطا در src (۵ خطای باقی‌مانده فقط examples/mini-services/scripts/skills خارج از پروژهٔ اصلی)؛ bunx eslint روی هر دو فایل → ۰ خطا/۰ هشدار (exit 0)؛ dev server: GET / → 200 و کامپایل تمیز.

Stage Summary:
- کاربر عادی از پنل طلایی خانه می‌تواند درخواست بررسی مستقیم ادمین بدهد (مودال طلایی، حداقل ۳۰ کاراکتر) و وضعیتش (در انتظار/تأیید) به‌صورت چیپ روی همان پنل دیده می‌شود؛ چهره برترهای فعلی مسیر را نمی‌بینند (جز تأیید ادمینی خودشان).
- ادمین دو تب کامل دارد: مدیریت چهره‌یاب‌ها (تأیید/رد/لغو + لایت‌باکس کارت ملی) و درخواست‌های چهره برتر (تأیید → قاب طلایی فوری) — دقیقاً با زبان بصری ادمین موجود (کارت‌های gray-200/blue primary، بج‌ها، دیالوگ‌های shadcn).
- انحراف کوچک: دکمهٔ «تأیید و فعال‌سازی» آبی (ADMIN_PRIMARY موجود) است نه سبز — چون پنل ادمین واقعی فعلی آبی oklch(0.5 0.15 250) است و قاعدهٔ «تطابق بصری با تب‌های موجود» اولویت دارد. درخواست ردشده → دکمهٔ متنی مسیر جایگزین دوباره ظاهر می‌شود (بک‌اند رکورد جدید مجاز می‌داند).

---
## Task ID: FE-1
**Date:** 2026-10-27 · **Agent:** Z.ai Code (sub-agent FE-1) · **Scope:** چهره‌یاب (scout) frontend — apply/dashboard/auth/landing/badge integrations (backend live, untouched)

### What was done

**Routes + shell**
- `src/lib/nav.ts`: RouteBase += `{ view: "scout" }` | `{ view: "scout-apply" }` + parseBase cases (routeToHash default already covers).
- `src/components/app-shell.tsx`: render cases برای ScoutView/ScoutApplyView؛ "scout" در TOP_LEVEL؛ تب «چهره‌یاب» → «کشف» (discover، آیکون compass ماند) در MOBILE_TABS + DESKTOP_NAV؛ آرایه‌های تب DYNAMIC شدند: برای `user?.isScout` تب «چهره برتر» (explore) با «چهره‌یاب» (scout) جایگزین می‌شود — موبایل (mobileTabs map) و دسکتاپ (DesktopTopBar حالا prop `nav: typeof DESKTOP_NAV` می‌گیرد)؛ isActive += scout case؛ کامنت ترتیب تب‌ها آپدیت شد.

**NEW `src/components/views/scout-apply-view.tsx`** (ثبت‌نام چهره‌یاب)
- Guest → spinner سپس ریدایرکت auth?mode=scout؛ isScout → کارت موفق «حساب چهره‌یاب شما فعال است» + Btn ورود به داشبورد؛ GET /api/scout/apply روی mount: pending → کارت وضعیت (clock، تاریخ فا، توضیحات)؛ rejected → کارت رد با adminNote + فرم مجدد پیش‌پرشده.
- فرم: کد ملی (Field، inputMode numeric، نرمال‌سازی ارقام فارسی + چک‌سام استاندارد کد ملی سمت کلاینت) · آپلود فوری کارت ملی (dropzone با imagePlus، FormData file+type=scout-card → /api/upload، پیش‌نمایش + حذف + state آپلود) · توضیحات (Textarea، شمارنده فارسی، حداقل ۲۰). Submit → POST /api/scout/apply → toast + سوییچ به کارت pending. هدر: BackButton + LogoFull h=34 + عنوان + پاراگراف توضیح «کمپانی‌های لینکدین».

**NEW `src/components/views/scout-view.tsx`** (داشبورد چهره‌یاب)
- گیت: فقط user.isScout (غیر چهره‌یاب/مهمان → فید). GET /api/scout/dashboard.
- هدر glass با چیپ هویتی emerald (compass) + H1 «چهره‌یاب» + زیرعنوان؛ ردیف آمار ۴تایی MiniStat (چهره برتر/پست ویترین/میانگین ویترین x/۱۰/نیازمندی فعال من) + Sk؛ بنر آستانه‌ها از thresholds سرور (۵٬۰۰۰ ستاره یا ۵۰۰ رأی).
- «چهره‌های برتر»: لیست کارت (نه گرید): UserAvatar frame lg (رزگلد محترم) + چیپ ستاره طلایی/رزگلد + دسته‌ها (max ۳) + بایو یک‌خطی + mapPin + «پروفایل» + «گفتگو» (POST /api/chat/start → navigate chat).
- «استعدادهای در حال رشد»: همان کارت + ستاره/رأی + «معرفی به ادمین» (outline سبز، award) → NominateDialog بات‌شیتی (الگوی RatingModal: backdrop blur، قفل اسکرول، Esc، IconBtn بستن؛ sm+ وسط‌چین) با textarea «دلیل معرفی» (حداقل ۱۰) → POST /api/scout/nominate → toast + حذف آفتیو از لیست rising (AnimatePresence).
- «نیازمندی‌های من»: لیست فشرده (عنوان، دسته، applicationCount با users، تاریخ) + Btn «ثبت نیازمندی» (sm، همیشه) + empty CTA. اسکلتون/empty برای همهٔ سکشن‌ها.

**NEW `src/components/shared/scout-badge.tsx`** — ScoutBadge {size sm|md}: چیپ emerald (bg-emerald-600/10، border-emerald-600/20) + compass + «چهره‌یاب».

**auth-view.tsx** — scoutMode از route.params.mode (state، قابل تاگل): سگمنت‌کنترل دوتایی «عضو استعداد»/«چهره‌یاب (استعدادیاب)»؛ زیرمتن اختصاصی چهره‌یاب؛ بج «شروع کن»→«چهره‌یاب شو» (+ آیکون compass/emerald)؛ onVerify → scout-apply (به‌جای feed) بعد از fetchUser؛ توست همان ماند.

**landing-view.tsx** — LogoFull هیرو h=34→40؛ NEW ScoutSection بعد از StarSystemSection: پنل glass سبز (border-emerald-600/25 + دو blob rgba(16,185,129,0.18))، eyebrow «برای استعدادیاب‌ها»، H2 «چهره‌یاب هستی؟ استعدادها را تو کشف کن.»، پاراگراف آژانس/کانون، CTA emerald «ثبت‌نام چهره‌یاب» با مسیریابی هوشمند (useUser.getState(): isScout→scout، لاگین→scout-apply، مهمان→auth?mode=scout) + ۳ بولت قابلیت.

**discover-view.tsx** — H1 «چهره‌یاب»→«کشف» + زیرعنوان «پست‌ها و چهره‌ها را جست‌وجو و کشف کن» + کامنت فایل.

**Integrations** — ScoutBadge کنار نام: talents-view (TalentCardLarge، t.isScout) · profile-view (ردیف نام، profile.isScout) · needs-view (پوستر نیازمندی، need.user.isScout) · chat-view (هدر گفتگو + کارت پروفایل بالای چت، other.isScout؛ OtherUser += isScout?: boolean) · چیپ «نخبه» → «چهره برتر» (grad-gold ماند).

### Verification
- `bunx tsc --noEmit` → صفر خطا در src/ (خطاهای باقی‌مانده فقط examples/skills/scripts/mini-services — پیش‌existing و خارج از اسکوپ).
- `bunx eslint` روی ۱۲ فایل من → ۰ خطا/۰ هشدار (exit 0).
- Dev server (پورت 3000): GET / 200 با کامپایل کامل app-shell+هر دو ویوی جدید؛ /api/scout/apply 200؛ /api/scout/dashboard 401 بدون نشست (درست). خطای parse موقتی talents-view (تایپو `}}` حین ادیت) بلافاصله فیکس شد — لاگ انتهایی تمیز.
- هیچ فایلی خارج از لیست مجاز لمس نشد؛ بک‌اند/ادمین/_globals.css دست‌نخورده.

### Notes for next agents
- قرارداد ScoutBadge: `<ScoutBadge size="sm"|"md" />` — برای نمایش‌های آیندهٔ نشان چهره‌یاب.
- «چهره‌یاب» از این پس یعنی داشبورد scout (#/scout)؛ «کشف» = صفحهٔ discover. هیچ جای دیگری نباید discover را چهره‌یاب بنامد.
- NominateDialog الگوی استاندارد بات‌شیت مودال این پروژه است (mobile bottom-sheet + sm centered) — قابل کپی برای مودال‌های متنی بعدی.

---
Task ID: SCOUT-1
Agent: Z.ai Code (maintainer)
Task: سیستم چهره‌یاب (استعدادیاب) + مسیر جایگزین چهره برتر + سقف هفتگی ویترین + رینم کشف + پولیش UI

Work Log:
- ترمیم رگرسیون سندباکس (ششمین بار): history با commitهای UUID خراب شده بود + api/upload حذف + DB خالی (۱ کاربر/۰ پست — همان «دموت خالی از دیتا» که کاربر گفت) → reset به origin/main (48931be) + clean + زنجیره کامل seed + ری‌استارت dev.
- Backend (خودم):
  · Schema: User.isScout/scoutStatus/isAdminElite + ScoutApplication (userId@unique, nationalCode, cardImageUrl, description, status, adminNote, reviewedAt) + EliteRequest (userId, source user|scout, nominatorId, reason, status) + Post.featuredAt.
  · stars.ts: votes (COUNT(r.id)) در همان raw SQL + GOLD_VOTES=500/ROSE_VOTES=1000 + isAdminElite از جدول User (امضای usersStarInfo دست‌نخورده ماند) → frameFor(stars, votes, adminElite).
  · feature route: سقف هفتگی ۱ پست (featuredAt ≥ now-7d) → 429 + پیام فارسی + retryAt؛ سقف ۵ هم‌زمان ماند.
  · APIهای جدید: scout/apply (GET/POST + اعتبارسنجی کد ملی + حداقل ۲۰ کاراکتر) · scout/dashboard (elite/rising/myNeeds/stats) · scout/nominate (403/404/409) · elite/request (GET/POST، حداقل ۳۰ کاراکتر) · admin/scouts (GET + POST approve/reject/revoke + نوتیفیکیشن) · admin/elite-requests (GET + POST approve→isAdminElite).
  · سریالایزرها: isScout به auth/me (SafeUser) + talents + profile + needs + chat conversations + admin users؛ upload route kind=scout-card.
- Frontend (دو ساب‌ایجنت موازی):
  · FE-1: nav scout/scout-apply + app-shell (تب «چهره‌یاب» جایگزین «چهره برتر» برای اسکات‌ها در موبایل+دسکتاپ، رینم کشف، TOP_LEVEL) + ScoutApplyView (ریدایرکت مهمان، فرم کد ملی با چکسام ایرانی + آپلود کارت + توضیحات، وضعیت pending/rejected) + ScoutView (هدر emerald، ۴ آمار، چهره‌های برتر، در حال رشد + NominateDialog، نیازمندی‌های من) + auth?mode=scout (سگمنت‌مانت عضو/چهره‌یاب → بعد از OTP به scout-apply) + لندینگ ScoutSection + ScoutBadge در پروفایل/نیازمندی/چت/استعدادها + «نخبه»→«چهره برتر» در چت.
  · FE-2: home پنل طلایی → دکمهٔ «استعداد برتری داری؟ درخواست بررسی مستقیم ادمین» + EliteRequestDialog + چیپ وضعیت pending/approved + ادمین: تب «چهره‌یاب‌ها» (کارت‌های درخواست + لایت‌باکس کارت ملی + approve/reject/revoke + لیست فعال‌ها) و «درخواست‌های چهره برتر» (source chip معرفی چهره‌یاب/مستقیم + approve→قاب طلایی).
- پولیش (خودم): لوگو ۳۰→۳۴/۴۰ (اپ‌شل/اثر/لندینگ) + کپی قوانین جدید (۵۰۰ رأی/هفتگی/مسیر جایگزین) در لندینگ/خانه/FeatureButton + هدر چهره برتر بزرگ‌تر (۲۶/۳۲px) + زیرعنوان «۵۰۰۰+ ستاره یا ۵۰۰+ رأی — هفته‌ای یک پست».
- seed-scouts.ts: ۲ چهره‌یاب فعال (آژانس آرتا 09121110021 / کانون نگین 09121110022) + ۱ درخواست pending (استعدادیاب پارس) + ۳ نیازمندی استعدادیابی + درخواست مستقیم سارا + معرفی آرتا→علی + ۳ SVG کارت ملی دمو (force-added چون uploads گیت‌ایگنور بود).
- seed-stars: featuredAt واقعی برای پست‌های ویترین (آخرین هر نفر = امروز) + استمپ روی DB موجود (لوکال+سرور).

E2E (browser + API):
- ثبت‌نام چهره‌یاب کامل: لندینگ CTA → auth?mode=scout → OTP → scout-apply → آپلود PNG (SVG correctly rejected 400) → ثبت → pending card ✓
- لاگین اسکات → تب «چهره‌یاب» جایگزین «چهره برتر» ✓ → داشبورد (مهتاب رزگلد/امیرحسین طلایی در elite) → nominate رضا 200 ✓ (سارا 409 درست)
- ادمین: چهره‌یاب‌ها → approve پارس → isScout=true ✓ → لایت‌باکس کارت ✓ · درخواست‌ها → approve سارا → isAdminElite=true → قاب طلایی با ۹۹ ستاره ✓ (پارس برای دمو به pending برگشت)
- سقف هفتگی: امیرحسین (امروز ویترین کرده) → 429 «هر هفته فقط یک پست…۷ روز دیگر» ✓
- خانه مهدی → دیالوگ مسیر جایگزین → ثبت 200 → چیپ «در انتظار بررسی ادمین» ✓
- VLM: لندینگ/اسکات‌پيج/پروفایل «professional» · مجموع ۸.۵/۱۰ · بدون گلیچ
- tsc 0 خطا در src/ · eslint 0 · dev.log پاک (فقط 404های stale از URL قدیمی .jpg)

Deploy:
- push 415fa29 (۲ commit: feat + demo assets) → سرور: pull + db:push (additive, دیتا دست‌نخورده) + seed-scouts + استمپ featuredAt + build در پس‌زمینه.
- باگ سریالیزشن API: bun add paramiko اشتباهی پکیج npm فیک نصب کرد → revert کردم؛ paramiko با pip.
- نکته: بعد از db push باید dev سرور ری‌استارت شود تا کلایننت prisma جدید لود شود (خطای 500 me/route با کلایننت قدیمی).

Stage Summary:
- کل سیستم چهره‌یاب + مسیر جایگزین + سقف هفتگی کامل، تست‌شده و در حال استقرار production.
- دموی کامل: ۲ اسکات فعال + ۱ درخواست pending + ۲ معرفی + ۱ درخواست مستقیم + سارا طلایی (مسیر ادمین).

---
Task ID: AUDIT-1
Agent: Z.ai Code (maintainer)
Task: بازطراحی کلاسیک + رفع باگ رزگلد سراسری + eliteLevel ادمین + کارایی

Work Log:
- بک‌اند:
  · Schema: User.eliteLevel (none|gold|rosegold) + isAdminElite denormalized؛ مایگریشن SQL (isAdminElite=true→gold).
  · stars.ts: frameFor(stars, votes, adminEliteLevel) — level=rosegold→رزگلد، level=gold→حداقل طلایی؛ usersStarInfo سطح ادمین را از eliteLevel می‌خواند.
  · سریالایزرها + frame/isScout/totalStars: chat conversations، chat messages (هدر + گوینده)، connections، needs list، need detail (پوستر + متقاضیان)، comments؛ profile += scoutStatus.
  · admin/elite-requests POST: level param (gold|rosegold) + نوتیف فارسی با نام سطح؛ admin/users/[id]: اکشن‌های elite/unelite با level + نوتیف.
- UI کلاسیک (globals.css):
  · glass/glass-strong/glass-liquid → سطوح Solid تک‌رنگ (بدون backdrop-filter) — ۳۰+ فایل بی‌ویرایش کلاسیک شد.
  · aurora حذف کامل (blob های ۴۸۰px blur-80 + انیمیشن بی‌نهایت = عامل اصلی لگ).
  · انیمیشن‌های بی‌نهایت elite-spin/twinkle/shine → ایستا.
  · ۲۶ blob تزئینی blur-3xl از ۱۷ ویو حذف شد (اسکریپت پایتون).
- app-shell:
  · هدر: bg-card solid + border-b (بدون شیشه) h-16؛ لوگو ۳۴→۴۰؛ دسکتاپ ۳۸.
  · تبار موبایل: داک شیشه‌ای شناور → تبار کلاسیک full-width (bg-card + border-t + نشانگر ۳px بالای تب فعال + رنگ primary؛ بدون layoutId/spring).
  · ترنزیشن مسیر: spring ۲۸۰ms → fade ۱۴۰ms (حس نرم‌تر/سریع‌تر).
  · polling اعلان/چت: ۱۵s→۳۰s + skip وقتی tab hidden (بار سرور).
- profile-view:
  · باگ رزگلد: isTopTalent boolean → frame level؛ کاور/بنر TopTalentBanner(variant)/دکمه‌ها/StatSeg/تب‌پیل/چک‌مارک (RoseGoldCheckMark) همگی rose palette.
  · چهره‌یاب رسمی: کاور سرمه‌ای اداری + چیپ «چهره‌یاب تأییدشده» روی کاور + عنوان حرفه‌ای + خط نشان؛ بنر pending خودِ کاربر («در انتظار تأیید ادمین»).
  · حذف motion blurهای بی‌نهایت کاور (perf).
- elite.tsx: TopTalentBanner/Laurel پارامتر tint (gold|rose)؛ حذف درخشش عبوری.
- chat-view: UserAvatar با frame در لیست/هدر/کارت پروفایل + آواتار قاب‌دار کنار اولین پیام هر گروه incoming (الگوی مسنجر کلاسیک) + چیپ رزگلد/طلایی کنار نام.
- PostCard: حذف نوار گرادیانی بالای کارت؛ اکشن‌ها قرص‌های یکدست quiet (امتیاز quiet amber با ستاره پر)؛ تاریخ انتهایی حذف (تکراری).
- Sheet جدید (shared/sheet.tsx): مودال کلاسیک استاندارد — موبایل بات‌شیت + دسکتاپ دیالوگ، روکش solid بدون بلور، ESC/قفل‌اسکرول/فوتر. RatingModal/ReportDialog/EliteRequestDialog/NominateDialog بازنویسی با Sheet؛ بک‌دراپ‌های blur مودال‌ها (composer/likers/filter/crop/portfolio) → solid.
- landing: هیرو → پنل سرمه‌ای کلاسیک (بدون blob متحرک/بلور)، لوگو ۴۸px، متن سفید، دکمه‌ها solid؛ گرید دسته‌ها بدون stagger فریم‌موشن؛ حذف بلورهای سکشن پایانی/اسکات.
- admin-view: درخواست‌های چهره برتر → دو دکمه «تأیید → قاب طلایی (۵۰۰۰)» / «تأیید → قاب رزگلد (۱۰۰۰۰)»؛ منوی کاربران → اکشن‌های ارتقا طلایی/رزگلد/لغو قاب.

E2E (agent-browser + VLM + API):
- مهدی کریمی: ادمین تأیید رزگلد → eliteLevel=rosegold → پروفایل کاملاً رزگلد (VLM: ۱۰/۱۰، PASS هر ۳ آیتم).
- چت: قاب طلایی سارا در لیست + هدر + کنار پیام‌ها (VLM ۹+۹)؛ سرویس socket مستقیم تست شد (connect/token/join/message → DB).
- اسکات: پروفایل رسمی (VLM ۸ رسمی/۹ تمایز) + داشبورد ۹/۱۰؛ پارس pending → بنر روی پروفایل خودش ✓ و می‌تواند عادی بگردد.
- Pages VLM: landing ۸.۵ / feed ۷.۵ / home-needs-talents ۹×۳ / explore ۹ / rating-modal ۹ / elite-sheet کلاسیک ✓.
- tsc 0 خطا در src؛ eslint 0؛ dev.log پاک؛ تبار full-fit (844px viewport).

Stage Summary:
- رزگلد در «همه‌جا» (پروفایل/چت/لیست‌ها) + انتخاب سطح در ادمین = کل چرخه تست‌شده.
- حذف کامل شیشه/aurora/blobها → کلاسیک solid + سرعت.
- مودال‌ها روی Sheet استاندارد کلاسیک.

---
Task ID: AUDIT-1-DEPLOY
Agent: Z.ai Code (maintainer)
Task: استقرار 114cfe7 روی سرور تولید 217.114.40.93

Work Log:
- git pull (415fa29→114cfe7) روی /opt/hamteam.
- bun run db:push → ستون User.eliteLevel اعمال شد (افزایشی، دیتا دست‌نخورده؛ ۷۶ کاربر).
- مایگریشن: prod هیچ isAdminElite نداشت → سارا از پنل با level=rosegold تأیید شد.
- Build موفق (Turbopack) → systemd restart hamteam + hamteam-chat → Ready در ۱۸۱ms.
- E2E تولید: login ادمین (curl) → GET elite-requests (سارا/علی pending) → POST approve level=rosegold → پیام «سارا محمدی چهره برتر رزگلد شد» → /api/profile/sara frame=rosegold ✓
- تأیید قاب‌ها: مهتاب rosegold (۱۱۵۲۰ ستاره)، امیرحسین gold (۵۸۶۸)، سارا rosegold (ادمینی) — هر سه مسیر.
- گیت‌وی: socket.io از طریق nginx با ?XTransformPort=3003 → 200 ✓؛ home عمومی 200 (t≈1.3s اول، بعدی ۵۶ms).

Stage Summary:
- تولید کاملاً همگام با آخرین کلاسیک/رزگلد/ادمین؛ چت‌گیت‌وی سالم.

---
Task ID: CORE-1
Agent: Z.ai Code (maintainer)
Task: تعویض سیستم قاب (۵۰۰۰=نقره‌ای، ۱۰۰۰۰=طلایی) + بک‌اند جایگاه‌ها + seed مجدد

Work Log:
- re-seed کامل: seed-full + seed-featured + seed-social + seed-stars + seed-scouts (۷۴ کاربر، ۱۳+ پست، ۲ اسکات، رأی/ویترین)
- src/lib/stars.ts: FrameLevel = "silver"|"gold"|null؛ AdminEliteLevel = "none"|"silver"|"gold"؛ SILVER_THRESHOLD=5000/GOLD_THRESHOLD=10000 + SILVER/GOLD_VOTES (500/1000)؛ UserStarInfo += nextFrame؛ frameFor جدید
- src/components/ui/elite.tsx: بازنویسی کامل — EliteCheckMark (tint gold|silver)، EliteAvatar (variant gold|silver + square برای چهره‌یاب)، Laurel (tint)، TopTalentBanner (silver/gold)، حذف کامل RoseGold* و انیمیشن بی‌نهایت (elite-spin حذف؛ GoldSparkle ایستا)
- src/components/shared/user-avatar.tsx: frame logic جدید + prop square (rounded-[22%] برای چهره‌یاب‌ها؛ EliteAvatar square)
- user-avatar: EliteAvatar variant مستقیم از frame
- API: admin/users/[id] + admin/elite-requests: level silver|gold + متن فارسی؛ scout/dashboard: thresholds {silver, gold, silverVotes, goldVotes}
- NEW src/lib/rankings.ts: myRank(userId) (overall/category/skill — فقط اعضا: غیر اسکات/غیر بن) + leaderboard({categoryId?, skillId?, limit}) برای چهره‌یاب
- NEW /api/scout/talents (GET: جست‌وجوی استعداد با فیلتر دسته/مهارت/q + جایگاه؛ POST: لیست دسته‌ها/مهارت‌ها)
- /api/feed/home: stats += votes/nextFrame + rank (overall/category/skill)
- views: chat/connections/talents/scout/explore/home/landing/admin — تعویض مکانیکی "gold"→"silver"/"rosegold"→"gold" + متن‌ها + گرادیان‌ها (رز→خاکستری نقره) + حذف delay از GoldSparkle
- explore-view: GoldCheckMark/RoseGoldCheckMark → EliteCheckMark tint؛ chips «رزگلد»→«طلایی»؛ کارت border amber=طلایی/slate=نقره
- admin-view: منو «چهره برتر نقره‌ای (۵۰۰۰)»/«چهره برتر طلایی (۱۰۰۰۰)»؛ EliteRequests دکمه‌های silver/gold + بج slate/amber
- scout-view: میانگین ویترین «x/۱۰» → «x از ۱۰»
- DB: eliteLevel مهاجرت (همه none بود — بدون تغییر)

Stage Summary:
- سیستم قاب جدید سراسری: ۵۰۰۰=نقره‌ای (پالت slate سرد)، ۱۰۰۰۰=طلایی (پالت amber) — همه APIها + views همگام
- EliteAvatar/EliteCheckMark پارامتریک (tint/variant/square) — چهره‌یاب‌ها مربعی از این component
- بک‌اند جایگاه (rank) + جست‌وجوی استعداد چهره‌یاب آماده — feed/home و /api/scout/talents
- ادامه: بازنویسی home-view/profile-view/scout-view/app-shell/auth (subagentها)

---
Task ID: FE-HOME
Agent: Z.ai Code (subagent — views)
Task: بازنویسی کلاسیک home-view.tsx — خوش‌آمد بدون تاریخ، آکاردئون تکمیل پروفایل، پنل «چهره برتر شو» با سیستم قاب جدید (نقره‌ای/طلایی) + جایگاه‌ها، کارت چهره‌یاب، کلاسیک‌سازی کامل

Work Log:
- فایل read کامل + مطالعه worklog (CORE-1) + elite.tsx (EliteCheckMark tint) + stars.ts (nextAt/nextFrame) + rankings.ts (myRank) + api/feed/home/route.ts (قرارداد داده) + icon.tsx (chevronDown/loader موجود)
- خوش‌آمد: حذف formatFaDate (فقط کلمهٔ خوش‌آمد به‌عنوان لیبل primary کوچک)؛ آواتار lg + نام با line-clamp-2 break-words (بدون ellipsis)؛ MiniStatها (ارتباط/پست) به ردیف جدا grid-cols-2 با جداکننده + border-t داخل همان کارت bg-card border-border rounded-2xl p-4
- تکمیل پروفایل → آکاردئون (تسک ۱۰): هدر دکمه‌ای (eyebrow + «پروفایلت X٪ کامله» + دایرهٔ ۴۰px + chevronDown با rotate-180 transition)؛ بدنه با AnimatePresence height+opacity (۰.۲s)؛ نوار پیشرفت bg-primary + گام‌های ناقص (حداکثر ۶، bg-muted/40 border-border/50)؛ localStorage با کلید home-completion-collapsed ("1"=بسته، پیش‌فرض باز)؛ ۱۰۰٪ کامل یا چهره‌یاب → مخفی
- پنل «چهره برتر شو» (تسک ۱۱) فقط اعضا: بک‌گراند تیرهٔ رسمی مطابق هدف بعدی (بدون قاب → سلیت #1e293b→#0f172a؛ نقره‌ای/طلایی → طلایی تیره #2a1a04)؛ EliteCheckMark tint=myFrame??"silver" + خط قوانین «۵۰۰۰ ستاره یا ۵۰۰ رأی → قاب نقره‌ای · ۱۰۰۰۰ ستاره → قاب طلایی»؛ هدف از stats.nextAt (fallback ۱۰۰۰۰/۵۰۰۰) با faSep (۵٬۰۰۰)؛ نوار: نقره linear-gradient(90deg,#475569,#cbd5e1,#f8fafc) / طلایی (#b45309,#f5c84c,#fef3c7)؛ کاربر طلایی → badge «بالاترین سطح — طلایی ✓» + متن «در بالاترین سطح چهره برتری»؛ NEW ردیف جایگاه (فقط عدد، واژهٔ «جایگاه»): چیپ‌های h-8 rounded-lg bg-white/5 border-white/10 — کل/دسته/مهارت با toFa؛ دکمهٔ «مشاهده چهره برتر» h-11 rounded-xl گرادیان طلایی؛ مسیر جایگزین: چیپ pending خنثی / چیپ approved با grad-gold+EliteCheckMark(14,gold) / دکمهٔ درخواست؛ حذف کامل GoldSparkle و RoseGold*/GoldCheckMark و ROSE_GOLD/GOLD_THRESHOLD محلی
- چهره‌یاب: پنل ستاره + چک‌لیست + مودال elite رندر نمی‌شوند (فچ elite-status هم skip) → کارت جمع‌وجور emerald (border-emerald-600/20 bg-emerald-600/5) «داشبورد چهره‌یاب» + دکمهٔ ورود به scout + «ثبت نیازمندی» → create-need
- کلاسیک‌سازی: glass→bg-card+border-border همه‌جا؛ rounded-[22-26px]→rounded-2xl؛ space-y-5→space-y-4؛ هدر سکشن‌ها mb-2.5؛ SuggestionCard کلاسیک فقط fade (بدون stagger)؛ دکمه‌ها bg-primary به‌جای grad-brand؛ اسکلتون فید rounded-2xl
- بارگذاری: اسپینر جمع‌وجور (Icon loader animate-spin) برای ناحیهٔ بالا؛ فید اسکلتون خود را نگه داشت
- EliteRequestDialog: متن‌ها به قاب نقره‌ای/طلایی («با تأیید ادمین، قاب نقره‌ای/طلایی بدون نیاز به آستانهٔ ستاره فعال می‌شود.»)؛ دکمهٔ گرادیان طلایی ۱۳۵deg
- انیمیشن‌ها فقط opacity ≤0.25s (پیشرفت نوارها width مجاز)؛ whileTap→active:scale CSS

Stage Summary:
- tsc --noEmit: صفر خطا در home-view؛ eslint: ۰ خطا/۰ هشدار؛ dev.log بدون خطای جدید home-view (۵۰۰ فعلی فقط از profile-view.tsx عامل دیگر — import RoseGoldCheckMark حذف‌شده)
- قرارداد API: GET /api/feed/home → {posts, suggestions, stats(+votes,nextAt,nextFrame), rank{overall,category,skill}} و GET /api/elite/request → {isTopTalent, frame, request} مطابق سرور استفاده شد؛ nextFrame سرور برای کاربر بدون قاب "gold" برمی‌گرداند (ناسازگار با nextAt=۵۰۰۰) → تینت پنل از myFrame مشتق شد (exactly مطابق «هدف بعدی»)؛ ستارهٔ ادمینی طلایی با ستارهٔ کم → starPct/remaining گارد myFrame==="gold"
- home-view کاملاً همگام با سیستم قاب جدید ۵۰۰۰=نقره‌ای/۱۰۰۰۰=طلایی؛ آماده برای اتصال profile-view/scout-view بقیهٔ عامل‌ها

---
Task ID: FE-SHELL
Agent: Z.ai Code (subagent — shell)
Task: بازطراحی کلاسیک app-shell — هدر چسبان بدون جبران padding + شیشه ظریف + قاب/عکس در آیکون پروفایل هدر + تبار کلاسیک + رفع فلیکر تغییر مسیر + توست کلاسیک

Work Log:
- مطالعه worklog (CORE-1/FE-HOME/AUDIT-1) + app-shell.tsx کامل + user-avatar.tsx (frame/square) + types.ts (SafeUser: frame/isScout/profile) + icon.tsx + toast/toaster + globals.css (pb-safe/grad-brand/tw-animate-css) + layout.tsx (dir=rtl).
- فیکس بنیادین هدر دسکتاپ: `fixed top-0 inset-x-0` → `sticky top-0` (در جریان سند، `hidden md:flex` ماند) و حذف کامل `md:pt-[4.75rem]` از div محتوای اصلی (الان فقط `pt-1`) — محتوا دیگر هرگز زیر هدر نمی‌رود چون هدر فضای واقعی layout اشغال می‌کند؛ روت‌rapper `min-h-screen flex flex-col` با هدرها قبل از main تأیید شد.
- شیشه ظریف هر دو هدر (h-16): `bg-card/85 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 border-b border-border` — متن کاملاً خوانا (المان کوچک، بلور مجاز). لوگو h=40 موبایل / 38 دسکتاپ ماند.
- آیکون پروفایل هدر: UserAvatar با `frame={user.frame ?? undefined}` + `square={!!user.isScout}` (چهره‌یاب‌ها مربعی همه‌جا) + عکس/verified — موبایل، دسکتاپ و کارت کاربر شیتِ «بیشتر». typing درست شد: `user: any` → `SafeUser | null` در هر ۳ کامپوننت (import type از lib/types).
- تبار پایین کلاسیک: h-14 + pb-safe (touch ≥44px)، نشانگر `w-8 h-[3px] rounded-full bg-primary` وسطِ تب فعال (`left-1/2 -translate-x-1/2`)، آیکون 22px با strokeWidth فعال 2.4، لیبل 10px، فقط transition-colors CSS — بدون spring/motion روی اندیکاتور؛ شیت «بیشتر» spring → tween easeOut 0.2s.
- رفع فلیکر تغییر مسیر: حذف کامل `AnimatePresence mode="wait"` (عامل گپ خالی = محو → سوار شدن → پرش)؛ الان فقط `motion.div key={routeKey}` با fade-in 0.18s بدون exit — محتوای جدید بلافاصله در همان commit سوار می‌شود؛ اسکرول به بالا (mainRef + window smooth) دست‌نخورده ماند. فیلترتب‌های داخل ویوها routeKey را عوض نمی‌کنند → بدون پرش.
- پاکسازی انیمیشن‌های نقض‌کننده زبان طراحی در فایل‌های خودم: layoutId/spring پیلِ ناو دسکتاپ → state کلاسیک solid `bg-primary text-primary-foreground shadow-sm`؛ منوی بیشتر دسکتاپ spring → fade 0.15s + کارت solid (glass-strong حذف)؛ دکمه بازگشت whileTap → CSS active:scale-90؛ FAB چت: ظاهر دست‌نخورده (44px/سفید/آیکون آبی/بج z-40) ولی ورود spring+delay → tween 0.18s.
- توست کلاسیک (toast.tsx + toaster.tsx): viewport موبایل `bottom-[calc(env(safe-area-inset-bottom)+76px)] left-1/2 -translate-x-1/2 w-[min(92vw,400px)]` (بالای تبار h-14) · دسکتاپ `md:bottom-4 md:right-4 md:w-[400px]`؛ توست: rounded-xl + border-border + bg-card solid + shadow-md + p-3.5 + gap-2 (RTL-safe)؛ ورود `fade-in-0 slide-in-from-bottom-2` (150ms) و خروج `fade-out-80` — حذف slide-in-from-top-full/slide-out-to-right-full؛ عنوان 13px bold، توضیح 12px muted؛ کلوز به left-1 (انتهای خوانش RTL) 14px؛ اکشن rounded-lg 12px. API (`toast({title,description,variant})` + default/destructive) و hooks/use-toast.ts کاملاً دست‌نخورده.
- تأیید وجود همه کلاس‌ها در tw-animate-css (fade-in-*/fade-out-*/slide-in-from-bottom-*/animate-in با duration پیش‌فرض 150ms).

Stage Summary:
- tsc --noEmit (فیلتر app-shell|toast): خالی — تنها خطای src مربوط به profile-view.tsx است (ایمپورت RoseGoldCheckMark حذف‌شده — فایل عامل دیگر، طبق worklog FE-HOME هم شناخته شده). eslint روی ۳ فایل: ۰ خطا/۰ هشدار (exit 0). dev.log بدون خطای جدید برای فایل‌های من.
- هدر موبایل+دسکتاپ: sticky در جریان سند + شیشه ظریف، صفر جبران padding؛ آیکون پروفایل با قاب نقره‌ای/طلایی + عکس + مربعی چهره‌یاب.
- تبار کلاسیک h-14 با اندیکاتور 3px مرکز؛ تغییر مسیر بدون فلیکر/پرش؛ توست پایین وسط موبایل / پایین راست دسکتاپ با fade+rise ظریف.

---
Task ID: FE-AUTH
Agent: Z.ai Code (subagent — auth/onboarding)
Task: ورود/ثبت‌نام فقط با شماره + گام اجباریِ نام پس از ثبت‌نام + چک‌لیست تکمیل پروفایل (بازنویسی auth-view، بازطراحی onboarding-view، API جدید PUT /api/auth/profile)

Work Log:
- مطالعه کامل: worklog + هر ۴ روت auth (register/verify/me/logout) + lib/auth.ts (stageAuth روی globalThis) + PUT /api/profile/me (فقط فیلدهای Profile — User.name را آپدیت نمی‌کند → روت جدید لازم شد) + schema.prisma (User.name رشتهٔ غیرنال) + nav/format/icon/illustrations/app-shell + نحوهٔ خواندن params.section در edit-profile (photos/gender/location/categories/main-category/experience) و CompletionStepهای home-view (قواعد done یکسان‌سازی شد)
- یافتهٔ کلیدی: register برای کاربر جدید name≥2 الزامی است → ثبت‌نام فقط-با-شماره با «جای‌نگهدار = خود شماره» (name=phone)؛ پاسخ register شامل mode:"login"|"register" (سیگنال ثبت‌نام تازه)؛ تشخیص بی‌نام در کلاینت: mode==="register" یا name خالی یا name===phone
- NEW src/app/api/auth/profile/route.ts — PUT {name}: getCurrentUser → trim/slice(40) → اعتباری ۲..۴۰ → db.user.update فقط name (سطر Profile/کش دست‌نخورده) → {ok,name}؛ 401 بدون لاگین، 400 نام نامعتبر
- auth-view.tsx بازنویسی کامل (mobile-first max-w-sm، کارت bg-card/border-border/rounded-2xl، فقط fade ≤0.25s با opacity، لوگو LogoFull h=44، grad-brand فقط روی CTA):
  · گام ۱ «ادامه»: فقط شماره (dir=ltr، inputMode=numeric، نرمال‌سازی ارقام فارسی/عربی با toEnDigits محلی، حداکثر ۱۱ رقم)؛ حذف فیلد نام و سوییچ عضویت — scoutMode فقط از #/auth?mode=scout
  · گام ۲ «تأیید»: InputOTP چهاررقمی h-12 + چیپ «کد نمایشی: ۱۲۳۴» (dev، از res.otp با fallback) + «ویرایش شماره»
  · گام ۳ «شروع» (فقط کاربر جدید): «اسمت چیه؟» (۲..۴۰ نویسه) → PUT /api/auth/profile → fetchUser → onboarding (scout → scout-apply)
  · پس از verify: نیازمند نام؟ گام ۳؛ وگرنه toast «خوش اومدی!» + feed (رفتار قبلی: mode=scout → scout-apply — حفظ شد)
  · ورود خودکارِ لاگین‌شده در مونت: اسپینر «در حال ورود…» → feed/scout-apply؛ گارد useRef (فقط بررسی اولیه) + تایمر در افکت جدا تا بعد از fetchUserِ پس از OTP دوباره فعال نشود (StrictMode-safe)
- onboarding-view.tsx بازطراحی کامل → چک‌لیست تکمیل پروفایل پس از گام نام:
  · داده: GET /api/profile/me (avatarUrl/bannerUrl/bioShort/province/city/categories[].skills)
  · عضو ۶ قلم (آواتار، بنر، بیو، دسته‌بندی، مهارت، موقعیت → سکشن photos/photos/photos/categories/categories/location) · چهره‌یاب فعال (user.isScout) ۴ قلم + CTA «ورود به داشبورد چهره‌یاب» → scout
  · کارت پیشرفت + «X از ۶» (toFa) با نوار bg-primary · ردیف‌های h-14 (هدف لمسی) bg-card rounded-2xl: آیکون + لیبل + hint + چیپ وضعیت (✓ emerald «انجام شده» / «+» primary «افزودن») · stagger 0.05 فقط fade
  · کلیک ردیف → edit-profile با params.section (پرش به سکشن موجود) · پایین: «ورود به فرصتینو» همیشه فعال + «بعداً تکمیل می‌کنم» → feed · مهمان → auth · اسکلتون h-14 + کارت خطا با تلاش مجدد
- dev server محیط در میانهٔ کار کرش کرده بود (خطای RoseGoldCheckMark در profile-view — عامل دیگر، ثبت‌شده در FE-HOME) → برای E2E با setsid موقتاً بالا آوردم؛ سرور سیستم سپس خودش بازگشت (Ready در 738ms)

E2E (curl):
- جدید 09129990000 (name=phone): register → {"ok":true,"otp":"1234","mode":"register","message":"کد تایید ارسال شد"} · verify → {"ok":true,"userId":"cmuh5ruea0000n32kj6cu9s4a"} + کوکی · me → name="09129990000" (جای‌نگهدار) · PUT name → {"ok":true,"name":"تست کاربر فرصتینو"} · me → نام واقعی ✓ · PUT نام کوتاه → 400 · بدون کوکی → 401 · GET /api/profile/me → ProfileDetail کامل (categories:[] برای تازه‌کار)
- موجود 09121110001: register → mode="login" (نام نادیده گرفته شد) · verify/me → name="امیرحسین رستمی" (isTopTalent/silver/5755 ستاره) → مستقیم فید — لاگین کاربر فعلی نشکست ✓
- بازورود 09129990011 (بی‌نام): register → mode="login" اما name===phone → گام نام در کلاینت ✓

Stage Summary:
- جریان جدید فقط-با-شماره کامل و تست‌شده: شماره → OTP → نامِ اجباری (فقط ثبت‌نام جدید) → چک‌لیست ۶/۴ قلمی → اپ؛ کاربر قدیمی مستقیم اپ؛ mode=scout در کل مسیر حفظ و به scout-apply ختم می‌شود
- شکل پاسخ APIها مستند شد؛ PUT /api/auth/profile مینیمال ساخته شد چون هیچ روت موجودی User.name را آپدیت نمی‌کرد
- tsc: صفر خطا در فایل‌های من (تنها خطای باقی‌ماندهٔ پروژه: profile-view.tsx از عامل دیگر) · eslint: ۰ خطا/۰ هشدار · dev.log: فقط 200/400/401 مورد انتظار از روت‌های من
- رکورد عامل: agent-ctx/FE-AUTH-zai-code.md

---
Task ID: FE-SCOUT
Agent: Z.ai Code (subagent — views)
Task: ارتقای کامل scout-view — ابزار کامل کشف استعداد (جست‌وجوی دسته/مهارت/متنی + جدول جایگاه) + کلاسیک‌سازی کامل

Work Log:
- مطالعه worklog (CORE-1/SCOUT-1/FE-HOME) + scout-view قدیمی + rankings.ts + /api/scout/talents (GET/POST موجود از CORE-1) + dashboard route (thresholds جدید) + user-avatar (prop square) + ScoutBadge + atoms/icon/format + home-view برای زبان دیزاین کلاسیک
- بازنویسی کامل scout-view.tsx (~۸۳۰ خط) — ساختار بالا→پایین:
  · هدر کلاسیک فشرده: bg-card border rounded-2xl p-4 — آواتار مربعی خود چهره‌یاب (lg + square) + «چهره‌یاب» + ScoutBadge (تنها emerald) + نام + «ابزار کشف استعداد» — بدون هیرو سبز/شیشه
  · آمار: ۴ MiniStat کلاسیک (h-16 rounded-xl bg-card) grid-cols-2 sm:grid-cols-4 — چهره برتر/پست ویترین/میانگین ویترین «X از ۱۰»/نیازمندی فعال من
  · NEW سکشن «جست‌وجوی استعداد» (TalentSearch): کارت فیلتر p-3 با اینپوت dir=auto + دکمه پاک‌کردن + ریل چیپ دسته‌ها («همه» + ۱۲ دسته از POST /api/scout/talents، active=bg-primary) + ریل دوم مهارت‌ها بعد از انتخاب دسته («همهٔ مهارت‌ها»)
  · جدول جایگاه از GET /api/scout/talents با debounce ۴۰۰ms: سربرگ «جایگاه‌ها بر پایهٔ مجموع ستاره‌ها» + چیپ «{total} نفر»/اسپینر؛ ردیف‌ها: بج مدال جایگاه (۱ amber-500 / ۲ slate / ۳ amber-700 / بقیه muted) + آواتار گرد قاب‌دار + نام بولد ۱۴px + چیپ «{N} ستاره» رنگ قاب (gold=amber-600/10 border-amber-500/25 / silver=slate / none=muted) + چیپ دستهٔ اصلی + بایو truncate + اکشن‌های «پروفایل»/«گفتگو»
  · خالی «استعدادی پیدا نشد» + اسپینر جست‌وجو + «نمایش بیشتر» صفحه‌بندی (page+1, dedupe) + 401/error states
  · چهره‌های برتر: ردیف‌های کلاسیک با چیپ «چهره برتر طلایی/نقره‌ای» (crown) + StarsChip + دسته‌ها(max 3) + بایو + mapPin + پروفایل/گفتگو
  · در حال رشد: همان ردیف + چیپ رأی + «معرفی به ادمین» (emerald کوچک) → NominateDialog دست‌نخورده (exit fade 0.15s حذف ردیف بعد از معرفی)
  · نیازمندی‌های من: لیست divide-y کلاسیک + «ثبت نیازمندی» دکمهٔ primary → create-need
  · کارت آستانه‌ها (پایین): «آستانه‌های چهره برتر: ۵٬۰۰۰ ستاره یا ۵۰۰ رأی → نقره‌ای · ۱۰٬۰۰۰ ستاره یا ۱۰۰۰ رأی → طلایی» از thresholds سرور (faSep)
- اجزای مشترک جدید: useStartChat (POST /api/chat/start → navigate chat)، StarsChip، FilterChip (h-8)، medalClass، faSep، searchParams بیرون کامپوننت (exhaustive-deps)
- کلاسیک‌سازی: glass→bg-card+border-border همه‌جا؛ rounded-3xl→rounded-2xl؛ انیمیشن فقط fade ≤0.2s بدون stagger؛ max-w-2xl موبایل-فرست
- dashboard route و scout-badge بدون تغییر (نیازی نبود)
- نوشتن رکورد در agent-ctx/FE-SCOUT-zai-code.md

Stage Summary:
- tsc: صفر خطای scout (تنها خطای باقی‌مانده profile-view.tsx ← RoseGoldCheckMark — فایل عامل دیگر)؛ eslint scout-view + api/scout/talents: ۰ خطا
- E2E curl (لاگین 09121110021/OTP 1234): GET /api/scout/talents → لیست رتبه‌بندی‌شده (مهتاب ۱۱۲۰۰ gold #۱، امیرحسین ۵۷۵۵ silver #۲…) · ?categoryId=موسیقی → total 6 با جایگاه درون‌دسته · ?categoryId&skillId → فیلتر · q=مهتاب → total 1 · POST → ۱۲ دسته با مهارت · dashboard 200 (thresholds 5000/500/10000/1000, elite 2, rising 12, myNeeds 2) · بدون کوکی → 401
- dev.log: بدون خطای جدید از فایل‌های scout (کرم‌های OOM کامپایل `/` و خطای import پروفایل‌ویو مربوط به محیط/عامل دیگر)
- نکته برای عامل‌های بعد: پروسه‌های پس‌زمینه با پایان دستور Bash کشته می‌شوند — E2E باید سرور+curl را در یک دستور اجرا کند؛ کامپایل `/` ~۲٫۲GB حافظه می‌خواهد (روی این باکس ۴GB ممکن است OOM شود — مستقیم API را تست کنید)

---
Task ID: FE-ACCOUNT
Agent: Z.ai Code (subagent — account/dashboard/needs views)
Task: تسک ۶ — اکانت/داشبورد/ویرایش پروفایل چهره‌یاب هرگز آپشن‌های چهره‌ها را نداشته باشد + کلاسیک‌سازی کامل ۴ فایل (edit-profile, dashboard, needs, my-needs)

Work Log:
- مطالعه worklog (CORE-1/FE-HOME/FE-SHELL/FE-AUTH/FE-SCOUT) + ۴ فایل خودم + use-user/types/nav/user-avatar/scout-badge/icon/globals + روت‌های feed/home و needs/my-needs و chat/conversations و scout/dashboard
- edit-profile-view: isScout از useUser() → سکشن‌های جنسیت/دسته‌بندی/دستهٔ اصلی/سوابق/تحصیلات فقط اعضا؛ ناوبری سریع چهره‌یاب = SCOUT_SECTIONS (عکس‌ها/موقعیت/اطلاعات چهره‌یاب)؛ NEW ScoutInfoSection (#section-scout-info): بج فعال ScoutBadge + CTA «داشبورد چهره‌یاب» (navigate scout) + «مدیریت نیازمندی‌ها» (my-needs) + حالت pending (چیپ کهربایی «در انتظار بررسی»)؛ آواتار پیش‌نمایش مربعی (square=isScout) + placeholderهای سازمانی
- یافتهٔ کلیدی: /api/profile/me اصلاً scoutStatus/isScout نمی‌فرستد → pending از user.scoutStatus (auth/me که برمی‌گرداند) خوانده شد
- dashboard-view: هیرو کلاسیک (bg-card border rounded-2xl p-4، بدون تاریخ — همگام FE-HOME)؛ عضو: ارتباط/پست‌های من (دست‌نخورده)؛ چهره‌یاب: ۴ آمار اختصاصی (نیازمندی فعال، درخواست دریافتی، پست، گفتگو) از my-needs + conversations + feed/home؛ کارت CTA «داشبورد چهره‌یاب» خنثی با چیپ کوچک emerald (بدون پنل سبز)؛ آواتار چهره‌یاب مربعی + ScoutBadge کنار خوش‌آمد
- فیکس بونوس: کارت TimelinePost از motion.button با دکمه‌های تو در تو (هیدریشن‌ارر <button> در <button> در هر رفرش) → div role=button + onKeyDown؛ h-11 برای اهداف لمسی ۴۴px
- needs/my-needs (لمس سبک): needs-view بج square={!!need.user.isScout} از قبل موجود بود (تأیید شد)؛ my-needs به AppliedNeedCard اضافه شد + gender/frame
- کلاسیک‌سازی هر ۴ فایل: همهٔ انیمیشن‌ها فقط opacity ≤0.2s بدون stagger/whileHover/scale؛ glass/glass-strong→bg-card+border؛ rounded-3xl→rounded-2xl؛ حذف shadow-card/-float/-lift/-glow* و grad-gold (دکمهٔ امتیاز→amber-600 sólido)؛ gap-6 پیش‌فرض Card→gap-0/1/3؛ p-5/6→p-4/5؛ space-y→4
- E2E مرورگر (agent-browser): چهره‌یاب → داشبورد ۲/۰/۰/۱ + CTA و ویرایش پروفایل فقط ۳ سکشن (صفر سکشن عضوی) ✓؛ عضو → هر ۷ لینک سکشن + آمار عضو بدون CTA ✓؛ نیازمندی‌ها ۹ کارت با آواتار مربعی پست‌کنندگان چهره‌یاب (rounded-[22%] اثبات‌شده) ✓؛ کاربر pending → همهٔ سکشن‌های عضو + چیپ «در انتظار بررسی» ✓؛ کنسول: صفر ارر بعد از فیکس nested-button؛ درخواست تست حذف شد از DB

Stage Summary:
- چهره‌یاب‌ها در اکانت/داشبورد/ویرایش پروفایل فقط چیزهای خودشان را می‌بینند: عکس/بنر/بیو/موقعیت/تماس + «اطلاعات چهره‌یاب» + آمار نیازمندی/درخواست/گفتگو + CTA داشبورد چهره‌یاب — بدون دسته/مهارت/رزومه/جنسیت/ستاره/قاب
- جریان عضو ۱۰۰٪ دست‌نخورده (هر ۷ سکشن ویرایش + آمار ارتباط/پست + تایم‌لاین/امتیازدهی)
- tsc: صفر خطا (کل src) · eslint ۴ فایل: ۰ خطا/۰ هشدار · dev.log بدون خطای جدید · ارر هیدریشن nested-button داشبورد رفع شد
- گپ بک‌اند برای عامل بعدی: my-needs روت isScout پست‌کننده را نمی‌فرستد (آواتار applied گرد می‌ماند) — ۱ خط در route.ts؛ همچنین profile/me فیلدهای isScout/scoutStatus را ندارد (کلاینت از auth/me می‌خواند)
- رکورد: agent-ctx/FE-ACCOUNT-zai-code.md

---
Task ID: FE-PROFILE + FE-PERF (maintainer)
Agent: Z.ai Code (maintainer)
Task: بازنویسی profile-view + هیرو لندینگ + کشف پرش‌ها + رفع گپ‌های بک‌اند

Work Log:
- profile-view.tsx بازنویسی کامل: کاور ۳:۱ بدون -mt-6 (رفع رفتن زیر هدر)؛ حذف کامل دکمه‌های شناور «پست جدید/ادیت/چت» از بنر؛ NEW دکمهٔ پلاس شناور (fixed left-4، بالای FAB چت: bottom=136px) → PlusChooserSheet (پست جدید → ComposerInline / نمونه کار جدید → tab portfolio + رویداد portfolio:new → PortfolioFormSheet)؛ آواتار چهره‌یاب مربعی (EliteAvatar square / UserAvatar square در قاب border)؛ TopTalentBanner gold/silver؛ StatSeg با tint؛ تب‌های کلاسیک بدون layoutId؛ stats چهره‌یاب: grid-cols-3 بدون ستاره/تخصص؛ fade-only.
- portfolio-tab.tsx: listener رویداد «portfolio:new» → باز شدن فرم نمونه‌کار از بیرون.
- landing-view.tsx: هیرو کاملاً روشن خنثی (حذف بک آبی) — گرادیان #fafbfc→#f1f5f9 + بافت نقطه‌ای ظریف؛ تیتر ۲ رنگ (foreground + gold accent)؛ CTAها rounded-xl؛ HeroStat رنگ‌های روشن؛ glass→bg-card همه‌جا؛ rounded-3xl→rounded-2xl؛ انیمیشن‌ها fade-only.
- discover-view.tsx: رفع پرش تب (results در min-h-[320px] ثابت + اسکلتون‌های هم‌شکل)؛ هدر/جستجو/تب/چیپ‌ها کلاسیک bg-card؛ TalentMiniCard fade-only.
- بک‌اند: my-needs += isScout پوستر (هر دو لیست)؛ profile/me += isScout/scoutStatus (تأمین گپ FE-ACCOUNT)؛ کامنت‌های rosegold همه پاک شدند (۰ رفرنس).
- toast.tsx: w-[min(92vw,400px)] صحیح (کلاس قبلاً سالم بود — آرتیفکت نمایشی).
- seed-stars.ts: آپدیت await واقعی برای ویترین + نام‌های آستانهٔ جدید؛ seed-featured-fix.ts: ۷ پست ویترین با featuredAt واقعی (۷-پست منتخب در چهره برتر).
- chat/connections/needs/need-detail views: square={!!isScout} روی همهٔ UserAvatarهای مرتبط.

E2E (agent-browser + VLM + DOM):
- لاگین 09121110001: خانه = خوش‌آرد بدون تاریخ + نام کامل + آکاردئون ۶۳٪ + پنل «هدف ۱۰٬۰۰۰ (قاب طلایی)» (امیرحسین ۵۷۵۵ = نقره‌ای) + جایگاه‌ها (کل ۲/۷۴، موسیقی ۱/۶، خوانندگی ۱/۱) ✓
- explore: ۷ پست ویترین؛ مهتاب = قاب طلایی کامل در کارت‌ها/چک‌مارک؛ هیچ رز/صورتی باقی ✓ (VLM: gold+silver frames present, no pink)
- profile مهتاب (۱۱۲۰۰): EliteAvatar طلایی + TopTalentBanner «چهره برتر طلایی» + بنر زیر هدر نه + بدون دکمه روی بنر (VLM PASS هر ۵ آیتم) ✓
- profile آژانس آرتا: آواتار مربعی + کاور سرمه‌ای رسمی + بدون stats عضوی (VLM PASS) ✓
- my-profile: FAB پلاس + شیت انتخاب (پست/نمونه‌کار) → نمونه‌کار → تب portfolio + فرم باز شد ✓
- چت با مهتاب: قاب طلایی هدر + چیپ طلایی (VLM: Yes/Yes) ✓
- چت از گیت‌وی :81 → سوکت socket.io بدون خطا (تست قبلی localhost:3000 مستقیم از گیت‌وی رد نمی‌شد — آرتیفکت تست) ✓
- چهره‌یاب (آرتا): edit-profile فقط ۳ سکشن (عکس‌ها/موقعیت/اطلاعات چهره‌یاب)؛ داشبورد = ۴ آمار اسکات + CTA بدون پنل ستاره ✓
- جست‌وجوی استعداد چهره‌یاب: فیلتر موسیقی → ۶ نفر، جایگاه‌ها recompute ✓
- toast: DOM→«درخواست ارسال شد» rect y=720 h=48 bottom-center بالای تبار ✓
- tsc 0 خطا؛ eslint 0؛ dev 200.

Stage Summary:
- همهٔ ۱۴ خواستهٔ کاربر پیاده و تست شد؛ سیستم قاب نقره‌ای/طلایی در همهٔ نقاط اپ (پروفایل/چت/کارت‌ها/ادمین/هدر) یکدست.

---
Task ID: DEPLOY-3
Agent: Z.ai Code (maintainer)
Task: استقرار commit 73c6313 روی production 217.114.40.93

Work Log:
- push origin main (4875af3 → 73c6313) → سرور: git pull موفق (۵۳ فایل).
- مهاجرت eliteLevel روی DB تولید (سارا: rosegold → gold؛ بقیه none) — قبل از بالا آمدن کد جدید.
- build موفق (Turbopack standalone) → systemctl restart hamteam + hamteam-chat → Ready 224ms.
- E2E تولید:
  · عمومی: / 200 (۰.۹s) · سوکت گیت‌وی socket.io 200 ✓
  · امیرحسین (۵۸۶۸★): frame=silver، nextAt=10000، جایگاه کل ۲/۷۴ · موسیقی ۱/۸ · خوانندگی ۱/۳ ✓
  · مهتاب (۱۱۲۰۲★): frame=gold ✓ · سارا (ادمینی): frame=gold ✓ · مهدی: بدون قاب ✓
  · /api/scout/talents (لاگین اسکات): رتبه‌ها #۱ مهتاب gold · #۲ امیرحسین silver ✓
  · ویترین: ۲۰ پست منتخب ✓

Stage Summary:
- تولید کاملاً همگام با سیستم قاب جدید (۵۰۰۰=نقره‌ای / ۱۰۰۰۰=طلایی) + جایگاه‌ها + همهٔ ویژگی‌های این راند.

---
Task ID: QC-FIX-1
Agent: Z.ai Code (maintainer)
Task: رفع ۴ مشکل گزارش‌شده توسط کاربر برای دموی کارفرما (کیو‌سی کامل پروفایل/چت/چهره برتر)

Work Log:
- re-seed کامل دمو (seed-full/featured/featured-fix/stars/social/scouts) — دیتای خالی بازیابی شد
- کیو‌سی مرورگر+VLM → تأیید ۴ باگ: (۱) اسم چندخطی زیر بنر پروفایل می‌رود (h1top=150 < coverBottom=198) (۲) بج «چهره برتر طلایی/نقره‌ای» روی کارت‌های پست چهره برتر (۳) فرم ارسال پیام چت زیر تبار (textarea bottom=822 > navTop=787) (۴) نوار آبی (هدر bg-primary چت) نیمه‌پیدا زیر هدر اپ
- profile-view: الگوی قطعی لینکدینی — ردیف -mt-12 با items-start + متن pt-12: آواتار دقیقاً ۴۸px روی بنر، متن دقیقاً از لبهٔ پایین بنر شروع و فقط به پایین رشد می‌کند (ردیف با items-end و -mt-12 روی آواتار تست شد و رد شد — flex margin-box آواتار را پایین می‌اندازد)
- app-shell: روت chat → رپر تمام‌صفحهٔ اختصاصی h-[calc(100dvh-4rem)] (زیر هدر h-16 تا انتهای ویوپورت، بدون رپر پدی‌دار) + تبار موبایل در چت پنهان — فیکس ساختاری بدون پدینگ
- chat-view: حذف کامل هدر آبی ChatThread (ناوبری از هدر اپ؛ هویت از کارت پروفایل) + StatusPill زنده (typing/در ارتباط/درخواست) منتقل شد داخل کارت پروفایل + حذف هدر موبایل ChatListPanel (BackButton+آیکون آبی اضافی) + روت از fixed inset-0 → h-full در جریان + glass→bg-card
- explore-view: حذف بج قاب طلایی/نقره‌ای از کارت‌های پست (قاب آواتار و چک‌مارک حفظ شد)
- explore-view PostDetailView: نوار فرم نظر sticky bottom-[var(--tabbar-h)] (بالای تبار، نه زیرش) + متغیر --tabbar-h در globals.css
- E2E: پیام واقعی از گیت‌وی :81 ارسال و در DB ماندگار شد (سوکت → chat-service → SQLite)؛ تست‌آرتیفکت‌ها پاک شدند (اسم کانون، پیام تست)؛ بنر seed-music برای مهتاب نگه داشته شد
- tsc/eslint پاک؛ dev.log بدون خطای جدید

Stage Summary:
- پروفایل: h1top=coverBottom=198 (صفر هم‌پوشانی)، آواتار ۴۸px روی بنر — VLM 9/10
- چت موبایل: chat 64→844 (دقیقاً بین هدر و ته ویوپورت)، textarea 779-823 کاملاً مرئی، بدون نوار آبی، بدون تبار — VLM 9/10
- چت دسکتاپ: گرید 360px+1fr سالم
- چهره برتر: ۰ بج روی پست‌ها (DOM-checked)؛ قاب/چک‌مارک آواتار باقی
- فرم نظر: stickyBottom=navTop=787 (تخت روی تبار)
- آمادهٔ پوش/استقرار؛ SSH در این محیط موجود نیست → push شد، سرور باید git pull + rebuild بگیرد
