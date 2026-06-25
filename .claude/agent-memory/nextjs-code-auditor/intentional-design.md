---
name: intentional-design
description: Confirmed intentional/not-yet-implemented decisions — never flag these as defects
metadata:
  type: project
---

- All data helpers (`src/lib/db/collections.ts`, `src/lib/db/items.ts`) are scoped to a hardcoded demo user (`DEMO_USER_EMAIL = "demo@devstash.io"`) until NextAuth v5 auth lands. Do NOT report missing auth checks as security issues.
- `src/lib/mock-data.ts` and `src/lib/dashboard.ts` are intentionally still present as the Sidebar's user area still reads from mock-data (currentUser). These are scaffolding, not dead code.
- Pro gating (file/image type checks, item limits) is intentionally not enforced yet. Do not flag the absence of gating logic.
- TopBar search input and New Collection/New Item buttons are intentionally disabled (display-only); this is not a bug.
- `src/app/page.tsx` is a bare placeholder (`<h1>Devstash</h1>`); root route redirect to /dashboard is not yet built. Not a defect.
- `isPro: true` in `src/lib/mock-data.ts` (currentUser) is intentional — the mock user is Pro for demo purposes.

**Why:** Early-stage codebase being built feature-by-feature per the workflow in ai-interaction.md. Auth, Pro gating, and search come in future features.

**How to apply:** When reviewing, skip any finding that would only matter once auth or Pro gating exists.
