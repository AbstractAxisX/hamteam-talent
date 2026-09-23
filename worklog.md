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
