---
name: intentional-design
description: Confirmed intentional/not-yet-implemented decisions — never flag these as defects
metadata:
  type: project
---

- All data helpers in `src/lib/db/collections.ts` and `src/lib/db/items.ts` are scoped to a hardcoded demo user (`DEMO_USER_EMAIL = "demo@devstash.io"`) — deliberate interim state while auth was built out incrementally, documented at length in `context/current-feature.md`. The scoping is consistently applied across every query in both files (verified 2026-07-24 read of both files in full) — do NOT flag "demo-scoped instead of session-scoped" as a defect. Only flag if one query in the pattern diverges from its siblings (e.g. checks ownership differently) — none found as of 2026-07-24.
- Auth (NextAuth v5, `src/auth.ts` / `src/auth.config.ts` / `src/proxy.ts`) is now fully built: GitHub OAuth + email/password credentials, email verification (toggleable via `EMAIL_VERIFICATION_ENABLED`), forgot/reset password, rate limiting on all 5 auth endpoints (Upstash, fails open), profile page, change password, delete account. All server actions/API routes DO exist now (superseded an old memory that said otherwise) and correctly call `auth()`/session checks before mutating — the *data itself* just still resolves to the demo user underneath, not the session user (see above).
- Pro gating (file/image type checks, item limits) is intentionally not enforced yet — sidebar shows a "Pro" tag on file/image types but doesn't block access.
- TopBar search input is intentionally disabled (display-only); "New Collection" button is also still disabled (no collection create UI yet) — "New Item" IS wired (opens `CreateItemDialog`).
- `/collections/[id]` pages don't exist yet (sidebar links to them, but the route isn't built) — not-yet-implemented, not a defect.
- Item drawer's Favorite/Pin/Copy action-bar buttons are intentionally unwired (display-only) — Edit/Delete are wired.
- `src/lib/mock-data.ts` and `src/lib/dashboard.ts` — BOTH CONFIRMED DELETED as of 2026-07-24 (verified via Read — files no longer exist). An older memory said they were "intentionally still present" — that was stale; correct it if seen again. Sidebar/dashboard now read entirely from `src/lib/db/*` DB helpers + the real session user via `getCurrentUser()`.
- Syntax highlighting for the generic (non-Monaco/non-Markdown) content display is intentionally deferred — plain line-numbered `<pre>` block (`CodeBlock` in `ItemDrawer.tsx`).
- No rate limiting on `/api/items/[id]`, `/api/items/[id]/download`, `/api/upload`, `/api/account/*` — accepted, low-value targets (require auth already); only the 5 pre-auth/account-recovery endpoints have rate limiting per the 2026-07-04 feature.

**Why:** Early-stage codebase built feature-by-feature per `context/current-feature.md`'s documented workflow. Auth, Pro gating, collections CRUD, and search are still-incomplete features, not bugs.
