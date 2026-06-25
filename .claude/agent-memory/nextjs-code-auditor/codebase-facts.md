---
name: codebase-facts
description: Confirmed facts about the repo state to prevent false positives in future audits
metadata:
  type: project
---

- `.env` is listed in `.gitignore` via `.env*` glob. `.env.example` is explicitly excluded (`!.env.example`). Do NOT report `.env` as exposed.
- `src/generated/prisma` is listed in `.gitignore`. Do not report generated client as committed.
- No `tailwind.config.*` file exists — correct for Tailwind v4. All theme config lives in `src/app/globals.css` under `@theme inline {}`.
- No server actions (`src/actions/`) or API routes (`src/app/api/`) exist yet — the app has no mutations yet, only reads.
- TypeScript strict mode is enabled (`"strict": true` in tsconfig.json).
- `bcryptjs` is used (not `bcrypt`) — the `@types/bcryptjs` dev dependency is present and correct.
- `src/hooks/use-mobile.ts` exists (not `.tsx`) — the hook has no JSX so the `.ts` extension is correct.
- The seed script uses a serial loop (not Promise.all) for system item types because it must do a manual findFirst before each create — this is intentional due to the NULL uniqueness caveat in Postgres.
- `react()` cache wraps `getDashboardCollections()` so the dashboard layout and page share one DB query per request. This is the correct pattern for RSC data deduplication.
- `dashboard/layout.tsx` calls `getDashboardCollections()` AND `dashboard/page.tsx` also calls it — but React cache deduplicates the query, so this is NOT a double-fetch issue.
- `src/lib/dashboard.ts` is technically unused by production code (the dashboard page now uses DB helpers) but `src/lib/mock-data.ts` is still imported by `Sidebar.tsx` for the currentUser (name, email, isPro).
