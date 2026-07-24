# Task 3-b — Jobs (نیازمندی‌ها) Feature

## Agent
full-stack-developer (Jobs)

## Files Created/Modified
- `src/app/api/jobs/route.ts` — GET (list + filters) / POST (create + skill-match notifications)
- `src/app/api/jobs/[id]/route.ts` — GET (detail, with applications if owner) / PUT (close/reopen/update, owner only) / DELETE (owner or admin)
- `src/app/api/jobs/[id]/apply/route.ts` — POST apply with duplicate prevention + conversation upsert + owner notification
- `src/app/api/jobs/my-jobs/route.ts` — GET posted + applied lists for current user
- `src/components/views/jobs-view.tsx` — JobsView (filters, sort, grid)
- `src/components/views/job-detail-view.tsx` — JobDetailView (full info, applications, apply form, close button)
- `src/components/views/create-job-view.tsx` — CreateJobView (form with multi-skill chip selector)
- `src/components/views/my-jobs-view.tsx` — MyJobsView (posted/applied tabs)

## API contract summary
- `GET /api/jobs?categoryId=&skillId=&province=&city=&sort=recent|popular` → `{ jobs: JobPostWithRelations[] }` (status=open only, take 50)
- `POST /api/jobs` body `{ title, description, categoryId, skills: string[], province?, city? }` → `{ ok, id }`. Validates skills belong to category. Sends `job_match` notification to users whose UserSkills intersect.
- `GET /api/jobs/{id}` → `{ job: JobPostWithRelations & { applications?: [...] } }` (applications only if requester is owner)
- `PUT /api/jobs/{id}` body `{ status?: "open"|"closed" } | { title?, description?, province?, city? }` (owner only)
- `DELETE /api/jobs/{id}` (owner or admin)
- `POST /api/jobs/{id}/apply` body `{ message }` → `{ ok }`. Prevents duplicates, applying to own/closed posts. Upserts Conversation between applicant & owner.
- `GET /api/jobs/my-jobs` → `{ posted: MyPostedJob[], applied: MyAppliedJob[] }`

## Design notes
- Emerald primary + amber accent + success green for "open" status (NO blue/indigo)
- Mobile-first responsive grids: 1 col mobile → 2 col desktop
- Skeletons during loading, EmptyState when empty, toast feedback for all actions
- Persian text + `toFa()` numerals, Vazirmatn font, RTL-friendly
- Static route `/api/jobs/my-jobs` correctly takes priority over dynamic `/api/jobs/[id]`

## Verification
- `bun run lint` — 0 errors (1 pre-existing warning in profile-view.tsx unrelated)
- `curl` smoke tests: all routes return correct status codes (200/401/404)
- Dev server log confirms routes compile and respond
