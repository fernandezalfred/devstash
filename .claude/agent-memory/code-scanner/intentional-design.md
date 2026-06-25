---
name: intentional-design
description: Confirmed intentional/not-yet-implemented decisions — never flag these as defects
metadata:
  type: project
---

- All data helpers (`src/lib/db/collections.ts`, `src/lib/db/items.ts`) are scoped to a hardcoded demo user (`DEMO_USER_EMAIL = "demo@devstash.io"`) until NextAuth v5 auth lands. Do NOT report missing auth checks as security issues.
- `src/lib/mock-data.ts` and `src/lib/dashboard.ts` are intentionally still present — Sidebar still reads currentUser from mock-data. These are scaffolding, not dead code.
- Pro gating (file/image type checks, item limits) is intentionally not enforced yet.
- TopBar search input and buttons are intentionally disabled (display-only).
- `src/app/page.tsx` is a bare placeholder; root route redirect to /dashboard not yet built.
- `isPro: true` in mock-data `currentUser` is intentional for demo purposes.

**Why:** Early-stage codebase built feature-by-feature. Auth, Pro gating, and search are future features.
