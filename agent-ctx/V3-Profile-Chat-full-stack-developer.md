# Task V3-Profile-Chat — Profile, EditProfile, Chat v3 rebuild

## Context
Rebuilding 3 view files for a Persian RTL talent discovery platform (همتیم). The design system changed to a CALM palette (deep petrol-teal primary `bg-primary text-primary-foreground`, warm off-white bg). NO gradients, NO neon. New features added: gender field, avatar/banner photo upload, circular bigger avatar (2xl = w-28 h-28), chat message requests.

## Files modified (overwrite only — these 3 files)
1. `/home/z/my-project/src/components/views/profile-view.tsx`
2. `/home/z/my-project/src/components/views/edit-profile-view.tsx`
3. `/home/z/my-project/src/components/views/chat-view.tsx`

## Key design decisions
- **Calm palette**: Only `bg-primary`/`text-primary-foreground`/`bg-card`/`bg-muted`/`border-border`/`text-gold`/`text-rose`/`text-warning`/`text-success` from globals.css tokens. Replaced all old `bg-lime`/`text-forest`/`bg-cream-gradient` (which no longer exist).
- **Avatar clip fix**: Card uses `overflow-visible` so avatar can overlap banner; only the banner div uses `overflow-hidden` (so the solid bg-color/image is clipped to rounded-t-2xl). UserAvatar with size="2xl" + `className="ring-4 ring-card"` (NO `rounded-3xl` override — keeps UserAvatar's natural `rounded-full` = perfect circle).
- **Gender field**: ProfileDetail has `gender: string | null` from /api/profile/[id]. Displayed as Badge in header + in About tab. EditProfile has RadioGroup مرد/زن/نامشخص saved via PUT /api/profile/me `{ gender }`.
- **Avatar upload**: POST /api/upload multipart FormData with `type` field = "avatar" or "banner". Returns `{ ok, url }`. Saves to /public/uploads and updates profile automatically.
- **Chat message requests**: /api/chat/conversations now returns `{ conversations: [active+my-pending-with-flag], requests: [their-pending-for-me], unreadCount }`. Each item has `status: "active"|"pending_request"` + `initiatorId`. UI shows two tabs and conditional input area based on status.
- **Socket.io**: PRESERVED `io("/", { path:"/", query: { XTransformPort: "3003" }, auth: { userId } })`. Join room, emit "message", listen for "message"/"typing". On incoming message → if active conv → append + mark read; always refresh conversations list.

## API shapes (do NOT modify APIs)
- `GET /api/profile/[id]` → ProfileDetail (now includes `gender: string | null`)
- `GET/PUT /api/profile/me` — PUT now accepts `gender: "male"|"female"|null`
- `POST /api/upload` — multipart form: `file` + `type` ("avatar"|"banner"). Returns `{ ok, url }`. Saves to /public/uploads and updates profile.
- `GET /api/chat/conversations` → `{ conversations, requests, unreadCount }`
- `POST /api/chat/start` — body: `{ userId, initialMessage? }`. If connected → active conversation. If not → creates pending_request + message + notification. Returns `{ conversationId, status }`.
- `POST /api/chat/conversations/[id]/respond` — body: `{ action: "accept"|"reject" }`
- `POST /api/chat/conversations/[id]/read` — mark messages as read
- `GET /api/chat/conversations/[id]/messages` — returns `{ conversation: { id, otherUser }, messages }` (NO status — that comes from the conversations list)

## Status badges logic in chat header
- `status === "active"` → "دنبال‌شده" (UserCheck icon, primary-foreground color)
- `status === "pending_request" && initiatorId === me` → "در انتظار تأیید درخواست" (Clock icon)
- `status === "pending_request" && initiatorId !== me` → "درخواست پیام جدید" (Bell icon)

## Input area varies by status
- `active` → Textarea + Send button (primary, motion whileTap/whileHover, Send -scale-x-100 for RTL)
- `pending_request + my request` → "در انتظار تأیید درخواست" message card (warning/10 bg), NO input
- `pending_request + their request` → "تأیید" (primary) + "رد" (outline rose) buttons

## Verification
- `bun run lint` → 0 errors across entire project
- `bunx tsc --noEmit` → 0 errors in my 3 view files (pre-existing errors in API routes are out of scope)
- `tail dev.log` → ✓ Compiled multiple times, NO errors, NO warnings, all API routes returning 200
