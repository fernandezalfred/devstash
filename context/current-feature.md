# Current Feature

## Prisma + Neon PostgreSQL Setup — Completed

Set up Prisma ORM (v7) with a Neon serverless PostgreSQL database, and create the initial schema based on the data models in `@context/project-overview.md`.

### Requirements

- Use Neon PostgreSQL (serverless)
- Use **Prisma 7** — review the upgrade guide for breaking changes before schema work
- Create the initial schema from the data models in `@context/project-overview.md` (will evolve)
- Include NextAuth models (`Account`, `Session`, `VerificationToken`)
- Add appropriate indexes and cascade deletes
- Two Neon branches: a development branch (`DATABASE_URL`) and a production branch
- ALWAYS create migrations (`prisma migrate dev`) — never `prisma db push` unless explicitly specified

### References

- @context/features/database-spec.md
- @context/project-overview.md (initial data models)
- Prisma 7 upgrade guide: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Prisma Postgres quickstart: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres

## Dashboard UI Phase 3 — Completed

Phase 3 of 3 for the dashboard UI layout. Build out the main area to the right of the sidebar. Use the reference screenshot for layout and the mock data file (`@src/lib/mock-data.js`) imported directly until the database is implemented.

### Requirements

- The main area to the right
- Recent collections
- Pinned Items
- 10 Recent items
- 4 stats cards at the top for number of items, collections, favorite items and favorite collections (not in screenshot)

### References

- @context/screenshots/dashboard-ui-main.png
- @context/project-overview.md
- @src/lib/mock-data.js
- @context/features/dashboard-phase-1-spec.md
- @context/features/dashboard-phase-2-spec.md
- @context/features/dashboard-phase-3-spec.md

## Notes

## History

<!-- Keep this updated. Earliest to latest -->

- 2026-05-06: Initial Next.js setup (created via `create-next-app`); pushed to `git@github.com:fernandezalfred/devstash.git`.
- 2026-05-29: Dashboard UI Phase 1 complete. Initialized shadcn/ui (radix base, nova preset, Tailwind v4 CSS theme), added Button + Input components. Root layout set to dark mode by default with Geist fonts wired to `--font-sans`/`--font-mono`. Added `/dashboard` route with shell layout (`TopBar` + placeholder `Sidebar` + main area). Top bar is display-only (brand, disabled search field, New Collection / New Item buttons). Build passes; verified in browser.
- 2026-05-29: Dashboard UI Phase 2 complete. Built out the `Sidebar` against the reference screenshot: collapsible Types section linking to `/items/[slug]` with colored icons + item counts, a Favorites collections section (name + right-aligned star), an "All Collections" section (non-favorites, most-recent-first, with counts), and a bottom user/avatar area with a Settings link. Sidebar collapses inline on desktop and slides in as an overlay drawer on mobile, both driven by the top bar's panel toggle (`DashboardShell` + `useIsMobile`). Added `item-icons.ts` (lucide name → component map). Mock data: added `itemCount` to `ItemType` and reordered types so Links is last, to match the screenshot. Note: the second collections section is labeled "All Collections" (screenshot wording) rather than "Most recent" (spec wording); item type order follows the screenshot (Links last) over `project-overview.md`. Build passes.
- 2026-06-02: Dashboard UI Phase 3 complete. Built out the main area to the right of the sidebar: 4 stats cards (total items, collections, favorite items, favorite collections), a recent collections grid (`CollectionsGrid` + `CollectionCard`, background tinted by the collection's dominant item type), pinned items (`PinnedItems`), and the 10 most-recent items (`RecentItems`), with a shared `ItemRow` (type-colored left border + icon). Added `src/lib/dashboard.ts` for the dashboard data helpers/derivations over the mock data. Disabled the Next.js dev indicator (`devIndicators: false` in `next.config.ts`). Build passes.
- 2026-06-13: Prisma + Neon PostgreSQL setup complete. Prisma 7 with the `pg` driver adapter (`@prisma/adapter-pg`), client generated to `src/generated/prisma` (gitignored). `prisma.config.ts` drives migrations over a DIRECT (non-pooled) connection while the app runtime uses the pooled `DATABASE_URL` via the adapter in `src/lib/prisma.ts`. Initial schema (`20260608121136_init` migration) covers User/Account/Session/VerificationToken (NextAuth v5), ItemType, Item, Collection, ItemCollection (M:N join), and Tag, with indexes + cascade deletes. `prisma/seed.ts` seeds the 7 immutable system item types. Added `db:*` npm scripts and `.env.example` (DATABASE_URL pooled + DIRECT_URL). Added `scripts/test-db.ts` to smoke-test the connection and print row counts (`tsx scripts/test-db.ts`). Build passes.
