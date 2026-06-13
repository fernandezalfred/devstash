# Current Feature

## Seed Data — Completed

Create/expand the seed script (`prisma/seed.ts`) to populate the database with a demo user, the system item types, and sample collections + items for development and demos. Overwrite/extend the existing system-types-only seed.

### Requirements

- **Demo user:** `demo@devstash.io`, name "Demo User", password `12345678` (hash with bcryptjs, 12 rounds), `isPro: false`, `emailVerified: now()`
- **System item types:** seed all 7 (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`) with their Lucide icon names + hex colors, `isSystem: true`
- **Collections & items** (all owned by the demo user):
  - **React Patterns** — _Reusable React patterns and hooks_ — 3 TypeScript snippets (custom hooks, component patterns, utility functions)
  - **AI Workflows** — _AI prompts and workflow automations_ — 3 prompts (code review, documentation generation, refactoring assistance)
  - **DevOps** — _Infrastructure and deployment resources_ — 1 snippet, 1 command, 2 links (real doc URLs)
  - **Terminal Commands** — _Useful shell commands for everyday development_ — 4 commands (git, docker, process management, package manager)
  - **Design Resources** — _UI/UX resources and references_ — 4 links (real URLs: CSS/Tailwind, component libraries, design systems, icon libraries)
- Seed should be idempotent (safe to re-run) where practical
- Use real, valid URLs for `link` items

### References

- @context/features/seed-spec.md
- @context/project-overview.md (data models)
- @prisma/seed.ts (existing system-types seed)

## Notes

## History

<!-- Keep this updated. Earliest to latest -->

- 2026-05-06: Initial Next.js setup (created via `create-next-app`); pushed to `git@github.com:fernandezalfred/devstash.git`.
- 2026-05-29: Dashboard UI Phase 1 complete. Initialized shadcn/ui (radix base, nova preset, Tailwind v4 CSS theme), added Button + Input components. Root layout set to dark mode by default with Geist fonts wired to `--font-sans`/`--font-mono`. Added `/dashboard` route with shell layout (`TopBar` + placeholder `Sidebar` + main area). Top bar is display-only (brand, disabled search field, New Collection / New Item buttons). Build passes; verified in browser.
- 2026-05-29: Dashboard UI Phase 2 complete. Built out the `Sidebar` against the reference screenshot: collapsible Types section linking to `/items/[slug]` with colored icons + item counts, a Favorites collections section (name + right-aligned star), an "All Collections" section (non-favorites, most-recent-first, with counts), and a bottom user/avatar area with a Settings link. Sidebar collapses inline on desktop and slides in as an overlay drawer on mobile, both driven by the top bar's panel toggle (`DashboardShell` + `useIsMobile`). Added `item-icons.ts` (lucide name → component map). Mock data: added `itemCount` to `ItemType` and reordered types so Links is last, to match the screenshot. Note: the second collections section is labeled "All Collections" (screenshot wording) rather than "Most recent" (spec wording); item type order follows the screenshot (Links last) over `project-overview.md`. Build passes.
- 2026-06-02: Dashboard UI Phase 3 complete. Built out the main area to the right of the sidebar: 4 stats cards (total items, collections, favorite items, favorite collections), a recent collections grid (`CollectionsGrid` + `CollectionCard`, background tinted by the collection's dominant item type), pinned items (`PinnedItems`), and the 10 most-recent items (`RecentItems`), with a shared `ItemRow` (type-colored left border + icon). Added `src/lib/dashboard.ts` for the dashboard data helpers/derivations over the mock data. Disabled the Next.js dev indicator (`devIndicators: false` in `next.config.ts`). Build passes.
- 2026-06-13: Prisma + Neon PostgreSQL setup complete. Prisma 7 with the `pg` driver adapter (`@prisma/adapter-pg`), client generated to `src/generated/prisma` (gitignored). `prisma.config.ts` drives migrations over a DIRECT (non-pooled) connection while the app runtime uses the pooled `DATABASE_URL` via the adapter in `src/lib/prisma.ts`. Initial schema (`20260608121136_init` migration) covers User/Account/Session/VerificationToken (NextAuth v5), ItemType, Item, Collection, ItemCollection (M:N join), and Tag, with indexes + cascade deletes. `prisma/seed.ts` seeds the 7 immutable system item types. Added `db:*` npm scripts and `.env.example` (DATABASE_URL pooled + DIRECT_URL). Added `scripts/test-db.ts` to smoke-test the connection and print row counts (`tsx scripts/test-db.ts`). Build passes.
- 2026-06-13: Seed data complete. Expanded `prisma/seed.ts` beyond the system item types to seed a demo user (`demo@devstash.io` / "Demo User", password `12345678` hashed with `bcryptjs` at 12 rounds, `isPro: false`, `emailVerified: now()`, upserted by email) plus 5 collections and 18 items owned by that user: React Patterns (3 TS snippets), AI Workflows (3 prompts), DevOps (1 snippet + 1 command + 2 links), Terminal Commands (4 commands), Design Resources (4 links) — real URLs for all link items. Seed is idempotent: the demo user's collections/items are deleted and recreated each run (ItemCollection join rows cascade). Link items use `contentType: TEXT` with `content: null` + `url` set (the `ContentType` enum has no URL variant). Added `bcryptjs` dependency. Build passes; seed verified against the dev DB and confirmed idempotent on re-run.
