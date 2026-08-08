# Task ID: Filters-Fix
**Agent**: full-stack-developer (Filters)
**Task**: Make filters 4 full-width lines with labels in Discover and Talents views, add searchable selects

## Previous agent context
This is a small, surgical fix task. No prior agent work to consume — but I read the worklog.md history (Tasks 0 through Admin-V2, Chat-Fix, N-Needs-Final) for project context: RTL Persian social network "همتیم", calm petrol-teal palette (no gradients/neon), Vazirmatn font, mobile-first iOS-quality.

## Files I read (relevant ones)
- `/home/z/my-project/src/components/views/discover-view.tsx` (old 642 lines — shadcn Select in 2x2 grid)
- `/home/z/my-project/src/components/views/talents-view.tsx` (old 355 lines — province+city in 2-col grid)
- `/home/z/my-project/src/components/shared/searchable-select.tsx` (component to use — has `label`/`allLabel`/`disabled` props; treats `value === "all" || value === ""` as `isAll`; dropdown is `absolute z-50 top-full mt-1.5 w-full` — important for clipping analysis)
- `/home/z/my-project/src/lib/geo.ts` (PROVINCES, getCitiesForProvince, getProvinceName)
- `/home/z/my-project/src/lib/format.ts` (toFa, formatCount)
- `/home/z/my-project/src/lib/utils.ts` (cn)
- `/home/z/my-project/dev.log` (server healthy, /api/categories returning 200)

## Files I modified
1. `/home/z/my-project/src/components/views/discover-view.tsx` — OVERWROTE (~580 lines)
2. `/home/z/my-project/src/components/views/talents-view.tsx` — OVERWROTE (~330 lines)

## Key design decisions
1. **State shape**: `province` and `city` use `""` (empty) for "all" instead of `"all"`. Rationale: empty string is falsy so `if (province) params.set(...)` correctly skips when no filter. SearchableSelect already treats both `""` and `"all"` as `isAll` so the display works correctly either way.
2. **Clipping fix**: The original discover-view used framer-motion `AnimatePresence` with `height: 0 → auto` animation, which requires `overflow-hidden` to clip content during the transition. That `overflow-hidden` would also clip the SearchableSelect's absolutely-positioned dropdown (since SearchableSelect's dropdown is `position: absolute; top: 100%` of its relative parent — it extends BELOW the SearchableSelect, outside the card bounds). Fixed by switching to opacity + y-offset animation (no `overflow-hidden`).
3. **Skill `allLabel` is conditional**: `allLabel={categoryId ? "همه" : undefined}`. When category is not selected and skill is disabled, this makes SearchableSelect display the placeholder ("ابتدا دسته‌بندی را انتخاب کنید") instead of "همه" — clearer UX.
4. **Default `showFilters=true`** in discover-view so the 4-line filter card is visible on first load (matches the spec's intent that the user sees the 4-line layout).
5. **Labelled text search** in talents-view: Added label "جستجوی نام یا مهارت" above the text search input to match the "label above each filter" pattern.

## Layout produced
Both views now render:
```
[Label: دسته‌بندی]
[Select ▼]                              ← full-width SearchableSelect
[Label: مهارت]                            ← disabled until category selected
[Select ▼]                              ← full-width SearchableSelect
[Label: استان]
[Select ▼]                              ← full-width, has "همه" first item
[Label: شهر]                              ← disabled until province selected
[Select ▼]                              ← full-width, has "همه" first item
```

## Things next agent should know
- SearchableSelect is now used for the first time in the project (was previously defined but unused — confirmed via grep).
- TalentCardLarge is still exported from talents-view.tsx and is used by CategoryView.
- The clipping issue I solved (AnimatePresence + overflow-hidden + absolute dropdown) is a general pattern — if any future view uses AnimatePresence height animation with SearchableSelect inside, it'll hit the same problem. Solution: use opacity-only animation.
- Province/city state now uses `""` not `"all"` — if any future code reads these values, check truthiness (`if (province)`) not `!== "all"`.

## Verification
- `bun run lint` → 0 errors, 0 warnings (clean).
- `tail -30 /home/z/my-project/dev.log` → all routes returning 200, multiple successful compiles, no errors.
- /api/categories endpoint (which both views depend on) confirmed working in dev log.
