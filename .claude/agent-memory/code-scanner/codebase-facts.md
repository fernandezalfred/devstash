---
name: codebase-facts
description: Confirmed facts about the repo state to prevent false positives
metadata:
  type: project
---

- `.env` is gitignored via `.env*` glob in `.gitignore`. `.env.example` is explicitly excluded. Never report `.env` as exposed.
- `src/generated/prisma` is gitignored.
- No `tailwind.config.*` exists — correct for Tailwind v4.
- No server actions or API routes exist yet — app is read-only at this stage.
- TypeScript strict mode is enabled.
- `bcryptjs` is used with `@types/bcryptjs` — correct setup.
- React `cache()` wraps `getDashboardCollections()` to deduplicate the query between layout and page.
- `src/lib/dashboard.ts` exports are currently unused by any server component (all replaced by DB helpers) but the file is not fully dead — confirm before flagging.
